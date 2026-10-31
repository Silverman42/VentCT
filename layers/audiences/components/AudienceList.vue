<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import { formatCount } from "~/utils/helpers/AnalyticsFormatters";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import {
  type AudienceStatusFilter,
  useAudienceStore,
} from "../composables/useAudienceStore";
import { AUDIENCE_STATUS_FILTER_OPTIONS } from "../utils/AudienceProfile";

interface NewModalController {
  open: () => Promise<void> | void;
}

/** Table-ready audience row with display fallbacks. */
interface IAudienceRow extends ITableBodyData {
  id: string;
  name: string;
  campaign: string;
  email: string;
  phone: string;
  promoter: string;
  hasTransaction: boolean;
  isVerified: boolean;
}

const {
  audiences,
  audienceStats,
  fetchingAudiences,
  audiencesPage,
  audiencesPerPage,
  audiencesTotal,
  audiencesSearch,
  audiencesStatus,
  fetchAudiences,
} = useAudienceStore();

const route = useRoute();
const router = useRouter();

const filterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const audienceNewModal = ref<NewModalController | null>(null);
const hasLoaded = ref(false);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "campaign", name: "Campaign", isHiddenOnMobile: true },
  { id: "email", name: "Email", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
  { id: "promoter", name: "Promoter", isHiddenOnMobile: true },
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

/** Confirms that a query parameter is a supported status filter. */
const isStatusFilter = (value: string): value is AudienceStatusFilter =>
  AUDIENCE_STATUS_FILTER_OPTIONS.some((option) => option.value === value);

/** Normalizes the route query into audience-list controls. */
const getRouteState = (): {
  search: string;
  status: AudienceStatusFilter;
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);
  const requestedStatus = getQueryValue(route.query.status);

  return {
    search: getQueryValue(route.query.search).trim(),
    status: isStatusFilter(requestedStatus) ? requestedStatus : "all",
    page:
      Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const searchInput = ref(getRouteState().search);

/** Audience rows mapped from the API with explicit fallbacks. */
const audienceRows = computed<IAudienceRow[]>(() =>
  audiences.value.map((member) => ({
    id: member.id,
    name: member.name || "Unnamed audience",
    campaign: member.campaignName || "—",
    email: member.email || "—",
    phone: member.phone || "—",
    promoter: member.promoterName || "Unassigned",
    hasTransaction: Boolean(member.hasTransacted),
    isVerified: Boolean(member.isVerified),
  })),
);

/** Summary cards built from the list response's summary block. */
const summaryCards = computed(() => [
  {
    label: "Registered Audience",
    value: formatCount(audienceStats.value.registeredTotal),
    description: "Total number of registered audience",
  },
  {
    label: "Verified Audience",
    value: formatCount(audienceStats.value.verifiedTotal),
    description: "Number of verified audience",
  },
  {
    label: "Audience With Transaction",
    value: formatCount(audienceStats.value.withTransactionTotal),
    description: "Audience with transactions",
  },
  {
    label: "Today's Registration",
    value: formatCount(audienceStats.value.today),
    description: "Number of audience that registered today",
  },
  {
    label: "This Week Registration",
    value: formatCount(audienceStats.value.thisWeek),
    description: "Number of audience that registered this week",
  },
  {
    label: "This Month Registration",
    value: formatCount(audienceStats.value.thisMonth),
    description: "Number of audience that registered this month",
  },
  {
    label: "This Year Registration",
    value: formatCount(audienceStats.value.thisYear),
    description: "Number of audience that registered this year",
  },
  {
    label: "Unverified Audience",
    value: formatCount(audienceStats.value.unverifiedTotal),
    description: "Audience that has not done their verification",
  },
]);

/** Label for the active status filter. */
const activeFilterLabel = computed(
  () =>
    AUDIENCE_STATUS_FILTER_OPTIONS.find(
      (option) => option.value === audiencesStatus.value,
    )?.label ?? "All",
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
  const { search, status, page } = getRouteState();
  audiencesSearch.value = search;
  audiencesStatus.value = status;
  return runListRequest(() => fetchAudiences(page));
};

/** Writes list controls to compact route query values; the route watcher fetches. */
const updateRouteQuery = (changes: {
  search?: string;
  status?: AudienceStatusFilter;
  page?: number;
}): void => {
  const next = { ...getRouteState(), ...changes };
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

/** Updates the status filter, resets to page 1 and closes the dropdown. */
const selectFilter = (status: AudienceStatusFilter): void => {
  filterDropdown.value?.closeDropdown();
  updateRouteQuery({ status, page: 1 });
};

/** Moves the table to another page. */
const changePage = (page: number): void => {
  updateRouteQuery({ page });
};

/** Navigates to the single audience page when an audience row is clicked. */
const openAudienceDetail = (row: ITableBodyData): void => {
  void navigateTo(`/audiences/${String(row.id)}`);
};

/** Opens the New Audience creation modal. */
const openNewAudienceModal = (): void => {
  void audienceNewModal.value?.open();
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

onMounted(() => {
  void loadFromRoute();
});
</script>

<template>
  <AudienceListShimmer v-if="!hasLoaded" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading
      title="Audience"
      subtitle="View audience list, engagement and campaign participation"
    />

    <AppErrorState
      v-if="loadFailed"
      heading="We couldn't load audiences"
      description="Something went wrong while fetching the audience list. Please try again."
      :retrying="fetchingAudiences"
      @retry="loadFromRoute"
    />

    <template v-else>
      <section
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Audience summary metrics"
      >
        <article
          v-for="metric in summaryCards"
          :key="metric.label"
          class="flex min-h-[116px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        >
          <p class="text-xs text-dashboard-text font-normal">
            {{ metric.label }}
          </p>
          <p
            class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ metric.value }}
          </p>
          <p class="mt-1 text-[11px] text-dashboard-text">
            {{ metric.description }}
          </p>
        </article>
      </section>

      <TableComponent
        :headings="tableHeadings"
        :body="audienceRows"
        :is-loading="fetchingAudiences"
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
                    Filter by: {{ activeFilterLabel }}
                    <Icon name="vent:arrow-down" size="0.9rem" />
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="min-w-44 space-y-1">
                    <button
                      v-for="option in AUDIENCE_STATUS_FILTER_OPTIONS"
                      :key="option.value"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{
                        'bg-dashboard-bg-dark': audiencesStatus === option.value,
                      }"
                      @click="selectFilter(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </template>
              </AppDropdown>
            </template>

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

        <template #col_hasTransaction="{ rowData }">
          <AppPills :color="rowData.hasTransaction ? 'green' : 'red'">
            {{ rowData.hasTransaction ? "Yes" : "No" }}
          </AppPills>
        </template>

        <template #col_status="{ rowData }">
          <AppPills :color="rowData.isVerified ? 'green' : 'orange'">
            {{ rowData.isVerified ? "Verified" : "Not verified" }}
          </AppPills>
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="audiencesPage"
            :per-page="audiencesPerPage"
            :total-items="audiencesTotal"
            @change-page="changePage"
          />
        </template>
      </TableComponent>
    </template>

    <AudienceNewModal ref="audienceNewModal" />
  </div>
</template>
