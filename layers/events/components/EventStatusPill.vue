<script setup lang="ts">
import type { ColorsType } from "~/utils/types/misc/Colors";
import {
  EVENT_STATUS_LABELS,
  type EventStatus,
} from "../composables/useEventStore";

const props = defineProps<{
  status: EventStatus;
  /** Label sent by the API; used when the status is not a known value. */
  statusLabel?: string;
}>();

const STATUS_COLORS: Record<EventStatus, ColorsType> = {
  completed: "green",
  pending: "orange",
  running: "blue",
  cancelled: "red",
};

/** Pill color for the event status, falling back to gray for unknown values. */
const color = computed<ColorsType>(() => STATUS_COLORS[props.status] ?? "gray");

/** Visible label for the event status. */
const label = computed(
  () => EVENT_STATUS_LABELS[props.status] ?? props.statusLabel ?? props.status,
);
</script>

<template>
  <AppPills :color="color">{{ label }}</AppPills>
</template>
