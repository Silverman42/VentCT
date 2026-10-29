import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import { downloadResponseFile } from "~/utils/helpers/FileDownload";
import { resolveLastPage } from "~/utils/helpers/Pagination";
import type {
  IPaginationMeta,
  IResponse,
} from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Lifecycle status of a campaign returned by the API. */
export type CampaignApiStatus = "pending" | "running" | "closed";

/** Status filter applied to the campaigns list. */
export type CampaignStatusFilter = CampaignApiStatus | "all";

/** Display labels for each campaign status. */
export const CAMPAIGN_STATUS_LABELS: Record<CampaignApiStatus, string> = {
  pending: "Pending",
  running: "Running",
  closed: "Closed",
};

/** Spreadsheet formats supported by the campaign export endpoint. */
export type CampaignExportFormat = "xlsx" | "csv";

/** Audience status filter supported by the audiences endpoint. */
export type CampaignAudienceStatusFilter =
  | "all"
  | "verified"
  | "unverified"
  | "transacted";

/** Campaign record returned by the campaigns list endpoint. */
export interface ICampaign extends ITableBodyData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: CampaignApiStatus;
  target: number;
  /** Formatted as `YYYY-MM-DD`. */
  start_date?: string;
  /** Formatted as `YYYY-MM-DD`. */
  end_date?: string;
  banner_url?: string | null;
  promoters_count?: number;
  audiences_count?: number;
  created_at?: string;
  updated_at?: string;
}

/** Performance metrics returned with the campaign detail endpoint. */
export interface ICampaignMetrics {
  total_promoters: number;
  total_audiences: number;
  verified_audiences: number;
  transacted_audiences: number;
  total_events: number;
}

/** Campaign record returned by the campaign detail endpoint. */
export interface ICampaignDetails extends ICampaign {
  metrics?: ICampaignMetrics;
}

/** Campaign counts by status returned with the campaigns list. */
export interface ICampaignSummary {
  total_campaigns: number;
  running_count: number;
  pending_count: number;
  closed_count: number;
}

/** Response data of the campaigns list endpoint. */
export interface ICampaignListResponse {
  summary: ICampaignSummary;
  campaigns: ICampaign[];
}

/** Payload for creating a campaign. */
export interface ICreateCampaignPayload {
  name: string;
  description?: string;
  status: CampaignApiStatus;
  target: number;
  /** Formatted as `YYYY-MM-DD`. */
  start_date: string;
  /** Formatted as `YYYY-MM-DD`. */
  end_date: string;
  banner_url?: string;
}

/** Payload for updating a campaign; every field is optional. */
export type IUpdateCampaignPayload = Partial<ICreateCampaignPayload>;

/** Payload for deleting several campaigns at once. */
export interface IBatchDeleteCampaignsPayload {
  campaign_ids: string[];
}

/** Response data of the batch delete endpoint. */
export interface IBatchDeleteCampaignsResponse {
  deleted_count: number;
}

/** Promoter record returned by the promoters list endpoint. */
export interface ICampaignPromoter extends ITableBodyData {
  id: string;
  campaign_id?: string;
  campaign_name?: string;
  name: string;
  email: string;
  phone?: string | null;
  referral_code: string;
  app_referral_link?: string;
  web_referral_link?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Promoter summary returned with the promoters list. */
export interface ICampaignPromoterSummary {
  total_promoters: number;
  total_audience: number;
  verified_users: number;
  completed_trades: number;
  conversion_rate: number;
}

/** Response data of the promoters list endpoint. */
export interface ICampaignPromoterListResponse {
  summary: ICampaignPromoterSummary;
  promoters: ICampaignPromoter[];
}

/** Audience record returned by the audiences list endpoint. */
export interface ICampaignAudience extends ITableBodyData {
  id: string;
  campaign_id?: string;
  promoter_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  is_verified: boolean;
  has_transacted: boolean;
  verified_at?: string | null;
  first_trade_at?: string | null;
  created_at?: string;
}

/** Audience summary returned with the audiences list. */
export interface ICampaignAudienceSummary {
  total_audiences: number;
  verified_count: number;
  transacted_count: number;
  unverified_count: number;
}

/** Response data of the audiences list endpoint. */
export interface ICampaignAudienceListResponse {
  summary: ICampaignAudienceSummary;
  audiences: ICampaignAudience[];
}

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

/** Provides campaign API state and actions. */
export const useCampaignStore = () => {
  const endpoints = {
    CAMPAIGNS: "/admin/campaigns",
    CAMPAIGN: (id: string) => `/admin/campaigns/${id}`,
    BATCH_DELETE: "/admin/campaigns/batch-delete",
    EXPORT: "/admin/campaigns/export",
    PROMOTERS: "/admin/promoters",
    AUDIENCES: "/admin/audiences",
  };

  const state = {
    fetchingCampaignOptions: useState<boolean>(
      "useCampaignStore.fetchingCampaignOptions",
      () => false,
    ),
    campaignOptions: useState<ICampaign[]>(
      "useCampaignStore.campaignOptions",
      () => [],
    ),

    fetchingCampaigns: useState<boolean>(
      "useCampaignStore.fetchingCampaigns",
      () => false,
    ),
    fetchingCampaignDetails: useState<boolean>(
      "useCampaignStore.fetchingCampaignDetails",
      () => false,
    ),
    creatingCampaign: useState<boolean>(
      "useCampaignStore.creatingCampaign",
      () => false,
    ),
    updatingCampaign: useState<boolean>(
      "useCampaignStore.updatingCampaign",
      () => false,
    ),
    deletingCampaign: useState<boolean>(
      "useCampaignStore.deletingCampaign",
      () => false,
    ),
    batchDeletingCampaigns: useState<boolean>(
      "useCampaignStore.batchDeletingCampaigns",
      () => false,
    ),
    exportingCampaigns: useState<boolean>(
      "useCampaignStore.exportingCampaigns",
      () => false,
    ),

    campaigns: useState<ICampaign[]>("useCampaignStore.campaigns", () => []),
    campaignSummary: useState<ICampaignSummary | null>(
      "useCampaignStore.campaignSummary",
      () => null,
    ),
    campaignsPage: useState<number>("useCampaignStore.campaignsPage", () => 1),
    campaignsPerPage: useState<number>(
      "useCampaignStore.campaignsPerPage",
      () => 10,
    ),
    campaignsLastPage: useState<number>(
      "useCampaignStore.campaignsLastPage",
      () => 1,
    ),
    campaignsTotal: useState<number>(
      "useCampaignStore.campaignsTotal",
      () => 0,
    ),
    campaignsSearch: useState<string>(
      "useCampaignStore.campaignsSearch",
      () => "",
    ),
    campaignsStatus: useState<CampaignStatusFilter>(
      "useCampaignStore.campaignsStatus",
      () => "all",
    ),
    selectedCampaign: useState<ICampaignDetails | null>(
      "useCampaignStore.selectedCampaign",
      () => null,
    ),

    fetchingCampaignPromoters: useState<boolean>(
      "useCampaignStore.fetchingCampaignPromoters",
      () => false,
    ),
    campaignPromoters: useState<ICampaignPromoter[]>(
      "useCampaignStore.campaignPromoters",
      () => [],
    ),
    campaignPromotersPage: useState<number>(
      "useCampaignStore.campaignPromotersPage",
      () => 1,
    ),
    campaignPromotersPerPage: useState<number>(
      "useCampaignStore.campaignPromotersPerPage",
      () => 10,
    ),
    campaignPromotersLastPage: useState<number>(
      "useCampaignStore.campaignPromotersLastPage",
      () => 1,
    ),
    campaignPromotersTotal: useState<number>(
      "useCampaignStore.campaignPromotersTotal",
      () => 0,
    ),
    campaignPromotersSearch: useState<string>(
      "useCampaignStore.campaignPromotersSearch",
      () => "",
    ),

    fetchingCampaignAudiences: useState<boolean>(
      "useCampaignStore.fetchingCampaignAudiences",
      () => false,
    ),
    campaignAudiences: useState<ICampaignAudience[]>(
      "useCampaignStore.campaignAudiences",
      () => [],
    ),
    campaignAudiencesPage: useState<number>(
      "useCampaignStore.campaignAudiencesPage",
      () => 1,
    ),
    campaignAudiencesPerPage: useState<number>(
      "useCampaignStore.campaignAudiencesPerPage",
      () => 10,
    ),
    campaignAudiencesLastPage: useState<number>(
      "useCampaignStore.campaignAudiencesLastPage",
      () => 1,
    ),
    campaignAudiencesTotal: useState<number>(
      "useCampaignStore.campaignAudiencesTotal",
      () => 0,
    ),
    campaignAudiencesSearch: useState<string>(
      "useCampaignStore.campaignAudiencesSearch",
      () => "",
    ),
    campaignAudiencesStatus: useState<CampaignAudienceStatusFilter>(
      "useCampaignStore.campaignAudiencesStatus",
      () => "all",
    ),
  };

  const getters = {
    /** Campaign counts per status for the index summary cards. */
    campaignStats: computed(() => ({
      total: state.campaignSummary.value?.total_campaigns ?? 0,
      pending: state.campaignSummary.value?.pending_count ?? 0,
      running: state.campaignSummary.value?.running_count ?? 0,
      closed: state.campaignSummary.value?.closed_count ?? 0,
    })),
  };

  /** Applies updated campaign fields to the selected campaign and the list. */
  const mergeCampaign = (campaignId: string, changes: Partial<ICampaign>) => {
    if (state.selectedCampaign.value?.id === campaignId) {
      state.selectedCampaign.value = {
        ...state.selectedCampaign.value,
        ...changes,
      };
    }
    state.campaigns.value = state.campaigns.value.map((campaign) =>
      campaign.id === campaignId ? { ...campaign, ...changes } : campaign,
    );
  };

  const actions = {
    /** Fetches up to 100 campaigns for use in selectors such as the event form. */
    async fetchCampaignOptions(search: string = "") {
      state.fetchingCampaignOptions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignListResponse>>(endpoints.CAMPAIGNS, {
          method: "GET",
          query: {
            page: 1,
            per_page: 100,
            search: search.trim() || undefined,
          },
        })
        .then((response) => {
          state.campaignOptions.value = response.data?.campaigns ?? [];
          return state.campaignOptions.value;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Campaign fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignOptions.value = false;
        });
    },

    /**
     * Fetches one page of campaigns using the stored search/status filters.
     * When a page beyond the first comes back empty or fails, the page state
     * rolls back to the last valid page.
     */
    async fetchCampaigns(page: number = state.campaignsPage.value) {
      const previousPage = state.campaignsPage.value;
      state.campaignsPage.value = page;
      state.fetchingCampaigns.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignListResponse, any, IPaginationMeta>>(
          endpoints.CAMPAIGNS,
          {
            method: "GET",
            query: {
              page,
              per_page: state.campaignsPerPage.value,
              search: state.campaignsSearch.value || undefined,
              status:
                state.campaignsStatus.value === "all"
                  ? undefined
                  : state.campaignsStatus.value,
            },
          },
        )
        .then((response) => {
          const campaigns = response.data?.campaigns ?? [];
          state.campaignSummary.value = response.data?.summary ?? null;

          if (page > 1 && campaigns.length === 0) {
            state.campaignsPage.value = previousPage;
            return state.campaigns.value;
          }

          state.campaigns.value = campaigns;
          state.campaignsTotal.value = response.meta?.total ?? campaigns.length;
          state.campaignsLastPage.value = resolveLastPage(response.meta);
          state.campaignsPage.value = response.meta?.current_page ?? page;
          return campaigns;
        })
        .catch((error) => {
          state.campaignsPage.value = previousPage;
          handleApiError(error, "Campaign fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaigns.value = false;
        });
    },

    /** Updates the search term and reloads the first page of campaigns. */
    async setCampaignsSearch(search: string) {
      state.campaignsSearch.value = search.trim();
      return actions.fetchCampaigns(1);
    },

    /** Updates the status filter and reloads the first page of campaigns. */
    async setCampaignsStatus(status: CampaignStatusFilter) {
      state.campaignsStatus.value = status;
      return actions.fetchCampaigns(1);
    },

    /**
     * Loads one campaign with its metrics into `selectedCampaign`.
     * Resolves to `null` without a toast when the campaign does not exist.
     */
    async fetchCampaignDetails(campaignId: string) {
      state.fetchingCampaignDetails.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignDetails>>(
          endpoints.CAMPAIGN(campaignId),
          { method: "GET" },
        )
        .then((response) => {
          state.selectedCampaign.value = response.data ?? null;
          return state.selectedCampaign.value;
        })
        .catch((error) => {
          state.selectedCampaign.value = null;
          if (isNotFoundError(error)) return null;
          handleApiError(error, "Campaign detail fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignDetails.value = false;
        });
    },

    /** Creates a campaign, then refreshes the first page of the list. */
    async createCampaign(payload: ICreateCampaignPayload) {
      state.creatingCampaign.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaign>>(endpoints.CAMPAIGNS, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            `${payload.name} has been created successfully.`,
            "success",
            "Campaign created",
            "large",
          );
          void actions.fetchCampaigns(1).catch(() => undefined);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Campaign creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingCampaign.value = false;
        });
    },

    /** Updates a campaign and merges the changes into stored campaign state. */
    async updateCampaign(campaignId: string, payload: IUpdateCampaignPayload) {
      state.updatingCampaign.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<Partial<ICampaign>>>(
          endpoints.CAMPAIGN(campaignId),
          { method: "PUT", body: payload },
        )
        .then((response) => {
          mergeCampaign(campaignId, {
            ...(payload as Partial<ICampaign>),
            ...(response.data ?? {}),
          });
          useToastHandler().triggerToast(
            "The campaign details have been saved.",
            "success",
            "Campaign updated",
            "large",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Campaign update failed");
          throw error;
        })
        .finally(() => {
          state.updatingCampaign.value = false;
        });
    },

    /** Permanently deletes a campaign and removes it from stored state. */
    async deleteCampaign(campaignId: string) {
      state.deletingCampaign.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<{ id: string }>>(endpoints.CAMPAIGN(campaignId), {
          method: "DELETE",
        })
        .then(() => {
          state.campaigns.value = state.campaigns.value.filter(
            (campaign) => campaign.id !== campaignId,
          );
          if (state.selectedCampaign.value?.id === campaignId) {
            state.selectedCampaign.value = null;
          }
          useToastHandler().triggerToast(
            "The campaign has been permanently deleted.",
            "success",
            "Campaign deleted",
            "large",
          );
          return true;
        })
        .catch((error) => {
          handleApiError(error, "Campaign deletion failed");
          throw error;
        })
        .finally(() => {
          state.deletingCampaign.value = false;
        });
    },

    /**
     * Deletes several campaigns, then reloads the current list page. Falls back
     * to the previous page when the current one no longer has campaigns.
     */
    async batchDeleteCampaigns(campaignIds: string[]) {
      state.batchDeletingCampaigns.value = true;
      const payload: IBatchDeleteCampaignsPayload = {
        campaign_ids: campaignIds,
      };

      return useApiClientHandler()
        .$apiClient<IResponse<IBatchDeleteCampaignsResponse>>(
          endpoints.BATCH_DELETE,
          { method: "POST", body: payload },
        )
        .then((response) => {
          const deletedCount = response.data?.deleted_count ?? campaignIds.length;
          useToastHandler().triggerToast(
            `${deletedCount} campaign${deletedCount === 1 ? "" : "s"} deleted successfully.`,
            "success",
            "Campaigns deleted",
            "large",
          );

          const remainingOnPage = state.campaigns.value.filter(
            (campaign) => !campaignIds.includes(campaign.id),
          ).length;
          const targetPage =
            remainingOnPage === 0 && state.campaignsPage.value > 1
              ? state.campaignsPage.value - 1
              : state.campaignsPage.value;
          void actions.fetchCampaigns(targetPage).catch(() => undefined);
          return deletedCount;
        })
        .catch((error) => {
          handleApiError(error, "Campaign deletion failed");
          throw error;
        })
        .finally(() => {
          state.batchDeletingCampaigns.value = false;
        });
    },

    /** Downloads the campaign list as a spreadsheet using the active filters. */
    async exportCampaigns(format: CampaignExportFormat) {
      state.exportingCampaigns.value = true;

      return useApiClientHandler()
        .$apiClient.raw<Blob>(endpoints.EXPORT, {
          method: "GET",
          responseType: "blob",
          query: {
            format,
            search: state.campaignsSearch.value || undefined,
            status:
              state.campaignsStatus.value === "all"
                ? undefined
                : state.campaignsStatus.value,
          },
        })
        .then((response) =>
          downloadResponseFile({
            responseData: response._data,
            contentType: response.headers.get("content-type"),
            contentDisposition: response.headers.get("content-disposition"),
            fallbackFileName: "campaigns",
            fallbackExtension: format,
          }),
        )
        .catch((error) => {
          handleApiError(error, "Campaign export failed");
          throw error;
        })
        .finally(() => {
          state.exportingCampaigns.value = false;
        });
    },

    /**
     * Fetches one page of promoters assigned to a campaign.
     * Lives here until the promoters layer has its own API store; move it to
     * `usePromoterStore` once that exists.
     */
    async fetchCampaignPromoters(
      campaignId: string,
      page: number = state.campaignPromotersPage.value,
    ) {
      const previousPage = state.campaignPromotersPage.value;
      state.campaignPromotersPage.value = page;
      state.fetchingCampaignPromoters.value = true;

      return useApiClientHandler()
        .$apiClient<
          IResponse<ICampaignPromoterListResponse, any, IPaginationMeta>
        >(endpoints.PROMOTERS, {
          method: "GET",
          query: {
            page,
            per_page: state.campaignPromotersPerPage.value,
            campaign_id: campaignId,
            search: state.campaignPromotersSearch.value || undefined,
          },
        })
        .then((response) => {
          const promoters = response.data?.promoters ?? [];
          if (page > 1 && promoters.length === 0) {
            state.campaignPromotersPage.value = previousPage;
            return state.campaignPromoters.value;
          }

          state.campaignPromoters.value = promoters;
          state.campaignPromotersTotal.value =
            response.meta?.total ?? promoters.length;
          state.campaignPromotersLastPage.value = resolveLastPage(
            response.meta,
          );
          state.campaignPromotersPage.value =
            response.meta?.current_page ?? page;
          return promoters;
        })
        .catch((error) => {
          state.campaignPromotersPage.value = previousPage;
          handleApiError(error, "Promoter fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignPromoters.value = false;
        });
    },

    /** Updates the promoter search term and reloads the first page. */
    async setCampaignPromotersSearch(campaignId: string, search: string) {
      state.campaignPromotersSearch.value = search.trim();
      return actions.fetchCampaignPromoters(campaignId, 1);
    },

    /**
     * Fetches one page of audience members recorded against a campaign.
     * Lives here until the audiences layer has its own API store; move it to
     * `useAudienceStore` once that exists.
     */
    async fetchCampaignAudiences(
      campaignId: string,
      page: number = state.campaignAudiencesPage.value,
    ) {
      const previousPage = state.campaignAudiencesPage.value;
      state.campaignAudiencesPage.value = page;
      state.fetchingCampaignAudiences.value = true;

      return useApiClientHandler()
        .$apiClient<
          IResponse<ICampaignAudienceListResponse, any, IPaginationMeta>
        >(endpoints.AUDIENCES, {
          method: "GET",
          query: {
            page,
            per_page: state.campaignAudiencesPerPage.value,
            campaign_id: campaignId,
            search: state.campaignAudiencesSearch.value || undefined,
            status:
              state.campaignAudiencesStatus.value === "all"
                ? undefined
                : state.campaignAudiencesStatus.value,
          },
        })
        .then((response) => {
          const audiences = response.data?.audiences ?? [];
          if (page > 1 && audiences.length === 0) {
            state.campaignAudiencesPage.value = previousPage;
            return state.campaignAudiences.value;
          }

          state.campaignAudiences.value = audiences;
          state.campaignAudiencesTotal.value =
            response.meta?.total ?? audiences.length;
          state.campaignAudiencesLastPage.value = resolveLastPage(
            response.meta,
          );
          state.campaignAudiencesPage.value =
            response.meta?.current_page ?? page;
          return audiences;
        })
        .catch((error) => {
          state.campaignAudiencesPage.value = previousPage;
          handleApiError(error, "Audience fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignAudiences.value = false;
        });
    },

    /** Updates the audience search term and reloads the first page. */
    async setCampaignAudiencesSearch(campaignId: string, search: string) {
      state.campaignAudiencesSearch.value = search.trim();
      return actions.fetchCampaignAudiences(campaignId, 1);
    },

    /** Updates the audience status filter and reloads the first page. */
    async setCampaignAudiencesStatus(
      campaignId: string,
      status: CampaignAudienceStatusFilter,
    ) {
      state.campaignAudiencesStatus.value = status;
      return actions.fetchCampaignAudiences(campaignId, 1);
    },

    /** Clears campaign-scoped promoter and audience tables between campaigns. */
    resetCampaignRelations() {
      state.campaignPromoters.value = [];
      state.campaignPromotersPage.value = 1;
      state.campaignPromotersTotal.value = 0;
      state.campaignPromotersLastPage.value = 1;
      state.campaignPromotersSearch.value = "";
      state.campaignAudiences.value = [];
      state.campaignAudiencesPage.value = 1;
      state.campaignAudiencesTotal.value = 0;
      state.campaignAudiencesLastPage.value = 1;
      state.campaignAudiencesSearch.value = "";
      state.campaignAudiencesStatus.value = "all";
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
