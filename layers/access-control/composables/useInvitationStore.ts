import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Admin who sent an invitation. */
export interface IInvitationSender {
  id: string;
  name: string;
  email: string;
}

/** One team invitation (UserInvitationResource). */
export interface IInvitation extends ITableBodyData {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  invited_by?: IInvitationSender | null;
  expires_at?: string | null;
  created_at?: string;
}

/** Payload for sending a team invitation (§13.2). */
export interface ISendInvitationPayload {
  email: string;
  role: string;
  permissions?: string[];
}

/** Pagination meta returned with the invitations list. */
export interface IInvitationPaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page?: number;
}

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the dashboard layout already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Provides team invitation API state and actions (§13). */
export const useInvitationStore = () => {
  const endpoints = {
    INVITATIONS: "/admin/invitations",
    INVITATION: (id: string) => `/admin/invitations/${id}`,
    INVITATION_RESEND: (id: string) => `/admin/invitations/${id}/resend`,
  };

  const state = {
    fetchingInvitations: useState<boolean>(
      "useInvitationStore.fetchingInvitations",
      () => false,
    ),
    sendingInvitation: useState<boolean>(
      "useInvitationStore.sendingInvitation",
      () => false,
    ),
    /** Id of the invitation currently being resent, for a per-row spinner. */
    resendingInvitationId: useState<string | null>(
      "useInvitationStore.resendingInvitationId",
      () => null,
    ),
    revokingInvitation: useState<boolean>(
      "useInvitationStore.revokingInvitation",
      () => false,
    ),
    invitations: useState<IInvitation[]>(
      "useInvitationStore.invitations",
      () => [],
    ),
    invitationsPage: useState<number>(
      "useInvitationStore.invitationsPage",
      () => 1,
    ),
    invitationsPerPage: useState<number>(
      "useInvitationStore.invitationsPerPage",
      () => 15,
    ),
    invitationsLastPage: useState<number>(
      "useInvitationStore.invitationsLastPage",
      () => 1,
    ),
    invitationsTotal: useState<number>(
      "useInvitationStore.invitationsTotal",
      () => 0,
    ),
    invitationsSearch: useState<string>(
      "useInvitationStore.invitationsSearch",
      () => "",
    ),
    /** Role name filter; an empty string means all roles. */
    invitationsRole: useState<string>(
      "useInvitationStore.invitationsRole",
      () => "",
    ),
  };

  /** Derives the last page from list meta, falling back to total / per_page. */
  const resolveLastPage = (
    meta: IInvitationPaginationMeta | undefined,
  ): number => {
    if (!meta) return 1;
    if (meta.last_page) return Math.max(1, meta.last_page);
    return Math.max(1, Math.ceil((meta.total ?? 0) / (meta.per_page || 1)));
  };

  const actions = {
    /**
     * Fetches one page of invitations using the stored search and role filter.
     * When a page beyond the first comes back empty or fails, the page state
     * rolls back to the last valid page.
     */
    async fetchInvitations(page: number = state.invitationsPage.value) {
      const previousPage = state.invitationsPage.value;
      state.invitationsPage.value = page;
      state.fetchingInvitations.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IInvitation[], any, IInvitationPaginationMeta>>(
          endpoints.INVITATIONS,
          {
            method: "GET",
            query: {
              page,
              per_page: state.invitationsPerPage.value,
              search: state.invitationsSearch.value || undefined,
              role: state.invitationsRole.value || undefined,
            },
          },
        )
        .then((response) => {
          const invitations = response.data ?? [];
          if (page > 1 && invitations.length === 0) {
            state.invitationsPage.value = previousPage;
            return state.invitations.value;
          }

          state.invitations.value = invitations;
          state.invitationsTotal.value = response.meta?.total ?? invitations.length;
          state.invitationsLastPage.value = resolveLastPage(response.meta);
          state.invitationsPage.value = response.meta?.current_page ?? page;
          return invitations;
        })
        .catch((error) => {
          state.invitationsPage.value = previousPage;
          handleApiError(error, "Invitations fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingInvitations.value = false;
        });
    },

    /** Applies an email search term, resets to page 1 and refetches. */
    async setInvitationsSearch(search: string) {
      state.invitationsSearch.value = search.trim();
      return actions.fetchInvitations(1);
    },

    /** Applies a role filter ("" for all roles), resets to page 1 and refetches. */
    async setInvitationsRole(role: string) {
      state.invitationsRole.value = role;
      return actions.fetchInvitations(1);
    },

    /** Sends a team invitation, then reloads the first page of invitations. */
    async sendInvitation(payload: ISendInvitationPayload) {
      state.sendingInvitation.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IInvitation>>(endpoints.INVITATIONS, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            response.message || `An invitation was sent to ${payload.email}.`,
            "success",
            "Invitation sent",
            "large",
          );
          void actions.fetchInvitations(1).catch(() => undefined);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Invitation failed");
          throw error;
        })
        .finally(() => {
          state.sendingInvitation.value = false;
        });
    },

    /** Re-sends an invitation email and merges the refreshed expiry into the row. */
    async resendInvitation(id: string) {
      state.resendingInvitationId.value = id;

      return useApiClientHandler()
        .$apiClient<IResponse<IInvitation | null>>(
          endpoints.INVITATION_RESEND(id),
          { method: "POST" },
        )
        .then((response) => {
          if (response.data) {
            state.invitations.value = state.invitations.value.map((invitation) =>
              invitation.id === id ? { ...invitation, ...response.data } : invitation,
            );
          } else {
            void actions.fetchInvitations().catch(() => undefined);
          }
          useToastHandler().triggerToast(
            response.message || "Invitation resent successfully",
            "success",
            "Invitation resent",
            "large",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Invitation resend failed");
          throw error;
        })
        .finally(() => {
          state.resendingInvitationId.value = null;
        });
    },

    /**
     * Cancels an invitation. If it was the only row on a later page, steps back
     * one page before refreshing so the list doesn't land on an empty page.
     */
    async revokeInvitation(id: string) {
      state.revokingInvitation.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<null>>(endpoints.INVITATION(id), {
          method: "DELETE",
        })
        .then((response) => {
          const page =
            state.invitations.value.length === 1 && state.invitationsPage.value > 1
              ? state.invitationsPage.value - 1
              : state.invitationsPage.value;
          useToastHandler().triggerToast(
            response.message || "Invitation cancelled and deleted successfully",
            "success",
            "Invitation revoked",
            "large",
          );
          void actions.fetchInvitations(page).catch(() => undefined);
          return true;
        })
        .catch((error) => {
          handleApiError(error, "Invitation revoke failed");
          throw error;
        })
        .finally(() => {
          state.revokingInvitation.value = false;
        });
    },
  };

  return {
    ...state,
    ...actions,
  };
};
