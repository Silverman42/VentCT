<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type {
  AudienceVerificationFilter,
  CampaignAudienceMember,
  CampaignCountryFilter,
  CampaignMetricKey,
  CampaignPromoter,
  CampaignStatus,
  PromoterAudienceFilter,
} from "../composables/useCampaignMockData";

interface CampaignModalController {
  open: () => void | Promise<void>;
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

const DETAIL_TABLE_PAGE_SIZE = 10;

const props = defineProps<{
  campaignId: string;
}>();

const {
  campaignCountryOptions,
  getCampaignDetails,
  getCampaignMetrics,
  getCampaignOverview,
} = useCampaignMockData();
const editCampaignModal = ref<CampaignModalController | null>(null);
const qrCodeModal = ref<CampaignModalController | null>(null);
const breakdownModal = ref<BreakdownModalController | null>(null);
const actionsDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const countryDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const overviewCountry = ref<CampaignCountryFilter>("all");
const overviewDateRange = ref<OverviewDateRange | null>(
  createLastThirtyDaysRange(),
);
const promoterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const audienceDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const promoterSearchInput = ref("");
const audienceSearchInput = ref("");
const promoterSearch = ref("");
const audienceSearch = ref("");
const promoterFilter = ref<PromoterAudienceFilter>("all");
const audienceFilter = ref<AudienceVerificationFilter>("all");
const promoterPage = ref(1);
const audiencePage = ref(1);

const promoterHeadings: ITableHeaderData[] = [
  { id: "name", name: "Names" },
  { id: "email", name: "Email", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
  { id: "referralCode", name: "Reference Code", isHiddenOnMobile: true },
  { id: "audience", name: "Audience" },
];

const audienceHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "promoter", name: "Promoter" },
  { id: "email", name: "Email", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
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

/** Resolves the requested campaign data and makes missing fixtures explicit. */
const campaignDetails = computed(() => getCampaignDetails(props.campaignId));

/** Maps the campaign lifecycle status to its badge colour and label. */
const statusPill = computed(() => {
  const status: CampaignStatus =
    campaignDetails.value?.campaign.status ?? "pending";
  const pills: Record<
    CampaignStatus,
    { color: "green" | "orange" | "gray"; label: string }
  > = {
    running: { color: "green", label: "Running" },
    pending: { color: "orange", label: "Pending" },
    closed: { color: "gray", label: "Closed" },
  };
  return pills[status];
});

/** Per-country overview rows narrowed by the country and date filters. */
const overviewRows = computed(() =>
  getCampaignOverview(props.campaignId, {
    country: overviewCountry.value,
    dateRange: overviewDateRange.value,
  }),
);

/** Overview cards split into the two four-card rows of the design. */
const overviewMetricRows = computed<IAppMetric[][]>(() => {
  const metrics: IAppMetric[] = getCampaignMetrics(overviewRows.value).map(
    (metric) => ({ ...metric, actionable: Boolean(metric.key) }),
  );
  return [metrics.slice(0, 4), metrics.slice(4)];
});

/** Label of the active country filter for the dropdown trigger. */
const overviewCountryLabel = computed(
  () =>
    campaignCountryOptions.find(
      (option) => option.value === overviewCountry.value,
    )?.label ?? "All Country",
);

/** Debounces promoter filtering until the user pauses typing. */
const updatePromoterSearch = useDebounceFn((value: string) => {
  promoterSearch.value = value;
  promoterPage.value = 1;
}, 300);

/** Debounces audience filtering until the user pauses typing. */
const updateAudienceSearch = useDebounceFn((value: string) => {
  audienceSearch.value = value;
  audiencePage.value = 1;
}, 300);

/** Filters promoter fixtures by search text and audience contribution state. */
const filteredPromoters = computed<CampaignPromoter[]>(() => {
  const details = campaignDetails.value;
  if (!details) return [];

  const searchTerm = promoterSearch.value.trim().toLocaleLowerCase();

  return details.promoters.filter((promoter) => {
    const matchesSearch =
      !searchTerm ||
      [promoter.name, promoter.email, promoter.phone, promoter.referralCode]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);
    const matchesAudience =
      promoterFilter.value === "all" ||
      (promoterFilter.value === "has-audience" && promoter.audience > 0) ||
      (promoterFilter.value === "no-audience" && promoter.audience === 0);

    return matchesSearch && matchesAudience;
  });
});

/** Filters audience fixtures by search text and their verification state. */
const filteredAudience = computed<CampaignAudienceMember[]>(() => {
  const details = campaignDetails.value;
  if (!details) return [];

  const searchTerm = audienceSearch.value.trim().toLocaleLowerCase();

  return details.audience.filter((member) => {
    const matchesSearch =
      !searchTerm ||
      [member.name, member.promoter, member.email, member.phone]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);
    const matchesVerification =
      audienceFilter.value === "all" ||
      (audienceFilter.value === "verified" && member.isVerified) ||
      (audienceFilter.value === "not-verified" && !member.isVerified);

    return matchesSearch && matchesVerification;
  });
});

/** Determines the final valid promoter-table page after filtering. */
const promoterLastPage = computed(() =>
  Math.max(
    1,
    Math.ceil(filteredPromoters.value.length / DETAIL_TABLE_PAGE_SIZE),
  ),
);

/** Determines the final valid audience-table page after filtering. */
const audienceLastPage = computed(() =>
  Math.max(
    1,
    Math.ceil(filteredAudience.value.length / DETAIL_TABLE_PAGE_SIZE),
  ),
);

/** Selects promoters visible in the active paginated range. */
const pagedPromoters = computed(() => {
  const start = (promoterPage.value - 1) * DETAIL_TABLE_PAGE_SIZE;
  return filteredPromoters.value.slice(start, start + DETAIL_TABLE_PAGE_SIZE);
});

/** Selects audience members visible in the active paginated range. */
const pagedAudience = computed(() => {
  const start = (audiencePage.value - 1) * DETAIL_TABLE_PAGE_SIZE;
  return filteredAudience.value.slice(start, start + DETAIL_TABLE_PAGE_SIZE);
});

/** Changes the promoter audience filter and closes the corresponding menu. */
const selectPromoterFilter = (filter: PromoterAudienceFilter) => {
  promoterFilter.value = filter;
  promoterPage.value = 1;
  promoterDropdown.value?.closeDropdown();
};

/** Changes the audience verification filter and closes the corresponding menu. */
const selectAudienceFilter = (filter: AudienceVerificationFilter) => {
  audienceFilter.value = filter;
  audiencePage.value = 1;
  audienceDropdown.value?.closeDropdown();
};

/** Renders a concise text label for a promoter audience filter value. */
const getPromoterFilterLabel = (filter: PromoterAudienceFilter): string => {
  if (filter === "has-audience") return "Has audience";
  if (filter === "no-audience") return "No audience";
  return "All";
};

/** Renders a concise text label for an audience verification filter value. */
const getAudienceFilterLabel = (filter: AudienceVerificationFilter): string => {
  if (filter === "not-verified") return "Not verified";
  return `${filter.slice(0, 1).toUpperCase()}${filter.slice(1)}`;
};

/** Opens the validation-only campaign edit form for the current campaign. */
const openEditCampaignModal = (): void => {
  actionsDropdown.value?.closeDropdown();
  editCampaignModal.value?.open();
};

/** Opens the QR pass for the current campaign. */
const openQrCodeModal = (): void => {
  actionsDropdown.value?.closeDropdown();
  qrCodeModal.value?.open();
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

watch(promoterSearchInput, (value) => updatePromoterSearch(value));
watch(audienceSearchInput, (value) => updateAudienceSearch(value));

watch(promoterFilter, () => {
  promoterPage.value = 1;
});

watch(audienceFilter, () => {
  audiencePage.value = 1;
});

watch(
  promoterLastPage,
  (lastPage) => {
    if (promoterPage.value > lastPage) promoterPage.value = lastPage;
  },
  { immediate: true },
);

watch(
  audienceLastPage,
  (lastPage) => {
    if (audiencePage.value > lastPage) audiencePage.value = lastPage;
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="campaignDetails" class="flex w-full flex-col gap-6">
    <section class="flex items-start justify-between gap-4">
      <div>
        <h2
          class="text-lg md:text-2xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ campaignDetails.campaign.name }}
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Target - {{ campaignDetails.campaign.target.toLocaleString() }} &nbsp;
          Referral code -
          {{ campaignDetails.campaign.referralCode }}
        </p>
        <AppPills class="mt-2 text-xs" :color="statusPill.color">
          {{ statusPill.label }}
        </AppPills>
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
              class="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-400 opacity-60"
              disabled
              title="Not available in mock mode"
            >
              <Icon name="vent:trash" size="1rem" />
              Delete campaign
            </button>
          </div>
        </template>
      </AppDropdown>
    </section>

    <section
      class="flex flex-wrap items-center justify-end gap-2 border-b border-dashboard-card-border pb-5"
      aria-label="Campaign overview filters"
    >
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
    </section>

    <AppMetricRows
      :rows="overviewMetricRows"
      aria-label="Campaign summary metrics"
      @select="openMetricBreakdown"
    />

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <TableComponent
        class="xl:col-span-7"
        :headings="promoterHeadings"
        :body="pagedPromoters"
        empty-heading="No promoters found"
        empty-subtitle="Try changing the promoter search or audience filter."
      >
        <template #table-heading>
          <TableComponentHeader
            v-model:search="promoterSearchInput"
            table-name="Promoters"
            search-placeholder="Search promoters..."
          >
            <template #filters>
              <AppDropdown
                ref="promoterDropdown"
                position="right"
                :width-is-finite="false"
              >
                <template #default>
                  <button
                    type="button"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                  >
                    <Icon name="vent:filter" size="0.9rem" />
                    Filters
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="min-w-38 space-y-1">
                    <button
                      v-for="filter in [
                        'all',
                        'has-audience',
                        'no-audience',
                      ] as const"
                      :key="filter"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{
                        'bg-dashboard-bg-dark': promoterFilter === filter,
                      }"
                      @click="selectPromoterFilter(filter)"
                    >
                      {{ getPromoterFilterLabel(filter) }}
                    </button>
                  </div>
                </template>
              </AppDropdown>
            </template>
          </TableComponentHeader>
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="promoterPage"
            :per-page="DETAIL_TABLE_PAGE_SIZE"
            :total-items="filteredPromoters.length"
            @change-page="promoterPage = $event"
          />
        </template>
      </TableComponent>

      <CampaignTopPromoters
        class="xl:col-span-5"
        :total-volume="campaignDetails.totalVolume"
        :promoters="campaignDetails.topPromoters"
      />
    </section>

    <TableComponent
      :headings="audienceHeadings"
      :body="pagedAudience"
      empty-heading="No audience members found"
      empty-subtitle="Try changing the audience search or verification filter."
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
                  Filter by: {{ getAudienceFilterLabel(audienceFilter) }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-38 space-y-1">
                  <button
                    v-for="filter in [
                      'all',
                      'verified',
                      'not-verified',
                    ] as const"
                    :key="filter"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': audienceFilter === filter,
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
          :color="rowData.hasTransaction ? 'green' : 'red'"
          class="text-xs"
        >
          {{ rowData.hasTransaction ? "Yes" : "No" }}
        </AppPills>
      </template>

      <template #col_status="{ rowData }">
        <AppPills :color="rowData.isVerified ? 'green' : 'red'" class="text-xs">
          {{ rowData.isVerified ? "Verified" : "Not verified" }}
        </AppPills>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="audiencePage"
          :per-page="DETAIL_TABLE_PAGE_SIZE"
          :total-items="filteredAudience.length"
          @change-page="audiencePage = $event"
        />
      </template>
    </TableComponent>

    <CampaignPerformanceChart :performance="campaignDetails.performance" />

    <CampaignEditModal
      ref="editCampaignModal"
      :campaign="campaignDetails.campaign"
    />
    <CampaignQrCodeModal
      ref="qrCodeModal"
      :campaign="campaignDetails.campaign"
    />
    <CampaignMetricBreakdownModal ref="breakdownModal" :rows="overviewRows" />
  </div>

  <section
    v-else
    class="flex min-h-[24rem] flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 text-center"
  >
    <Icon name="vent:box-search" size="2.5rem" class="text-dashboard-text" />
    <h1 class="mt-4 text-xl font-medium text-dashboard-heading">
      Campaign not found
    </h1>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      This campaign does not exist in the current fixture data.
    </p>
    <NuxtLink
      to="/campaigns"
      class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm text-white transition hover:bg-brand-color-005"
    >
      Return to campaigns
    </NuxtLink>
  </section>
</template>
