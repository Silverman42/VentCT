<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import {
  formatCount,
  formatPercent,
} from "~/utils/helpers/AnalyticsFormatters";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";

interface ModalController {
  open: () => Promise<void> | void;
}

/** Table-ready promoter row with display fallbacks. */
interface IPromoterRow extends ITableBodyData {
  id: string;
  name: string;
  campaign: string;
  email: string;
  phone: string;
  referralCode: string;
}

const {
  promoters,
  promoterStats,
  fetchingPromoters,
  promotersPage,
  promotersPerPage,
  promotersTotal,
  promotersSearch,
  promotersCampaignId,
  fetchPromoters,
} = usePromotersStore();
const { campaignOptions, fetchCampaignOptions } = useCampaignStore();
const route = useRoute();
const router = useRouter();
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const selectAllInput = ref<HTMLInputElement | null>(null);
const newPromoterModal = ref<ModalController | null>(null);
const exportPromoterModal = ref<ModalController | null>(null);
const deletePromoterModal = ref<ModalController | null>(null);
const hasLoaded = ref(false);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "select", name: "Select", mobileLabel: "Select", width: "4.5rem" },
  { id: "name", name: "Name", width: "20%" },
  { id: "campaign", name: "Campaign", width: "29%", isHiddenOnMobile: true },
  { id: "email", name: "Email", width: "16%", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", width: "14%", isHiddenOnMobile: true },
  { id: "referralCode", name: "Referral code", width: "14%" },
  { id: "open", name: "Open", mobileLabel: "Open", width: "4.5rem" },
];

/** Reads one scalar value from Nuxt's potentially repeated query values. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Normalizes the route query into promoter-list controls. */
const getRouteState = (): {
  search: string;
  campaignId: string;
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);

  return {
    search: getQueryValue(route.query.search).trim(),
    campaignId: getQueryValue(route.query.campaign).trim(),
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const searchInput = ref(getRouteState().search);
const selectedPromoterIds = ref<Set<string>>(new Set());

/** Promoter rows mapped from the API with explicit fallbacks. */
const promoterRows = computed<IPromoterRow[]>(() =>
  promoters.value.map((promoter) => ({
    id: promoter.id,
    name: promoter.name || "Unnamed promoter",
    campaign: promoter.campaignName || "—",
    email: promoter.email || "—",
    phone: promoter.phone || "—",
    referralCode: promoter.referralCode || "—",
  })),
);

/** Summary cards built from the list response's summary block. */
const summaryCards = computed(() => [
  {
    label: "Total Promoters",
    value: formatCount(promoterStats.value.totalPromoters),
    description: "All active promoters",
  },
  {
    label: "Total Audience",
    value: formatCount(promoterStats.value.totalAudience),
    description: "Unique audience",
  },
  {
    label: "Verified Users",
    value: formatCount(promoterStats.value.verifiedUsers),
    description: "Audience with verified status",
  },
  {
    label: "Completed Trade",
    value: formatCount(promoterStats.value.completedTrades),
    description: "Completed transactions",
  },
  {
    label: "Conversion Rate",
    value: formatPercent(promoterStats.value.conversionRate),
    description: "Registration to transaction rate",
  },
]);

/** Label for the active campaign filter. */
const campaignFilterLabel = computed(() => {
  if (!promotersCampaignId.value) return "All";
  return (
    campaignOptions.value.find(
      (campaign) => campaign.id === promotersCampaignId.value,
    )?.name ?? "Selected campaign"
  );
});

/** Selected ids as an array for the delete modal. */
const selectedIdList = computed(() => [...selectedPromoterIds.value]);

/** Indicates whether every promoter rendered on the current page is selected. */
const areVisiblePromotersSelected = computed(
  () =>
    promoters.value.length > 0 &&
    promoters.value.every((promoter) =>
      selectedPromoterIds.value.has(promoter.id),
    ),
);

/** Indicates whether the select-all field should render in an indeterminate state. */
const areSomeVisiblePromotersSelected = computed(
  () =>
    !areVisiblePromotersSelected.value &&
    promoters.value.some((promoter) =>
      selectedPromoterIds.value.has(promoter.id),
    ),
);

/**
 * Runs a list request while tracking first-load and failure state, so the
 * shimmer and error section render independently of the table's refetch state.
 */
const runListRequest = async (
  request: () => Promise<unknown>,
): Promise<void> => {
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
  const { search, campaignId, page } = getRouteState();
  promotersSearch.value = search;
  promotersCampaignId.value = campaignId;
  return runListRequest(() => fetchPromoters(page));
};

/** Writes list controls to compact route query values; the route watcher fetches. */
const updateRouteQuery = (changes: {
  search?: string;
  campaignId?: string;
  page?: number;
}): void => {
  const next = { ...getRouteState(), ...changes };
  const query: Record<string, string> = {};

  if (next.search) query.search = next.search;
  if (next.campaignId) query.campaign = next.campaignId;
  if (next.page > 1) query.page = String(next.page);

  void router.replace({ path: route.path, query });
};

/** Pushes the search term to the route after the user stops typing. */
const syncDebouncedSearch = useDebounceFn((term: string) => {
  if (term.trim() === getRouteState().search) return;
  updateRouteQuery({ search: term.trim(), page: 1 });
}, 300);

/** Updates the campaign filter (empty for all) and dismisses its dropdown menu. */
const selectCampaignFilter = (campaignId: string): void => {
  campaignDropdown.value?.closeDropdown();
  updateRouteQuery({ campaignId, page: 1 });
};

/** Moves the table to another page. */
const changePage = (page: number): void => {
  updateRouteQuery({ page });
};

/** Toggles one promoter row without triggering its navigation handler. */
const togglePromoterSelection = (promoterId: string): void => {
  const nextSelection = new Set(selectedPromoterIds.value);

  if (nextSelection.has(promoterId)) {
    nextSelection.delete(promoterId);
  } else {
    nextSelection.add(promoterId);
  }

  selectedPromoterIds.value = nextSelection;
};

/** Toggles the current page's complete visible promoter set. */
const toggleVisiblePromoterSelection = (): void => {
  const nextSelection = new Set(selectedPromoterIds.value);

  if (areVisiblePromotersSelected.value) {
    promoters.value.forEach((promoter) => nextSelection.delete(promoter.id));
  } else {
    promoters.value.forEach((promoter) => nextSelection.add(promoter.id));
  }

  selectedPromoterIds.value = nextSelection;
};

/** Clears the selection after the selected promoters are deleted. */
const handlePromotersDeleted = (): void => {
  selectedPromoterIds.value = new Set();
};

/** Opens the selected promoter profile. */
const openPromoter = (row: ITableBodyData): void => {
  void navigateTo(`/promoters/${String(row.id)}`);
};

/** Opens a fresh promoter creation form. */
const openNewPromoterModal = (): void => {
  void newPromoterModal.value?.open();
};

/** Opens the export format picker. */
const openExportPromoterModal = (): void => {
  void exportPromoterModal.value?.open();
};

/** Opens the delete confirmation for the selected promoters. */
const openDeleteSelectedModal = (): void => {
  void deletePromoterModal.value?.open();
};

/** Updates the native select-all checkbox's indeterminate visual state. */
const refreshSelectAllState = (): void => {
  if (selectAllInput.value) {
    selectAllInput.value.indeterminate = areSomeVisiblePromotersSelected.value;
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
  [areVisiblePromotersSelected, areSomeVisiblePromotersSelected],
  () => refreshSelectAllState(),
  { flush: "post" },
);

onMounted(() => {
  void loadFromRoute();
  void fetchCampaignOptions().catch(() => undefined);
});
</script>

<template>
  <PromoterListShimmer v-if="!hasLoaded" />

  <div v-else class="flex min-w-0 w-full flex-col gap-6">
    <AppHeading
      title="Promoters"
      subtitle="Manage and monitor promoters performance"
    />

    <AppErrorState
      v-if="loadFailed"
      heading="We couldn't load promoters"
      description="Something went wrong while fetching the promoter list. Please try again."
      :retrying="fetchingPromoters"
      @retry="loadFromRoute"
    />

    <template v-else>
      <section
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Promoter summary metrics"
      >
        <article
          v-for="metric in summaryCards"
          :key="metric.label"
          class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        >
          <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
          <p
            class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ metric.value }}
          </p>
          <p class="mt-auto pt-2 text-[0.6875rem] text-dashboard-text">
            {{ metric.description }}
          </p>
        </article>
      </section>

      <TableComponent
        :headings="tableHeadings"
        :body="promoterRows"
        :is-loading="fetchingPromoters"
        clickable
        empty-heading="No promoters found"
        empty-subtitle="Try changing the search text or campaign filter."
        @row-click="openPromoter"
      >
        <template #table-heading>
          <TableComponentHeader
            v-model:search="searchInput"
            table-name="Promoters"
            search-placeholder="Search..."
          >
            <template #filters>
              <AppDropdown
                ref="campaignDropdown"
                position="right"
                :width-is-finite="false"
              >
                <template #default>
                  <button
                    type="button"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                  >
                    Filter by: {{ campaignFilterLabel }}
                    <Icon name="vent:arrow-down" size="0.9rem" />
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="max-h-72 min-w-56 space-y-1 overflow-y-auto">
                    <button
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{ 'bg-dashboard-bg-dark': !promotersCampaignId }"
                      @click="selectCampaignFilter('')"
                    >
                      All
                    </button>
                    <button
                      v-for="campaign in campaignOptions"
                      :key="campaign.id"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{
                        'bg-dashboard-bg-dark':
                          promotersCampaignId === campaign.id,
                      }"
                      @click="selectCampaignFilter(campaign.id)"
                    >
                      {{ campaign.name }}
                    </button>
                  </div>
                </template>
              </AppDropdown>
            </template>
            <template #actions>
              <button
                v-if="selectedPromoterIds.size > 0"
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-100/60 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                aria-label="Delete selected promoters"
                @click="openDeleteSelectedModal"
              >
                <Icon name="vent:trash" size="1rem" />
                Delete selected ({{ selectedPromoterIds.size }})
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default"
                aria-label="Export promoter data"
                @click="openExportPromoterModal"
              >
                <Icon name="vent:external-link" size="1rem" />
                Export
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-3 py-2.5 text-sm text-white transition hover:bg-brand-color-005"
                aria-label="Create a new promoter"
                @click="openNewPromoterModal"
              >
                New Promoter
              </button>
            </template>
          </TableComponentHeader>
        </template>

        <template #head_select>
          <input
            ref="selectAllInput"
            type="checkbox"
            class="h-4 w-4 cursor-pointer accent-brand-color-default"
            :checked="areVisiblePromotersSelected"
            aria-label="Select all promoters on this page"
            @click.stop
            @change="toggleVisiblePromoterSelection"
          />
        </template>

        <template #col_select="{ rowData }">
          <input
            type="checkbox"
            class="h-4 w-4 cursor-pointer accent-brand-color-default"
            :checked="selectedPromoterIds.has(String(rowData.id))"
            :aria-label="`Select ${rowData.name}`"
            @click.stop
            @change="togglePromoterSelection(String(rowData.id))"
          />
        </template>

        <template #col_open>
          <Icon
            name="vent:arrow-right"
            size="1.15rem"
            class="text-dashboard-heading"
          />
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="promotersPage"
            :per-page="promotersPerPage"
            :total-items="promotersTotal"
            @change-page="changePage"
          />
        </template>
      </TableComponent>
    </template>

    <PromoterNewModal ref="newPromoterModal" />
    <PromoterExportModal ref="exportPromoterModal" />
    <PromoterDeleteModal
      ref="deletePromoterModal"
      :promoter-ids="selectedIdList"
      batch
      @deleted="handlePromotersDeleted"
    />
  </div>
</template>
