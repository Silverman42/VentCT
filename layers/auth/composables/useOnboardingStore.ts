import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";
import type { IAuthUser } from "./useAuthStore";

export interface IInvitation {
  email: string;
  role: string;
  expires_at: string;
}

export interface IAcceptInvitationPayload {
  name: string;
  password: string;
  password_confirmation: string;
}

/** The proxy strips `token` and stores it as the session cookie. */
export interface IAcceptInvitationResponse {
  user: IAuthUser;
}

/** Provides invitation lookup and acceptance state for the onboarding flow. */
export const useOnboardingStore = () => {
  const endpoints = {
    INVITATION: (token: string) =>
      `/auth/invitations/${encodeURIComponent(token)}`,
    ACCEPT_INVITATION: (token: string) =>
      `/auth/invitations/${encodeURIComponent(token)}/accept`,
  };

  const states = {
    inviteIsAccpeted: useState<boolean>(
      "useOnboardingStore.invite_accepted",
      () => false,
    ),
    invitation: useState<IInvitation | null>(
      "useOnboardingStore.invitation",
      () => null,
    ),
    invitationError: useState<string | null>(
      "useOnboardingStore.invitationError",
      () => null,
    ),
    fetchingInvitation: useState<boolean>(
      "useOnboardingStore.fetchingInvitation",
      () => false,
    ),
    acceptingInvitation: useState<boolean>(
      "useOnboardingStore.acceptingInvitation",
      () => false,
    ),
  };

  const actions = {
    /** Moves from the invitation summary to the set-password step. */
    acceptInvitation() {
      states.inviteIsAccpeted.value = true;
    },

    /**
     * Validates the invitation token and stores its details.
     * Failures are kept in `invitationError` for the page to render instead of an error page.
     */
    async inspectInvitation(token: string) {
      states.fetchingInvitation.value = true;
      states.invitationError.value = null;

      return useApiClientHandler()
        .$apiClient<IResponse<IInvitation>>(endpoints.INVITATION(token), {
          method: "GET",
        })
        .then((response) => {
          states.invitation.value = response.data;
          return response.data;
        })
        .catch((error) => {
          states.invitation.value = null;
          states.invitationError.value =
            error?.data?.message ||
            "This invitation link is invalid or has expired.";
          ApiErrorHandler(error, false, false, "", { triggeredErrorCodes: [] });
          throw error;
        })
        .finally(() => {
          states.fetchingInvitation.value = false;
        });
    },

    /** Activates the invited account, signs the user in, and opens the dashboard. */
    async completeInvitation(token: string, payload: IAcceptInvitationPayload) {
      states.acceptingInvitation.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IAcceptInvitationResponse>>(
          endpoints.ACCEPT_INVITATION(token),
          { method: "POST", body: payload },
        )
        .then(async (response) => {
          useAuthStore().setUser(response.data?.user ?? null);
          useToastHandler().triggerToast(
            response.message,
            "success",
            "Account Activated",
          );
          await navigateTo("/dashboard");
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Account Activation Failed", {
            triggeredErrorCodes: [500],
          });
          throw error;
        })
        .finally(() => {
          states.acceptingInvitation.value = false;
        });
    },

    /** Clears onboarding state when leaving the flow. */
    resetOnboarding() {
      states.inviteIsAccpeted.value = false;
      states.invitation.value = null;
      states.invitationError.value = null;
    },
  };

  return { ...states, ...actions };
};
