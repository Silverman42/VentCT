<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { ITableBodyData, ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { TabsData } from "~/utils/types/misc/Tabs";
import type { PromoterAudienceStatusFilter } from "../composables/usePromotersStore";
import {
  PROMOTER_AUDIENCE_FILTER_OPTIONS,
  PROMOTER_METRIC_SHIMMER_ROWS,
  PROMOTER_PERIOD_OPTIONS,
  buildPromoterMetricRows,
  getPromoterInitials,
  type PromoterDetailTab,
  type PromoterPeriod,
} from "../utils/PromoterProfile";

interface ModalController {
  open: () => Promise<void> | void;
  close: () => void;
}

/** Table-ready referred-audience row. */
interface IAudienceRow extends ITableBodyData {
  id: string;
  name: string;
  campaign: string;
  email: string;
  phone: string;
  hasTransaction: boolean;
  isVerified: boolean;
}

const props = defineProps<{
  promoterId: string;
}>();

const {
  selectedPromoter,
  fetchingPromoterDetails,
  promoterAudiences,
  fetchingPromoterAudiences,
  promoterAudiencesPage,
  promoterAudiencesPerPage,
  promoterAudiencesTotal,
  promoterAudiencesStatus,
  fetchPromoterDetails,
  fetchPromoterAudiences,
  setPromoterAudiencesSearch,
  setPromoterAudiencesStatus,
  setPromoterProfileFilters,
  resetPromoterProfile,
} = usePromotersStore();
const route = useRoute();
const router = useRouter();
const editPromoterModal = ref<ModalController | null>(null);
const deletePromoterModal = ref<ModalController | null>(null);
const audienceDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const periodDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref("");
const hasLoaded = ref(false);
const loadFailed = ref(false);
const isApplyingRoute = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "campaign", name: "Campaign", width: "25%", isHiddenOnMobile: true },
  { id: "email", name: "Email", width: "20%", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", width: "16%", isHiddenOnMobile: true },
  { id: "transaction", name: "Transaction", width: "12%" },
  { id: "status", name: "Status", width: "14%" },
];

const detailTabs: Array<TabsData & { id: PromoterDetailTab }> = [
  { id: "audiences", name: "Audiences" },
  { id: "transactions", name: "Transactions" },
  { id: "withdrawal", name: "Withdrawal" },
  { id: "utility", name: "Utility" },
];

const defaultTab: PromoterDetailTab = "audiences";
const defaultPeriod: PromoterPeriod = "last_30_days";

/** Reads one scalar value from a Nuxt query-string value. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Identifies a supported detail dashboard tab from a query-string value. */
const isPromoterDetailTab = (value: string): value is PromoterDetailTab =>
  detailTabs.some((tab) => tab.id === value);

/** Identifies a supported reporting period from a query-string value. */
const isPromoterPeriod = (value: string): value is PromoterPeriod =>
  PROMOTER_PERIOD_OPTIONS.some((period) => period.value === value);

/** Normalizes the visible tab and period controls from the current route. */
const getRouteState = (): {
  tab: PromoterDetailTab;
  period: PromoterPeriod;
} => {
  const requestedTab = getQueryValue(route.query.tab);
  const requestedPeriod = getQueryValue(route.query.period);

  return {
    tab: isPromoterDetailTab(requestedTab) ? requestedTab : defaultTab,
    period: isPromoterPeriod(requestedPeriod) ? requestedPeriod : defaultPeriod,
  };
};

const initialRouteState = getRouteState();
const activeTab = ref<string>(initialRouteState.tab);
const activePeriod = ref<PromoterPeriod>(initialRouteState.period);

/** Null-safe profile view model for the header and referral card. */
const profile = computed(() => {
  const promoter = selectedPromoter.value;
  if (!promoter) return null;

  return {
    name: promoter.name || "Unnamed promoter",
    initials: getPromoterInitials(promoter.name),
    avatarUrl: promoter.avatarUrl || "",
    hasAvatar: Boolean(promoter.avatarUrl),
    campaign: promoter.campaignName || "No campaign",
    email: promoter.email || "—",
    phone: promoter.phone || "—",
    joinedDate: promoter.createdAt
      ? DateFormatter.formatDate(promoter.createdAt)
      : "—",
    referralCode: promoter.referralCode || "—",
    appLink: promoter.appReferralLink || "—",
    webLink: promoter.webReferralLink || "—",
  };
});

/** Metric card rows per tab; transaction tabs are `null` without permission. */
const metricRows = computed(() =>
  buildPromoterMetricRows(selectedPromoter.value?.metrics),
);

/** Referred-audience rows mapped from the API with display fallbacks. */
const audienceRows = computed<IAudienceRow[]>(() =>
  promoterAudiences.value.map((member) => ({
    id: member.id,
    name: member.name || "—",
    campaign: member.campaignName || "—",
    email: member.email || "—",
    phone: member.phone || "—",
    hasTransaction: Boolean(member.hasTransacted),
    isVerified: Boolean(member.isVerified),
  })),
);

/** Resolves the dropdown label for the selected reporting period. */
const activePeriodLabel = computed(
  () =>
    PROMOTER_PERIOD_OPTIONS.find((period) => period.value === activePeriod.value)
      ?.label ?? "Last 30 days",
);

/** Resolves the dropdown label for the selected audience filter. */
const activeAudienceFilterLabel = computed(
  () =>
    PROMOTER_AUDIENCE_FILTER_OPTIONS.find(
      (option) => option.value === promoterAudiencesStatus.value,
    )?.label ?? "All",
);

/** Loads the profile and its first page of referred audience for the current promoter. */
const loadPromoter = async (): Promise<void> => {
  loadFailed.value = false;
  setPromoterProfileFilters({ timeframe: activePeriod.value });

  try {
    const promoter = await fetchPromoterDetails(props.promoterId);
    if (promoter) {
      void fetchPromoterAudiences(props.promoterId, 1).catch(() => undefined);
    }
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Refetches profile metrics after the period changes, keeping the page in place. */
const refreshMetrics = (): void => {
  setPromoterProfileFilters({ timeframe: activePeriod.value });
  void fetchPromoterDetails(props.promoterId).catch(() => undefined);
};

/** Debounces audience search until the user pauses typing. */
const updateAudienceSearch = useDebounceFn((value: string) => {
  void setPromoterAudiencesSearch(props.promoterId, value).catch(
    () => undefined,
  );
}, 300);

/** Moves the referred-audience table to another page. */
const changeAudiencePage = (page: number): void => {
  void fetchPromoterAudiences(props.promoterId, page).catch(() => undefined);
};

/** Keeps the current tab and period URL compact while preserving defaults implicitly. */
const syncRouteState = (): void => {
  const nextQuery: Record<string, string> = {};
  if (activeTab.value !== defaultTab) nextQuery.tab = activeTab.value;
  if (activePeriod.value !== defaultPeriod)
    nextQuery.period = activePeriod.value;

  const currentQuery = {
    tab: getQueryValue(route.query.tab),
    period: getQueryValue(route.query.period),
  };

  if (
    currentQuery.tab === (nextQuery.tab ?? "") &&
    currentQuery.period === (nextQuery.period ?? "")
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
const selectPeriod = (period: PromoterPeriod): void => {
  activePeriod.value = period;
  periodDropdown.value?.closeDropdown();
};

/** Selects an audience filter and closes the associated dropdown menu. */
const selectAudienceFilter = (filter: PromoterAudienceStatusFilter): void => {
  audienceDropdown.value?.closeDropdown();
  void setPromoterAudiencesStatus(props.promoterId, filter).catch(
    () => undefined,
  );
};

/** Opens the edit form for the loaded promoter. */
const openEditPromoterModal = (): void => {
  void editPromoterModal.value?.open();
};

/** Opens the delete confirmation for the loaded promoter. */
const openDeletePromoterModal = (): void => {
  void deletePromoterModal.value?.open();
};

watch(searchInput, (value) => updateAudienceSearch(value));

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
  () => props.promoterId,
  () => {
    resetPromoterProfile();
    searchInput.value = "";
    hasLoaded.value = false;
    void loadPromoter();
  },
);

onMounted(() => {
  resetPromoterProfile();
  void loadPromoter();
});
</script>

<template>
  <PromoterDetailShimmer v-if="!hasLoaded" />

  <AppErrorState
    v-else-if="loadFailed"
    heading="We couldn't load this promoter"
    description="Something went wrong while fetching the promoter profile. Please try again."
    :retrying="fetchingPromoterDetails"
    @retry="loadPromoter"
  />

  <div v-else-if="profile && selectedPromoter" class="flex min-w-0 w-full flex-col gap-6">
    <AppHeading
      title="Promoters Profile"
      subtitle="Manage and monitor promoters performance"
    />

    <section
      class="flex flex-col gap-4 border-b border-dashboard-card-border pb-6 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex min-w-0 items-center gap-4">
        <img
          v-if="profile.hasAvatar"
          :src="profile.avatarUrl"
          :alt="`${profile.name} profile photo`"
          class="h-22 w-22 shrink-0 rounded-full border border-dashboard-card-border object-cover"
        />
        <span
          v-else
          class="flex h-22 w-22 shrink-0 items-center justify-center rounded-full border border-dashboard-card-border bg-dashboard-bg-dark text-2xl font-medium text-dashboard-heading"
          aria-hidden="true"
        >
          {{ profile.initials }}
        </span>
        <div class="min-w-0">
          <h2
            class="truncate text-xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ profile.name }}
          </h2>
          <p class="mt-1 text-sm text-dashboard-text">{{ profile.campaign }}</p>
          <div
            class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-dashboard-text"
          >
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:direct-inbox" size="0.95rem" />
              {{ profile.email }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:call" size="0.95rem" />
              {{ profile.phone }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:calendar" size="0.95rem" />
              Joined {{ profile.joinedDate }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex shrink-0 flex-wrap gap-3">
        <AppButton
          type="button"
          size="sm"
          color="neutral"
          outlined
          :block="false"
          class="w-fit !px-5 !py-2.5"
          aria-label="Delete promoter"
          @click="openDeletePromoterModal"
        >
          <Icon name="vent:trash" size="1.1rem" />
          Delete
        </AppButton>
        <AppButton
          type="button"
          size="sm"
          color="primary"
          :block="false"
          class="w-fit !px-5 !py-2.5"
          aria-label="Edit promoter profile"
          @click="openEditPromoterModal"
        >
          <Icon name="vent:profile-add" size="1.1rem" />
          Edit Profile
        </AppButton>
      </div>
    </section>

    <section
      class="grid grid-cols-1 gap-5 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)]"
    >
      <div class="flex items-start flex-col">
        <p class="text-sm text-dashboard-text">Referral Code</p>
        <AppClipBoard :text="profile.referralCode" icon-size="1rem">
          <span class="text-sm font-medium text-dashboard-heading">{{
            profile.referralCode
          }}</span>
        </AppClipBoard>
      </div>
      <div class="min-w-0 flex items-start flex-col">
        <p class="text-sm text-dashboard-text">App Referral Link</p>
        <AppClipBoard :text="profile.appLink" icon-size="1rem" class="min-w-0 max-w-full">
          <span class="min-w-0 truncate text-sm text-dashboard-heading">{{
            profile.appLink
          }}</span>
        </AppClipBoard>
      </div>
      <div class="min-w-0 flex items-start flex-col">
        <p class="text-sm text-dashboard-text">Web Referral Link</p>
        <AppClipBoard :text="profile.webLink" icon-size="1rem" class="min-w-0 max-w-full">
          <span class="min-w-0 truncate text-sm text-dashboard-heading">{{
            profile.webLink
          }}</span>
        </AppClipBoard>
      </div>
    </section>

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
              aria-label="Promoter reporting period"
            >
              <Icon name="vent:calendar" size="1rem" />
              {{ activePeriodLabel }}
              <Icon name="vent:arrow-down" size="0.9rem" />
            </button>
          </template>
          <template #dropdown_body>
            <div class="min-w-40 space-y-1">
              <button
                v-for="period in PROMOTER_PERIOD_OPTIONS"
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

      <template #audiences>
        <div
          class="flex flex-col gap-6 border-t border-dashboard-card-border pt-5"
        >
          <AppMetricRowsShimmer
            v-if="fetchingPromoterDetails"
            :rows="PROMOTER_METRIC_SHIMMER_ROWS.audiences"
          />
          <AppMetricRows
            v-else-if="metricRows.audiences"
            :rows="metricRows.audiences"
            aria-label="Promoter audience metrics"
          />
          <TableComponent
            :headings="tableHeadings"
            :body="audienceRows"
            :is-loading="fetchingPromoterAudiences"
            empty-heading="No referred audience found"
            empty-subtitle="Try changing the search text or active filter."
          >
            <template #table-heading>
              <TableComponentHeader
                v-model:search="searchInput"
                table-name="Referred Audience"
                search-placeholder="Search..."
              >
                <template #filters>
                  <AppDropdown
                    ref="audienceDropdown"
                    position="right"
                    :width-is-finite="false"
                  >
                    <template #default>
                      <button
                        type="button"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                      >
                        Filter by: {{ activeAudienceFilterLabel }}
                        <Icon name="vent:arrow-down" size="0.9rem" />
                      </button>
                    </template>
                    <template #dropdown_body>
                      <div class="min-w-44 space-y-1">
                        <button
                          v-for="option in PROMOTER_AUDIENCE_FILTER_OPTIONS"
                          :key="option.value"
                          type="button"
                          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                          :class="{
                            'bg-dashboard-bg-dark':
                              promoterAudiencesStatus === option.value,
                          }"
                          @click="selectAudienceFilter(option.value)"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </template>
                  </AppDropdown>
                </template>
              </TableComponentHeader>
            </template>

            <template #col_transaction="{ rowData }">
              <AppPills
                :color="rowData.hasTransaction ? 'green' : 'red'"
                class="text-xs"
              >
                {{ rowData.hasTransaction ? "Yes" : "No" }}
              </AppPills>
            </template>

            <template #col_status="{ rowData }">
              <AppPills
                :color="rowData.isVerified ? 'green' : 'red'"
                class="text-xs"
              >
                {{ rowData.isVerified ? "Verified" : "Not verified" }}
              </AppPills>
            </template>

            <template #table-footer>
              <TableComponentPagination
                :page="promoterAudiencesPage"
                :per-page="promoterAudiencesPerPage"
                :total-items="promoterAudiencesTotal"
                @change-page="changeAudiencePage"
              />
            </template>
          </TableComponent>
        </div>
      </template>

      <template
        v-for="tab in ['transactions', 'withdrawal', 'utility'] as const"
        :key="tab"
        #[tab]
      >
        <div class="border-t border-dashboard-card-border pt-5">
          <AppMetricRowsShimmer
            v-if="fetchingPromoterDetails"
            :rows="PROMOTER_METRIC_SHIMMER_ROWS[tab]"
          />
          <AppMetricRows
            v-else-if="metricRows[tab]"
            :rows="metricRows[tab]!"
            aria-label="Promoter transaction metrics"
          />
          <AppEmptyState
            v-else
            heading="Transaction figures unavailable"
            empty-table-subtitle="You don't have permission to view this promoter's transaction figures."
            height="16rem"
            hide-image
          />
        </div>
      </template>
    </AppTab>

    <PromoterEditModal ref="editPromoterModal" :promoter="selectedPromoter" />
    <PromoterDeleteModal
      ref="deletePromoterModal"
      :promoter-ids="[selectedPromoter.id]"
      redirect-on-delete
    />
  </div>

  <section
    v-else
    class="flex min-h-[24rem] flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 text-center"
  >
    <Icon name="vent:box-search" size="2.5rem" class="text-dashboard-text" />
    <h1 class="mt-4 text-xl font-medium text-dashboard-heading">
      Promoter not found
    </h1>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      This promoter does not exist or has been deleted.
    </p>
    <NuxtLink
      to="/promoters"
      class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm text-white transition hover:bg-brand-color-005"
    >
      Return to promoters
    </NuxtLink>
  </section>
</template>
