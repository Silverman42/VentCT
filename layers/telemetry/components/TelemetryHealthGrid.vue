<script setup lang="ts">
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type { ISystemHealth } from "../composables/useTelemetryStore";
import type { ITelemetryServiceDetail } from "./TelemetryServiceCard.vue";

const props = defineProps<{
  health: ISystemHealth;
}>();

const FALLBACK = "—";

/** Formats a numeric value with a unit, or a fallback when it is missing. */
const formatNumber = (
  value: number | null | undefined,
  unit = "",
  fractionDigits = 2,
): string => {
  if (typeof value !== "number" || Number.isNaN(value)) return FALLBACK;
  const formatted = value.toLocaleString("en-US", {
    maximumFractionDigits: fractionDigits,
  });
  return unit ? `${formatted}${unit}` : formatted;
};

/** Formats a megabyte size, switching to gigabytes from 1,024 MB upwards. */
const formatMegabytes = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value)) return FALLBACK;
  return value >= 1024
    ? formatNumber(value / 1024, " GB", 1)
    : formatNumber(value, " MB", 1);
};

/** Formats a boolean flag as Enabled/Disabled, or a fallback when missing. */
const formatFlag = (value: boolean | null | undefined): string =>
  typeof value === "boolean" ? (value ? "Enabled" : "Disabled") : FALLBACK;

/** Formats an ISO timestamp as date and time, or a fallback when missing. */
const formatTimestamp = (value: string | null | undefined): string =>
  value
    ? `${DateFormatter.formatDate(value)}, ${DateFormatter.formatTime(value)}`
    : FALLBACK;

/** Normalises the diagnostics payload into template-ready values with fallbacks. */
const viewModel = computed(() => {
  const { database, cache, redis, horizon, storage, runtime, backup } =
    props.health;
  const usage = storage?.usedPercentage;

  return {
    system: {
      status: props.health.status ?? "",
      environment: props.health.environment || FALLBACK,
      reportedAt: formatTimestamp(props.health.timestamp),
    },
    runtime: {
      php: runtime?.phpVersion || FALLBACK,
      laravel: runtime?.laravelVersion || FALLBACK,
      memoryUsage: formatNumber(runtime?.memoryUsageMb, " MB", 1),
      memoryLimit: runtime?.memoryLimit || FALLBACK,
      opcache: formatFlag(runtime?.opcacheEnabled),
    },
    database: {
      driver: database?.driver || FALLBACK,
      latency: formatNumber(database?.latencyMs, " ms"),
      status: database?.status ?? "",
    },
    cache: {
      driver: cache?.driver || FALLBACK,
      latency: formatNumber(cache?.latencyMs, " ms"),
      status: cache?.status ?? "",
    },
    redis: {
      latency: formatNumber(redis?.latencyMs, " ms"),
      status: redis?.status ?? "",
    },
    horizon: {
      status: horizon?.status ?? "",
      supervisors: formatNumber(horizon?.masterSupervisorsCount, "", 0),
    },
    storage: {
      free: formatMegabytes(storage?.freeSpaceMb),
      total: formatMegabytes(storage?.totalSpaceMb),
      usage: formatNumber(usage, "%", 1),
      usageValue: typeof usage === "number" ? usage : 0,
      hasUsage: typeof usage === "number",
    },
    backup: {
      disks: backup?.disks?.length ? backup.disks.join(", ") : FALLBACK,
      notifications: formatFlag(backup?.notificationsEnabled),
    },
  };
});

/** Headline KPIs rendered above the service cards. */
const metricRows = computed<IAppMetric[][]>(() => [
  [
    {
      key: "db-latency",
      label: "Database latency",
      value: viewModel.value.database.latency,
      description: "Round-trip time to the primary database",
    },
    {
      key: "cache-latency",
      label: "Cache latency",
      value: viewModel.value.cache.latency,
      description: "Round-trip time to the cache store",
    },
    {
      key: "redis-latency",
      label: "Redis latency",
      value: viewModel.value.redis.latency,
      description: "Round-trip time to Redis",
    },
    {
      key: "storage-usage",
      label: "Storage used",
      value: viewModel.value.storage.usage,
      description: `${viewModel.value.storage.free} free of ${viewModel.value.storage.total}`,
    },
  ],
]);

/** Detail rows for the overall system card. */
const systemDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Environment", value: viewModel.value.system.environment },
  { label: "Reported at", value: viewModel.value.system.reportedAt },
]);

/** Detail rows for the runtime card. */
const runtimeDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "PHP", value: viewModel.value.runtime.php },
  { label: "Laravel", value: viewModel.value.runtime.laravel },
  { label: "Memory usage", value: viewModel.value.runtime.memoryUsage },
  { label: "Memory limit", value: viewModel.value.runtime.memoryLimit },
  { label: "OPcache", value: viewModel.value.runtime.opcache },
]);

/** Detail rows for the database card. */
const databaseDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Driver", value: viewModel.value.database.driver },
  { label: "Latency", value: viewModel.value.database.latency },
]);

/** Detail rows for the cache card. */
const cacheDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Driver", value: viewModel.value.cache.driver },
  { label: "Latency", value: viewModel.value.cache.latency },
]);

/** Detail rows for the Redis card. */
const redisDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Latency", value: viewModel.value.redis.latency },
]);

/** Detail rows for the Horizon card. */
const horizonDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Master supervisors", value: viewModel.value.horizon.supervisors },
]);

/** Detail rows for the storage card. */
const storageDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Free", value: viewModel.value.storage.free },
  { label: "Total", value: viewModel.value.storage.total },
  { label: "Used", value: viewModel.value.storage.usage },
]);

/** Detail rows for the backup card. */
const backupDetails = computed<ITelemetryServiceDetail[]>(() => [
  { label: "Disks", value: viewModel.value.backup.disks },
  { label: "Notifications", value: viewModel.value.backup.notifications },
]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppMetricRows :rows="metricRows" aria-label="System health metrics" />

    <section
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <TelemetryServiceCard
        title="System"
        icon="vent:radar"
        :status="viewModel.system.status"
        :details="systemDetails"
      />
      <TelemetryServiceCard
        title="Runtime"
        icon="vent:element"
        :details="runtimeDetails"
      />
      <TelemetryServiceCard
        title="Database"
        icon="vent:box-search"
        :status="viewModel.database.status"
        :details="databaseDetails"
      />
      <TelemetryServiceCard
        title="Cache"
        icon="vent:timer"
        :status="viewModel.cache.status"
        :details="cacheDetails"
      />
      <TelemetryServiceCard
        title="Redis"
        icon="vent:timer"
        :status="viewModel.redis.status"
        :details="redisDetails"
      />
      <TelemetryServiceCard
        title="Horizon"
        icon="vent:radar"
        :status="viewModel.horizon.status"
        :details="horizonDetails"
      />
      <TelemetryServiceCard
        title="Storage"
        icon="vent:folder-two"
        :details="storageDetails"
      >
        <AppProgressBar
          v-if="viewModel.storage.hasUsage"
          class="mt-3"
          :value="viewModel.storage.usageValue"
          label="Storage usage"
        />
      </TelemetryServiceCard>
      <TelemetryServiceCard
        title="Backup"
        icon="vent:folder-two"
        :details="backupDetails"
      />
    </section>
  </div>
</template>
