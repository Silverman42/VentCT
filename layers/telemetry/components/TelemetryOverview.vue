<script setup lang="ts">
import { useNow } from "@vueuse/core";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { TabsData } from "~/utils/types/misc/Tabs";

type TelemetryTab = "health" | "liveness";

const route = useRoute();
const router = useRouter();
const {
  systemHealth,
  liveness,
  fetchingSystemHealth,
  fetchingLiveness,
  systemHealthCheckedAt,
  livenessCheckedAt,
  fetchSystemHealth,
  fetchLiveness,
} = useTelemetryStore();

const telemetryTabs: Array<TabsData & { id: TelemetryTab }> = [
  { id: "health", name: "Health Telemetry" },
  { id: "liveness", name: "Liveness" },
];
const defaultTab: TelemetryTab = "health";

const isApplyingRoute = ref(false);
const healthFailed = ref(false);
const livenessFailed = ref(false);
/** Re-renders the relative "last checked" label every 30 seconds. */
const now = useNow({ interval: 30_000 });

/** Reads one scalar value from a Nuxt query-string value. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Identifies a supported telemetry tab from a query-string value. */
const isTelemetryTab = (value: string): value is TelemetryTab =>
  telemetryTabs.some((tab) => tab.id === value);

/** Resolves the active tab from the current route, defaulting to health. */
const getRouteTab = (): TelemetryTab => {
  const requestedTab = getQueryValue(route.query.tab);
  return isTelemetryTab(requestedTab) ? requestedTab : defaultTab;
};

const activeTab = ref<string>(getRouteTab());

/** Keeps the tab in the URL while omitting the default tab. */
const syncRouteState = (): void => {
  const nextTab = activeTab.value !== defaultTab ? activeTab.value : "";
  if (getQueryValue(route.query.tab) === nextTab) return;

  void router.replace({
    path: route.path,
    query: nextTab ? { tab: nextTab } : {},
  });
};

/** Applies browser-navigation query changes to the active tab. */
const applyRouteState = (): void => {
  isApplyingRoute.value = true;
  activeTab.value = getRouteTab();
  isApplyingRoute.value = false;
};

/** Fetches system-health diagnostics and records whether the request failed. */
const loadSystemHealth = async (): Promise<void> => {
  healthFailed.value = false;
  try {
    await fetchSystemHealth();
  } catch {
    healthFailed.value = true;
  }
};

/** Runs the liveness probe and records whether the request failed. */
const loadLiveness = async (): Promise<void> => {
  livenessFailed.value = false;
  try {
    await fetchLiveness();
  } catch {
    livenessFailed.value = true;
  }
};

/** Fetches the given tab's data the first time it becomes active. */
const loadTabOnFirstVisit = (tab: string): void => {
  if (tab === "health" && !systemHealth.value && !fetchingSystemHealth.value)
    void loadSystemHealth();
  if (tab === "liveness" && !liveness.value && !fetchingLiveness.value)
    void loadLiveness();
};

/** Re-fetches the data behind the currently active tab. */
const refreshActiveTab = (): void => {
  if (activeTab.value === "liveness") void loadLiveness();
  else void loadSystemHealth();
};

/** Whether the active tab's request is in flight. */
const isRefreshing = computed(() =>
  activeTab.value === "liveness"
    ? fetchingLiveness.value
    : fetchingSystemHealth.value,
);

/** Relative label for when the active tab's data was last fetched. */
const lastCheckedLabel = computed(() => {
  void now.value;
  const checkedAt =
    activeTab.value === "liveness"
      ? livenessCheckedAt.value
      : systemHealthCheckedAt.value;
  return checkedAt
    ? `Last checked ${DateFormatter.formatDistanceToNow(checkedAt)}`
    : "Not checked yet";
});

watch(
  activeTab,
  (tab) => {
    if (!isApplyingRoute.value) syncRouteState();
    loadTabOnFirstVisit(tab);
  },
  { flush: "sync" },
);

watch(
  () => route.query,
  () => applyRouteState(),
  { deep: true },
);

onMounted(() => {
  loadTabOnFirstVisit(activeTab.value);
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <AppHeading
      title="Telemetry"
      subtitle="Infrastructure diagnostics and service liveness"
    />

    <AppTab
      v-model:active-tab="activeTab"
      :tab-list="telemetryTabs"
      :default-tab-id="activeTab"
      :show-icon="false"
      tab-btn-style="pill"
    >
      <template #header-actions>
        <div class="flex items-center gap-3">
          <p class="text-sm text-dashboard-text" aria-live="polite">
            {{ lastCheckedLabel }}
          </p>
          <AppButton
            type="button"
            size="sm"
            color="neutral"
            outlined
            class="!py-2 !px-4"
            :disabled="isRefreshing"
            aria-label="Refresh telemetry"
            @click="refreshActiveTab"
          >
            <Icon
              name="vent:rotate-left"
              size="1rem"
              :class="{ 'animate-spin': isRefreshing }"
              aria-hidden="true"
            />
            Refresh
          </AppButton>
        </div>
      </template>

      <template #health>
        <div>
          <TelemetryHealthGridShimmer
            v-if="fetchingSystemHealth && !systemHealth"
          />
          <TelemetryErrorState
            v-else-if="healthFailed && !systemHealth"
            heading="We couldn't load system health"
            description="The diagnostics endpoint did not respond. Check your connection and try again."
            :retrying="fetchingSystemHealth"
            @retry="loadSystemHealth"
          />
          <TelemetryHealthGrid v-else-if="systemHealth" :health="systemHealth" />
          <AppEmptyState
            v-else
            heading="No diagnostics yet"
            empty-table-subtitle="Refresh to collect a system health snapshot."
            height="30vh"
            hide-image
          />
        </div>
      </template>

      <template #liveness>
        <div>
          <TelemetryLivenessGridShimmer v-if="fetchingLiveness && !liveness" />
          <TelemetryErrorState
            v-else-if="livenessFailed && !liveness"
            heading="We couldn't reach the liveness probe"
            description="The health endpoint did not respond. Check your connection and try again."
            :retrying="fetchingLiveness"
            @retry="loadLiveness"
          />
          <TelemetryLivenessGrid v-else-if="liveness" :liveness="liveness" />
          <AppEmptyState
            v-else
            heading="No liveness data yet"
            empty-table-subtitle="Refresh to run the liveness probe."
            height="30vh"
            hide-image
          />
        </div>
      </template>
    </AppTab>
  </div>
</template>
