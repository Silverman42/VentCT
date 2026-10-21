<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type {
  AttendeeStatusFilter,
  ExportFormat,
} from "../composables/useEventStore";

interface MarkModalController {
  open: () => Promise<void> | void;
}

const props = defineProps<{
  eventId: string;
  /** True when the attendance request failed and an error state should show. */
  loadFailed?: boolean;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const {
  attendees,
  attendeeSummary,
  fetchingAttendees,
  exportingAttendees,
  attendeesPage,
  attendeesPerPage,
  attendeesTotal,
  attendeesSearch,
  attendeesStatus,
  fetchEventAttendees,
  setAttendeesSearch,
  setAttendeesStatus,
  exportEventAttendees,
} = useEventStore();

const filterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const exportDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const markAttendanceModal = ref<MarkModalController | null>(null);
const searchInput = ref(attendeesSearch.value);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "email", name: "Email" },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
  { id: "status", name: "Status" },
  { id: "checked_in_at", name: "Checked In", isHiddenOnMobile: true },
];

const filterOptions: AttendeeStatusFilter[] = [
  "all",
  "attended",
  "not_attended",
];

const exportOptions: Array<{ value: ExportFormat; label: string }> = [
  { value: "xlsx", label: "Export as XLSX" },
  { value: "csv", label: "Export as CSV" },
];

/** True until the first attendee response arrives, so the full shimmer is shown. */
const isInitialLoad = computed(
  () => fetchingAttendees.value && !attendeeSummary.value,
);

/** Formats an attendee status filter option into its visible label. */
const getFilterLabel = (filter: AttendeeStatusFilter): string => {
  if (filter === "attended") return "Attended";
  if (filter === "not_attended") return "Not attended";
  return "All";
};

/** Formats an attendee check-in time, with a fallback when not checked in. */
const formatCheckIn = (value?: string | null): string =>
  value ? DateFormatter.formatWithPattern(value, "MMM d, yyyy · h:mm a") : "—";

/** Applies an attendee status filter, closes the menu, and reloads page 1. */
const selectFilter = (filter: AttendeeStatusFilter): void => {
  filterDropdown.value?.closeDropdown();
  if (filter === attendeesStatus.value) return;
  void setAttendeesStatus(props.eventId, filter).catch(() => undefined);
};

/** Loads the requested page of attendees. */
const changePage = (page: number): void => {
  void fetchEventAttendees(props.eventId, page).catch(() => undefined);
};

/** Sends the debounced search term to the API. */
const applySearch = useDebounceFn((term: string) => {
  void setAttendeesSearch(props.eventId, term).catch(() => undefined);
}, 300);

/** Downloads the attendee list in the chosen format and closes the menu. */
const exportAttendees = (format: ExportFormat): void => {
  exportDropdown.value?.closeDropdown();
  void exportEventAttendees(props.eventId, format).catch(() => undefined);
};

/** Opens the Mark Attendance modal. */
const openMarkAttendanceModal = (): void => {
  void markAttendanceModal.value?.open();
};

watch(searchInput, (term) => {
  if (term.trim() !== attendeesSearch.value) void applySearch(term);
});

watch(attendeesSearch, (term) => {
  if (term !== searchInput.value.trim()) searchInput.value = term;
});
</script>

<template>
  <EventAttendanceTableShimmer v-if="isInitialLoad" />

  <section
    v-else-if="props.loadFailed && !attendeeSummary"
    class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
  >
    <h2 class="text-lg font-medium text-dashboard-heading">
      We couldn't load attendance
    </h2>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      Something went wrong while fetching attendees for this event.
    </p>
    <AppButton type="button" size="md" class="mt-5" @click="emit('retry')">
      Retry
    </AppButton>
  </section>

  <div v-else>
    <TableComponent
      :headings="tableHeadings"
      :body="attendees"
      :is-loading="fetchingAttendees"
      empty-heading="No attendees found"
      empty-subtitle="Try changing the search query or filter, or mark attendance for this event."
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Attendance"
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
                  Filter by: {{ getFilterLabel(attendeesStatus) }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-44 space-y-1">
                  <button
                    v-for="option in filterOptions"
                    :key="option"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': attendeesStatus === option,
                    }"
                    @click="selectFilter(option)"
                  >
                    Filter by: {{ getFilterLabel(option) }}
                  </button>
                </div>
              </template>
            </AppDropdown>

            <AppDropdown
              ref="exportDropdown"
              position="right"
              :width-is-finite="false"
            >
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  :disabled="exportingAttendees"
                >
                  <Icon
                    :name="exportingAttendees ? 'vent:loading' : 'vent:excel'"
                    size="0.95rem"
                    :class="{ 'animate-spin': exportingAttendees }"
                  />
                  Export
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-40 space-y-1">
                  <button
                    v-for="option in exportOptions"
                    :key="option.value"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    @click="exportAttendees(option.value)"
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
              @click="openMarkAttendanceModal"
            >
              Mark Attendance
            </button>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_phone="{ rowData }">
        {{ rowData.phone || "—" }}
      </template>

      <template #col_status="{ rowData }">
        <AppPills :color="rowData.status === 'attended' ? 'green' : 'red'">
          {{ rowData.status === "attended" ? "Attended" : "Not attended" }}
        </AppPills>
      </template>

      <template #col_checked_in_at="{ rowData }">
        {{ formatCheckIn(rowData.checked_in_at) }}
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="attendeesPage"
          :per-page="attendeesPerPage"
          :total-items="attendeesTotal"
          @change-page="changePage"
        />
      </template>
    </TableComponent>

    <EventMarkAttendanceModal
      ref="markAttendanceModal"
      :event-id="props.eventId"
    />
  </div>
</template>
