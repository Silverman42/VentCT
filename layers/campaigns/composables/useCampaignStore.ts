import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

/** Lifecycle status of a campaign returned by the API. */
export type CampaignApiStatus = "pending" | "running" | "closed";

/** Campaign record returned by the campaigns list endpoint. */
export interface ICampaign {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: CampaignApiStatus;
  target: number;
  start_date?: string;
  end_date?: string;
  banner_url?: string | null;
  promoters_count?: number;
  audiences_count?: number;
  created_at?: string;
  updated_at?: string;
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

/** Provides campaign API state and actions. Currently limited to selector options. */
export const useCampaignStore = () => {
  const endpoints = {
    CAMPAIGNS: "/admin/campaigns",
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
  };

  return {
    ...state,
    ...actions,
  };
};
