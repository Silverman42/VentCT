<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type { ITableBodyData, ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { Campaign, CampaignStatus } from "../composables/useCampaignMockData";

interface ModalController {
  open: () => Promise<void> | void;
}

const CAMPAIGNS_PER_PAGE = 10;

const { campaigns } = useCampaignMockData();
const route = useRoute();
const router = useRouter();
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const selectAllInput = ref<HTMLInputElement | null>(null);
const newCampaignModal = ref<ModalController | null>(null);
const exportCampaignModal = ref<ModalController | null>(null);
const isApplyingRoute = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "select", name: "Select", mobileLabel: "Select", width: "4.5rem" },
  { id: "name", name: "Name" },
  { id: "target", name: "Target", width: "30%" },
  { id: "status", name: "Status", width: "28%" },
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

/** Confirms that a query string is a supported campaign status. */
const isCampaignStatus = (value: string): value is CampaignStatus =>
  value === "pending" || value === "running" || value === "closed";

/** Normalizes the route query into campaign-list controls. */
const getRouteState = (): {
  search: string;
  status: CampaignStatus | "all";
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);
  const requestedStatus = getQueryValue(route.query.status);

  return {
    search: getQueryValue(route.query.search),
    status: isCampaignStatus(requestedStatus) ? requestedStatus : "all",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const initialRouteState = getRouteState();
const searchInput = ref(initialRouteState.search);
const statusFilter = ref<CampaignStatus | "all">(initialRouteState.status);
const currentPage = ref(initialRouteState.page);
const selectedCampaignIds = ref<Set<string>>(new Set());

/** Filters the campaign fixtures using the visible search and status controls. */
const filteredCampaigns = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  return campaigns.filter((campaign) => {
    const matchesStatus =
      statusFilter.value === "all" || campaign.status === statusFilter.value;
    const matchesSearch =
      !searchTerm ||
      [campaign.name, campaign.referralCode, campaign.target.toLocaleString()]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);

    return matchesStatus && matchesSearch;
  });
});

/** Derives the total pagination count from the current fixture result. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCampaigns.value.length / CAMPAIGNS_PER_PAGE)),
);

/** Selects the records rendered in the current ten-row table page. */
const pagedCampaigns = computed(() => {
  const start = (currentPage.value - 1) * CAMPAIGNS_PER_PAGE;
  return filteredCampaigns.value.slice(start, start + CAMPAIGNS_PER_PAGE);
});

/** Indicates whether every visible campaign currently has local selection state. */
const areVisibleCampaignsSelected = computed(
  () =>
    pagedCampaigns.value.length > 0 &&
    pagedCampaigns.value.every((campaign) =>
      selectedCampaignIds.value.has(campaign.id),
    ),
);

/** Indicates whether the page-level selection checkbox should be indeterminate. */
const areSomeVisibleCampaignsSelected = computed(
  () =>
    !areVisibleCampaignsSelected.value &&
    pagedCampaigns.value.some((campaign) =>
      selectedCampaignIds.value.has(campaign.id),
    ),
);

/** Converts a campaign status into the matching visual pill color. */
const getStatusColor = (status: CampaignStatus): "green" | "orange" | "gray" => {
  if (status === "running") return "green";
  if (status === "pending") return "orange";
  return "gray";
};

/** Formats a lowercase fixture status as a human-readable table label. */
const getStatusLabel = (status: CampaignStatus): string =>
  `${status.slice(0, 1).toUpperCase()}${status.slice(1)}`;

/** Synchronizes the current local list controls to compact route query values. */
const syncRouteState = () => {
  const nextQuery: Record<string, string> = {};

  if (searchInput.value.trim()) nextQuery.search = searchInput.value.trim();
  if (statusFilter.value !== "all") nextQuery.status = statusFilter.value;
  if (currentPage.value > 1) nextQuery.page = String(currentPage.value);

  const currentQuery = {
    search: getQueryValue(route.query.search),
    status: getQueryValue(route.query.status),
    page: getQueryValue(route.query.page),
  };

  if (
    currentQuery.search === (nextQuery.search ?? "") &&
    currentQuery.status === (nextQuery.status ?? "") &&
    currentQuery.page === (nextQuery.page ?? "")
  ) {
    return;
  }

  void router.replace({ path: route.path, query: nextQuery });
};

/** Delays route replacement while a user continues to type into search. */
const syncDebouncedSearch = useDebounceFn(syncRouteState, 300);

/** Applies an external browser-navigation query change to local table controls. */
const applyRouteState = () => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  searchInput.value = nextState.search;
  statusFilter.value = nextState.status;
  currentPage.value = nextState.page;
  isApplyingRoute.value = false;
};

/** Updates the active status filter and closes its dropdown menu. */
const selectStatusFilter = (status: CampaignStatus | "all") => {
  statusFilter.value = status;
  statusDropdown.value?.closeDropdown();
};

/** Toggles local selection for one campaign without affecting navigation. */
const toggleCampaignSelection = (campaignId: string) => {
  const nextSelection = new Set(selectedCampaignIds.value);

  if (nextSelection.has(campaignId)) {
    nextSelection.delete(campaignId);
  } else {
    nextSelection.add(campaignId);
  }

  selectedCampaignIds.value = nextSelection;
};

/** Toggles local selection for every campaign rendered on the current page. */
const toggleVisibleCampaignSelection = () => {
  const nextSelection = new Set(selectedCampaignIds.value);

  if (areVisibleCampaignsSelected.value) {
    pagedCampaigns.value.forEach((campaign) => nextSelection.delete(campaign.id));
  } else {
    pagedCampaigns.value.forEach((campaign) => nextSelection.add(campaign.id));
  }

  selectedCampaignIds.value = nextSelection;
};

/** Opens the selected campaign fixture while browser history retains list state. */
const openCampaign = (row: ITableBodyData) => {
  const campaign = row as Campaign;
  void navigateTo(`/campaigns/${campaign.id}`);
};

/** Opens a fresh fixture-backed campaign creation form. */
const openNewCampaignModal = (): void => {
  void newCampaignModal.value?.open();
};

/** Opens the export controls with the screenshot's default local state. */
const openExportCampaignModal = (): void => {
  void exportCampaignModal.value?.open();
};

/** Updates the native checkbox's indeterminate state after selection changes. */
const refreshSelectAllState = () => {
  if (selectAllInput.value) {
    selectAllInput.value.indeterminate = areSomeVisibleCampaignsSelected.value;
  }
};

watch(
  searchInput,
  () => {
    if (isApplyingRoute.value) return;
    currentPage.value = 1;
    syncDebouncedSearch();
  },
  { flush: "sync" },
);

watch(
  statusFilter,
  () => {
    if (isApplyingRoute.value) return;
    currentPage.value = 1;
    syncRouteState();
  },
  { flush: "sync" },
);

watch(
  currentPage,
  () => {
    if (!isApplyingRoute.value) syncRouteState();
  },
  { flush: "sync" },
);

watch(
  () => route.query,
  () => applyRouteState(),
  { deep: true },
);

watch(
  totalPages,
  (lastPage) => {
    if (currentPage.value > lastPage) currentPage.value = lastPage;
  },
  { immediate: true },
);

watch(
  [areVisibleCampaignsSelected, areSomeVisibleCampaignsSelected],
  () => refreshSelectAllState(),
  { flush: "post" },
);

onMounted(() => refreshSelectAllState());
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <AppHeading title="Campaign" subtitle="Create, manage and monitor campaign" />

    <section class="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Campaign summary metrics">
      <article
        v-for="metric in [
          { label: 'Pending Campaign', value: 0 },
          { label: 'Running Campaign', value: 26 },
          { label: 'Closed Campaign', value: 0 },
        ]"
        :key="metric.label"
        class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">{{ metric.value }}</p>
      </article>
    </section>

    <TableComponent
      :headings="tableHeadings"
      :body="pagedCampaigns"
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
                  Filter by: {{ statusFilter === 'all' ? 'All' : getStatusLabel(statusFilter) }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-38 space-y-1">
                  <button
                    v-for="status in ['all', 'running', 'pending', 'closed'] as const"
                    :key="status"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{ 'bg-dashboard-bg-dark': statusFilter === status }"
                    @click="selectStatusFilter(status)"
                  >
                    {{ status === 'all' ? 'All' : getStatusLabel(status) }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>
          <template #actions>
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

      <template #col_target="{ rowData }">{{ rowData.target.toLocaleString() }}</template>

      <template #col_status="{ rowData }">
        <AppPills :color="getStatusColor(rowData.status)">{{ getStatusLabel(rowData.status) }}</AppPills>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="CAMPAIGNS_PER_PAGE"
          :total-items="filteredCampaigns.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <CampaignNewModal ref="newCampaignModal" />
    <CampaignExportModal ref="exportCampaignModal" :campaigns="campaigns" />
  </div>
</template>
