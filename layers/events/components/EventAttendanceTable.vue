<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { AttendanceVerificationFilter } from "../composables/useEventStore";

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

const ATTENDEES_PER_PAGE = 10;

const { attendees, fetchingAttendees } = useEventStore();

const filterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const markAttendanceModal = ref<MarkModalController | null>(null);
const searchInput = ref("");
const verificationFilter = ref<AttendanceVerificationFilter>("all");
const currentPage = ref(1);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "email", name: "Email" },
  { id: "phone", name: "Phone", isHiddenOnMobile: true },
  { id: "hasTransaction", name: "Transaction Status" },
  { id: "isVerified", name: "Verification Status" },
];

const filterOptions: AttendanceVerificationFilter[] = [
  "all",
  "verified",
  "not_verified",
];

/** Attendees matching the active search term and verification filter. */
const filteredAttendees = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  return attendees.value.filter((attendee) => {
    const matchesFilter =
      verificationFilter.value === "all" ||
      (verificationFilter.value === "verified" && attendee.isVerified) ||
      (verificationFilter.value === "not_verified" && !attendee.isVerified);
    const matchesSearch =
      !searchTerm ||
      [attendee.name, attendee.email, attendee.phone]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);

    return matchesFilter && matchesSearch;
  });
});

/** Total number of pages for the filtered attendees. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAttendees.value.length / ATTENDEES_PER_PAGE)),
);

/** The slice of filtered attendees shown on the current page. */
const pagedAttendees = computed(() => {
  const start = (currentPage.value - 1) * ATTENDEES_PER_PAGE;
  return filteredAttendees.value.slice(start, start + ATTENDEES_PER_PAGE);
});

/** Formats a verification filter option into its visible label. */
const getFilterLabel = (filter: AttendanceVerificationFilter): string => {
  if (filter === "verified") return "Verified";
  if (filter === "not_verified") return "Not verified";
  return "All";
};

/** Applies a verification filter and closes the filter menu. */
const selectFilter = (filter: AttendanceVerificationFilter): void => {
  verificationFilter.value = filter;
  filterDropdown.value?.closeDropdown();
};

/** Opens the Mark Attendance modal. */
const openMarkAttendanceModal = (): void => {
  void markAttendanceModal.value?.open();
};

watch([searchInput, verificationFilter], () => {
  currentPage.value = 1;
});

watch(
  totalPages,
  (lastPage) => {
    if (currentPage.value > lastPage) currentPage.value = lastPage;
  },
  { immediate: true },
);
</script>

<template>
  <EventAttendanceTableShimmer v-if="fetchingAttendees" />

  <section
    v-else-if="props.loadFailed"
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
      :body="pagedAttendees"
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
                  Filter by: {{ getFilterLabel(verificationFilter) }}
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
                      'bg-dashboard-bg-dark': verificationFilter === option,
                    }"
                    @click="selectFilter(option)"
                  >
                    Filter by: {{ getFilterLabel(option) }}
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

      <template #col_hasTransaction="{ rowData }">
        <AppPills :color="rowData.hasTransaction ? 'green' : 'red'">
          {{ rowData.hasTransaction ? "Yes" : "NO" }}
        </AppPills>
      </template>

      <template #col_isVerified="{ rowData }">
        <AppPills :color="rowData.isVerified ? 'green' : 'red'">
          {{ rowData.isVerified ? "Verified" : "Not verified" }}
        </AppPills>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="ATTENDEES_PER_PAGE"
          :total-items="filteredAttendees.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <EventMarkAttendanceModal
      ref="markAttendanceModal"
      :event-id="props.eventId"
    />
  </div>
</template>
