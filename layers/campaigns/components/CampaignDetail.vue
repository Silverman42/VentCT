<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import type {
  CampaignCountryFilter,
  CampaignMetricKey,
} from "../composables/useCampaignMockData";
import type {
  CampaignAudienceStatusFilter,
  ICampaign,
} from "../composables/useCampaignStore";
import {
  formatCampaignDate,
  formatCampaignDateRange,
} from "../utils/CampaignFormatters";

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
} = useCampaignStore();
const { campaignCountryOptions, getCampaignSampleInsights, getCampaignMetrics, getCampaignOverview } =
  useCampaignMockData();

const campaignFormModal = ref<CampaignFormModalController | null>(null);
const deleteModal = ref<CampaignModalController | null>(null);
const qrCodeModal = ref<CampaignModalController | null>(null);
const breakdownModal = ref<BreakdownModalController | null>(null);
const actionsDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const countryDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const audienceDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const overviewCountry = ref<CampaignCountryFilter>("all");
const overviewDateRange = ref<OverviewDateRange | null>(
  createLastThirtyDaysRange(),
);
const promoterSearchInput = ref("");
const audienceSearchInput = ref("");
const hasLoaded = ref(false);
const detailsFailed = ref(false);
const promotersFailed = ref(false);
const audiencesFailed = ref(false);

const AUDIENCE_FILTERS: CampaignAudienceStatusFilter[] = [
  "all",
  "verified",
  "unverified",
  "transacted",
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

/** Builds the default "Last 30 days" overview window ending today. */
function createLastThirtyDaysRange(): OverviewDateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  return {
    key: "last30days",
    label: "Last 30 days",
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/** Header view model for the loaded campaign, with explicit fallbacks. */
const campaignView = computed(() => {
  const campaign = selectedCampaign.value;
  return {
    name: campaign?.name || "Untitled campaign",
    slug: campaign?.slug || "—",
    status: campaign?.status ?? "pending",
    target: (campaign?.target ?? 0).toLocaleString(),
    description: campaign?.description?.trim() || "",
    dates: formatCampaignDateRange(campaign?.start_date, campaign?.end_date),
  };
});

/** API-backed performance cards split into two rows. */
const apiMetricRows = computed<IAppMetric[][]>(() => {
  const metrics = selectedCampaign.value?.metrics;
  const format = (value: number | undefined) => (value ?? 0).toLocaleString();

  return [
    [
      {
        label: "Promoters",
        value: format(metrics?.total_promoters),
        description: "Promoters assigned to this campaign",
      },
      {
        label: "Audience",
        value: format(metrics?.total_audiences),
        description: "People referred into this campaign",
      },
      {
        label: "Events",
        value: format(metrics?.total_events),
        description: "Events linked to this campaign",
      },
    ],
    [
      {
        label: "Verified Audience",
        value: format(metrics?.verified_audiences),
        description: "Audience members who completed KYC",
      },
      {
        label: "Transacted Audience",
        value: format(metrics?.transacted_audiences),
        description: "Audience members who completed a trade",
      },
    ],
  ];
});

/** Sample per-country overview rows narrowed by the country filter. */
const overviewRows = computed(() =>
  getCampaignOverview({
    country: overviewCountry.value,
    dateRange: overviewDateRange.value,
  }),
);

/** Sample overview cards split into the two four-card rows of the design. */
const overviewMetricRows = computed<IAppMetric[][]>(() => {
  const metrics: IAppMetric[] = getCampaignMetrics(overviewRows.value).map(
    (metric) => ({ ...metric, actionable: Boolean(metric.key) }),
  );
  return [metrics.slice(0, 4), metrics.slice(4)];
});

/** Sample top-promoter and performance data. */
const sampleInsights = getCampaignSampleInsights();

/** Label of the active country filter for the dropdown trigger. */
const overviewCountryLabel = computed(
  () =>
    campaignCountryOptions.find(
      (option) => option.value === overviewCountry.value,
    )?.label ?? "All Country",
);

/** Promoter names keyed by id, used to label audience rows. */
const promoterNames = computed(
  () =>
    new Map(
      campaignPromoters.value.map((promoter) => [promoter.id, promoter.name]),
    ),
);

/** Promoter rows mapped from the API with explicit fallbacks. */
const promoterRows = computed<IPromoterRow[]>(() =>
  campaignPromoters.value.map((promoter) => ({
    id: promoter.id,
    name: promoter.name || "—",
    email: promoter.email || "—",
    phone: promoter.phone || "—",
    referralCode: promoter.referral_code || "—",
  })),
);

/** Audience rows mapped from the API with explicit fallbacks. */
const audienceRows = computed<IAudienceRow[]>(() =>
  campaignAudiences.value.map((member) => ({
    id: member.id,
    name: member.name || "—",
    promoter:
      (member.promoter_id && promoterNames.value.get(member.promoter_id)) ||
      "—",
    email: member.email || "—",
    phone: member.phone || "—",
    hasTransacted: Boolean(member.has_transacted),
    isVerified: Boolean(member.is_verified),
    joined: formatCampaignDate(member.created_at),
  })),
);

/** Renders a concise text label for an audience status filter value. */
const getAudienceFilterLabel = (filter: CampaignAudienceStatusFilter): string =>
  `${filter.slice(0, 1).toUpperCase()}${filter.slice(1)}`;

/** Runs a related-table request and records whether it failed. */
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

/** Loads the campaign, then its promoters and audience when it exists. */
const loadCampaign = async (): Promise<void> => {
  hasLoaded.value = false;
  detailsFailed.value = false;
  promoterSearchInput.value = "";
  audienceSearchInput.value = "";
  resetCampaignRelations();

  try {
    await fetchCampaignDetails(props.campaignId);
  } catch {
    detailsFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }

  if (selectedCampaign.value) {
    await Promise.all([loadPromoters(1), loadAudiences(1)]);
  }
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

/** Applies the overview country filter and closes its menu. */
const selectOverviewCountry = (country: CampaignCountryFilter): void => {
  overviewCountry.value = country;
  countryDropdown.value?.closeDropdown();
};

/** Opens the breakdown modal for an actionable overview card. */
const openMetricBreakdown = (metric: IAppMetric): void => {
  if (!metric.key) return;
  breakdownModal.value?.open(metric.key as CampaignMetricKey);
};

watch(promoterSearchInput, (term, previous) => {
  if (term.trim() !== previous.trim()) updatePromoterSearch(term);
});
watch(audienceSearchInput, (term, previous) => {
  if (term.trim() !== previous.trim()) updateAudienceSearch(term);
});
watch(() => props.campaignId, loadCampaign, { immediate: true });
</script>

<template>
  <CampaignDetailShimmer v-if="!hasLoaded" />

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
          Target - {{ campaignView.target }} &nbsp; Slug -
          {{ campaignView.slug }} &nbsp; {{ campaignView.dates }}
        </p>
        <p
          v-if="campaignView.description"
          class="mt-1 max-w-2xl text-sm text-dashboard-text"
        >
          {{ campaignView.description }}
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

    <AppMetricRows :rows="apiMetricRows" aria-label="Campaign performance metrics" />

    <section
      class="flex flex-wrap items-center justify-between gap-2 border-b border-dashboard-card-border pb-5"
      aria-label="Campaign overview filters"
    >
      <p class="text-xs text-dashboard-text">
        Overview, breakdown, top promoters and chart show sample data.
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <AppDateTimeDropdown
          v-model="overviewDateRange"
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
            >
              <Icon name="vent:global" size="1rem" />
              {{ overviewCountryLabel }}
              <Icon name="vent:arrow-down" size="0.9rem" />
            </button>
          </template>
          <template #dropdown_body>
            <div class="min-w-38 space-y-1">
              <button
                v-for="option in campaignCountryOptions"
                :key="option.value"
                type="button"
                class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                :class="{
                  'bg-dashboard-bg-dark': overviewCountry === option.value,
                }"
                @click="selectOverviewCountry(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </template>
        </AppDropdown>
      </div>
    </section>

    <AppMetricRows
      :rows="overviewMetricRows"
      aria-label="Campaign overview metrics"
      @select="openMetricBreakdown"
    />

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <section
        v-if="promotersFailed"
        class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center xl:col-span-7"
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
        class="xl:col-span-7"
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

      <CampaignTopPromoters
        class="xl:col-span-5"
        :total-volume="sampleInsights.totalVolume"
        :promoters="sampleInsights.topPromoters"
      />
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

    <CampaignPerformanceChart :performance="sampleInsights.performance" />

    <CampaignNewModal ref="campaignFormModal" />
    <CampaignDeleteModal
      ref="deleteModal"
      :campaign-ids="[selectedCampaign.id]"
      redirect-on-delete
    />
    <CampaignQrCodeModal ref="qrCodeModal" :campaign="selectedCampaign" />
    <CampaignMetricBreakdownModal ref="breakdownModal" :rows="overviewRows" />
  </div>
</template>
