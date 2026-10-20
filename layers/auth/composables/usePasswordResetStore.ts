import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

export enum PassResetSteps {
  REQUEST = "Request",
  CODE_VERIFICATION = "CodeVerification",
  CHANGE_PASSWORD = "ChangePassword",
  SUCCESS = "Success",
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IForgotPasswordResponse {
  email: string;
  expires_in_minutes: number;
}

export interface IVerifyCodePayload {
  email: string;
  code: string;
}

export interface IVerifyCodeResponse {
  email: string;
  reset_token: string;
}

export interface IResetPasswordPayload {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

/** Provides the multi-step forgot-password flow state and its API actions. */
export const usePasswordResetStore = () => {
  const endpoints = {
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_CODE: "/auth/forgot-password/verify-code",
    RESEND_CODE: "/auth/forgot-password/resend",
    RESET_PASSWORD: "/auth/forgot-password/reset",
  };

  const states = {
    resetStep: useState<PassResetSteps>(
      "usePasswordResetStore.resetSteps",
      () => PassResetSteps.REQUEST,
    ),
    email: useState<string>("usePasswordResetStore.email", () => ""),
    code: useState<string>("usePasswordResetStore.code", () => ""),
    resetToken: useState<string>("usePasswordResetStore.resetToken", () => ""),
    expiresInMinutes: useState<number | null>(
      "usePasswordResetStore.expiresInMinutes",
      () => null,
    ),
    requestingCode: useState<boolean>(
      "usePasswordResetStore.requestingCode",
      () => false,
    ),
    verifyingCode: useState<boolean>(
      "usePasswordResetStore.verifyingCode",
      () => false,
    ),
    resendingCode: useState<boolean>(
      "usePasswordResetStore.resendingCode",
      () => false,
    ),
    resettingPassword: useState<boolean>(
      "usePasswordResetStore.resettingPassword",
      () => false,
    ),
  };

  const actions = {
    /** Moves the flow to the given step. */
    changeStep: (step: PassResetSteps) => {
      states.resetStep.value = step;
    },

    /** Stores the email address the reset code is sent to. */
    setEmail: (email: string) => {
      states.email.value = email;
    },

    /** Returns the flow to its first step and clears all collected values. */
    resetActions: () => {
      actions.changeStep(PassResetSteps.REQUEST);
      actions.setEmail("");
      states.code.value = "";
      states.resetToken.value = "";
      states.expiresInMinutes.value = null;
    },

    /** Requests a reset code for the email and advances to code verification. */
    async requestResetCode(email: string) {
      states.requestingCode.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IForgotPasswordResponse>>(
          endpoints.FORGOT_PASSWORD,
          { method: "POST", body: { email } satisfies IForgotPasswordPayload },
        )
        .then((response) => {
          actions.setEmail(response.data?.email ?? email);
          states.expiresInMinutes.value =
            response.data?.expires_in_minutes ?? null;
          useToastHandler().triggerToast(
            response.message,
            "success",
            "Verification Code Sent",
          );
          actions.changeStep(PassResetSteps.CODE_VERIFICATION);
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Request Failed", {
            triggeredErrorCodes: [500],
          });
          throw error;
        })
        .finally(() => {
          states.requestingCode.value = false;
        });
    },

    /** Confirms the emailed code and advances to choosing a new password. */
    async verifyResetCode(code: string) {
      states.verifyingCode.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IVerifyCodeResponse>>(endpoints.VERIFY_CODE, {
          method: "POST",
          body: { email: states.email.value, code } satisfies IVerifyCodePayload,
        })
        .then((response) => {
          states.code.value = code;
          states.resetToken.value = response.data?.reset_token ?? "";
          actions.changeStep(PassResetSteps.CHANGE_PASSWORD);
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Verification Failed", {
            triggeredErrorCodes: [500],
          });
          throw error;
        })
        .finally(() => {
          states.verifyingCode.value = false;
        });
    },

    /** Invalidates the previous code and emails a fresh one. */
    async resendResetCode() {
      states.resendingCode.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IForgotPasswordResponse>>(endpoints.RESEND_CODE, {
          method: "POST",
          body: { email: states.email.value } satisfies IForgotPasswordPayload,
        })
        .then((response) => {
          states.expiresInMinutes.value =
            response.data?.expires_in_minutes ?? null;
          useToastHandler().triggerToast(
            response.message,
            "success",
            "Code Resent",
          );
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Resend Failed", {
            triggeredErrorCodes: [500],
          });
          throw error;
        })
        .finally(() => {
          states.resendingCode.value = false;
        });
    },

    /** Sets the new password using the verified email and code, then shows the success step. */
    async resetPassword(password: string, passwordConfirmation: string) {
      states.resettingPassword.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<null>>(endpoints.RESET_PASSWORD, {
          method: "POST",
          body: {
            email: states.email.value,
            code: states.code.value,
            password,
            password_confirmation: passwordConfirmation,
          } satisfies IResetPasswordPayload,
        })
        .then((response) => {
          actions.changeStep(PassResetSteps.SUCCESS);
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Password Reset Failed", {
            triggeredErrorCodes: [500],
          });
          throw error;
        })
        .finally(() => {
          states.resettingPassword.value = false;
        });
    },
  };

  return {
    ...states,
    ...actions,
  };
};
