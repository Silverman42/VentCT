<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import {
  EVENT_STATUS_LABELS,
  type EventStatusFilter,
  type IEvent,
} from "../composables/useEventStore";

interface NewModalController {
  open: () => Promise<void> | void;
}

const {
  events,
  eventStats,
  fetchingEvents,
  eventsPage,
  eventsPerPage,
  eventsTotal,
  eventsSearch,
  eventsStatus,
  fetchEvents,
  setEventsSearch,
  setEventsStatus,
} = useEventStore();

const filterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const eventNewModal = ref<NewModalController | null>(null);
const searchInput = ref(eventsSearch.value);
const hasLoaded = ref(false);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "venue", name: "Venue", isHiddenOnMobile: true },
  { id: "event_date", name: "Date", isHiddenOnMobile: true },
  { id: "target", name: "Target" },
  { id: "status", name: "Status" },
];

const filterOptions: EventStatusFilter[] = [
  "all",
  "pending",
  "running",
  "completed",
  "cancelled",
];

/** Summary cards shown above the events table. */
const statCards = computed(() => [
  { label: "Completed Events", value: eventStats.value.completed },
  { label: "Pending", value: eventStats.value.pending },
  { label: "Running", value: eventStats.value.running },
  { label: "Cancelled", value: eventStats.value.cancelled },
]);

/** Formats a status filter option into its visible label. */
const getFilterLabel = (filter: EventStatusFilter): string =>
  filter === "all" ? "All" : EVENT_STATUS_LABELS[filter];

/** Formats an API event date for the table, with a fallback for missing values. */
const formatEventDate = (value?: string): string =>
  value ? DateFormatter.formatDate(value) : "—";

/** Runs a list request and records whether it failed for the error state. */
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

/** Loads the current page of events. */
const loadEvents = (): Promise<void> => runListRequest(() => fetchEvents());

/** Applies a status filter, closes the filter menu, and reloads page 1. */
const selectFilter = (filter: EventStatusFilter): void => {
  filterDropdown.value?.closeDropdown();
  if (filter === eventsStatus.value) return;
  void runListRequest(() => setEventsStatus(filter));
};

/** Loads the requested page of events. */
const changePage = (page: number): void => {
  void fetchEvents(page).catch(() => undefined);
};

/** Sends the debounced search term to the API. */
const applySearch = useDebounceFn((term: string) => {
  void runListRequest(() => setEventsSearch(term));
}, 300);

/** Navigates to the details page of the clicked event. */
const openEventDetail = (row: ITableBodyData): void => {
  void navigateTo(`/events/${(row as IEvent).id}`);
};

/** Opens the New Event modal. */
const openNewEventModal = (): void => {
  void eventNewModal.value?.open();
};

watch(searchInput, (term) => {
  if (term.trim() !== eventsSearch.value) void applySearch(term);
});

onMounted(() => {
  void loadEvents();
});
</script>

<template>
  <EventListShimmer v-if="!hasLoaded" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading title="Events" subtitle="Track and manage events record." />

    <section
      v-if="loadFailed"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">
        We couldn't load events
      </h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        Something went wrong while fetching the events list. Please try again.
      </p>
      <AppButton
        type="button"
        size="md"
        class="mt-5"
        @click="loadEvents"
      >
        Retry
      </AppButton>
    </section>

    <template v-else>
      <section
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Event summary"
      >
        <article
          v-for="card in statCards"
          :key="card.label"
          class="flex min-h-[104px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        >
          <p class="text-xs font-normal text-dashboard-text">
            {{ card.label }}
          </p>
          <p
            class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ card.value.toLocaleString("en-US") }}
          </p>
        </article>
      </section>

      <TableComponent
        :headings="tableHeadings"
        :body="events"
        :is-loading="fetchingEvents"
        clickable
        empty-heading="No events found"
        empty-subtitle="Try changing the search query or status filter, or create a new event."
        @row-click="openEventDetail"
      >
        <template #table-heading>
          <TableComponentHeader
            v-model:search="searchInput"
            table-name="Events"
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
                    Filter by: {{ getFilterLabel(eventsStatus) }}
                    <Icon name="vent:arrow-down" size="0.9rem" />
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="min-w-40 space-y-1">
                    <button
                      v-for="option in filterOptions"
                      :key="option"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{ 'bg-dashboard-bg-dark': eventsStatus === option }"
                      @click="selectFilter(option)"
                    >
                      Filter by: {{ getFilterLabel(option) }}
                    </button>
                  </div>
                </template>
              </AppDropdown>

              <EventExportMenu :events="events" />
            </template>

            <template #actions>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
                @click="openNewEventModal"
              >
                New Event
              </button>
            </template>
          </TableComponentHeader>
        </template>

        <template #col_venue="{ rowData }">
          {{ rowData.venue || "—" }}
        </template>

        <template #col_event_date="{ rowData }">
          {{ formatEventDate(rowData.event_date) }}
        </template>

        <template #col_target="{ rowData }">
          {{ Number(rowData.target).toLocaleString("en-US") }}
        </template>

        <template #col_status="{ rowData }">
          <EventStatusPill :status="rowData.status" />
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="eventsPage"
            :per-page="eventsPerPage"
            :total-items="eventsTotal"
            @change-page="changePage"
          />
        </template>
      </TableComponent>
    </template>

    <EventNewModal ref="eventNewModal" />
  </div>
</template>
