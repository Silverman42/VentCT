import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Destination behaviour encoded by a deep link. */
export type DeepLinkType = "referral" | "route" | "link";

/** Type values accepted by the deep-links list filter. */
export type DeepLinkTypeFilter = DeepLinkType | "all";

/** Identifies whether a deep link currently redirects visitors. */
export type DeepLinkStatus = "active" | "inactive";

/** Status values accepted by the deep-links list filter. */
export type DeepLinkStatusFilter = DeepLinkStatus | "all";

/** Fallback labels for each deep-link type when the API omits `type_label`. */
export const DEEP_LINK_TYPE_LABELS: Record<DeepLinkType, string> = {
  referral: "Referral",
  route: "Route",
  link: "Link",
};

/** Fallback labels for each deep-link status when the API omits `status_label`. */
export const DEEP_LINK_STATUS_LABELS: Record<DeepLinkStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

/** User who created a deep link. */
export interface IDeepLinkCreator {
  id: string;
  name: string;
  email: string;
}

/** One deep link as returned by the list endpoint (DeepLinkResource). */
export interface IDeepLink extends ITableBodyData {
  id: string;
  name: string;
  type: DeepLinkType;
  type_label?: string;
  /** Always `branch`. */
  provider?: string;
  target: string;
  referral_code?: string | null;
  /** Generated short link that visitors open. */
  link_url?: string | null;
  preview_title?: string | null;
  preview_description?: string | null;
  preview_image_url?: string | null;
  clicks_count?: number;
  status: DeepLinkStatus;
  status_label?: string;
  created_at?: string;
}

/** Deep link returned by the details endpoint (DeepLinkDetailResource). */
export interface IDeepLinkDetails extends IDeepLink {
  creator?: IDeepLinkCreator | null;
  updated_at?: string;
}

/** Deep-link counts shown in the list summary cards. */
export interface IDeepLinkSummary {
  total_links: number;
  active_links: number;
  inactive_links: number;
  total_clicks: number;
}

/** Response data of the deep-links list endpoint. */
export interface IDeepLinkListResponse {
  summary: IDeepLinkSummary;
  deep_links: IDeepLink[];
}

/** Payload for creating a deep link. */
export interface ICreateDeepLinkPayload {
  name: string;
  type: DeepLinkType;
  target: string;
  referral_code?: string;
  preview_title?: string;
  preview_description?: string;
  preview_image_url?: string;
  status?: DeepLinkStatus;
}

/**
 * Payload for updating a deep link; every field is optional and optional
 * text fields accept null to clear them.
 */
export type IUpdateDeepLinkPayload = {
  [K in keyof ICreateDeepLinkPayload]?: ICreateDeepLinkPayload[K] | null;
};

/** Response data of the toggle-status endpoint. */
export interface IDeepLinkToggleResponse {
  id: string;
  status: DeepLinkStatus;
  status_label?: string;
}

/** Pagination meta returned with the deep-links list. */
export interface IDeepLinkPaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page?: number;
}

/** Returns true when an API error is a 404 Not Found. */
const isNotFoundError = (error: unknown): boolean =>
  (error as { statusCode?: number })?.statusCode === 404;

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the session middleware already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Provides deep-link API state and actions for the deep-links layer. */
export const useDeepLinkStore = () => {
  const endpoints = {
    DEEP_LINKS: "/admin/deep-links",
    DEEP_LINK: (id: string) => `/admin/deep-links/${id}`,
    DEEP_LINK_TOGGLE: (id: string) => `/admin/deep-links/${id}/toggle-status`,
  };

  const state = {
    fetchingDeepLinks: useState<boolean>(
      "useDeepLinkStore.fetchingDeepLinks",
      () => false,
    ),
    fetchingDeepLinkDetails: useState<boolean>(
      "useDeepLinkStore.fetchingDeepLinkDetails",
      () => false,
    ),
    creatingDeepLink: useState<boolean>(
      "useDeepLinkStore.creatingDeepLink",
      () => false,
    ),
    updatingDeepLink: useState<boolean>(
      "useDeepLinkStore.updatingDeepLink",
      () => false,
    ),
    togglingDeepLinkStatus: useState<boolean>(
      "useDeepLinkStore.togglingDeepLinkStatus",
      () => false,
    ),
    deletingDeepLink: useState<boolean>(
      "useDeepLinkStore.deletingDeepLink",
      () => false,
    ),
    deepLinks: useState<IDeepLink[]>("useDeepLinkStore.deepLinks", () => []),
    deepLinkSummary: useState<IDeepLinkSummary | null>(
      "useDeepLinkStore.deepLinkSummary",
      () => null,
    ),
    selectedDeepLink: useState<IDeepLinkDetails | null>(
      "useDeepLinkStore.selectedDeepLink",
      () => null,
    ),
    deepLinksPage: useState<number>("useDeepLinkStore.deepLinksPage", () => 1),
    deepLinksPerPage: useState<number>(
      "useDeepLinkStore.deepLinksPerPage",
      () => 15,
    ),
    deepLinksLastPage: useState<number>(
      "useDeepLinkStore.deepLinksLastPage",
      () => 1,
    ),
    deepLinksTotal: useState<number>("useDeepLinkStore.deepLinksTotal", () => 0),
    deepLinksSearch: useState<string>(
      "useDeepLinkStore.deepLinksSearch",
      () => "",
    ),
    deepLinksType: useState<DeepLinkTypeFilter>(
      "useDeepLinkStore.deepLinksType",
      () => "all",
    ),
    deepLinksStatus: useState<DeepLinkStatusFilter>(
      "useDeepLinkStore.deepLinksStatus",
      () => "all",
    ),
  };

  const getters = {
    /** Summary card values with zero fallbacks. */
    deepLinkStats: computed(() => ({
      total: state.deepLinkSummary.value?.total_links ?? 0,
      active: state.deepLinkSummary.value?.active_links ?? 0,
      inactive: state.deepLinkSummary.value?.inactive_links ?? 0,
      clicks: state.deepLinkSummary.value?.total_clicks ?? 0,
    })),
  };

  /** Derives the last page from list meta, falling back to total / per_page. */
  const resolveLastPage = (
    meta: IDeepLinkPaginationMeta | undefined,
  ): number => {
    if (!meta) return 1;
    if (meta.last_page) return Math.max(1, meta.last_page);
    return Math.max(1, Math.ceil((meta.total ?? 0) / (meta.per_page || 1)));
  };

  /** Merges updated fields into the matching list row and selected record. */
  const mergeDeepLink = (id: string, changes: Partial<IDeepLink>): void => {
    state.deepLinks.value = state.deepLinks.value.map((deepLink) =>
      deepLink.id === id ? { ...deepLink, ...changes } : deepLink,
    );
    if (state.selectedDeepLink.value?.id === id) {
      state.selectedDeepLink.value = {
        ...state.selectedDeepLink.value,
        ...changes,
      };
    }
  };

  /** Shifts one link between the active and inactive summary counts. */
  const shiftSummaryStatus = (status: DeepLinkStatus): void => {
    const summary = state.deepLinkSummary.value;
    if (!summary) return;
    const delta = status === "active" ? 1 : -1;
    state.deepLinkSummary.value = {
      ...summary,
      active_links: Math.max(0, summary.active_links + delta),
      inactive_links: Math.max(0, summary.inactive_links - delta),
    };
  };

  const actions = {
    /**
     * Fetches one page of deep links using the stored search/type/status
     * filters. When a page beyond the first comes back empty or fails, the
     * page state rolls back to the last valid page.
     */
    async fetchDeepLinks(page: number = state.deepLinksPage.value) {
      const previousPage = state.deepLinksPage.value;
      state.deepLinksPage.value = page;
      state.fetchingDeepLinks.value = true;

      return useApiClientHandler()
        .$apiClient<
          IResponse<IDeepLinkListResponse, any, IDeepLinkPaginationMeta>
        >(endpoints.DEEP_LINKS, {
          method: "GET",
          query: {
            page,
            per_page: state.deepLinksPerPage.value,
            search: state.deepLinksSearch.value || undefined,
            type:
              state.deepLinksType.value === "all"
                ? undefined
                : state.deepLinksType.value,
            status:
              state.deepLinksStatus.value === "all"
                ? undefined
                : state.deepLinksStatus.value,
          },
        })
        .then((response) => {
          const deepLinks = response.data?.deep_links ?? [];
          if (page > 1 && deepLinks.length === 0) {
            state.deepLinksPage.value = previousPage;
            return state.deepLinks.value;
          }

          state.deepLinks.value = deepLinks;
          state.deepLinkSummary.value = response.data?.summary ?? null;
          state.deepLinksTotal.value = response.meta?.total ?? deepLinks.length;
          state.deepLinksLastPage.value = resolveLastPage(response.meta);
          state.deepLinksPage.value = response.meta?.current_page ?? page;
          return deepLinks;
        })
        .catch((error) => {
          state.deepLinksPage.value = previousPage;
          handleApiError(error, "Deep link fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingDeepLinks.value = false;
        });
    },

    /** Applies a search term, resets to page 1, and refetches deep links. */
    async setDeepLinksSearch(search: string) {
      state.deepLinksSearch.value = search.trim();
      return actions.fetchDeepLinks(1);
    },

    /** Applies a type filter, resets to page 1, and refetches deep links. */
    async setDeepLinksType(type: DeepLinkTypeFilter) {
      state.deepLinksType.value = type;
      return actions.fetchDeepLinks(1);
    },

    /** Applies a status filter, resets to page 1, and refetches deep links. */
    async setDeepLinksStatus(status: DeepLinkStatusFilter) {
      state.deepLinksStatus.value = status;
      return actions.fetchDeepLinks(1);
    },

    /**
     * Loads one deep link into `selectedDeepLink`. Resolves to null without a
     * toast when the link does not exist (404); other failures are rethrown.
     */
    async fetchDeepLinkDetails(id: string) {
      state.fetchingDeepLinkDetails.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IDeepLinkDetails>>(endpoints.DEEP_LINK(id), {
          method: "GET",
        })
        .then((response) => {
          state.selectedDeepLink.value = response.data ?? null;
          return state.selectedDeepLink.value;
        })
        .catch((error) => {
          state.selectedDeepLink.value = null;
          if (isNotFoundError(error)) return null;
          handleApiError(error, "Deep link detail fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingDeepLinkDetails.value = false;
        });
    },

    /** Creates a deep link, then reloads the first page of the list. */
    async createDeepLink(payload: ICreateDeepLinkPayload) {
      state.creatingDeepLink.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IDeepLink>>(endpoints.DEEP_LINKS, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            `${payload.name} is ready to share.`,
            "success",
            "Deep link created",
            "large",
          );
          void actions.fetchDeepLinks(1).catch(() => undefined);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Deep link creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingDeepLink.value = false;
        });
    },

    /** Updates a deep link and merges the returned resource into state. */
    async updateDeepLink(id: string, payload: IUpdateDeepLinkPayload) {
      state.updatingDeepLink.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IDeepLink>>(endpoints.DEEP_LINK(id), {
          method: "PUT",
          body: payload,
        })
        .then((response) => {
          const previousStatus = state.deepLinks.value.find(
            (deepLink) => deepLink.id === id,
          )?.status;
          const changes = {
            ...payload,
            ...(response.data ?? {}),
          } as Partial<IDeepLink>;
          mergeDeepLink(id, changes);
          if (changes.status && previousStatus && changes.status !== previousStatus) {
            shiftSummaryStatus(changes.status);
          }
          useToastHandler().triggerToast(
            "Deep link changes have been saved.",
            "success",
            "Deep link updated",
            "large",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Deep link update failed");
          throw error;
        })
        .finally(() => {
          state.updatingDeepLink.value = false;
        });
    },

    /** Flips a deep link between active and inactive and stores the new status. */
    async toggleDeepLinkStatus(id: string) {
      state.togglingDeepLinkStatus.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IDeepLinkToggleResponse>>(
          endpoints.DEEP_LINK_TOGGLE(id),
          { method: "PATCH" },
        )
        .then((response) => {
          const status = response.data?.status;
          if (status) {
            mergeDeepLink(id, {
              status,
              status_label:
                response.data?.status_label ?? DEEP_LINK_STATUS_LABELS[status],
            });
            shiftSummaryStatus(status);
          }
          useToastHandler().triggerToast(
            response.message ||
              (status === "inactive"
                ? "The deep link has been deactivated."
                : "The deep link is active again."),
            "success",
            "Deep link status updated",
            "large",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Deep link status update failed");
          throw error;
        })
        .finally(() => {
          state.togglingDeepLinkStatus.value = false;
        });
    },

    /**
     * Deletes a deep link, then reloads the current page so the list and
     * summary counts stay accurate (falling back a page if it empties).
     */
    async deleteDeepLink(id: string) {
      state.deletingDeepLink.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<null>>(endpoints.DEEP_LINK(id), {
          method: "DELETE",
        })
        .then(() => {
          const isLastRowOnPage = state.deepLinks.value.length <= 1;
          state.deepLinks.value = state.deepLinks.value.filter(
            (deepLink) => deepLink.id !== id,
          );
          if (state.selectedDeepLink.value?.id === id) {
            state.selectedDeepLink.value = null;
          }
          const page =
            isLastRowOnPage && state.deepLinksPage.value > 1
              ? state.deepLinksPage.value - 1
              : state.deepLinksPage.value;
          void actions.fetchDeepLinks(page).catch(() => undefined);
          useToastHandler().triggerToast(
            "The deep link has been deleted.",
            "success",
            "Deep link deleted",
            "large",
          );
          return true;
        })
        .catch((error) => {
          handleApiError(error, "Deep link deletion failed");
          throw error;
        })
        .finally(() => {
          state.deletingDeepLink.value = false;
        });
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
