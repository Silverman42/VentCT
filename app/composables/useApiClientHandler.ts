import { ResponseEvents, type IResponse } from "~/utils/types/misc/ResponseBody";

export const useApiClientHandler = (allowContentType: boolean = true) => {
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
