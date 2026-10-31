import type {
  AnalyticsSeriesUnit,
  AnalyticsTimeframe,
} from "~/utils/helpers/AnalyticsFormatters";
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
  | "transacted"
  | "not_transacted";

/** Campaign record (CampaignResource) returned by the list, create and update endpoints. */
export interface ICampaign extends ITableBodyData {
  id: string;
  name: string;
  slug: string | null;
  target: number;
  referralCode: string;
  status: CampaignApiStatus;
  statusLabel?: string;
  /** Formatted as `YYYY-MM-DD`. */
  startsAt: string | null;
  /** Formatted as `YYYY-MM-DD`. */
  endsAt: string | null;
  promotersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** All-time header metrics of the campaign detail endpoint. Financial fields are `null` without `dashboard.basic.view`. */
export interface ICampaignDetailMetrics {
  promotersCount: number;
  audienceCount: number;
  eventsCount: number;
  verifiedAudienceCount: number;
  transactedAudienceCount: number;
  totalTransactions: number | null;
  successfulTransactions: number | null;
  easypayVolume: number | null;
  safewalletVolume: number | null;
  totalVolume: number | null;
}

/** USD volume (2 dp) and row count for one ledger slice. */
export interface IVolumeCount {
  volume: number;
  count: number;
}

/** Ledger breakdown behind the campaign overview cards. */
export interface ICampaignOverviewBreakdown {
  transactions: IVolumeCount & {
    easypay: IVolumeCount;
    safewallet: IVolumeCount & { cash: IVolumeCount; crypto: IVolumeCount };
  };
  deposits: IVolumeCount;
  withdrawals: IVolumeCount & { cash: IVolumeCount; crypto: IVolumeCount };
  utility: IVolumeCount & { airtime: IVolumeCount; data: IVolumeCount };
  lastTransactionAt: string | null;
}

/** Overview figures for the selected timeframe and country. */
export interface ICampaignOverview {
  promoters: number;
  audience: number;
  transactionCount: number;
  depositCount: number;
  transactionVolume: number;
  depositVolume: number;
  utilityCount: number;
  withdrawCount: number;
  breakdown: ICampaignOverviewBreakdown;
}

/** Response data of `GET /admin/campaigns/{id}`. */
export interface ICampaignDetails extends ICampaign {
  metrics: ICampaignDetailMetrics;
  /** `null` when the user lacks `dashboard.basic.view`. */
  overview: ICampaignOverview | null;
  promoters?: ICampaignPromoter[];
}

/** Filters applied to the campaign overview, top promoters and countries. */
export interface ICampaignOverviewFilters {
  timeframe: AnalyticsTimeframe;
  /** `YYYY-MM-DD`; only sent when `timeframe` is `custom`. */
  startDate?: string;
  /** `YYYY-MM-DD`; only sent when `timeframe` is `custom`. */
  endDate?: string;
  /** ISO alpha-2 country code; empty means all countries. */
  countryCode?: string;
}

/** Chart window accepted by the verification vs trade series endpoint. */
export type CampaignSeriesPeriod = "7d" | "30d" | "90d" | "12m";

/** One promoter's share of the campaign's deposit volume. */
export interface ICampaignTopPromoter {
  id: string;
  name: string;
  volume: number;
  share: number;
}

/** Response data of `GET /admin/dashboard/top-promoters?campaignId=`. */
export interface ICampaignTopPromoters {
  totalVolume: number;
  unattributedVolume: number;
  promoters: ICampaignTopPromoter[];
}

/** One bucket of the verification vs trade chart. */
export interface ICampaignVerificationPoint {
  bucket: string;
  verifiedUsers: number;
  tradedUsers: number;
}

/** Response data of `GET /admin/dashboard/verification-trade-series?campaignId=`. */
export interface ICampaignVerificationSeries {
  period: string;
  unit: AnalyticsSeriesUnit;
  series: ICampaignVerificationPoint[];
}

/** A country with registered audiences, used by the overview country filter. */
export interface ICampaignCountry {
  code: string;
  name: string;
  audienceCount: number;
}

/** Response data of `GET /admin/dashboard/countries?campaignId=`. */
export interface ICampaignCountriesResponse {
  countries: ICampaignCountry[];
}

/** Campaign counts by status returned with the campaigns list. */
export interface ICampaignSummary {
  all: number;
  running: number;
  pending: number;
  closed: number;
}

/** Response data of the campaigns list endpoint. */
export interface ICampaignListResponse {
  summary: ICampaignSummary;
  campaigns: ICampaign[];
}

/** Payload for creating a campaign. */
export interface ICreateCampaignPayload {
  name: string;
  referralCode: string;
  target?: number;
  status?: CampaignApiStatus;
  slug?: string | null;
  /** Formatted as `YYYY-MM-DD`. */
  startsAt?: string | null;
  /** Formatted as `YYYY-MM-DD`. */
  endsAt?: string | null;
}

/** Payload for updating a campaign; every field is optional. */
export type IUpdateCampaignPayload = Partial<ICreateCampaignPayload>;

/** Payload for deleting several campaigns at once. */
export interface IBatchDeleteCampaignsPayload {
  ids: string[];
}

/** Response data of the batch delete endpoint. */
export interface IBatchDeleteCampaignsResponse {
  deletedCount: number;
}

/** Promoter record returned by the promoters list endpoint. */
export interface ICampaignPromoter extends ITableBodyData {
  id: string;
  campaignId?: string;
  campaignName?: string;
  name: string;
  email: string;
  phone?: string | null;
  referralCode: string;
  appReferralLink?: string;
  webReferralLink?: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Promoter summary returned with the promoters list. */
export interface ICampaignPromoterSummary {
  totalPromoters: number;
  totalAudience: number;
  verifiedUsers: number;
  completedTrades: number;
  conversionRate: number;
}

/** Response data of the promoters list endpoint. */
export interface ICampaignPromoterListResponse {
  summary: ICampaignPromoterSummary;
  promoters: ICampaignPromoter[];
}

/** Audience record returned by the audiences list endpoint. */
export interface ICampaignAudience extends ITableBodyData {
  id: string;
  campaignId?: string;
  campaignName?: string;
  promoterId?: string | null;
  promoterName?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  isVerified: boolean;
  hasTransacted: boolean;
  status?: string;
  statusLabel?: string;
  kycLevel?: number | null;
  countryCode?: string | null;
  verifiedAt?: string | null;
  firstTradeAt?: string | null;
  createdAt?: string;
}

/** Audience summary returned with the audiences list. */
export interface ICampaignAudienceSummary {
  registeredTotal: number;
  verifiedTotal: number;
  withTransactionTotal: number;
  unverifiedTotal: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

/** Response data of the audiences list endpoint. */
export interface ICampaignAudienceListResponse {
  summary: ICampaignAudienceSummary;
  audiences: ICampaignAudience[];
}

/** Query parameters accepted by the overview-filtered analytics endpoints. */
type CampaignAnalyticsQuery = Record<string, string | number | undefined>;

/**
 * Turns overview filters into query parameters, sending the date range only
 * for a custom timeframe and dropping an empty country.
 */
const buildOverviewQuery = (
  filters: ICampaignOverviewFilters,
): CampaignAnalyticsQuery => {
  const query: CampaignAnalyticsQuery = { timeframe: filters.timeframe };

  if (filters.timeframe === "custom" && filters.startDate && filters.endDate) {
    query.startDate = filters.startDate;
    query.endDate = filters.endDate;
  }
  if (filters.countryCode) query.countryCode = filters.countryCode;

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

/** Provides campaign API state and actions. */
export const useCampaignStore = () => {
  const endpoints = {
    CAMPAIGNS: "/admin/campaigns",
    CAMPAIGN: (id: string) => `/admin/campaigns/${id}`,
    BATCH_DELETE: "/admin/campaigns/batch-delete",
    EXPORT: "/admin/campaigns/export",
    PROMOTERS: "/admin/promoters",
    AUDIENCES: "/admin/audiences",
    TOP_PROMOTERS: "/admin/dashboard/top-promoters",
    VERIFICATION_SERIES: "/admin/dashboard/verification-trade-series",
    COUNTRIES: "/admin/dashboard/countries",
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

    overviewFilters: useState<ICampaignOverviewFilters>(
      "useCampaignStore.overviewFilters",
      () => ({ timeframe: "last_30_days" }),
    ),
    fetchingCampaignOverview: useState<boolean>(
      "useCampaignStore.fetchingCampaignOverview",
      () => false,
    ),
    campaignOverview: useState<ICampaignOverview | null>(
      "useCampaignStore.campaignOverview",
      () => null,
    ),
    fetchingCampaignTopPromoters: useState<boolean>(
      "useCampaignStore.fetchingCampaignTopPromoters",
      () => false,
    ),
    campaignTopPromoters: useState<ICampaignTopPromoters | null>(
      "useCampaignStore.campaignTopPromoters",
      () => null,
    ),
    campaignSeriesPeriod: useState<CampaignSeriesPeriod>(
      "useCampaignStore.campaignSeriesPeriod",
      () => "7d",
    ),
    fetchingCampaignVerificationSeries: useState<boolean>(
      "useCampaignStore.fetchingCampaignVerificationSeries",
      () => false,
    ),
    campaignVerificationSeries: useState<ICampaignVerificationSeries | null>(
      "useCampaignStore.campaignVerificationSeries",
      () => null,
    ),
    fetchingCampaignCountries: useState<boolean>(
      "useCampaignStore.fetchingCampaignCountries",
      () => false,
    ),
    campaignCountries: useState<ICampaignCountry[]>(
      "useCampaignStore.campaignCountries",
      () => [],
    ),
  };

  const { can } = useAuthStore();

  const getters = {
    /** Campaign counts per status for the index summary cards. */
    campaignStats: computed(() => ({
      total: state.campaignSummary.value?.all ?? 0,
      pending: state.campaignSummary.value?.pending ?? 0,
      running: state.campaignSummary.value?.running ?? 0,
      closed: state.campaignSummary.value?.closed ?? 0,
    })),
    /** Whether the user may load the financial overview, top promoters and chart. */
    canViewCampaignAnalytics: computed<boolean>(() =>
      can("dashboard.basic.view"),
    ),
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
            perPage: 100,
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
              perPage: state.campaignsPerPage.value,
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
          state.campaignsPage.value = response.meta?.currentPage ?? page;
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
     * Loads one campaign with its all-time metrics into `selectedCampaign` and
     * its filtered overview into `campaignOverview`, using the stored overview
     * filters. Resolves to `null` without a toast when the campaign does not exist.
     */
    async fetchCampaignDetails(campaignId: string) {
      state.fetchingCampaignDetails.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignDetails>>(
          endpoints.CAMPAIGN(campaignId),
          {
            method: "GET",
            query: buildOverviewQuery(state.overviewFilters.value),
          },
        )
        .then((response) => {
          state.selectedCampaign.value = response.data ?? null;
          state.campaignOverview.value = response.data?.overview ?? null;
          return state.selectedCampaign.value;
        })
        .catch((error) => {
          state.selectedCampaign.value = null;
          state.campaignOverview.value = null;
          if (isNotFoundError(error)) return null;
          handleApiError(error, "Campaign detail fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignDetails.value = false;
        });
    },

    /**
     * Re-fetches the campaign detail with the current overview filters and
     * updates only `campaignOverview`, so the header and tables stay in place.
     */
    async fetchCampaignOverview(campaignId: string) {
      state.fetchingCampaignOverview.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignDetails>>(
          endpoints.CAMPAIGN(campaignId),
          {
            method: "GET",
            query: buildOverviewQuery(state.overviewFilters.value),
          },
        )
        .then((response) => {
          state.campaignOverview.value = response.data?.overview ?? null;
          return state.campaignOverview.value;
        })
        .catch((error) => {
          handleApiError(error, "Campaign overview fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignOverview.value = false;
        });
    },

    /**
     * Merges new overview filters (dates are dropped unless the timeframe is
     * `custom`). Callers then refresh the overview and top promoters.
     */
    setCampaignOverviewFilters(partial: Partial<ICampaignOverviewFilters>) {
      const next = { ...state.overviewFilters.value, ...partial };
      if (next.timeframe !== "custom") {
        delete next.startDate;
        delete next.endDate;
      }
      if (!next.countryCode) delete next.countryCode;
      state.overviewFilters.value = next;
      return next;
    },

    /** Fetches the campaign's promoters ranked by deposit volume for the overview filters. */
    async fetchCampaignTopPromoters(campaignId: string, limit = 7) {
      state.fetchingCampaignTopPromoters.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignTopPromoters>>(endpoints.TOP_PROMOTERS, {
          method: "GET",
          query: {
            ...buildOverviewQuery(state.overviewFilters.value),
            campaignId,
            limit,
          },
        })
        .then((response) => {
          state.campaignTopPromoters.value = response.data ?? null;
          return state.campaignTopPromoters.value;
        })
        .catch((error) => {
          handleApiError(error, "Top promoters fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignTopPromoters.value = false;
        });
    },

    /**
     * Fetches the verification vs trade chart series for the campaign, using
     * the stored chart period and the overview country filter.
     */
    async fetchCampaignVerificationSeries(campaignId: string) {
      state.fetchingCampaignVerificationSeries.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignVerificationSeries>>(
          endpoints.VERIFICATION_SERIES,
          {
            method: "GET",
            query: {
              period: state.campaignSeriesPeriod.value,
              campaignId,
              countryCode: state.overviewFilters.value.countryCode || undefined,
            },
          },
        )
        .then((response) => {
          state.campaignVerificationSeries.value = response.data ?? null;
          return state.campaignVerificationSeries.value;
        })
        .catch((error) => {
          handleApiError(error, "Performance chart fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignVerificationSeries.value = false;
        });
    },

    /** Changes the chart period and reloads the verification vs trade series. */
    async setCampaignSeriesPeriod(
      campaignId: string,
      period: CampaignSeriesPeriod,
    ) {
      state.campaignSeriesPeriod.value = period;
      return actions.fetchCampaignVerificationSeries(campaignId);
    },

    /** Fetches the countries that have audiences in this campaign, for the country filter. */
    async fetchCampaignCountries(campaignId: string) {
      state.fetchingCampaignCountries.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignCountriesResponse>>(endpoints.COUNTRIES, {
          method: "GET",
          query: { campaignId },
        })
        .then((response) => {
          state.campaignCountries.value = response.data?.countries ?? [];
          return state.campaignCountries.value;
        })
        .catch((error) => {
          handleApiError(error, "Country list fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignCountries.value = false;
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
        ids: campaignIds,
      };

      return useApiClientHandler()
        .$apiClient<IResponse<IBatchDeleteCampaignsResponse>>(
          endpoints.BATCH_DELETE,
          { method: "POST", body: payload },
        )
        .then((response) => {
          const deletedCount = response.data?.deletedCount ?? campaignIds.length;
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
     * Fetches one page of promoters assigned to a campaign for the campaign
     * detail table. Kept separate from `usePromotersStore` so the campaign
     * table's page/search state doesn't clash with the promoters list.
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
            perPage: state.campaignPromotersPerPage.value,
            campaignId,
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
            response.meta?.currentPage ?? page;
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
            perPage: state.campaignAudiencesPerPage.value,
            campaignId,
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
            response.meta?.currentPage ?? page;
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

    /**
     * Clears campaign-scoped tables and analytics between campaigns, and
     * resets the overview filters to the default "Last 30 days".
     */
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
      state.overviewFilters.value = { timeframe: "last_30_days" };
      state.campaignOverview.value = null;
      state.campaignTopPromoters.value = null;
      state.campaignSeriesPeriod.value = "7d";
      state.campaignVerificationSeries.value = null;
      state.campaignCountries.value = [];
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
