import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

export interface ILoginPayload {
  email: string;
  password: string;
  device_name: string;
}

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
}

/** The proxy strips `token` before the response reaches the browser. */
export interface ILoginResponse {
  user: IAuthUser;
}

export interface IAuthProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface IFetchAuthUserOptions {
  /** Skip toasts and error pages, e.g. when only probing for an existing session. */
  silent?: boolean;
}

/** Provides authentication state and the login, session lookup, and logout actions. */
export const useAuthStore = () => {
  const endpoints = {
    LOGIN: "/auth/login",
    AUTH_USER: "/auth/user",
    LOGOUT: "/auth/logout",
  };

  const state = {
    user: useState<IAuthUser | null>("useAuthStore.user", () => null),
    signingIn: useState<boolean>("useAuthStore.signingIn", () => false),
    fetchingAuthUser: useState<boolean>(
      "useAuthStore.fetchingAuthUser",
      () => false,
    ),
    loggingOut: useState<boolean>("useAuthStore.loggingOut", () => false),
  };

  const getters = {
    /** Template-ready profile view model for the signed-in user. */
    profile: computed<IAuthProfile>(() => ({
      name: state.user.value?.name ?? "",
      email: state.user.value?.email ?? "",
      role: state.user.value?.roles?.[0] ?? "Administrator",
      avatar: "/img/avatar.png",
    })),
    /** Whether an authenticated user has been loaded. */
    isAuthenticated: computed<boolean>(() => !!state.user.value),
  };

  const actions = {
    /**
     * Signs in with email and password and stores the returned user.
     * Invalid credentials only raise a toast; the error is rethrown for the caller.
     */
    async login(payload: ILoginPayload) {
      state.signingIn.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ILoginResponse>>(endpoints.LOGIN, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          state.user.value = response.data.user;
          return response.data.user;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Login Failed", {
            triggeredErrorCodes: [500],
          });
          throw error;
        })
        .finally(() => {
          state.signingIn.value = false;
        });
    },

    /**
     * Fetches the user behind the current session and stores it.
     * Always rethrows so callers can react to the status code (e.g. 401).
     */
    async fetchAuthUser(options: IFetchAuthUserOptions = {}) {
      state.fetchingAuthUser.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IAuthUser>>(endpoints.AUTH_USER, {
          method: "GET",
        })
        .then((response) => {
          state.user.value = response.data;
          return response.data;
        })
        .catch((error) => {
          state.user.value = null;
          if (!options.silent) {
            const isUnauthenticated = error?.statusCode === 401;
            ApiErrorHandler(error, !isUnauthenticated, false, "Session Check Failed", {
              triggeredErrorCodes: [500],
            });
          }
          throw error;
        })
        .finally(() => {
          state.fetchingAuthUser.value = false;
        });
    },

    /**
     * Revokes the current session and returns to the login page.
     * The local session is cleared even when the request fails.
     */
    async logout() {
      if (state.loggingOut.value) return;
      state.loggingOut.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<null>>(endpoints.LOGOUT, {
          method: "POST",
        })
        .then(() => true)
        .catch((error) => {
          if (error?.statusCode !== 401) {
            ApiErrorHandler(error, true, false, "Logout Failed", {
              triggeredErrorCodes: [],
            });
          }
          return false;
        })
        .finally(async () => {
          state.user.value = null;
          state.loggingOut.value = false;
          await navigateTo("/");
        });
    },

    /** Stores a user obtained from another auth flow, such as accepting an invitation. */
    setUser(user: IAuthUser | null) {
      state.user.value = user;
    },
  };

  return {
    ...state,
    ...actions,
    ...getters,
  };
};
