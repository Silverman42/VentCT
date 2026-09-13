<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type { ITableBodyData, ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { AttendanceRecord, AttendanceStatus } from "../composables/useAttendanceStore";

interface AttendanceModalController {
  open: (preselectedIds?: string[]) => Promise<void> | void;
}

interface DetailModalController {
  open: (id: string) => void;
}

const ATTENDANCE_PER_PAGE = 10;
const { records, summary } = useAttendanceStore();
const route = useRoute();
const router = useRouter();
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const selectAllInput = ref<HTMLInputElement | null>(null);
const createAttendanceModal = ref<AttendanceModalController | null>(null);
const markAttendanceModal = ref<AttendanceModalController | null>(null);
const profileSideModal = ref<DetailModalController | null>(null);
const isApplyingRoute = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "select", name: "Select", mobileLabel: "Select", width: "4.5rem" },
  { id: "name", name: "Name", width: "16%" },
  { id: "email", name: "Email", width: "22%", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", width: "14%", isHiddenOnMobile: true },
  { id: "createdAt", name: "Date Created", width: "18%", isHiddenOnMobile: true },
  { id: "referralCode", name: "Referral Code", width: "12%" },
  { id: "status", name: "Status", width: "10%" },
  { id: "open", name: "", mobileLabel: "View", width: "3.5rem", justify: "right" },
];

/** Reads one scalar query-string value without leaking arrays into controls. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalar = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalar === "string" ? scalar : "";
};

/** Confirms that a query-string status is supported by the attendance list. */
const isAttendanceStatus = (value: string): value is AttendanceStatus =>
  value === "attended" || value === "not-attended";

/** Normalizes route query values for refresh-safe list controls. */
const getRouteState = (): {
  search: string;
  status: AttendanceStatus | "all";
  page: number;
} => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);
  const requestedStatus = getQueryValue(route.query.status);

  return {
    search: getQueryValue(route.query.search),
    status: isAttendanceStatus(requestedStatus) ? requestedStatus : "all",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const initialRouteState = getRouteState();
const searchInput = ref(initialRouteState.search);
const statusFilter = ref<AttendanceStatus | "all">(initialRouteState.status);
const currentPage = ref(initialRouteState.page);
const selectedAttendanceIds = ref<Set<string>>(new Set());

/** Filters local fixtures with the visible search and status controls. */
const filteredAttendance = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  return records.value.filter((record) => {
    const matchesStatus =
      statusFilter.value === "all" || record.status === statusFilter.value;
    const matchesSearch =
      !searchTerm ||
      [record.name, record.email, record.phone, record.referralCode]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);

    return matchesStatus && matchesSearch;
  });
});

/** Derives the final valid table page from the filtered local fixture result. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAttendance.value.length / ATTENDANCE_PER_PAGE)),
);

/** Returns the ten records currently visible in the table. */
const pagedAttendance = computed(() => {
  const start = (currentPage.value - 1) * ATTENDANCE_PER_PAGE;
  return filteredAttendance.value.slice(start, start + ATTENDANCE_PER_PAGE);
});

/** Indicates whether every current-page record has been selected. */
const areVisibleAttendanceSelected = computed(
  () =>
    pagedAttendance.value.length > 0 &&
    pagedAttendance.value.every((record) => selectedAttendanceIds.value.has(record.id)),
);

/** Indicates whether only part of the visible page has been selected. */
const areSomeVisibleAttendanceSelected = computed(
  () =>
    !areVisibleAttendanceSelected.value &&
    pagedAttendance.value.some((record) => selectedAttendanceIds.value.has(record.id)),
);

/** Converts attendance status values to the copy used in the supplied visual. */
const getStatusLabel = (status: AttendanceStatus): string =>
  status === "attended" ? "Attended" : "Not Attended";

/** Synchronizes non-default visible list controls to the current route. */
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

/** Delays route updates while a user continues typing a search term. */
const syncDebouncedSearch = useDebounceFn(syncRouteState, 300);

/** Applies browser navigation changes to the local table controls. */
const applyRouteState = (): void => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  searchInput.value = nextState.search;
  statusFilter.value = nextState.status;
  currentPage.value = nextState.page;
  isApplyingRoute.value = false;
};

/** Selects a status filter and closes its shared dropdown. */
const selectStatusFilter = (status: AttendanceStatus | "all"): void => {
  statusFilter.value = status;
  statusDropdown.value?.closeDropdown();
};

/** Toggles one table selection without triggering the row profile action. */
const toggleAttendanceSelection = (attendanceId: string): void => {
  const nextSelection = new Set(selectedAttendanceIds.value);

  if (nextSelection.has(attendanceId)) {
    nextSelection.delete(attendanceId);
  } else {
    nextSelection.add(attendanceId);
  }

  selectedAttendanceIds.value = nextSelection;
};

/** Toggles every attendance row rendered on the active table page. */
const toggleVisibleAttendanceSelection = (): void => {
  const nextSelection = new Set(selectedAttendanceIds.value);

  if (areVisibleAttendanceSelected.value) {
    pagedAttendance.value.forEach((record) => nextSelection.delete(record.id));
  } else {
    pagedAttendance.value.forEach((record) => nextSelection.add(record.id));
  }

  selectedAttendanceIds.value = nextSelection;
};

/** Opens a row's full details in the requested side-modal experience. */
const openAttendanceProfile = (row: ITableBodyData): void => {
  const record = row as AttendanceRecord;
  profileSideModal.value?.open(record.id);
};

/** Opens a fresh local attendance entry form. */
const openCreateAttendanceModal = (): void => {
  void createAttendanceModal.value?.open();
};

/** Opens the marking flow with outstanding records selected in the table. */
const openMarkAttendanceModal = (): void => {
  void markAttendanceModal.value?.open([...selectedAttendanceIds.value]);
};

/** Removes successfully marked records from the visible table selection state. */
const clearMarkedSelections = (recordIds: string[]): void => {
  const nextSelection = new Set(selectedAttendanceIds.value);
  recordIds.forEach((id) => nextSelection.delete(id));
  selectedAttendanceIds.value = nextSelection;
};

/** Updates the native select-all checkbox's indeterminate visual state. */
const refreshSelectAllState = (): void => {
  if (selectAllInput.value) {
    selectAllInput.value.indeterminate = areSomeVisibleAttendanceSelected.value;
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
  [areVisibleAttendanceSelected, areSomeVisibleAttendanceSelected],
  () => refreshSelectAllState(),
  { flush: "post" },
);

onMounted(() => refreshSelectAllState());
</script>

<template>
  <div class="flex min-w-0 w-full flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <AppHeading title="Attendance" subtitle="Track and manage attendance record." />
      <AppButton
        size="md"
        type="button"
        :block="false"
        color="primary"
        aria-label="Create attendance"
        @click="openCreateAttendanceModal"
      >
        <Icon name="vent:add" size="1rem" />
        Create Attendance
      </AppButton>
    </header>

    <section class="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Attendance summary metrics">
      <article class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5">
        <p class="text-xs text-dashboard-text">Total Attendees</p>
        <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">{{ summary.totalAttendees.toLocaleString() }}</p>
      </article>
      <article class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5">
        <p class="text-xs text-dashboard-text">Attended</p>
        <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">{{ summary.attended.toLocaleString() }}</p>
      </article>
      <article class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5">
        <p class="text-xs text-dashboard-text">Not Attended</p>
        <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">{{ summary.notAttended.toLocaleString() }}</p>
      </article>
    </section>

    <TableComponent
      :headings="tableHeadings"
      :body="pagedAttendance"
      clickable
      empty-heading="No attendance records found"
      empty-subtitle="Try changing the search text or attendance status filter."
      @row-click="openAttendanceProfile"
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Attendance"
          search-placeholder="Search..."
        >
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
                <div role="listbox" aria-label="Attendance status" class="min-w-44 space-y-1">
                  <button
                    v-for="status in ['all', 'attended', 'not-attended'] as const"
                    :key="status"
                    type="button"
                    role="option"
                    :aria-selected="statusFilter === status"
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
              class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-color-default px-3 py-2.5 text-sm text-brand-color-default transition hover:bg-brand-color-default/10 sm:w-auto"
              aria-label="Mark attendance"
              @click="openMarkAttendanceModal"
            >
              Mark Attendance
            </button>
          </template>
        </TableComponentHeader>
      </template>

      <template #head_select>
        <input
          ref="selectAllInput"
          type="checkbox"
          class="h-4 w-4 cursor-pointer accent-brand-color-default"
          :checked="areVisibleAttendanceSelected"
          aria-label="Select all attendance records on this page"
          @click.stop
          @change="toggleVisibleAttendanceSelection"
        />
      </template>

      <template #col_select="{ rowData }">
        <input
          type="checkbox"
          class="h-4 w-4 cursor-pointer accent-brand-color-default"
          :checked="selectedAttendanceIds.has(String(rowData.id))"
          :aria-label="`Select ${rowData.name}`"
          @click.stop
          @change="toggleAttendanceSelection(String(rowData.id))"
        />
      </template>

      <template #col_status="{ rowData }">
        <AppPills :color="rowData.status === 'attended' ? 'green' : 'gray'">
          {{ getStatusLabel(rowData.status) }}
        </AppPills>
      </template>

      <template #col_open>
        <Icon name="vent:arrow-right" size="1.15rem" class="text-dashboard-heading" />
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="ATTENDANCE_PER_PAGE"
          :total-items="filteredAttendance.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <CreateAttendanceModal ref="createAttendanceModal" />
    <MarkAttendanceModal ref="markAttendanceModal" @marked="clearMarkedSelections" />
    <AttendanceProfileSideModal ref="profileSideModal" />
  </div>
</template>
