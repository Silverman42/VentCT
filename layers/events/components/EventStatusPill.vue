<script setup lang="ts">
import type { ColorsType } from "~/utils/types/misc/Colors";
import {
  EVENT_STATUS_LABELS,
  type EventStatus,
} from "../composables/useEventStore";

const props = defineProps<{
  status: EventStatus;
}>();

const STATUS_COLORS: Record<EventStatus, ColorsType> = {
  completed: "green",
  pending: "orange",
  running: "blue",
};

/** Pill color for the event status, falling back to gray for unknown values. */
const color = computed<ColorsType>(() => STATUS_COLORS[props.status] ?? "gray");

/** Visible label for the event status. */
const label = computed(() => EVENT_STATUS_LABELS[props.status] ?? props.status);
</script>

<template>
  <AppPills :color="color">{{ label }}</AppPills>
</template>
