<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import {
  buildTimeframePresets,
  formatCount,
  formatUsd,
  toApiDate,
  type AnalyticsTimeframe,
} from "~/utils/helpers/AnalyticsFormatters";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import type {
  CampaignAudienceStatusFilter,
  CampaignSeriesPeriod,
  ICampaign,
  ICampaignOverviewFilters,
} from "../composables/useCampaignStore";
import {
  formatCampaignDate,
  formatCampaignDateRange,
} from "../utils/CampaignFormatters";
import {
  buildOverviewMetrics,
  type CampaignMetricKey,
} from "../utils/CampaignOverview";

interface CampaignModalController {
  open: () => void | Promise<void>;
  close: () => void;
}

interface CampaignFormModalController {
  open: (campaign?: ICampaign) => void | Promise<void>;
  close: () => void;
}

interface BreakdownModalController {
  open: (key: CampaignMetricKey) => void;
  close: () => void;
}

/** Date range shape bound to `AppDateTimeDropdown`. */
interface OverviewDateRange {
  key: string;
  label: string;
  start: string;
  end: string;
  custom?: boolean;
}

/** Template-ready country option; an empty code means all countries. */
interface CountryOption {
  code: string;
  label: string;
}

/** Table-ready promoter row with formatted fallbacks. */
interface IPromoterRow extends ITableBodyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
}

/** Table-ready audience row with formatted fallbacks. */
interface IAudienceRow extends ITableBodyData {
  id: string;
  name: string;
  promoter: string;
  email: string;
  phone: string;
  hasTransacted: boolean;
  isVerified: boolean;
  joined: string;
}

const props = defineProps<{
  campaignId: string;
}>();

const {
  selectedCampaign,
  fetchCampaignDetails,
  campaignPromoters,
  fetchingCampaignPromoters,
  campaignPromotersPage,
  campaignPromotersPerPage,
  campaignPromotersTotal,
  fetchCampaignPromoters,
  setCampaignPromotersSearch,
  campaignAudiences,
  fetchingCampaignAudiences,
  campaignAudiencesPage,
  campaignAudiencesPerPage,
  campaignAudiencesTotal,
  campaignAudiencesStatus,
  fetchCampaignAudiences,
  setCampaignAudiencesSearch,
  setCampaignAudiencesStatus,
  resetCampaignRelations,
  canViewCampaignAnalytics,
  overviewFilters,
  campaignOverview,
  fetchingCampaignOverview,
  fetchCampaignOverview,
  setCampaignOverviewFilters,
  campaignTopPromoters,
  fetchingCampaignTopPromoters,
  fetchCampaignTopPromoters,
  campaignSeriesPeriod,
  campaignVerificationSeries,
  fetchingCampaignVerificationSeries,
  fetchCampaignVerificationSeries,
  setCampaignSeriesPeriod,
  campaignCountries,
  fetchingCampaignCountries,
  fetchCampaignCountries,
} = useCampaignStore();

const timeframePresets = buildTimeframePresets();
const campaignFormModal = ref<CampaignFormModalController | null>(null);
const deleteModal = ref<CampaignModalController | null>(null);
const qrCodeModal = ref<CampaignModalController | null>(null);
const breakdownModal = ref<BreakdownModalController | null>(null);
const actionsDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const countryDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const audienceDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const overviewDateRange = ref<OverviewDateRange | null>(null);
const promoterSearchInput = ref("");
const audienceSearchInput = ref("");
const hasLoaded = ref(false);
const detailsFailed = ref(false);
const promotersFailed = ref(false);
const audiencesFailed = ref(false);
const overviewFailed = ref(false);
const topPromotersFailed = ref(false);
const seriesFailed = ref(false);

const AUDIENCE_FILTERS: CampaignAudienceStatusFilter[] = [
  "all",
  "verified",
  "unverified",
  "transacted",
  "not_transacted",
];

const promoterHeadings: ITableHeaderData[] = [
  { id: "name", name: "Names" },
  { id: "email", name: "Email", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
  { id: "referralCode", name: "Referral Code" },
];

const audienceHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "promoter", name: "Promoter" },
  { id: "email", name: "Email", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
  { id: "joined", name: "Joined", isHiddenOnMobile: true },
  { id: "transaction", name: "Transaction" },
  { id: "status", name: "Status" },
];

/** Rebuilds the date dropdown selection from the stored overview filters. */
const getRangeFromFilters = (
  filters: ICampaignOverviewFilters,
): OverviewDateRange | null => {
  const { timeframe, startDate, endDate } = filters;
  if (timeframe === "custom" && startDate && endDate) {
    return {
      key: "custom",
      label: "Custom",
      start: new Date(`${startDate}T00:00:00`).toISOString(),
      end: new Date(`${endDate}T23:59:59`).toISOString(),
      custom: true,
    };
  }

  const preset = timeframePresets.find((item) => item.key === timeframe);
  return preset?.start && preset.end
    ? { key: preset.key, label: preset.label, start: preset.start, end: preset.end }
    : null;
};

/** Header view model for the loaded campaign, with explicit fallbacks. */
const campaignView = computed(() => {
  const campaign = selectedCampaign.value;
  return {
    name: campaign?.name || "Untitled campaign",
    slug: campaign?.slug || "—",
    referralCode: campaign?.referralCode || "—",
    status: campaign?.status ?? "pending",
    target: formatCount(campaign?.target),
    dates: formatCampaignDateRange(campaign?.startsAt, campaign?.endsAt),
  };
});

/** All-time header cards; the financial row only shows when the API returns it. */
const headerMetricRows = computed<IAppMetric[][]>(() => {
  const metrics = selectedCampaign.value?.metrics;
  const rows: IAppMetric[][] = [
    [
      {
        label: "Promoters",
        value: formatCount(metrics?.promotersCount),
        description: "Promoters assigned to this campaign",
      },
      {
        label: "Audience",
        value: formatCount(metrics?.audienceCount),
        description: "People referred into this campaign",
      },
      {
        label: "Events",
        value: formatCount(metrics?.eventsCount),
        description: "Events linked to this campaign",
      },
    ],
    [
      {
        label: "Verified Audience",
        value: formatCount(metrics?.verifiedAudienceCount),
        description: "Audience members who completed KYC",
      },
      {
        label: "Transacted Audience",
        value: formatCount(metrics?.transactedAudienceCount),
        description: "Audience members who completed a trade",
      },
    ],
  ];

  const hasFinancials =
    metrics?.totalVolume !== null && metrics?.totalVolume !== undefined;
  if (hasFinancials) {
    rows.push([
      {
        label: "Total Transactions",
        value: formatCount(metrics?.totalTransactions),
        description: "All-time EasyPay and SafeWallet deposits",
      },
      {
        label: "Total Volume",
        value: formatUsd(metrics?.totalVolume),
        description: "All-time transaction volume",
      },
      {
        label: "EasyPay Volume",
        value: formatUsd(metrics?.easypayVolume),
        description: "All-time EasyPay payout volume",
      },
      {
        label: "SafeWallet Volume",
        value: formatUsd(metrics?.safewalletVolume),
        description: "All-time SafeWallet deposit volume",
      },
    ]);
  }

  return rows;
});

/** Overview cards for the active filters, split into the design's two rows. */
const overviewMetricRows = computed<IAppMetric[][]>(() => {
  const metrics = buildOverviewMetrics(campaignOverview.value);
  return [metrics.slice(0, 4), metrics.slice(4)];
});

/** Country choices, with "All Country" first. */
const countryOptions = computed<CountryOption[]>(() => [
  { code: "", label: "All Country" },
  ...campaignCountries.value.map((country) => ({
    code: country.code,
    label: country.name || country.code,
  })),
]);

/** Label of the active country filter for the dropdown trigger. */
const overviewCountryLabel = computed(
  () =>
    countryOptions.value.find(
      (option) => option.code === (overviewFilters.value.countryCode ?? ""),
    )?.label ?? "All Country",
);

/** Whether top promoters should show the first-load shimmer. */
const showTopPromotersShimmer = computed(
  () => fetchingCampaignTopPromoters.value && !campaignTopPromoters.value,
);

/** Whether the chart should show the first-load shimmer. */
const showSeriesShimmer = computed(
  () =>
    fetchingCampaignVerificationSeries.value &&
    !campaignVerificationSeries.value,
);

/** Promoter rows mapped from the API with explicit fallbacks. */
const promoterRows = computed<IPromoterRow[]>(() =>
  campaignPromoters.value.map((promoter) => ({
    id: promoter.id,
    name: promoter.name || "—",
    email: promoter.email || "—",
    phone: promoter.phone || "—",
    referralCode: promoter.referralCode || "—",
  })),
);

/** Audience rows mapped from the API with explicit fallbacks. */
const audienceRows = computed<IAudienceRow[]>(() =>
  campaignAudiences.value.map((member) => ({
    id: member.id,
    name: member.name || "—",
    promoter: member.promoterName || "—",
    email: member.email || "—",
    phone: member.phone || "—",
    hasTransacted: Boolean(member.hasTransacted),
    isVerified: Boolean(member.isVerified),
    joined: formatCampaignDate(member.createdAt),
  })),
);

/** Renders a readable label for an audience status filter value, e.g. "Not transacted". */
const getAudienceFilterLabel = (filter: CampaignAudienceStatusFilter): string => {
  const text = filter.replace(/_/g, " ");
  return `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
};

/** Runs a campaign-scoped request and records whether it failed. */
const runRelationRequest = async (
  failed: Ref<boolean>,
  request: () => Promise<unknown>,
): Promise<void> => {
  failed.value = false;
  try {
    await request();
  } catch {
    failed.value = true;
  }
};

/** Loads the campaign's promoters table. */
const loadPromoters = (page?: number): Promise<void> =>
  runRelationRequest(promotersFailed, () =>
    fetchCampaignPromoters(props.campaignId, page),
  );

/** Loads the campaign's audience table. */
const loadAudiences = (page?: number): Promise<void> =>
  runRelationRequest(audiencesFailed, () =>
    fetchCampaignAudiences(props.campaignId, page),
  );

/** Reloads the overview cards for the current filters. */
const loadOverview = (): Promise<void> =>
  runRelationRequest(overviewFailed, () =>
    fetchCampaignOverview(props.campaignId),
  );

/** Loads the top promoters by volume for the current filters. */
const loadTopPromoters = (): Promise<void> =>
  runRelationRequest(topPromotersFailed, () =>
    fetchCampaignTopPromoters(props.campaignId),
  );

/** Loads the verification vs trade chart series. */
const loadSeries = (): Promise<void> =>
  runRelationRequest(seriesFailed, () =>
    fetchCampaignVerificationSeries(props.campaignId),
  );

/** Loads the country filter options; on failure only "All Country" is offered. */
const loadCountries = async (): Promise<void> => {
  try {
    await fetchCampaignCountries(props.campaignId);
  } catch {
    // The toast already reports it; the filter keeps "All Country".
  }
};

/**
 * Loads the campaign (with its overview), then its tables and, when the user
 * may see analytics, the countries, top promoters and chart.
 */
const loadCampaign = async (): Promise<void> => {
  hasLoaded.value = false;
  detailsFailed.value = false;
  overviewFailed.value = false;
  topPromotersFailed.value = false;
  seriesFailed.value = false;
  promoterSearchInput.value = "";
  audienceSearchInput.value = "";
  resetCampaignRelations();
  overviewDateRange.value = getRangeFromFilters(overviewFilters.value);

  try {
    await fetchCampaignDetails(props.campaignId);
  } catch {
    detailsFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }

  if (!selectedCampaign.value) return;

  const requests: Promise<void>[] = [loadPromoters(1), loadAudiences(1)];
  if (canViewCampaignAnalytics.value) {
    requests.push(loadCountries(), loadTopPromoters(), loadSeries());
  }
  await Promise.all(requests);
};

/** Applies new overview filters and refreshes the analytics that depend on them. */
const applyOverviewFilters = (
  partial: Partial<ICampaignOverviewFilters>,
  includeSeries = false,
): void => {
  setCampaignOverviewFilters(partial);
  void loadOverview();
  void loadTopPromoters();
  if (includeSeries) void loadSeries();
};

/** Searches promoters once the user pauses typing. */
const updatePromoterSearch = useDebounceFn((term: string) => {
  void runRelationRequest(promotersFailed, () =>
    setCampaignPromotersSearch(props.campaignId, term),
  );
}, 300);

/** Searches audience members once the user pauses typing. */
const updateAudienceSearch = useDebounceFn((term: string) => {
  void runRelationRequest(audiencesFailed, () =>
    setCampaignAudiencesSearch(props.campaignId, term),
  );
}, 300);

/** Changes the audience status filter and closes its menu. */
const selectAudienceFilter = (filter: CampaignAudienceStatusFilter) => {
  audienceDropdown.value?.closeDropdown();
  void runRelationRequest(audiencesFailed, () =>
    setCampaignAudiencesStatus(props.campaignId, filter),
  );
};

/** Changes the chart period and reloads the series. */
const selectSeriesPeriod = (period: CampaignSeriesPeriod): void => {
  void runRelationRequest(seriesFailed, () =>
    setCampaignSeriesPeriod(props.campaignId, period),
  );
};

/** Opens the edit form prefilled with the loaded campaign. */
const openEditCampaignModal = (): void => {
  actionsDropdown.value?.closeDropdown();
  if (selectedCampaign.value) {
    void campaignFormModal.value?.open(selectedCampaign.value);
  }
};

/** Opens the QR pass for the current campaign. */
const openQrCodeModal = (): void => {
  actionsDropdown.value?.closeDropdown();
  void qrCodeModal.value?.open();
};

/** Opens the delete confirmation for the current campaign. */
const openDeleteModal = (): void => {
  actionsDropdown.value?.closeDropdown();
  void deleteModal.value?.open();
};

/** Applies the overview country filter (also used by the chart) and closes its menu. */
const selectOverviewCountry = (code: string): void => {
  countryDropdown.value?.closeDropdown();
  if ((overviewFilters.value.countryCode ?? "") === code) return;
  applyOverviewFilters({ countryCode: code || undefined }, true);
};

/** Opens the breakdown modal for an actionable overview card. */
const openMetricBreakdown = (metric: IAppMetric): void => {
  if (!metric.key) return;
  breakdownModal.value?.open(metric.key as CampaignMetricKey);
};

watch(overviewDateRange, (range, previous) => {
  if (!range || !previous || !selectedCampaign.value) return;
  if (range.custom) {
    applyOverviewFilters({
      timeframe: "custom",
      startDate: toApiDate(range.start),
      endDate: toApiDate(range.end),
    });
    return;
  }
  if (range.key === overviewFilters.value.timeframe) return;
  applyOverviewFilters({ timeframe: range.key as AnalyticsTimeframe });
});
watch(promoterSearchInput, (term, previous) => {
  if (term.trim() !== previous.trim()) updatePromoterSearch(term);
});
watch(audienceSearchInput, (term, previous) => {
  if (term.trim() !== previous.trim()) updateAudienceSearch(term);
});
watch(() => props.campaignId, loadCampaign, { immediate: true });
</script>

<template>
  <CampaignDetailShimmer
    v-if="!hasLoaded"
    :show-analytics="canViewCampaignAnalytics"
  />

  <section
    v-else-if="detailsFailed"
    class="flex min-h-[24rem] flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 text-center"
  >
    <h1 class="text-xl font-medium text-dashboard-heading">
      We couldn't load this campaign
    </h1>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      Something went wrong while fetching the campaign details. Please try
      again.
    </p>
    <AppButton type="button" size="md" class="mt-5" @click="loadCampaign">
      Retry
    </AppButton>
  </section>

  <section
    v-else-if="!selectedCampaign"
    class="flex min-h-[24rem] flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 text-center"
  >
    <Icon name="vent:box-search" size="2.5rem" class="text-dashboard-text" />
    <h1 class="mt-4 text-xl font-medium text-dashboard-heading">
      Campaign not found
    </h1>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      This campaign does not exist or may have been deleted.
    </p>
    <NuxtLink
      to="/campaigns"
      class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm text-white transition hover:bg-brand-color-005"
    >
      Return to campaigns
    </NuxtLink>
  </section>

  <div v-else class="flex w-full flex-col gap-6">
    <section class="flex items-start justify-between gap-4">
      <div>
        <h2
          class="text-lg md:text-2xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ campaignView.name }}
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Target - {{ campaignView.target }} &nbsp; Referral code -
          {{ campaignView.referralCode }} &nbsp; Slug - {{ campaignView.slug }}
          &nbsp; {{ campaignView.dates }}
        </p>
        <CampaignStatusPill class="mt-2 text-xs" :status="campaignView.status" />
      </div>

      <AppDropdown
        ref="actionsDropdown"
        position="right"
        :width-is-finite="false"
      >
        <template #default>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashboard-card-border text-dashboard-heading transition hover:border-brand-color-default hover:text-brand-color-default"
            aria-label="Campaign actions"
          >
            <Icon name="vent:more" size="1.1rem" />
          </button>
        </template>
        <template #dropdown_body>
          <div class="min-w-44 space-y-1">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
              @click="openQrCodeModal"
            >
              <Icon name="vent:ai-scan" size="1rem" />
              Generate QR Code
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
              @click="openEditCampaignModal"
            >
              <Icon name="vent:edit" size="1rem" />
              Edit campaign
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 transition hover:bg-dashboard-bg-dark dark:text-red-400"
              @click="openDeleteModal"
            >
              <Icon name="vent:trash" size="1rem" />
              Delete campaign
            </button>
          </div>
        </template>
      </AppDropdown>
    </section>

    <AppMetricRows
      :rows="headerMetricRows"
      aria-label="Campaign all-time metrics"
    />

    <template v-if="canViewCampaignAnalytics">
      <section
        class="flex flex-wrap items-center justify-between gap-2 border-b border-dashboard-card-border pb-5"
        aria-label="Campaign overview filters"
      >
        <p class="text-xs text-dashboard-text">
          Period and country apply to the overview and top promoters; country
          also applies to the chart.
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <AppDateTimeDropdown
            v-model="overviewDateRange"
            :presets="timeframePresets"
            show-preset-label
            button-class="!rounded-lg !px-3 !py-2 !font-normal"
          />
          <AppDropdown
            ref="countryDropdown"
            position="right"
            :width-is-finite="false"
          >
            <template #default>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg-darker px-3 py-3 text-sm text-dashboard-heading transition hover:border-brand-color-default"
                :aria-busy="fetchingCampaignCountries"
              >
                <Icon name="vent:global" size="1rem" />
                {{ overviewCountryLabel }}
                <Icon name="vent:arrow-down" size="0.9rem" />
              </button>
            </template>
            <template #dropdown_body>
              <div class="min-w-38 space-y-1">
                <button
                  v-for="option in countryOptions"
                  :key="option.code || 'all'"
                  type="button"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{
                    'bg-dashboard-bg-dark':
                      (overviewFilters.countryCode ?? '') === option.code,
                  }"
                  @click="selectOverviewCountry(option.code)"
                >
                  {{ option.label }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </div>
      </section>

      <AppMetricRowsShimmer
        v-if="fetchingCampaignOverview"
        :rows="[4, 4]"
      />
      <AppErrorState
        v-else-if="overviewFailed"
        heading="We couldn't load the overview"
        description="Check your connection and try again."
        @retry="loadOverview"
      />
      <AppMetricRows
        v-else
        :rows="overviewMetricRows"
        aria-label="Campaign overview metrics"
        @select="openMetricBreakdown"
      />
    </template>

    <p
      v-else
      class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-4 py-3 text-sm text-dashboard-text"
    >
      Financial overview, top promoters and performance charts need the
      dashboard analytics permission.
    </p>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <section
        v-if="promotersFailed"
        class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
        :class="canViewCampaignAnalytics ? 'xl:col-span-7' : 'xl:col-span-12'"
      >
        <h3 class="text-lg font-medium text-dashboard-heading">
          We couldn't load promoters
        </h3>
        <AppButton type="button" size="md" class="mt-5" @click="loadPromoters()">
          Retry
        </AppButton>
      </section>

      <TableComponent
        v-else
        :class="canViewCampaignAnalytics ? 'xl:col-span-7' : 'xl:col-span-12'"
        :headings="promoterHeadings"
        :body="promoterRows"
        :is-loading="fetchingCampaignPromoters"
        empty-heading="No promoters found"
        empty-subtitle="No promoters match this campaign and search."
      >
        <template #table-heading>
          <TableComponentHeader
            v-model:search="promoterSearchInput"
            table-name="Promoters"
            search-placeholder="Search promoters..."
          />
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="campaignPromotersPage"
            :per-page="campaignPromotersPerPage"
            :total-items="campaignPromotersTotal"
            @change-page="loadPromoters"
          />
        </template>
      </TableComponent>

      <template v-if="canViewCampaignAnalytics">
        <CampaignTopPromotersShimmer
          v-if="showTopPromotersShimmer"
          class="xl:col-span-5"
        />
        <CampaignTopPromoters
          v-else
          class="xl:col-span-5"
          :data="campaignTopPromoters"
          :loading="fetchingCampaignTopPromoters"
          :failed="topPromotersFailed"
          @retry="loadTopPromoters"
        />
      </template>
    </section>

    <section
      v-if="audiencesFailed"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h3 class="text-lg font-medium text-dashboard-heading">
        We couldn't load the audience
      </h3>
      <AppButton type="button" size="md" class="mt-5" @click="loadAudiences()">
        Retry
      </AppButton>
    </section>

    <TableComponent
      v-else
      :headings="audienceHeadings"
      :body="audienceRows"
      :is-loading="fetchingCampaignAudiences"
      empty-heading="No audience members found"
      empty-subtitle="Try changing the audience search or status filter."
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="audienceSearchInput"
          table-name="Audience"
          search-placeholder="Search audience..."
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
                  Filter by:
                  {{ getAudienceFilterLabel(campaignAudiencesStatus) }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-38 space-y-1">
                  <button
                    v-for="filter in AUDIENCE_FILTERS"
                    :key="filter"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': campaignAudiencesStatus === filter,
                    }"
                    @click="selectAudienceFilter(filter)"
                  >
                    {{ getAudienceFilterLabel(filter) }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_transaction="{ rowData }">
        <AppPills
          :color="rowData.hasTransacted ? 'green' : 'red'"
          class="text-xs"
        >
          {{ rowData.hasTransacted ? "Yes" : "No" }}
        </AppPills>
      </template>

      <template #col_status="{ rowData }">
        <AppPills :color="rowData.isVerified ? 'green' : 'red'" class="text-xs">
          {{ rowData.isVerified ? "Verified" : "Not verified" }}
        </AppPills>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="campaignAudiencesPage"
          :per-page="campaignAudiencesPerPage"
          :total-items="campaignAudiencesTotal"
          @change-page="loadAudiences"
        />
      </template>
    </TableComponent>

    <template v-if="canViewCampaignAnalytics">
      <CampaignPerformanceChartShimmer v-if="showSeriesShimmer" />
      <CampaignPerformanceChart
        v-else
        :period="campaignSeriesPeriod"
        :data="campaignVerificationSeries"
        :loading="fetchingCampaignVerificationSeries"
        :failed="seriesFailed"
        @update:period="selectSeriesPeriod"
        @retry="loadSeries"
      />
    </template>

    <CampaignNewModal ref="campaignFormModal" />
    <CampaignDeleteModal
      ref="deleteModal"
      :campaign-ids="[selectedCampaign.id]"
      redirect-on-delete
    />
    <CampaignQrCodeModal ref="qrCodeModal" :campaign="selectedCampaign" />
    <CampaignMetricBreakdownModal
      ref="breakdownModal"
      :breakdown="campaignOverview?.breakdown ?? null"
    />
  </div>
</template>
