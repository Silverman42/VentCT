<script setup lang="ts">
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import { FlagFetch } from "~/utils/helpers/Flags";
import type { TabsData } from "~/utils/types/misc/Tabs";
import { useAudienceStore } from "../composables/useAudienceStore";
import {
  AUDIENCE_METRIC_SHIMMER_ROWS,
  AUDIENCE_PERIOD_OPTIONS,
  buildAudienceMetricRows,
  type AudienceDetailTab,
  type AudiencePeriod,
} from "../utils/AudienceProfile";

const props = defineProps<{
  audienceId: string;
}>();

const {
  selectedAudience,
  fetchingAudienceDetails,
  fetchAudienceDetails,
  setAudienceProfileFilters,
  resetAudienceProfile,
} = useAudienceStore();

const route = useRoute();
const router = useRouter();
const periodDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const hasLoaded = ref(false);
const loadFailed = ref(false);
const isApplyingRoute = ref(false);
const flagFailed = ref(false);

const detailTabs: Array<TabsData & { id: AudienceDetailTab }> = [
  { id: "transactions", name: "Transactions" },
  { id: "withdrawal", name: "Withdrawal" },
  { id: "utility", name: "Utility" },
];

const defaultTab: AudienceDetailTab = "transactions";
const defaultPeriod: AudiencePeriod = "last_30_days";

/** Reads one scalar value from a Nuxt query-string value. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Identifies a supported metric tab from a query-string value. */
const isAudienceDetailTab = (value: string): value is AudienceDetailTab =>
  detailTabs.some((tab) => tab.id === value);

/** Identifies a supported reporting period from a query-string value. */
const isAudiencePeriod = (value: string): value is AudiencePeriod =>
  AUDIENCE_PERIOD_OPTIONS.some((period) => period.value === value);

/** Normalizes the visible tab and period controls from the current route. */
const getRouteState = (): {
  tab: AudienceDetailTab;
  period: AudiencePeriod;
} => {
  const requestedTab = getQueryValue(route.query.tab);
  const requestedPeriod = getQueryValue(route.query.period);

  return {
    tab: isAudienceDetailTab(requestedTab) ? requestedTab : defaultTab,
    period: isAudiencePeriod(requestedPeriod) ? requestedPeriod : defaultPeriod,
  };
};

const initialRouteState = getRouteState();
const activeTab = ref<string>(initialRouteState.tab);
const activePeriod = ref<AudiencePeriod>(initialRouteState.period);

/** Template-ready profile view of the selected audience with fallbacks. */
const profileView = computed(() => {
  const audience = selectedAudience.value;
  const fullName = audience?.name || "Unnamed audience";

  return {
    exists: Boolean(audience),
    fullName,
    initial: fullName.charAt(0).toUpperCase(),
    level: audience?.kycLevelLabel ?? "",
    country: audience?.country || audience?.countryCode || "Country not set",
    flagUrl: audience?.countryCode ? FlagFetch(audience.countryCode) : "",
    email: audience?.email || "—",
    phone: audience?.phone || "—",
    lastTransaction: audience?.lastTransactionAt
      ? `Last transaction ${DateFormatter.formatDate(audience.lastTransactionAt)}`
      : "No transactions yet",
    campaign: audience?.campaignName || "No campaign",
    promoter: audience?.promoterName || "Unassigned",
    hasTransaction: Boolean(audience?.hasTransacted),
  };
});

/** Metric card rows per tab; `null` when transaction figures are hidden. */
const metricRows = computed(() =>
  buildAudienceMetricRows(selectedAudience.value?.metrics),
);

/** Resolves the dropdown label for the selected reporting period. */
const activePeriodLabel = computed(
  () =>
    AUDIENCE_PERIOD_OPTIONS.find(
      (period) => period.value === activePeriod.value,
    )?.label ?? "Last 30 days",
);

/** Loads the audience profile for the active period, recording failures. */
const loadAudience = async (): Promise<void> => {
  loadFailed.value = false;
  flagFailed.value = false;
  setAudienceProfileFilters({ timeframe: activePeriod.value });

  try {
    await fetchAudienceDetails(props.audienceId);
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Refetches profile metrics after the period changes, keeping the page in place. */
const refreshMetrics = (): void => {
  setAudienceProfileFilters({ timeframe: activePeriod.value });
  void fetchAudienceDetails(props.audienceId).catch(() => undefined);
};

/** Keeps the tab and period in the URL while leaving defaults implicit. */
const syncRouteState = (): void => {
  const nextQuery: Record<string, string> = {};
  if (activeTab.value !== defaultTab) nextQuery.tab = activeTab.value;
  if (activePeriod.value !== defaultPeriod)
    nextQuery.period = activePeriod.value;

  if (
    getQueryValue(route.query.tab) === (nextQuery.tab ?? "") &&
    getQueryValue(route.query.period) === (nextQuery.period ?? "")
  ) {
    return;
  }

  void router.replace({ path: route.path, query: nextQuery });
};

/** Applies browser-navigation query changes to the tab and period controls. */
const applyRouteState = (): void => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  activeTab.value = nextState.tab;
  activePeriod.value = nextState.period;
  isApplyingRoute.value = false;
};

/** Selects a reporting period and closes the period dropdown menu. */
const selectPeriod = (period: AudiencePeriod): void => {
  activePeriod.value = period;
  periodDropdown.value?.closeDropdown();
};

watch(
  [activeTab, activePeriod],
  () => {
    if (!isApplyingRoute.value) syncRouteState();
  },
  { flush: "sync" },
);

watch(activePeriod, (period, previous) => {
  if (period !== previous && hasLoaded.value) refreshMetrics();
});

watch(
  () => route.query,
  () => applyRouteState(),
  { deep: true },
);

watch(
  () => props.audienceId,
  () => {
    resetAudienceProfile();
    hasLoaded.value = false;
    void loadAudience();
  },
);

onMounted(() => {
  resetAudienceProfile();
  void loadAudience();
});

onBeforeUnmount(() => {
  resetAudienceProfile();
});
</script>

<template>
  <div class="flex min-w-0 w-full flex-col gap-8">
    <AudienceDetailShimmer v-if="!hasLoaded" />

    <AppErrorState
      v-else-if="loadFailed"
      heading="We couldn't load this audience"
      description="Something went wrong while fetching the audience details. Please try again."
      :retrying="fetchingAudienceDetails"
      @retry="loadAudience"
    />

    <section
      v-else-if="!profileView.exists"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <Icon name="vent:box-search" size="2.5rem" class="text-dashboard-text" />
      <h2 class="mt-4 text-lg font-medium text-dashboard-heading">
        Audience not found
      </h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        This audience member may have been removed or the link is incorrect.
      </p>
      <NuxtLink
        to="/audiences"
        class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
      >
        Back to audiences
      </NuxtLink>
    </section>

    <template v-else>
      <!-- Profile card -->
      <section
        class="flex items-start gap-4 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <div class="relative shrink-0">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-color-005 text-xl font-semibold text-white"
          >
            {{ profileView.initial }}
          </div>
          <img
            v-if="profileView.flagUrl && !flagFailed"
            :src="profileView.flagUrl"
            :alt="`${profileView.country} flag`"
            class="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-dashboard-bg object-cover"
            @error="flagFailed = true"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <h2
              class="truncate text-xl font-medium tracking-tight text-dashboard-heading"
            >
              {{ profileView.fullName }}
            </h2>
            <AppPills v-if="profileView.level" color="blue" class="text-[0.6875rem]">
              {{ profileView.level }}
            </AppPills>
          </div>

          <p class="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dashboard-text">
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:global" size="1rem" />
              {{ profileView.country }}
            </span>
            <span>{{ profileView.campaign }}</span>
          </p>

          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-dashboard-text"
          >
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:direct-inbox" size="0.95rem" />
              {{ profileView.email }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:call" size="0.95rem" />
              {{ profileView.phone }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:calendar" size="0.95rem" />
              {{ profileView.lastTransaction }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dashboard-text"
          >
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:profile" size="1rem" />
              Promoter:
              <span class="text-dashboard-heading">{{ profileView.promoter }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:wallet-icon" size="1rem" />
              Transactions
              <AppPills
                :color="profileView.hasTransaction ? 'green' : 'red'"
                class="text-xs"
              >
                {{ profileView.hasTransaction ? "Yes" : "No" }}
              </AppPills>
            </span>
          </div>
        </div>
      </section>

      <!-- Metric tabs -->
      <AppTab
        v-model:active-tab="activeTab"
        :tab-list="detailTabs"
        :default-tab-id="activeTab"
        :show-icon="false"
        tab-btn-style="pill"
        class="!max-w-full"
      >
        <template #header-actions>
          <AppDropdown
            ref="periodDropdown"
            position="right"
            :width-is-finite="false"
          >
            <template #default>
              <button
                type="button"
                class="inline-flex h-12 items-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 text-sm text-dashboard-heading transition hover:border-brand-color-default"
                aria-label="Audience reporting period"
              >
                <Icon name="vent:calendar" size="1rem" />
                {{ activePeriodLabel }}
                <Icon name="vent:arrow-down" size="0.9rem" />
              </button>
            </template>
            <template #dropdown_body>
              <div class="min-w-40 space-y-1">
                <button
                  v-for="period in AUDIENCE_PERIOD_OPTIONS"
                  :key="period.value"
                  type="button"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{
                    'bg-dashboard-bg-dark': activePeriod === period.value,
                  }"
                  @click="selectPeriod(period.value)"
                >
                  {{ period.label }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </template>

        <template v-for="tab in detailTabs" :key="tab.id" #[tab.id]>
          <div class="border-t border-dashboard-card-border pt-5">
            <AppMetricRowsShimmer
              v-if="fetchingAudienceDetails"
              :rows="AUDIENCE_METRIC_SHIMMER_ROWS[tab.id]"
            />
            <AppMetricRows
              v-else-if="metricRows[tab.id]"
              :rows="metricRows[tab.id]!"
              :aria-label="`Audience ${tab.name.toLowerCase()} metrics`"
            />
            <AppEmptyState
              v-else
              heading="Transaction figures unavailable"
              empty-table-subtitle="You don't have permission to view this audience's transaction figures."
              height="16rem"
              hide-image
            />
          </div>
        </template>
      </AppTab>
    </template>
  </div>
</template>
