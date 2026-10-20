import { ResponseEvents, type IResponse } from "~/utils/types/misc/ResponseBody";

/**
 * Creates a fetch client that talks to the backend through the same-origin
 * `/api/backend` proxy, which attaches the session token from its httpOnly cookie.
 * During SSR the incoming request's cookies are forwarded so the proxy can see the session.
 *
 * @param allowContentType - Set `false` for FormData uploads so the browser sets the boundary.
 */
export const useApiClientHandler = (allowContentType: boolean = true) => {
  // Read in the calling Nuxt context; `onRequest` runs outside of it.
  const ssrCookie = import.meta.server ? useRequestHeaders(["cookie"]).cookie : undefined;

  const $apiClient = $fetch.create({
    baseURL: "/api/backend",
    credentials: "same-origin",
    onRequest({ options }) {
      const headers = new Headers(options.headers);
      const method = String(options.method ?? "GET").toUpperCase();

      // Only set Content-Type when needed and when the caller has not provided one.
      if (
        allowContentType &&
        !headers.has("Content-Type") &&
        !["GET", "HEAD"].includes(method)
      ) {
        headers.set("Content-Type", "application/json");
      }

      if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
      }

      if (ssrCookie && !headers.has("cookie")) {
        headers.set("cookie", ssrCookie);
      }

      options.headers = headers;
    },
    onResponse({ response }) {
      const res = response._data as IResponse;
      if (
        res.event === ResponseEvents.TWO_FACTOR_ENABLED &&
        useRoute().path !== "/otp"
      ) {
        navigateTo("/otp", { external: true });
      }
    },
  });

  return {
    $apiClient,
  };
};
