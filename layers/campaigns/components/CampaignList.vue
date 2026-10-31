<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type { ITableBodyData, ITableHeaderData } from "~/utils/types/misc/TableComponent";
import {
  CAMPAIGN_STATUS_LABELS,
  type CampaignStatusFilter,
  type ICampaign,
} from "../composables/useCampaignStore";
import { formatCampaignDateRange } from "../utils/CampaignFormatters";

interface ModalController {
  open: () => Promise<void> | void;
}

/** Table-ready campaign row with formatted fallbacks. */
interface ICampaignRow extends ITableBodyData {
  id: string;
  name: string;
  status: ICampaign["status"];
  target: string;
  dates: string;
  promoters: string;
  referralCode: string;
}

const {
  campaigns,
  campaignStats,
  fetchingCampaigns,
  campaignsPage,
  campaignsPerPage,
  campaignsTotal,
  campaignsSearch,
  campaignsStatus,
  fetchCampaigns,
} = useCampaignStore();
const route = useRoute();
const router = useRouter();
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const selectAllInput = ref<HTMLInputElement | null>(null);
const newCampaignModal = ref<ModalController | null>(null);
const exportCampaignModal = ref<ModalController | null>(null);
const deleteCampaignModal = ref<ModalController | null>(null);
const hasLoaded = ref(false);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "select", name: "Select", mobileLabel: "Select", width: "4.5rem" },
  { id: "name", name: "Name" },
  { id: "dates", name: "Duration", width: "22%" },
  { id: "target", name: "Target", width: "12%" },
  { id: "promoters", name: "Promoters", width: "12%" },
  { id: "referralCode", name: "Referral Code", width: "12%" },
  { id: "status", name: "Status", width: "12%" },
];

const STATUS_FILTERS: CampaignStatusFilter[] = [
  "all",
  "running",
  "pending",
  "closed",
];

/** Reads the first scalar value from a Nuxt query-string value. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Confirms that a query string is a supported campaign status filter. */
const isStatusFilter = (value: string): value is CampaignStatusFilter =>
  (STATUS_FILTERS as string[]).includes(value);

/** Normalizes the route query into campaign-list controls. */
const getRouteState = (): {
  search: string;
  status: CampaignStatusFilter;
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);
  const requestedStatus = getQueryValue(route.query.status);

  return {
    search: getQueryValue(route.query.search).trim(),
    status: isStatusFilter(requestedStatus) ? requestedStatus : "all",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const searchInput = ref(getRouteState().search);
const selectedCampaignIds = ref<Set<string>>(new Set());

/** Campaign rows mapped from the API with explicit fallbacks. */
const campaignRows = computed<ICampaignRow[]>(() =>
  campaigns.value.map((campaign) => ({
    id: campaign.id,
    name: campaign.name || "Untitled campaign",
    status: campaign.status,
    target: (campaign.target ?? 0).toLocaleString(),
    dates: formatCampaignDateRange(campaign.startsAt, campaign.endsAt),
    promoters: (campaign.promotersCount ?? 0).toLocaleString(),
    referralCode: campaign.referralCode || "—",
  })),
);

/** Summary cards built from the list response's status counts. */
const summaryCards = computed(() => [
  { label: "Pending Campaign", value: campaignStats.value.pending },
  { label: "Running Campaign", value: campaignStats.value.running },
  { label: "Closed Campaign", value: campaignStats.value.closed },
]);

/** Selected ids as an array for the delete modal. */
const selectedIdList = computed(() => [...selectedCampaignIds.value]);

/** Indicates whether every visible campaign is selected. */
const areVisibleCampaignsSelected = computed(
  () =>
    campaigns.value.length > 0 &&
    campaigns.value.every((campaign) =>
      selectedCampaignIds.value.has(campaign.id),
    ),
);

/** Indicates whether the page-level selection checkbox should be indeterminate. */
const areSomeVisibleCampaignsSelected = computed(
  () =>
    !areVisibleCampaignsSelected.value &&
    campaigns.value.some((campaign) =>
      selectedCampaignIds.value.has(campaign.id),
    ),
);

/** Formats a status filter as a human-readable label. */
const getStatusLabel = (status: CampaignStatusFilter): string =>
  status === "all" ? "All" : CAMPAIGN_STATUS_LABELS[status];

/**
 * Runs a list request while tracking first-load and failure state, so the
 * shimmer and error section render independently of the table's refetch state.
 */
const runListRequest = async (request: () => Promise<unknown>): Promise<void> => {
  loadFailed.value = false;
  try {
    await request();
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Copies the route query into store filters and fetches the requested page. */
const loadFromRoute = (): Promise<void> => {
  const { search, status, page } = getRouteState();
  campaignsSearch.value = search;
  campaignsStatus.value = status;
  return runListRequest(() => fetchCampaigns(page));
};

/** Writes list controls to compact route query values; the route watcher fetches. */
const updateRouteQuery = (changes: {
  search?: string;
  status?: CampaignStatusFilter;
  page?: number;
}) => {
  const current = getRouteState();
  const next = { ...current, ...changes };
  const query: Record<string, string> = {};

  if (next.search) query.search = next.search;
  if (next.status !== "all") query.status = next.status;
  if (next.page > 1) query.page = String(next.page);

  void router.replace({ path: route.path, query });
};

/** Pushes the search term to the route after the user stops typing. */
const syncDebouncedSearch = useDebounceFn((term: string) => {
  if (term.trim() === getRouteState().search) return;
  updateRouteQuery({ search: term.trim(), page: 1 });
}, 300);

/** Updates the active status filter and closes its dropdown menu. */
const selectStatusFilter = (status: CampaignStatusFilter) => {
  statusDropdown.value?.closeDropdown();
  updateRouteQuery({ status, page: 1 });
};

/** Moves the table to another page. */
const changePage = (page: number) => {
  updateRouteQuery({ page });
};

/** Toggles selection for one campaign without affecting navigation. */
const toggleCampaignSelection = (campaignId: string) => {
  const nextSelection = new Set(selectedCampaignIds.value);

  if (nextSelection.has(campaignId)) {
    nextSelection.delete(campaignId);
  } else {
    nextSelection.add(campaignId);
  }

  selectedCampaignIds.value = nextSelection;
};

/** Toggles selection for every campaign rendered on the current page. */
const toggleVisibleCampaignSelection = () => {
  const nextSelection = new Set(selectedCampaignIds.value);

  if (areVisibleCampaignsSelected.value) {
    campaigns.value.forEach((campaign) => nextSelection.delete(campaign.id));
  } else {
    campaigns.value.forEach((campaign) => nextSelection.add(campaign.id));
  }

  selectedCampaignIds.value = nextSelection;
};

/** Clears the selection after the selected campaigns are deleted. */
const handleCampaignsDeleted = () => {
  selectedCampaignIds.value = new Set();
};

/** Opens the selected campaign's detail page. */
const openCampaign = (row: ITableBodyData) => {
  void navigateTo(`/campaigns/${String(row.id)}`);
};

/** Opens a fresh campaign creation form. */
const openNewCampaignModal = (): void => {
  void newCampaignModal.value?.open();
};

/** Opens the export format picker. */
const openExportCampaignModal = (): void => {
  void exportCampaignModal.value?.open();
};

/** Opens the delete confirmation for the selected campaigns. */
const openDeleteSelectedModal = (): void => {
  void deleteCampaignModal.value?.open();
};

/** Updates the native checkbox's indeterminate state after selection changes. */
const refreshSelectAllState = () => {
  if (selectAllInput.value) {
    selectAllInput.value.indeterminate = areSomeVisibleCampaignsSelected.value;
  }
};

watch(searchInput, (term) => syncDebouncedSearch(term));

watch(
  () => route.query,
  () => {
    const { search } = getRouteState();
    if (search !== searchInput.value.trim()) searchInput.value = search;
    void loadFromRoute();
  },
);

watch(
  [areVisibleCampaignsSelected, areSomeVisibleCampaignsSelected],
  () => refreshSelectAllState(),
  { flush: "post" },
);

onMounted(() => {
  void loadFromRoute();
});
</script>

<template>
  <CampaignListShimmer v-if="!hasLoaded" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading title="Campaign" subtitle="Create, manage and monitor campaign" />

    <section
      v-if="loadFailed"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">
        We couldn't load campaigns
      </h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        Something went wrong while fetching the campaign list. Please try again.
      </p>
      <AppButton type="button" size="md" class="mt-5" @click="loadFromRoute">
        Retry
      </AppButton>
    </section>

    <template v-else>
      <section class="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Campaign summary metrics">
        <article
          v-for="metric in summaryCards"
          :key="metric.label"
          class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        >
          <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
          <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">
            {{ metric.value.toLocaleString() }}
          </p>
        </article>
      </section>

      <TableComponent
        :headings="tableHeadings"
        :body="campaignRows"
        :is-loading="fetchingCampaigns"
        clickable
        empty-heading="No campaigns found"
        empty-subtitle="Try changing the search text or campaign status filter."
        @row-click="openCampaign"
      >
        <template #table-heading>
          <TableComponentHeader v-model:search="searchInput" table-name="Campaign" search-placeholder="Search...">
            <template #filters>
              <AppDropdown ref="statusDropdown" position="right" :width-is-finite="false">
                <template #default>
                  <button
                    type="button"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                  >
                    Filter by: {{ getStatusLabel(campaignsStatus) }}
                    <Icon name="vent:arrow-down" size="0.9rem" />
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="min-w-38 space-y-1">
                    <button
                      v-for="status in STATUS_FILTERS"
                      :key="status"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{ 'bg-dashboard-bg-dark': campaignsStatus === status }"
                      @click="selectStatusFilter(status)"
                    >
                      {{ getStatusLabel(status) }}
                    </button>
                  </div>
                </template>
              </AppDropdown>
            </template>
            <template #actions>
              <button
                v-if="selectedCampaignIds.size > 0"
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-100/60 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                aria-label="Delete selected campaigns"
                @click="openDeleteSelectedModal"
              >
                <Icon name="vent:trash" size="1rem" />
                Delete selected ({{ selectedCampaignIds.size }})
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default"
                aria-label="Export campaign data"
                @click="openExportCampaignModal"
              >
                <Icon name="vent:external-link" size="1rem" />
                Export
                <Icon name="vent:arrow-down" size="0.85rem" />
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-3 py-2.5 text-sm text-white transition hover:bg-brand-color-005"
                aria-label="Create a new campaign"
                @click="openNewCampaignModal"
              >
                <Icon name="vent:add" size="1rem" />
                New Campaign
              </button>
            </template>
          </TableComponentHeader>
        </template>

        <template #head_select>
          <input
            ref="selectAllInput"
            type="checkbox"
            class="h-4 w-4 cursor-pointer accent-brand-color-default"
            :checked="areVisibleCampaignsSelected"
            aria-label="Select all campaigns on this page"
            @click.stop
            @change="toggleVisibleCampaignSelection"
          />
        </template>

        <template #col_select="{ rowData }">
          <input
            type="checkbox"
            class="h-4 w-4 cursor-pointer accent-brand-color-default"
            :checked="selectedCampaignIds.has(String(rowData.id))"
            :aria-label="`Select ${rowData.name}`"
            @click.stop
            @change="toggleCampaignSelection(String(rowData.id))"
          />
        </template>

        <template #col_status="{ rowData }">
          <CampaignStatusPill :status="rowData.status" />
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="campaignsPage"
            :per-page="campaignsPerPage"
            :total-items="campaignsTotal"
            @change-page="changePage"
          />
        </template>
      </TableComponent>
    </template>

    <CampaignNewModal ref="newCampaignModal" />
    <CampaignExportModal ref="exportCampaignModal" />
    <CampaignDeleteModal
      ref="deleteCampaignModal"
      :campaign-ids="selectedIdList"
      batch
      @deleted="handleCampaignsDeleted"
    />
  </div>
</template>
