import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import { downloadResponseFile } from "~/utils/helpers/FileDownload";
import type { IResponse } from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Spreadsheet formats supported by the activity log export endpoint. */
export type ActivityLogExportFormat = "xlsx" | "csv";

/** User who performed a logged action. */
export interface IActivityLogCauser {
  id: string;
  name: string;
  email: string;
}

/** Activity log entry returned by the activity logs endpoint. */
export interface IActivityLog extends ITableBodyData {
  id: number | string;
  /** Module that produced the entry, e.g. `events` or `campaigns`. */
  log_name: string;
  description: string;
  /** Fully qualified model class, e.g. `App\\Models\\Event`. */
  subject_type: string | null;
  subject_id: string | null;
  causer: IActivityLogCauser | null;
  properties: Record<string, unknown>;
  /** ISO date-time string. */
  created_at: string;
}

/** Filters applied to the activity log list and export requests. */
export interface IActivityLogFilters {
  /** Module name; an empty string means all modules. */
  log_name: string;
  /** Causer user ID; an empty string means any user. */
  causer_id: string;
  /** Formatted as `yyyy-MM-dd`; empty when unbounded. */
  date_from: string;
  /** Formatted as `yyyy-MM-dd`; empty when unbounded. */
  date_to: string;
}

/** Pagination meta returned with list responses. */
export interface IPaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page?: number;
}

/** Creates an empty filter set that matches every activity log. */
const createDefaultFilters = (): IActivityLogFilters => ({
  log_name: "",
  causer_id: "",
  date_from: "",
  date_to: "",
});

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the session middleware already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Provides forensic activity log API state and actions for the logs layer. */
export const useActivityLogStore = () => {
  const endpoints = {
    ACTIVITY_LOGS: "/admin/activity-logs",
    ACTIVITY_LOGS_EXPORT: "/admin/activity-logs/export",
  };

  const state = {
    fetchingActivityLogs: useState<boolean>(
      "useActivityLogStore.fetchingActivityLogs",
      () => false,
    ),
    exportingActivityLogs: useState<boolean>(
      "useActivityLogStore.exportingActivityLogs",
      () => false,
    ),

    activityLogs: useState<IActivityLog[]>(
      "useActivityLogStore.activityLogs",
      () => [],
    ),
    activityLogsPage: useState<number>(
      "useActivityLogStore.activityLogsPage",
      () => 1,
    ),
    activityLogsPerPage: useState<number>(
      "useActivityLogStore.activityLogsPerPage",
      () => 15,
    ),
    activityLogsLastPage: useState<number>(
      "useActivityLogStore.activityLogsLastPage",
      () => 1,
    ),
    activityLogsTotal: useState<number>(
      "useActivityLogStore.activityLogsTotal",
      () => 0,
    ),
    activityLogFilters: useState<IActivityLogFilters>(
      "useActivityLogStore.activityLogFilters",
      createDefaultFilters,
    ),
  };

  /** Derives the last page from list meta, falling back to total / per_page. */
  const resolveLastPage = (meta: IPaginationMeta | undefined): number => {
    if (!meta) return 1;
    if (meta.last_page) return Math.max(1, meta.last_page);
    return Math.max(1, Math.ceil((meta.total ?? 0) / (meta.per_page || 1)));
  };

  /** Builds the shared filter query, omitting empty values. */
  const buildFilterQuery = (): Record<string, string | undefined> => {
    const filters = state.activityLogFilters.value;
    return {
      log_name: filters.log_name || undefined,
      causer_id: filters.causer_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    };
  };

  const actions = {
    /**
     * Fetches one page of activity logs using the stored filters. When a page
     * beyond the first comes back empty or fails, the page state rolls back to
     * the last valid page.
     */
    async fetchActivityLogs(page: number = state.activityLogsPage.value) {
      const previousPage = state.activityLogsPage.value;
      state.activityLogsPage.value = page;
      state.fetchingActivityLogs.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IActivityLog[], any, IPaginationMeta>>(
          endpoints.ACTIVITY_LOGS,
          {
            method: "GET",
            query: {
              page,
              per_page: state.activityLogsPerPage.value,
              ...buildFilterQuery(),
            },
          },
        )
        .then((response) => {
          const logs = response.data ?? [];
          if (page > 1 && logs.length === 0) {
            state.activityLogsPage.value = previousPage;
            return state.activityLogs.value;
          }

          state.activityLogs.value = logs;
          state.activityLogsTotal.value = response.meta?.total ?? logs.length;
          state.activityLogsLastPage.value = resolveLastPage(response.meta);
          state.activityLogsPage.value = response.meta?.current_page ?? page;
          return logs;
        })
        .catch((error) => {
          state.activityLogsPage.value = previousPage;
          handleApiError(error, "Activity log fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingActivityLogs.value = false;
        });
    },

    /** Merges filter changes, resets to page 1, and refetches activity logs. */
    async setActivityLogFilters(filters: Partial<IActivityLogFilters>) {
      state.activityLogFilters.value = {
        ...state.activityLogFilters.value,
        ...filters,
      };
      return actions.fetchActivityLogs(1);
    },

    /** Clears every filter, resets to page 1, and refetches activity logs. */
    async resetActivityLogFilters() {
      state.activityLogFilters.value = createDefaultFilters();
      return actions.fetchActivityLogs(1);
    },

    /** Downloads activity logs as a spreadsheet using the active filters. */
    async exportActivityLogs(format: ActivityLogExportFormat) {
      state.exportingActivityLogs.value = true;
      const { causer_id: _causerId, ...exportFilters } = buildFilterQuery();

      return useApiClientHandler()
        .$apiClient.raw<Blob>(endpoints.ACTIVITY_LOGS_EXPORT, {
          method: "GET",
          responseType: "blob",
          query: { format, ...exportFilters },
        })
        .then((response) =>
          downloadResponseFile({
            responseData: response._data,
            contentType: response.headers.get("content-type"),
            contentDisposition: response.headers.get("content-disposition"),
            fallbackFileName: "activity-logs",
            fallbackExtension: format,
          }),
        )
        .catch((error) => {
          handleApiError(error, "Activity log export failed");
          throw error;
        })
        .finally(() => {
          state.exportingActivityLogs.value = false;
        });
    },
  };

  return {
    ...state,
    ...actions,
  };
};
