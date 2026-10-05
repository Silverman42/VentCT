<script setup lang="ts">
import type { AppDropdown } from "#components";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import {
  EVENT_STATUS_LABELS,
  type EventStatus,
  type IEvent,
} from "../composables/useEventStore";

interface NewModalController {
  open: () => Promise<void> | void;
}

type EventStatusFilter = EventStatus | "all";

const EVENTS_PER_PAGE = 10;

const { events, eventStats, fetchingEvents, fetchEvents } = useEventStore();

const filterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const eventNewModal = ref<NewModalController | null>(null);
const searchInput = ref("");
const statusFilter = ref<EventStatusFilter>("all");
const currentPage = ref(1);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "target", name: "Target" },
  { id: "status", name: "Status" },
];

const filterOptions: EventStatusFilter[] = [
  "all",
  "completed",
  "pending",
  "running",
];

/** Summary cards shown above the events table. */
const statCards = computed(() => [
  { label: "Completed Events", value: eventStats.value.completed },
  { label: "Pending", value: eventStats.value.pending },
  { label: "Running", value: eventStats.value.running },
]);

/** Events matching the active search term and status filter. */
const filteredEvents = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  return events.value.filter((event) => {
    const matchesStatus =
      statusFilter.value === "all" || event.status === statusFilter.value;
    const matchesSearch =
      !searchTerm ||
      [event.name, event.location, String(event.target)]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);

    return matchesStatus && matchesSearch;
  });
});

/** Total number of pages for the filtered events. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredEvents.value.length / EVENTS_PER_PAGE)),
);

/** The slice of filtered events shown on the current page. */
const pagedEvents = computed(() => {
  const start = (currentPage.value - 1) * EVENTS_PER_PAGE;
  return filteredEvents.value.slice(start, start + EVENTS_PER_PAGE);
});

/** Formats a status filter option into its visible label. */
const getFilterLabel = (filter: EventStatusFilter): string =>
  filter === "all" ? "All" : EVENT_STATUS_LABELS[filter];

/** Applies a status filter and closes the filter menu. */
const selectFilter = (filter: EventStatusFilter): void => {
  statusFilter.value = filter;
  filterDropdown.value?.closeDropdown();
};

/** Navigates to the details page of the clicked event. */
const openEventDetail = (row: ITableBodyData): void => {
  void navigateTo(`/events/${(row as IEvent).id}`);
};

/** Opens the New Event modal. */
const openNewEventModal = (): void => {
  void eventNewModal.value?.open();
};

/** Loads events and records whether the request failed. */
const loadEvents = async (): Promise<void> => {
  loadFailed.value = false;
  try {
    await fetchEvents();
  } catch {
    loadFailed.value = true;
  }
};

watch([searchInput, statusFilter], () => {
  currentPage.value = 1;
});

watch(
  totalPages,
  (lastPage) => {
    if (currentPage.value > lastPage) currentPage.value = lastPage;
  },
  { immediate: true },
);

onMounted(() => {
  void loadEvents();
});
</script>

<template>
  <EventListShimmer v-if="fetchingEvents" />

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
        class="grid grid-cols-1 gap-3 sm:grid-cols-3"
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
        :body="pagedEvents"
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
                    Filter by: {{ getFilterLabel(statusFilter) }}
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
                      :class="{ 'bg-dashboard-bg-dark': statusFilter === option }"
                      @click="selectFilter(option)"
                    >
                      Filter by: {{ getFilterLabel(option) }}
                    </button>
                  </div>
                </template>
              </AppDropdown>

              <EventExportMenu :events="filteredEvents" />
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

        <template #col_target="{ rowData }">
          {{ Number(rowData.target).toLocaleString("en-US") }}
        </template>

        <template #col_status="{ rowData }">
          <EventStatusPill :status="rowData.status" />
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="currentPage"
            :per-page="EVENTS_PER_PAGE"
            :total-items="filteredEvents.length"
            @change-page="currentPage = $event"
          />
        </template>
      </TableComponent>
    </template>

    <EventNewModal ref="eventNewModal" />
  </div>
</template>
