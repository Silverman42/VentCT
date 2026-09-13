<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import type { Promoter } from "../composables/usePromoterMockData";

interface ModalController {
  open: () => Promise<void> | void;
}

const PROMOTERS_PER_PAGE = 10;

const { promoters, campaignOptions } = usePromoterMockData();
const route = useRoute();
const router = useRouter();
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const selectAllInput = ref<HTMLInputElement | null>(null);
const newPromoterModal = ref<ModalController | null>(null);
const exportPromoterModal = ref<ModalController | null>(null);
const isApplyingRoute = ref(false);

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

/** Confirms that the requested campaign appears in the visible fixture options. */
const isCampaignOption = (value: string): boolean =>
  campaignOptions.includes(value);

/** Normalizes route values into the three list controls. */
const getRouteState = (): {
  search: string;
  campaign: string;
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);
  const requestedCampaign = getQueryValue(route.query.campaign);

  return {
    search: getQueryValue(route.query.search),
    campaign: isCampaignOption(requestedCampaign) ? requestedCampaign : "all",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const initialRouteState = getRouteState();
const searchInput = ref(initialRouteState.search);
const campaignFilter = ref(initialRouteState.campaign);
const currentPage = ref(initialRouteState.page);
const selectedPromoterIds = ref<Set<string>>(new Set());

/** Filters promoter fixtures using the visible search text and campaign selector. */
const filteredPromoters = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  return promoters.filter((promoter) => {
    const matchesCampaign =
      campaignFilter.value === "all" ||
      promoter.campaign === campaignFilter.value;
    const matchesSearch =
      !searchTerm ||
      [
        promoter.name,
        promoter.campaign,
        promoter.email,
        promoter.phone,
        promoter.referralCode,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);

    return matchesCampaign && matchesSearch;
  });
});

/** Calculates the final valid table page for the current result set. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPromoters.value.length / PROMOTERS_PER_PAGE)),
);

/** Selects the promoter records visible on the current paginated table page. */
const pagedPromoters = computed(() => {
  const start = (currentPage.value - 1) * PROMOTERS_PER_PAGE;
  return filteredPromoters.value.slice(start, start + PROMOTERS_PER_PAGE);
});

/** Indicates whether every promoter rendered on the current page is selected. */
const areVisiblePromotersSelected = computed(
  () =>
    pagedPromoters.value.length > 0 &&
    pagedPromoters.value.every((promoter) =>
      selectedPromoterIds.value.has(promoter.id),
    ),
);

/** Indicates whether the select-all field should render in an indeterminate state. */
const areSomeVisiblePromotersSelected = computed(
  () =>
    !areVisiblePromotersSelected.value &&
    pagedPromoters.value.some((promoter) =>
      selectedPromoterIds.value.has(promoter.id),
    ),
);

/** Synchronizes local list controls to compact, shareable query parameters. */
const syncRouteState = (): void => {
  const nextQuery: Record<string, string> = {};

  if (searchInput.value.trim()) nextQuery.search = searchInput.value.trim();
  if (campaignFilter.value !== "all") nextQuery.campaign = campaignFilter.value;
  if (currentPage.value > 1) nextQuery.page = String(currentPage.value);

  const currentQuery = {
    search: getQueryValue(route.query.search),
    campaign: getQueryValue(route.query.campaign),
    page: getQueryValue(route.query.page),
  };

  if (
    currentQuery.search === (nextQuery.search ?? "") &&
    currentQuery.campaign === (nextQuery.campaign ?? "") &&
    currentQuery.page === (nextQuery.page ?? "")
  ) {
    return;
  }

  void router.replace({ path: route.path, query: nextQuery });
};

/** Debounces query replacement until typing pauses in the search control. */
const syncDebouncedSearch = useDebounceFn(syncRouteState, 300);

/** Applies browser-navigation query changes to the local table controls. */
const applyRouteState = (): void => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  searchInput.value = nextState.search;
  campaignFilter.value = nextState.campaign;
  currentPage.value = nextState.page;
  isApplyingRoute.value = false;
};

/** Updates the campaign filter and dismisses its dropdown menu. */
const selectCampaignFilter = (campaign: string): void => {
  campaignFilter.value = campaign;
  campaignDropdown.value?.closeDropdown();
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
    pagedPromoters.value.forEach((promoter) => nextSelection.delete(promoter.id));
  } else {
    pagedPromoters.value.forEach((promoter) => nextSelection.add(promoter.id));
  }

  selectedPromoterIds.value = nextSelection;
};

/** Opens the selected promoter profile while preserving list history in the browser. */
const openPromoter = (row: ITableBodyData): void => {
  const promoter = row as Promoter;
  void navigateTo(`/promoters/${promoter.id}`);
};

/** Opens a clean, validation-only promoter creation form. */
const openNewPromoterModal = (): void => {
  void newPromoterModal.value?.open();
};

/** Opens the fixture-backed promoter export controls. */
const openExportPromoterModal = (): void => {
  void exportPromoterModal.value?.open();
};

/** Updates the native select-all checkbox's indeterminate visual state. */
const refreshSelectAllState = (): void => {
  if (selectAllInput.value) {
    selectAllInput.value.indeterminate = areSomeVisiblePromotersSelected.value;
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
  campaignFilter,
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
  [areVisiblePromotersSelected, areSomeVisiblePromotersSelected],
  () => refreshSelectAllState(),
  { flush: "post" },
);

onMounted(() => refreshSelectAllState());
</script>

<template>
  <div class="flex min-w-0 w-full flex-col gap-6">
    <section
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Promoter summary metrics"
    >
      <article
        v-for="metric in [
          { label: 'Total Promoters', value: '109', description: 'All active promoters' },
          { label: 'Total Audience', value: '12,792', description: 'Unique audience' },
          { label: 'Verified Users', value: '7,823', description: 'Audience with verified status' },
          { label: 'Completed Trade', value: '1,923', description: 'Completed transactions' },
          { label: 'Conversion Rate', value: '15.4%', description: 'Registration to transaction rate' },
        ]"
        :key="metric.label"
        class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">
          {{ metric.value }}
        </p>
        <p class="mt-auto pt-2 text-[0.6875rem] text-dashboard-text">
          {{ metric.description }}
        </p>
      </article>
    </section>

    <TableComponent
      :headings="tableHeadings"
      :body="pagedPromoters"
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
            <AppDropdown ref="campaignDropdown" position="right" :width-is-finite="false">
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                >
                  Filter by: {{ campaignFilter === 'all' ? 'All' : campaignFilter }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="max-h-72 min-w-56 space-y-1 overflow-y-auto">
                  <button
                    v-for="campaign in ['all', ...campaignOptions]"
                    :key="campaign"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{ 'bg-dashboard-bg-dark': campaignFilter === campaign }"
                    @click="selectCampaignFilter(campaign)"
                  >
                    {{ campaign === 'all' ? 'All' : campaign }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>
          <template #actions>
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
        <Icon name="vent:arrow-right" size="1.15rem" class="text-dashboard-heading" />
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="PROMOTERS_PER_PAGE"
          :total-items="filteredPromoters.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <PromoterNewModal ref="newPromoterModal" :campaign-options="campaignOptions" />
    <PromoterExportModal ref="exportPromoterModal" :promoters="promoters" />
  </div>
</template>
