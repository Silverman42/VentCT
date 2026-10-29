<script setup lang="ts">
import type { AppDropdown } from "#components";
import { DateFilterHelper } from "~/utils/helpers/DateFilter";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import type {
  ActivityLogExportFormat,
  IActivityLog,
} from "../composables/useActivityLogStore";

interface SideModalController {
  open: (log: IActivityLog) => void;
}

/** Date range shape bound to `AppDateTimeDropdown`. */
interface ActivityLogDateRange {
  key: string;
  label: string;
  start: string;
  end: string;
  custom?: boolean;
}

/** Template-ready table row derived from an activity log entry. */
interface ActivityLogRow extends ITableBodyData {
  log: IActivityLog;
  date: string;
  time: string;
  module: string;
  description: string;
  causerName: string;
  causerEmail: string;
  ip: string;
}

const {
  activityLogs,
  fetchingActivityLogs,
  exportingActivityLogs,
  activityLogsPage,
  activityLogsPerPage,
  activityLogsTotal,
  activityLogFilters,
  fetchActivityLogs,
  setActivityLogFilters,
  exportActivityLogs,
} = useActivityLogStore();

const moduleDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const exportDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const viewSideModal = ref<SideModalController | null>(null);
const dateRange = ref<ActivityLogDateRange | null>(createLastThirtyDaysRange());
const hasLoaded = ref(false);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "created_at", name: "Date/time", width: "150px" },
  { id: "module", name: "Module" },
  { id: "description", name: "Description" },
  { id: "causer", name: "Performed by", isHiddenOnMobile: true },
  { id: "ip", name: "IP", isHiddenOnMobile: true },
  { id: "action", name: "", justify: "right", mobileLabel: "Action" },
];

const moduleOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "events", label: "Events" },
  { value: "campaigns", label: "Campaigns" },
  { value: "promoters", label: "Promoters" },
  { value: "audiences", label: "Audiences" },
  { value: "attendances", label: "Attendances" },
  { value: "deep_links", label: "Deep links" },
  { value: "users", label: "Users" },
  { value: "roles", label: "Roles" },
];

const exportOptions: Array<{ value: ActivityLogExportFormat; label: string }> =
  [
    { value: "xlsx", label: "Export as XLSX" },
    { value: "csv", label: "Export as CSV" },
  ];

/** Creates the default "Last 30 days" range used on first load. */
function createLastThirtyDaysRange(): ActivityLogDateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  return {
    key: "last30days",
    label: "Last 30 days",
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/** Converts a dropdown range into the API's `yyyy-MM-dd` date filters. */
const toDateFilters = (range: ActivityLogDateRange | null) => ({
  date_from: range ? DateFilterHelper.formatInputDate(range.start) : "",
  date_to: range ? DateFilterHelper.formatInputDate(range.end) : "",
});

/** Visible label of the active module filter. */
const moduleLabel = computed(
  () =>
    moduleOptions.find(
      (option) => option.value === activityLogFilters.value.log_name,
    )?.label ?? activityLogFilters.value.log_name,
);

/** Maps API log entries to template-ready table rows. */
const rows = computed<ActivityLogRow[]>(() =>
  activityLogs.value.map((log) => {
    const ip = log.properties?.ip;
    return {
      id: log.id,
      log,
      date: log.created_at ? DateFormatter.formatDate(log.created_at) : "—",
      time: log.created_at ? DateFormatter.formatTime(log.created_at) : "",
      module: log.log_name ?? "",
      description: log.description || "—",
      causerName: log.causer?.name || "System",
      causerEmail: log.causer?.email ?? "",
      ip: typeof ip === "string" && ip ? ip : "—",
    };
  }),
);

/** Runs a list request and records whether it failed for the error state. */
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

/** Applies the selected date range and loads the first page of logs. */
const loadActivityLogs = (): Promise<void> =>
  runListRequest(() => setActivityLogFilters(toDateFilters(dateRange.value)));

/** Applies a module filter, closes the menu, and reloads page 1. */
const selectModule = (module: string): void => {
  moduleDropdown.value?.closeDropdown();
  if (module === activityLogFilters.value.log_name) return;
  void runListRequest(() => setActivityLogFilters({ log_name: module }));
};

/** Loads the requested page of activity logs. */
const changePage = (page: number): void => {
  void fetchActivityLogs(page).catch(() => undefined);
};

/** Exports logs in the chosen format with the active filters. */
const exportLogs = (format: ActivityLogExportFormat): void => {
  exportDropdown.value?.closeDropdown();
  if (exportingActivityLogs.value) return;
  void exportActivityLogs(format).catch(() => undefined);
};

/** Opens the detail side panel for the clicked row. */
const openActivityLog = (row: ITableBodyData): void => {
  viewSideModal.value?.open((row as ActivityLogRow).log);
};

watch(dateRange, (range) => {
  void runListRequest(() => setActivityLogFilters(toDateFilters(range)));
});

onMounted(() => {
  void loadActivityLogs();
});
</script>

<template>
  <ActivityLogListShimmer v-if="!hasLoaded" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading
      title="Activity Logs"
      subtitle="Review who did what across the platform."
    />

    <section
      v-if="loadFailed"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">
        We couldn't load activity logs
      </h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        Something went wrong while fetching the activity logs. Please try
        again.
      </p>
      <AppButton type="button" size="md" class="mt-5" @click="loadActivityLogs">
        Retry
      </AppButton>
    </section>

    <TableComponent
      v-else
      :headings="tableHeadings"
      :body="rows"
      :is-loading="fetchingActivityLogs"
      clickable
      empty-heading="No activity logs found"
      empty-subtitle="Try changing the module or date range filters."
      @row-click="openActivityLog"
    >
      <template #table-heading>
        <TableComponentHeader table-name="Activity Logs" hide-search>
          <template #filters>
            <AppDropdown
              ref="moduleDropdown"
              position="right"
              :width-is-finite="false"
            >
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                >
                  Module: {{ moduleLabel }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-40 space-y-1">
                  <button
                    v-for="option in moduleOptions"
                    :key="option.value || 'all'"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark':
                        activityLogFilters.log_name === option.value,
                    }"
                    @click="selectModule(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </template>
            </AppDropdown>

            <AppDateTimeDropdown
              v-model="dateRange"
              button-class="!rounded-lg !px-3 !py-2 !font-normal"
            />
          </template>

          <template #actions>
            <AppDropdown
              ref="exportDropdown"
              position="right"
              :width-is-finite="false"
            >
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  aria-haspopup="menu"
                  :disabled="exportingActivityLogs"
                >
                  <Icon name="vent:send" size="1rem" />
                  {{ exportingActivityLogs ? "Exporting..." : "Export" }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-40 space-y-1" role="menu">
                  <button
                    v-for="option in exportOptions"
                    :key="option.value"
                    type="button"
                    role="menuitem"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    @click="exportLogs(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_created_at="{ rowData }">
        <span class="block text-dashboard-heading">{{ rowData.date }}</span>
        <span class="block text-xs text-dashboard-text">{{ rowData.time }}</span>
      </template>

      <template #col_module="{ rowData }">
        <ActivityLogModulePill :module="rowData.module" />
      </template>

      <template #col_description="{ rowData }">
        <span class="line-clamp-2 text-dashboard-heading">
          {{ rowData.description }}
        </span>
      </template>

      <template #col_causer="{ rowData }">
        <span class="block text-dashboard-heading">{{ rowData.causerName }}</span>
        <span
          v-if="rowData.causerEmail"
          class="block text-xs text-dashboard-text"
        >
          {{ rowData.causerEmail }}
        </span>
      </template>

      <template #col_ip="{ rowData }">
        <span class="font-mono text-xs text-dashboard-text">{{ rowData.ip }}</span>
      </template>

      <template #col_action="{ rowData }">
        <button
          type="button"
          class="rounded-lg border border-dashboard-card-border px-3 py-1.5 text-sm text-dashboard-heading transition hover:border-brand-color-default"
          @click.stop="openActivityLog(rowData)"
        >
          View
        </button>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="activityLogsPage"
          :per-page="activityLogsPerPage"
          :total-items="activityLogsTotal"
          @change-page="changePage"
        />
      </template>
    </TableComponent>

    <ActivityLogViewSideModal ref="viewSideModal" />
  </div>
</template>
