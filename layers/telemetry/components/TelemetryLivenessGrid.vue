<script setup lang="ts">
import type { IAppMetric } from "~/utils/types/misc/Metric";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type {
  ILiveness,
  ITelemetryService,
} from "../composables/useTelemetryStore";

const props = defineProps<{
  liveness: ILiveness;
}>();

const FALLBACK = "—";
const HEALTHY_SERVICE_STATUSES = ["connected", "healthy", "running", "ok", "up"];

/** Turns a snake_case service key into a readable label (`redis_cache` → `Redis cache`). */
const humanizeKey = (key: string): string => {
  const label = key.replace(/[_-]+/g, " ").trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : key;
};

/** Picks a representative icon for a service key. */
const resolveServiceIcon = (key: string): string => {
  const normalised = key.toLowerCase();
  if (normalised.includes("database") || normalised.includes("db"))
    return "vent:box-search";
  if (normalised.includes("redis") || normalised.includes("cache"))
    return "vent:timer";
  if (normalised.includes("disk") || normalised.includes("storage"))
    return "vent:folder-two";
  return "vent:radar";
};

/** Returns true when a payload value is a service probe object with a status. */
const isServiceProbe = (value: unknown): value is ITelemetryService =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ITelemetryService).status === "string";

/** Builds a service card's detail rows from whichever fields the probe sent. */
const getServiceDetails = (
  service: ITelemetryService,
): Array<{ label: string; value: string }> => {
  const details: Array<{ label: string; value: string }> = [];
  if (service.driver) details.push({ label: "Driver", value: service.driver });
  if (typeof service.latency_ms === "number")
    details.push({
      label: "Latency",
      value: `${service.latency_ms.toLocaleString("en-US", { maximumFractionDigits: 2 })} ms`,
    });
  return details;
};

/** Formats an ISO timestamp, falling back when it is missing or invalid. */
const formatTimestamp = (value?: string): string => {
  if (!value || Number.isNaN(new Date(value).getTime())) return FALLBACK;
  return DateFormatter.formatWithPattern(value, "MMM d, yyyy HH:mm:ss");
};

/** Normalises the liveness payload into template-ready values with fallbacks. */
const viewModel = computed(() => {
  const services = Object.entries(props.liveness ?? {})
    .filter((entry): entry is [string, ITelemetryService] =>
      isServiceProbe(entry[1]),
    )
    .map(([key, service]) => ({
      key,
      label: humanizeKey(key),
      icon: resolveServiceIcon(key),
      status: service.status || "unknown",
      details: getServiceDetails(service),
    }));
  const isHealthy =
    services.length > 0 &&
    services.every((service) =>
      HEALTHY_SERVICE_STATUSES.includes(service.status.toLowerCase()),
    );
  const reportedStatus = props.liveness?.status;
  const timestamp = props.liveness?.timestamp;

  return {
    services,
    hasServices: services.length > 0,
    overall: reportedStatus
      ? humanizeKey(reportedStatus)
      : services.length
        ? isHealthy
          ? "Healthy"
          : "Degraded"
        : FALLBACK,
    environment: props.liveness?.environment
      ? humanizeKey(props.liveness.environment)
      : FALLBACK,
    probedAt: formatTimestamp(timestamp),
    probedAgo:
      timestamp && !Number.isNaN(new Date(timestamp).getTime())
        ? DateFormatter.formatDistanceToNow(timestamp)
        : "Probe time unavailable",
    healthyCount: services.filter((service) =>
      HEALTHY_SERVICE_STATUSES.includes(service.status.toLowerCase()),
    ).length,
  };
});

/** Headline KPIs rendered above the service cards. */
const metricRows = computed<IAppMetric[][]>(() => [
  [
    {
      key: "overall-status",
      label: "Overall status",
      value: viewModel.value.overall,
      description: `${viewModel.value.healthyCount} of ${viewModel.value.services.length} services connected`,
    },
    {
      key: "environment",
      label: "Environment",
      value: viewModel.value.environment,
      description: "Reported by the liveness probe",
    },
    {
      key: "probe-timestamp",
      label: "Probe timestamp",
      value: viewModel.value.probedAt,
      description: viewModel.value.probedAgo,
    },
  ],
]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppMetricRows :rows="metricRows" aria-label="Liveness metrics" />

    <section
      v-if="viewModel.hasServices"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <TelemetryServiceCard
        v-for="service in viewModel.services"
        :key="service.key"
        :title="service.label"
        :icon="service.icon"
        :status="service.status"
        :details="service.details"
      />
    </section>

    <AppEmptyState
      v-else
      heading="No services reported"
      empty-table-subtitle="The liveness probe responded without any service checks."
      height="30vh"
      hide-image
    />
  </div>
</template>
