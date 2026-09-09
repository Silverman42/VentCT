import {
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  getHeader,
  getRequestHeaders,
  getRequestURL,
  getRouterParam,
  readRawBody,
  setCookie,
  setResponseHeader,
  setResponseStatus,
} from "h3";
import type { H3Event } from "h3";
import { joinURL } from "ufo";

const SESSION_COOKIE = "tk";
const MAINTENANCE_COOKIE = "mmsk";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const HOP_BY_HOP_HEADERS = new Set([
  "authorization",
  "connection",
  "content-length",
  "cookie",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "x-maintenance-secret",
]);
const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
];

const isSameOriginMutation = (event: H3Event) => {
  const origin = getHeader(event, "origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === getRequestURL(event).origin;
  } catch {
    return false;
  }
};

const asJsonObject = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase();
  if (MUTATING_METHODS.has(method) && !isSameOriginMutation(event)) {
    throw createError({ statusCode: 403, statusMessage: "Cross-origin request rejected" });
  }

  const config = useRuntimeConfig(event);
  if (!config.apiBaseUrl) {
    throw createError({ statusCode: 500, statusMessage: "API base URL is not configured" });
  }

  const path = getRouterParam(event, "path") || "";
  const targetUrl = joinURL(config.apiBaseUrl, path) + getRequestURL(event).search;
  const headers = new Headers();

  for (const [name, value] of Object.entries(getRequestHeaders(event))) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const sessionToken = getCookie(event, SESSION_COOKIE);
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);

  const maintenanceSecret = getCookie(event, MAINTENANCE_COOKIE);
  if (maintenanceSecret) headers.set("X-Maintenance-Secret", maintenanceSecret);

  const rawBody = !["GET", "HEAD"].includes(method)
    ? await readRawBody(event, false)
    : undefined;
  const body: ArrayBuffer | undefined = rawBody
    ? (new Uint8Array(rawBody).buffer as ArrayBuffer)
    : undefined;
  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
    });
  } catch {
    throw createError({ statusCode: 502, statusMessage: "Upstream API is unavailable" });
  }

  const contentType = upstream.headers.get("content-type") || "";
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    if (name === "content-length" && contentType.includes("application/json")) {
      continue;
    }
    const value = upstream.headers.get(name);
    if (value) setResponseHeader(event, name, value);
  }
  setResponseStatus(event, upstream.status as never, upstream.statusText);

  const normalizedPath = path.replace(/^\//, "");
  if (contentType.includes("application/json")) {
    const payload = (await upstream.json()) as unknown;
    const payloadObject = asJsonObject(payload);
    const data = asJsonObject(payloadObject?.data);

    if (upstream.ok && normalizedPath === "admin/verify-2fa" && data?.token) {
      setCookie(event, SESSION_COOKIE, String(data.token), {
        httpOnly: true,
        sameSite: "lax",
        secure: !import.meta.dev,
        path: "/",
      });
      delete data.token;
    }

    if (upstream.ok && normalizedPath === "admin/logout") {
      deleteCookie(event, SESSION_COOKIE, { httpOnly: true, path: "/", sameSite: "lax", secure: !import.meta.dev });
    }

    return payload;
  }

  return new Uint8Array(await upstream.arrayBuffer());
});
