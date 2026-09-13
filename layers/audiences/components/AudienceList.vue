<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import {
  type AudienceVerificationFilter,
  type IAudienceMember,
  useAudienceMockData,
} from "../composables/useAudienceMockData";
import { useAudienceStore } from "../composables/useAudienceStore";

interface DetailModalController {
  open: (data: IAudienceMember) => void;
}

interface NewModalController {
  open: () => Promise<void> | void;
}

const AUDIENCES_PER_PAGE = 10;

const { campaignOptions, promoterOptions } = useAudienceMockData();
const { audiences, metrics, fetchingAudiences, fetchAudiences } =
  useAudienceStore();

const route = useRoute();
const router = useRouter();

const filterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const audienceDetailModal = ref<DetailModalController | null>(null);
const audienceNewModal = ref<NewModalController | null>(null);
const isApplyingRoute = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "campaign", name: "Campaign" },
  { id: "email", name: "Email" },
  { id: "phone", name: "Phone" },
  { id: "promoter", name: "Promoter" },
  { id: "hasTransaction", name: "Transaction" },
  { id: "status", name: "Status" },
];

/** Reads the first scalar string value from route query parameters. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Confirms that a query parameter matches an audience verification filter. */
const isVerificationFilter = (
  value: string,
): value is AudienceVerificationFilter =>
  value === "verified" || value === "not_verified";

/** Extracts local table state from the active route query strings. */
const getRouteState = (): {
  search: string;
  statusFilter: AudienceVerificationFilter | "all";
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);
  const requestedStatus = getQueryValue(route.query.status);

  return {
    search: getQueryValue(route.query.search),
    statusFilter: isVerificationFilter(requestedStatus)
      ? requestedStatus
      : "all",
    page:
      Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const initialRouteState = getRouteState();
const searchInput = ref(initialRouteState.search);
const statusFilter = ref<AudienceVerificationFilter | "all">(
  initialRouteState.statusFilter,
);
const currentPage = ref(initialRouteState.page);

/** Filters audience records according to active search string and status filter. */
const filteredAudiences = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  return audiences.value.filter((member) => {
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "verified" && member.isVerified) ||
      (statusFilter.value === "not_verified" && !member.isVerified);

    const matchesSearch =
      !searchTerm ||
      [
        member.name,
        member.campaign,
        member.email,
        member.phone,
        member.promoter,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);

    return matchesStatus && matchesSearch;
  });
});

/** Derives total pagination page count from the filtered records. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAudiences.value.length / AUDIENCES_PER_PAGE)),
);

/** Selects the current ten-row page slice for table rendering. */
const pagedAudiences = computed(() => {
  const start = (currentPage.value - 1) * AUDIENCES_PER_PAGE;
  return filteredAudiences.value.slice(start, start + AUDIENCES_PER_PAGE);
});

/** Formats a status filter option into a user-facing label. */
const getFilterLabel = (filter: AudienceVerificationFilter | "all"): string => {
  if (filter === "verified") return "Verified";
  if (filter === "not_verified") return "Not verified";
  return "All";
};

/** Synchronizes list search, filter, and pagination state into URL query strings. */
const syncRouteState = (): void => {
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

/** Debounces route synchronization when typing into search input. */
const syncDebouncedSearch = useDebounceFn(syncRouteState, 300);

/** Applies route query parameter updates back into local controls. */
const applyRouteState = (): void => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  searchInput.value = nextState.search;
  statusFilter.value = nextState.statusFilter;
  currentPage.value = nextState.page;
  isApplyingRoute.value = false;
};

/** Updates the active verification status filter and closes dropdown menu. */
const selectFilter = (filter: AudienceVerificationFilter | "all"): void => {
  statusFilter.value = filter;
  filterDropdown.value?.closeDropdown();
};

/** Opens the detail modal when an audience row is clicked. */
const openAudienceDetail = (row: ITableBodyData): void => {
  const member = row as IAudienceMember;
  audienceDetailModal.value?.open(member);
};

/** Opens the New Audience creation modal. */
const openNewAudienceModal = (): void => {
  void audienceNewModal.value?.open();
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

onMounted(() => {
  void fetchAudiences();
});
</script>

<template>
  <AudienceListShimmer v-if="fetchingAudiences" />

  <div v-else class="flex w-full flex-col gap-6">
    <!-- Top Heading -->
    <AppHeading
      title="Audience"
      subtitle="View audience list, engagement and campaign participation"
    />

    <!-- Summary Metric Cards (2 rows of 4 cards) -->
    <section
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Audience summary metrics"
    >
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="flex min-h-[116px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <p class="text-xs text-dashboard-text font-normal">
          {{ metric.label }}
        </p>
        <p class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading">
          {{ metric.value }}
        </p>
        <p class="mt-1 text-[11px] text-dashboard-text">
          {{ metric.description }}
        </p>
      </article>
    </section>

    <!-- Table Section -->
    <TableComponent
      :headings="tableHeadings"
      :body="pagedAudiences"
      clickable
      empty-heading="No audience members found"
      empty-subtitle="Try changing the search query or status filter."
      @row-click="openAudienceDetail"
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Audience"
          search-placeholder="Search ..."
        >
          <!-- Filters Slot -->
          <template #filters>
            <AppDropdown
              ref="filterDropdown"
              position="right"
              :width-is-finite="false"
            >
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                >
                  Filter by: {{ getFilterLabel(statusFilter) }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-40 space-y-1">
                  <button
                    v-for="option in ['all', 'verified', 'not_verified'] as const"
                    :key="option"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{ 'bg-dashboard-bg-dark': statusFilter === option }"
                    @click="selectFilter(option)"
                  >
                    Filter by: {{ getFilterLabel(option) }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>

          <!-- Actions Slot -->
          <template #actions>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
              aria-label="Create a new audience member"
              @click="openNewAudienceModal"
            >
              <Icon name="vent:add" size="1rem" />
              New Audience
            </button>
          </template>
        </TableComponentHeader>
      </template>

      <!-- Transaction Pill Column -->
      <template #col_hasTransaction="{ rowData }">
        <AppPills :color="rowData.hasTransaction ? 'green' : 'red'">
          {{ rowData.hasTransaction ? 'Yes' : 'NO' }}
        </AppPills>
      </template>

      <!-- Verification Status Pill Column -->
      <template #col_status="{ rowData }">
        <AppPills :color="rowData.isVerified ? 'green' : 'orange'">
          {{ rowData.isVerified ? 'Verified' : 'Not verified' }}
        </AppPills>
      </template>

      <!-- Table Footer Pagination -->
      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="AUDIENCES_PER_PAGE"
          :total-items="filteredAudiences.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <!-- Modals -->
    <AudienceDetailModal ref="audienceDetailModal" />
    <AudienceNewModal
      ref="audienceNewModal"
      :campaign-options="campaignOptions"
      :promoter-options="promoterOptions"
    />
  </div>
</template>
