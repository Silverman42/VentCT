import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

/** Connectivity probe result for a backing service (database, cache, Redis). */
export interface ITelemetryService {
  status: string;
  driver?: string;
  latency_ms?: number;
}

/** Horizon queue supervisor status. */
export interface ITelemetryHorizon {
  status: string;
  master_supervisors_count?: number;
}

/** Storage volume utilisation; sizes are in megabytes. */
export interface ITelemetryStorage {
  storage_path?: string;
  free_space_mb?: number;
  total_space_mb?: number;
  used_percentage?: number;
}

/** PHP/Laravel runtime details. */
export interface ITelemetryRuntime {
  php_version?: string;
  laravel_version?: string;
  memory_usage_mb?: number;
  /** PHP ini notation, e.g. `128M`. */
  memory_limit?: string;
  opcache_enabled?: boolean;
}

/** Backup configuration snapshot. */
export interface ITelemetryBackup {
  disks?: string[];
  notifications_enabled?: boolean;
}

/** Response data of the system-health diagnostics endpoint. */
export interface ISystemHealth {
  /** Overall system status, e.g. `healthy`. */
  status?: string;
  environment?: string;
  /** ISO date-time string of when the server collected the snapshot. */
  timestamp?: string;
  database?: ITelemetryService;
  cache?: ITelemetryService;
  redis?: ITelemetryService;
  horizon?: ITelemetryHorizon;
  storage?: ITelemetryStorage;
  runtime?: ITelemetryRuntime;
  backup?: ITelemetryBackup;
}

/** Response data of the public liveness probe. */
export interface ILiveness {
  /** Overall system status, e.g. `healthy`. */
  status?: string;
  environment?: string;
  /** ISO date-time string. */
  timestamp?: string;
  database?: ITelemetryService;
  cache?: ITelemetryService;
  redis?: ITelemetryService;
}

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the session middleware already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Provides system-health and liveness API state and actions for the telemetry layer. */
export const useTelemetryStore = () => {
  const endpoints = {
    SYSTEM_HEALTH: "/admin/diagnostics/system-health",
    LIVENESS: "/health",
  };

  const state = {
    fetchingSystemHealth: useState<boolean>(
      "useTelemetryStore.fetchingSystemHealth",
      () => false,
    ),
    fetchingLiveness: useState<boolean>(
      "useTelemetryStore.fetchingLiveness",
      () => false,
    ),
    systemHealth: useState<ISystemHealth | null>(
      "useTelemetryStore.systemHealth",
      () => null,
    ),
    liveness: useState<ILiveness | null>(
      "useTelemetryStore.liveness",
      () => null,
    ),
    /** ISO time of the last completed system-health request. */
    systemHealthCheckedAt: useState<string | null>(
      "useTelemetryStore.systemHealthCheckedAt",
      () => null,
    ),
    /** ISO time of the last completed liveness request. */
    livenessCheckedAt: useState<string | null>(
      "useTelemetryStore.livenessCheckedAt",
      () => null,
    ),
  };

  const actions = {
    /** Fetches deep diagnostics and stores the snapshot with its check time. */
    async fetchSystemHealth() {
      state.fetchingSystemHealth.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ISystemHealth>>(endpoints.SYSTEM_HEALTH, {
          method: "GET",
        })
        .then((response) => {
          state.systemHealth.value = response.data ?? null;
          state.systemHealthCheckedAt.value = new Date().toISOString();
          return state.systemHealth.value;
        })
        .catch((error) => {
          handleApiError(error, "System health fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingSystemHealth.value = false;
        });
    },

    /**
     * Fetches the liveness probe. A degraded system may answer with a non-2xx
     * status that still carries service data; that data is stored so the
     * failing services render, and the error is rethrown for callers.
     */
    async fetchLiveness() {
      state.fetchingLiveness.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<ILiveness>>(endpoints.LIVENESS, {
          method: "GET",
        })
        .then((response) => {
          state.liveness.value = response.data ?? null;
          state.livenessCheckedAt.value = new Date().toISOString();
          return state.liveness.value;
        })
        .catch((error) => {
          const degradedData = (
            error as { data?: Partial<IResponse<ILiveness>> }
          )?.data?.data;
          if (degradedData?.status) {
            state.liveness.value = degradedData;
            state.livenessCheckedAt.value = new Date().toISOString();
          }
          handleApiError(error, "Liveness check failed");
          throw error;
        })
        .finally(() => {
          state.fetchingLiveness.value = false;
        });
    },
  };

  return {
    ...state,
    ...actions,
  };
};
