import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type {
  AnalyticsSeriesUnit,
  AnalyticsTimeframe,
} from "~/utils/helpers/AnalyticsFormatters";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

/** Reporting window accepted by the dashboard analytics endpoints. */
export type DashboardTimeframe = AnalyticsTimeframe;

/** Rolling chart window accepted by the dashboard series endpoints. */
export type DashboardSeriesPeriod = "1d" | "1w" | "2w" | "1m" | "90d" | "12m";

/** Bucket size returned with a chart series. */
export type DashboardSeriesUnit = AnalyticsSeriesUnit;

/** Campaign lifecycle status reported by the analytics endpoints. */
export type DashboardCampaignStatus = "running" | "pending" | "closed";

/** Filters shared by the overview, top promoters and chart requests. */
export interface IDashboardFilters {
  timeframe: DashboardTimeframe;
  /** `yyyy-MM-dd`; only sent when `timeframe` is `custom`. */
  startDate?: string;
  /** `yyyy-MM-dd`; only sent when `timeframe` is `custom`. */
  endDate?: string;
  /** Two-letter ISO country code, or empty for all countries. */
  countryCode?: string;
}

/** Response data of `GET /admin/dashboard/overview`. */
export interface IDashboardOverview {
  timeframe: DashboardTimeframe;
  campaigns: { total: number; running: number; pending: number; closed: number };
  promoters: { total: number };
  audiences: {
    total: number;
    verified: number;
    transacted: number;
    unverified: number;
  };
  attendances: { total: number; attended: number; notAttended: number };
  events: {
    total: number;
    running: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  deepLinks: { total: number; active: number; totalClicks: number };
  volumes: {
    tradingVolume: number;
    easypayVolume: number;
    safewalletVolume: number;
    transactionCount: number;
  };
}

/** One step of the registration → verification → trade funnel. */
export interface IFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

/** Response data of `GET /admin/dashboard/conversion-funnel`. */
export interface IConversionFunnel {
  timeframe: DashboardTimeframe;
  registeredCount: number;
  verifiedCount: number;
  transactedCount: number;
  verificationRate: number;
  transactionRateFromVerified: number;
  overallConversionRate: number;
  stages: IFunnelStage[];
}

/** One campaign row from `GET /admin/dashboard/campaign-performance`. */
export interface ICampaignPerformance {
  id: string;
  name: string;
  status: DashboardCampaignStatus;
  target: number;
  promotersCount: number;
  registeredCount: number;
  verifiedCount: number;
  transactedCount: number;
  targetAchievementRate: number;
  conversionRate: number;
}

/** Response data of `GET /admin/dashboard/campaign-performance`. */
export interface ICampaignPerformanceResponse {
  campaigns: ICampaignPerformance[];
}

/** One promoter row from `GET /admin/dashboard/promoter-leaderboard`. */
export interface IPromoterLeaderboardEntry {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  campaignId: string | null;
  campaignName: string | null;
  registeredCount: number;
  verifiedCount: number;
  transactedCount: number;
  conversionRate: number;
}

/** Response data of `GET /admin/dashboard/promoter-leaderboard`. */
export interface IPromoterLeaderboardResponse {
  leaderboard: IPromoterLeaderboardEntry[];
}

/** Volume (USD) and row count for one ledger slice. */
export interface IVolumeCount {
  volume: number;
  count: number;
}

/** Response data of `GET /admin/dashboard/transaction-metrics`. */
export interface ITransactionMetrics {
  transactions: IVolumeCount & {
    easypay: IVolumeCount;
    safewallet: IVolumeCount & { cash: IVolumeCount; crypto: IVolumeCount };
  };
  deposits: IVolumeCount;
  withdrawals: IVolumeCount & { cash: IVolumeCount; crypto: IVolumeCount };
  utility: IVolumeCount & { airtime: IVolumeCount; data: IVolumeCount };
  lastTransactionAt: string | null;
}

/** One promoter's share of deposit volume. */
export interface ITopPromoter {
  id: string;
  name: string;
  volume: number;
  share: number;
}

/** Response data of `GET /admin/dashboard/top-promoters`. */
export interface ITopPromotersByVolume {
  totalVolume: number;
  unattributedVolume: number;
  promoters: ITopPromoter[];
}

/** One bucket of the verification vs trade chart. */
export interface IVerificationTradePoint {
  bucket: string;
  verifiedUsers: number;
  tradedUsers: number;
}

/** Response data of `GET /admin/dashboard/verification-trade-series`. */
export interface IVerificationTradeSeries {
  period: DashboardSeriesPeriod;
  unit: DashboardSeriesUnit;
  series: IVerificationTradePoint[];
}

/** One bucket of the transaction volume chart. */
export interface ITransactionVolumePoint {
  bucket: string;
  volume: number;
  count: number;
}

/** Response data of `GET /admin/dashboard/transaction-volume-series`. */
export interface ITransactionVolumeSeries {
  period: DashboardSeriesPeriod;
  unit: DashboardSeriesUnit;
  series: ITransactionVolumePoint[];
}

/** A country with registered audiences, used by the country filter. */
export interface IAudienceCountry {
  code: string;
  name: string;
  audienceCount: number;
}

/** Response data of `GET /admin/dashboard/countries`. */
export interface IAudienceCountriesResponse {
  countries: IAudienceCountry[];
}

/** Request body of `POST /admin/dashboard/send-digest`. */
export interface ISendDigestPayload {
  /** Optional recipient; the backend falls back to super-admins when omitted. */
  email?: string;
}

/** Active campaign summary included in the weekly digest. */
export interface IDigestCampaign {
  id: string;
  name: string;
  target: number;
  registeredCount: number;
  verifiedCount: number;
  transactedCount: number;
  progressPercentage: number;
}

/** Response data of `POST /admin/dashboard/send-digest`. */
export interface IDigestReport {
  period: { start: string; end: string };
  metrics: {
    leadsRegistered: number;
    leadsVerified: number;
    leadsTransacted: number;
    eventAttendees: number;
  };
  funnel: {
    verificationRatePercent: number;
    transactionRatePercent: number;
    overallConversionPercent: number;
  };
  topPromoters: IPromoterLeaderboardEntry[];
  activeCampaigns: IDigestCampaign[];
  recipientsCount: number;
}

/** Query-string values the dashboard endpoints accept. */
type DashboardQuery = Record<string, string | number>;

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the session middleware already redirects to the login page.
 * 500s are not escalated to the full-page error, so one failing widget shows
 * its own error state instead of taking down the whole dashboard.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading, {
    triggeredErrorCodes: [401],
  });
};

/**
 * Turns dashboard filters into query parameters, dropping empty values and
 * sending the date range only for a custom timeframe. `countryCode` is only
 * added for endpoints that accept it (§11.5–11.8).
 */
const buildFilterQuery = (
  filters: IDashboardFilters,
  includeCountry = true,
): DashboardQuery => {
  const query: DashboardQuery = { timeframe: filters.timeframe };

  if (filters.timeframe === "custom" && filters.startDate && filters.endDate) {
    query.startDate = filters.startDate;
    query.endDate = filters.endDate;
  }
  if (includeCountry && filters.countryCode) query.countryCode = filters.countryCode;

  return query;
};

/** Provides dashboard analytics and digest API state and actions. */
export const useDashboardStore = () => {
  const endpoints = {
    OVERVIEW: "/admin/dashboard/overview",
    CONVERSION_FUNNEL: "/admin/dashboard/conversion-funnel",
    CAMPAIGN_PERFORMANCE: "/admin/dashboard/campaign-performance",
    PROMOTER_LEADERBOARD: "/admin/dashboard/promoter-leaderboard",
    TRANSACTION_METRICS: "/admin/dashboard/transaction-metrics",
    TOP_PROMOTERS: "/admin/dashboard/top-promoters",
    VERIFICATION_TRADE_SERIES: "/admin/dashboard/verification-trade-series",
    TRANSACTION_VOLUME_SERIES: "/admin/dashboard/transaction-volume-series",
    SEND_DIGEST: "/admin/dashboard/send-digest",
    COUNTRIES: "/admin/dashboard/countries",
  };

  const state = {
    filters: useState<IDashboardFilters>("useDashboardStore.filters", () => ({
      timeframe: "all_time",
    })),
    verificationPeriod: useState<DashboardSeriesPeriod>(
      "useDashboardStore.verificationPeriod",
      () => "1w",
    ),
    volumePeriod: useState<DashboardSeriesPeriod>(
      "useDashboardStore.volumePeriod",
      () => "1w",
    ),

    fetchingOverview: useState<boolean>(
      "useDashboardStore.fetchingOverview",
      () => false,
    ),
    fetchingConversionFunnel: useState<boolean>(
      "useDashboardStore.fetchingConversionFunnel",
      () => false,
    ),
    fetchingCampaignPerformance: useState<boolean>(
      "useDashboardStore.fetchingCampaignPerformance",
      () => false,
    ),
    fetchingPromoterLeaderboard: useState<boolean>(
      "useDashboardStore.fetchingPromoterLeaderboard",
      () => false,
    ),
    fetchingTransactionMetrics: useState<boolean>(
      "useDashboardStore.fetchingTransactionMetrics",
      () => false,
    ),
    fetchingTopPromoters: useState<boolean>(
      "useDashboardStore.fetchingTopPromoters",
      () => false,
    ),
    fetchingVerificationSeries: useState<boolean>(
      "useDashboardStore.fetchingVerificationSeries",
      () => false,
    ),
    fetchingVolumeSeries: useState<boolean>(
      "useDashboardStore.fetchingVolumeSeries",
      () => false,
    ),
    fetchingCountries: useState<boolean>(
      "useDashboardStore.fetchingCountries",
      () => false,
    ),
    sendingDigest: useState<boolean>(
      "useDashboardStore.sendingDigest",
      () => false,
    ),

    overview: useState<IDashboardOverview | null>(
      "useDashboardStore.overview",
      () => null,
    ),
    conversionFunnel: useState<IConversionFunnel | null>(
      "useDashboardStore.conversionFunnel",
      () => null,
    ),
    campaignPerformance: useState<ICampaignPerformance[] | null>(
      "useDashboardStore.campaignPerformance",
      () => null,
    ),
    promoterLeaderboard: useState<IPromoterLeaderboardEntry[] | null>(
      "useDashboardStore.promoterLeaderboard",
      () => null,
    ),
    transactionMetrics: useState<ITransactionMetrics | null>(
      "useDashboardStore.transactionMetrics",
      () => null,
    ),
    topPromoters: useState<ITopPromotersByVolume | null>(
      "useDashboardStore.topPromoters",
      () => null,
    ),
    verificationSeries: useState<IVerificationTradeSeries | null>(
      "useDashboardStore.verificationSeries",
      () => null,
    ),
    volumeSeries: useState<ITransactionVolumeSeries | null>(
      "useDashboardStore.volumeSeries",
      () => null,
    ),
    countries: useState<IAudienceCountry[]>(
      "useDashboardStore.countries",
      () => [],
    ),
    lastDigest: useState<IDigestReport | null>(
      "useDashboardStore.lastDigest",
      () => null,
    ),
  };

  const { can } = useAuthStore();

  const getters = {
    /** Whether the user may load the basic (overview, volume) analytics. */
    canViewBasic: computed<boolean>(() => can("dashboard.basic.view")),
    /** Whether the user may load the funnel, leaderboard, campaign table and digest. */
    canViewAdvanced: computed<boolean>(() => can("dashboard.advanced.view")),
  };

  const actions = {
    /** Merges new filter values; switching away from `custom` clears the dates. */
    setFilters(partial: Partial<IDashboardFilters>) {
      const next = { ...state.filters.value, ...partial };
      if (next.timeframe !== "custom") {
        delete next.startDate;
        delete next.endDate;
      }
      state.filters.value = next;
      return next;
    },

    /** Fetches entity counts and trading volumes for the active filters. */
    async fetchOverview() {
      state.fetchingOverview.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IDashboardOverview>>(endpoints.OVERVIEW, {
          method: "GET",
          query: buildFilterQuery(state.filters.value, false),
        })
        .then((response) => {
          state.overview.value = response.data ?? null;
          return state.overview.value;
        })
        .catch((error) => {
          handleApiError(error, "Dashboard overview fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingOverview.value = false;
        });
    },

    /** Fetches the registration → verification → trade funnel for the active timeframe. */
    async fetchConversionFunnel() {
      state.fetchingConversionFunnel.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IConversionFunnel>>(endpoints.CONVERSION_FUNNEL, {
          method: "GET",
          query: buildFilterQuery(state.filters.value, false),
        })
        .then((response) => {
          state.conversionFunnel.value = response.data ?? null;
          return state.conversionFunnel.value;
        })
        .catch((error) => {
          handleApiError(error, "Conversion funnel fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingConversionFunnel.value = false;
        });
    },

    /** Fetches per-campaign target and conversion performance. */
    async fetchCampaignPerformance() {
      state.fetchingCampaignPerformance.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ICampaignPerformanceResponse>>(
          endpoints.CAMPAIGN_PERFORMANCE,
          { method: "GET" },
        )
        .then((response) => {
          state.campaignPerformance.value = response.data?.campaigns ?? [];
          return state.campaignPerformance.value;
        })
        .catch((error) => {
          handleApiError(error, "Campaign performance fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCampaignPerformance.value = false;
        });
    },

    /** Fetches the promoters ranked by conversions, optionally for one campaign. */
    async fetchPromoterLeaderboard(limit = 10, campaignId?: string) {
      state.fetchingPromoterLeaderboard.value = true;

      const query: DashboardQuery = { limit };
      if (campaignId) query.campaignId = campaignId;

      return useApiClientHandler()
        .$apiClient<IResponse<IPromoterLeaderboardResponse>>(
          endpoints.PROMOTER_LEADERBOARD,
          { method: "GET", query },
        )
        .then((response) => {
          state.promoterLeaderboard.value = response.data?.leaderboard ?? [];
          return state.promoterLeaderboard.value;
        })
        .catch((error) => {
          handleApiError(error, "Promoter leaderboard fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingPromoterLeaderboard.value = false;
        });
    },

    /** Fetches the deposit, withdrawal and utility breakdown for the active filters. */
    async fetchTransactionMetrics() {
      state.fetchingTransactionMetrics.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ITransactionMetrics>>(
          endpoints.TRANSACTION_METRICS,
          { method: "GET", query: buildFilterQuery(state.filters.value) },
        )
        .then((response) => {
          state.transactionMetrics.value = response.data ?? null;
          return state.transactionMetrics.value;
        })
        .catch((error) => {
          handleApiError(error, "Transaction metrics fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingTransactionMetrics.value = false;
        });
    },

    /** Fetches the promoters with the largest share of deposit volume. */
    async fetchTopPromoters(limit = 5) {
      state.fetchingTopPromoters.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ITopPromotersByVolume>>(endpoints.TOP_PROMOTERS, {
          method: "GET",
          query: { ...buildFilterQuery(state.filters.value), limit },
        })
        .then((response) => {
          state.topPromoters.value = response.data ?? null;
          return state.topPromoters.value;
        })
        .catch((error) => {
          handleApiError(error, "Top promoters fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingTopPromoters.value = false;
        });
    },

    /**
     * Fetches the verified vs traded users series. Passing a period also
     * stores it as the selected chart period.
     */
    async fetchVerificationTradeSeries(period?: DashboardSeriesPeriod) {
      if (period) state.verificationPeriod.value = period;
      state.fetchingVerificationSeries.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IVerificationTradeSeries>>(
          endpoints.VERIFICATION_TRADE_SERIES,
          {
            method: "GET",
            query: {
              ...buildFilterQuery(state.filters.value),
              period: state.verificationPeriod.value,
            },
          },
        )
        .then((response) => {
          state.verificationSeries.value = response.data ?? null;
          return state.verificationSeries.value;
        })
        .catch((error) => {
          handleApiError(error, "Verification series fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingVerificationSeries.value = false;
        });
    },

    /**
     * Fetches the deposit volume and count series. Passing a period also
     * stores it as the selected chart period.
     */
    async fetchTransactionVolumeSeries(period?: DashboardSeriesPeriod) {
      if (period) state.volumePeriod.value = period;
      state.fetchingVolumeSeries.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ITransactionVolumeSeries>>(
          endpoints.TRANSACTION_VOLUME_SERIES,
          {
            method: "GET",
            query: {
              ...buildFilterQuery(state.filters.value),
              period: state.volumePeriod.value,
            },
          },
        )
        .then((response) => {
          state.volumeSeries.value = response.data ?? null;
          return state.volumeSeries.value;
        })
        .catch((error) => {
          handleApiError(error, "Transaction volume series fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingVolumeSeries.value = false;
        });
    },

    /** Fetches the countries that have audiences, busiest first. */
    async fetchCountries() {
      state.fetchingCountries.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IAudienceCountriesResponse>>(endpoints.COUNTRIES, {
          method: "GET",
        })
        .then((response) => {
          state.countries.value = response.data?.countries ?? [];
          return state.countries.value;
        })
        .catch((error) => {
          handleApiError(error, "Country list fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingCountries.value = false;
        });
    },

    /** Generates and emails the weekly performance digest, then shows a success toast. */
    async sendDigest(payload: ISendDigestPayload) {
      state.sendingDigest.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IDigestReport>>(endpoints.SEND_DIGEST, {
          method: "POST",
          body: payload.email ? { email: payload.email } : {},
        })
        .then((response) => {
          state.lastDigest.value = response.data ?? null;
          useToastHandler().triggerToast(
            response.message || "Weekly performance digest sent",
            "success",
            "Digest Sent",
          );
          return state.lastDigest.value;
        })
        .catch((error) => {
          handleApiError(error, "Digest dispatch failed");
          throw error;
        })
        .finally(() => {
          state.sendingDigest.value = false;
        });
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
