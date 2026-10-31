import type { AnalyticsTimeframe } from "~/utils/helpers/AnalyticsFormatters";
import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import { downloadResponseFile } from "~/utils/helpers/FileDownload";
import { resolveLastPage } from "~/utils/helpers/Pagination";
import type {
  IPaginationMeta,
  IResponse,
} from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Quick status filter accepted by `GET /admin/audiences`. */
export type AudienceStatusFilter =
  | "all"
  | "verified"
  | "unverified"
  | "transacted"
  | "not_transacted";

/** Spreadsheet formats supported by the audience export endpoint. */
export type AudienceExportFormat = "xlsx" | "csv";

/** Audience record (AudienceResource) returned by the list and create endpoints. */
export interface IAudience extends ITableBodyData {
  id: string;
  campaignId: string;
  campaignName: string | null;
  promoterId: string | null;
  promoterName: string | null;
  name: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  hasTransacted: boolean;
  status: string;
  statusLabel: string;
  /** `0` when unknown/unverified, otherwise `1`–`3`. */
  kycLevel: number;
  countryCode: string | null;
  verifiedAt: string | null;
  firstTradeAt: string | null;
  createdAt?: string;
}

/** Audience totals returned with the audience list. */
export interface IAudienceSummary {
  registeredTotal: number;
  verifiedTotal: number;
  withTransactionTotal: number;
  unverifiedTotal: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

/** Response data of `GET /admin/audiences`. */
export interface IAudienceListResponse {
  summary: IAudienceSummary;
  audiences: IAudience[];
}

/** USD volume and row count for one ledger slice. */
export interface IAudienceVolumeCount {
  volume: number;
  count: number;
}

/** Ledger metrics on the audience profile, following the selected timeframe. */
export interface IAudienceMetrics {
  transactions: IAudienceVolumeCount & {
    easypay: IAudienceVolumeCount;
    safewallet: IAudienceVolumeCount & {
      cash: IAudienceVolumeCount;
      crypto: IAudienceVolumeCount;
    };
  };
  deposits: IAudienceVolumeCount;
  withdrawals: IAudienceVolumeCount & {
    cash: IAudienceVolumeCount;
    crypto: IAudienceVolumeCount;
  };
  utility: IAudienceVolumeCount & {
    airtime: IAudienceVolumeCount;
    data: IAudienceVolumeCount;
  };
  lastTransactionAt: string | null;
}

/**
 * Response data of `GET /admin/audiences/{id}`. `lastTransactionAt` and
 * `metrics` are `null` without the `dashboard.basic.view` permission.
 */
export interface IAudienceDetails extends IAudience {
  kycLevelLabel: string | null;
  country: string | null;
  lastTransactionAt: string | null;
  metrics: IAudienceMetrics | null;
  updatedAt?: string;
}

/** Filters applied to the audience profile metrics. */
export interface IAudienceProfileFilters {
  timeframe: AnalyticsTimeframe;
  /** `YYYY-MM-DD`; only sent when `timeframe` is `custom`. */
  startDate?: string;
  /** `YYYY-MM-DD`; only sent when `timeframe` is `custom`. */
  endDate?: string;
}

/** Payload for recording a single audience member. */
export interface ICreateAudiencePayload {
  campaignId: string;
  name: string;
  email: string;
  /** Must belong to `campaignId`. */
  promoterId?: string;
  phone?: string;
  isVerified?: boolean;
  hasTransacted?: boolean;
}

/** Payload for the CSV/XLS/XLSX batch import. */
export interface IImportAudiencesPayload {
  campaignId: string;
  file: File;
}

/** Response data of the batch import endpoint (the job runs in the background). */
export interface IImportAudiencesResponse {
  fileName: string;
  campaignId: string;
  queuedAt: string;
}

/** Query parameters sent to the audience profile endpoint. */
type AudienceProfileQuery = Record<string, string | undefined>;

/** Default profile filters, matching the "Last 30 days" selector. */
const defaultProfileFilters = (): IAudienceProfileFilters => ({
  timeframe: "last_30_days",
});

/** Turns profile filters into query parameters; dates are only sent for `custom`. */
const buildProfileQuery = (
  filters: IAudienceProfileFilters,
): AudienceProfileQuery => {
  const query: AudienceProfileQuery = { timeframe: filters.timeframe };

  if (filters.timeframe === "custom" && filters.startDate && filters.endDate) {
    query.startDate = filters.startDate;
    query.endDate = filters.endDate;
  }

  return query;
};

/** Returns true when an API error is a 404 Not Found. */
const isNotFoundError = (error: unknown): boolean =>
  (error as { statusCode?: number })?.statusCode === 404;

/**
 * Reports an API error through the shared handler. The toast is skipped for
 * 401s because the session middleware already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Provides audience API state and actions. */
export const useAudienceStore = () => {
  const endpoints = {
    AUDIENCES: "/admin/audiences",
    AUDIENCE: (id: string) => `/admin/audiences/${id}`,
    IMPORT: "/admin/audiences/import-csv",
    EXPORT: "/admin/audiences/export",
  };

  const state = {
    fetchingAudiences: useState<boolean>(
      "useAudienceStore.fetchingAudiences",
      () => false,
    ),
    fetchingAudienceDetails: useState<boolean>(
      "useAudienceStore.fetchingAudienceDetails",
      () => false,
    ),
    creatingAudience: useState<boolean>(
      "useAudienceStore.creatingAudience",
      () => false,
    ),
    importingAudiences: useState<boolean>(
      "useAudienceStore.importingAudiences",
      () => false,
    ),
    exportingAudiences: useState<boolean>(
      "useAudienceStore.exportingAudiences",
      () => false,
    ),

    audiences: useState<IAudience[]>("useAudienceStore.audiences", () => []),
    audienceSummary: useState<IAudienceSummary | null>(
      "useAudienceStore.audienceSummary",
      () => null,
    ),
    audiencesPage: useState<number>("useAudienceStore.audiencesPage", () => 1),
    audiencesPerPage: useState<number>(
      "useAudienceStore.audiencesPerPage",
      () => 10,
    ),
    audiencesLastPage: useState<number>(
      "useAudienceStore.audiencesLastPage",
      () => 1,
    ),
    audiencesTotal: useState<number>(
      "useAudienceStore.audiencesTotal",
      () => 0,
    ),
    audiencesSearch: useState<string>(
      "useAudienceStore.audiencesSearch",
      () => "",
    ),
    audiencesStatus: useState<AudienceStatusFilter>(
      "useAudienceStore.audiencesStatus",
      () => "all",
    ),
    /** Empty string means all campaigns. */
    audiencesCampaignId: useState<string>(
      "useAudienceStore.audiencesCampaignId",
      () => "",
    ),
    /** Empty string means all promoters. */
    audiencesPromoterId: useState<string>(
      "useAudienceStore.audiencesPromoterId",
      () => "",
    ),

    selectedAudience: useState<IAudienceDetails | null>(
      "useAudienceStore.selectedAudience",
      () => null,
    ),
    profileFilters: useState<IAudienceProfileFilters>(
      "useAudienceStore.profileFilters",
      defaultProfileFilters,
    ),
  };

  const { can } = useAuthStore();

  const getters = {
    /** Audience totals for the list summary cards, with zero fallbacks. */
    audienceStats: computed<IAudienceSummary>(() => ({
      registeredTotal: state.audienceSummary.value?.registeredTotal ?? 0,
      verifiedTotal: state.audienceSummary.value?.verifiedTotal ?? 0,
      withTransactionTotal:
        state.audienceSummary.value?.withTransactionTotal ?? 0,
      unverifiedTotal: state.audienceSummary.value?.unverifiedTotal ?? 0,
      today: state.audienceSummary.value?.today ?? 0,
      thisWeek: state.audienceSummary.value?.thisWeek ?? 0,
      thisMonth: state.audienceSummary.value?.thisMonth ?? 0,
      thisYear: state.audienceSummary.value?.thisYear ?? 0,
    })),
    /** Whether the user may see the profile's transaction figures. */
    canViewAudienceTransactions: computed<boolean>(() =>
      can("dashboard.basic.view"),
    ),
  };

  /** Shared list filters sent to the list and export endpoints. */
  const listFilterQuery = () => ({
    search: state.audiencesSearch.value || undefined,
    campaignId: state.audiencesCampaignId.value || undefined,
    promoterId: state.audiencesPromoterId.value || undefined,
  });

  const actions = {
    /**
     * Fetches one page of audiences using the stored search/status/campaign
     * filters. When a page beyond the first comes back empty or fails, the
     * page state rolls back to the last valid page.
     */
    async fetchAudiences(page: number = state.audiencesPage.value) {
      const previousPage = state.audiencesPage.value;
      state.audiencesPage.value = page;
      state.fetchingAudiences.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IAudienceListResponse, any, IPaginationMeta>>(
          endpoints.AUDIENCES,
          {
            method: "GET",
            query: {
              page,
              perPage: state.audiencesPerPage.value,
              ...listFilterQuery(),
              status:
                state.audiencesStatus.value === "all"
                  ? undefined
                  : state.audiencesStatus.value,
            },
          },
        )
        .then((response) => {
          const audiences = response.data?.audiences ?? [];
          state.audienceSummary.value = response.data?.summary ?? null;

          if (page > 1 && audiences.length === 0) {
            state.audiencesPage.value = previousPage;
            return state.audiences.value;
          }

          state.audiences.value = audiences;
          state.audiencesTotal.value = response.meta?.total ?? audiences.length;
          state.audiencesLastPage.value = resolveLastPage(response.meta);
          state.audiencesPage.value = response.meta?.currentPage ?? page;
          return audiences;
        })
        .catch((error) => {
          state.audiencesPage.value = previousPage;
          handleApiError(error, "Audience fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingAudiences.value = false;
        });
    },

    /** Updates the search term and reloads the first page of audiences. */
    async setAudiencesSearch(search: string) {
      state.audiencesSearch.value = search.trim();
      return actions.fetchAudiences(1);
    },

    /** Updates the status quick filter and reloads the first page. */
    async setAudiencesStatus(status: AudienceStatusFilter) {
      state.audiencesStatus.value = status;
      return actions.fetchAudiences(1);
    },

    /** Updates the campaign filter (empty for all) and reloads the first page. */
    async setAudiencesCampaign(campaignId: string) {
      state.audiencesCampaignId.value = campaignId;
      return actions.fetchAudiences(1);
    },

    /**
     * Loads one audience profile with metrics for the stored profile filters.
     * Resolves to `null` without a toast when the audience does not exist.
     */
    async fetchAudienceDetails(audienceId: string) {
      state.fetchingAudienceDetails.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IAudienceDetails>>(
          endpoints.AUDIENCE(audienceId),
          {
            method: "GET",
            query: buildProfileQuery(state.profileFilters.value),
          },
        )
        .then((response) => {
          state.selectedAudience.value = response.data ?? null;
          return state.selectedAudience.value;
        })
        .catch((error) => {
          if (isNotFoundError(error)) {
            state.selectedAudience.value = null;
            return null;
          }
          handleApiError(error, "Audience profile fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingAudienceDetails.value = false;
        });
    },

    /**
     * Merges new profile filters (dates are dropped unless the timeframe is
     * `custom`). Callers then refetch the profile.
     */
    setAudienceProfileFilters(partial: Partial<IAudienceProfileFilters>) {
      const next = { ...state.profileFilters.value, ...partial };
      if (next.timeframe !== "custom") {
        delete next.startDate;
        delete next.endDate;
      }
      state.profileFilters.value = next;
      return next;
    },

    /** Records a single audience member, then refreshes the first list page. */
    async createAudience(payload: ICreateAudiencePayload) {
      state.creatingAudience.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IAudience>>(endpoints.AUDIENCES, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            `${payload.name} has been added successfully.`,
            "success",
            "Audience added",
            "large",
          );
          void actions.fetchAudiences(1).catch(() => undefined);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Audience creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingAudience.value = false;
        });
    },

    /**
     * Uploads a CSV/XLS/XLSX file for background import into a campaign.
     * The API only queues the job, so the list is not refreshed here.
     */
    async importAudiences(payload: IImportAudiencesPayload) {
      state.importingAudiences.value = true;

      const body = new FormData();
      body.append("campaignId", payload.campaignId);
      body.append("file", payload.file);

      return useApiClientHandler()
        .$apiClient<IResponse<IImportAudiencesResponse>>(endpoints.IMPORT, {
          method: "POST",
          body,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            "The import has been queued and will be processed in the background.",
            "success",
            "Import queued",
            "large",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Audience import failed");
          throw error;
        })
        .finally(() => {
          state.importingAudiences.value = false;
        });
    },

    /** Downloads the audience list as a spreadsheet using the active filters. */
    async exportAudiences(format: AudienceExportFormat) {
      state.exportingAudiences.value = true;
      const status = state.audiencesStatus.value;

      return useApiClientHandler()
        .$apiClient.raw<Blob>(endpoints.EXPORT, {
          method: "GET",
          responseType: "blob",
          query: {
            format,
            ...listFilterQuery(),
            // Export only supports the verification flag, not the quick status.
            isVerified:
              status === "verified"
                ? true
                : status === "unverified"
                  ? false
                  : undefined,
          },
        })
        .then((response) =>
          downloadResponseFile({
            responseData: response._data,
            contentType: response.headers.get("content-type"),
            contentDisposition: response.headers.get("content-disposition"),
            fallbackFileName: "audiences",
            fallbackExtension: format,
          }),
        )
        .catch((error) => {
          handleApiError(error, "Audience export failed");
          throw error;
        })
        .finally(() => {
          state.exportingAudiences.value = false;
        });
    },

    /** Clears the loaded profile and its filters between audience members. */
    resetAudienceProfile() {
      state.selectedAudience.value = null;
      state.profileFilters.value = defaultProfileFilters();
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
