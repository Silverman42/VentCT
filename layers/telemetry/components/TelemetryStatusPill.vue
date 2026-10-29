<script setup lang="ts">
import type { ColorsType } from "~/utils/types/misc/Colors";

const props = defineProps<{
  /** Raw service status string returned by the API. */
  status: string;
}>();

const GREEN_STATUSES = ["healthy", "connected", "running", "ok", "up"];
const ORANGE_STATUSES = ["degraded", "pending", "paused", "warning"];
const RED_STATUSES = [
  "unhealthy",
  "disconnected",
  "stopped",
  "failed",
  "down",
  "error",
  "inactive",
];

/** Maps the normalised status to a semantic pill colour. */
const pillColor = computed<ColorsType>(() => {
  const status = props.status.trim().toLowerCase();
  if (GREEN_STATUSES.includes(status)) return "green";
  if (ORANGE_STATUSES.includes(status)) return "orange";
  if (RED_STATUSES.includes(status)) return "red";
  return "gray";
});

/** Converts snake_case or lowercase statuses into a sentence-case label. */
const statusLabel = computed(() => {
  const label = props.status.trim().replace(/[_-]+/g, " ");
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Unknown";
});
</script>

<template>
  <AppPills :color="pillColor" has-tick class="text-xs font-medium">
    {{ statusLabel }}
  </AppPills>
</template>
