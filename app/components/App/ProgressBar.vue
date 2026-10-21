<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Fill percentage between 0 and 100. */
    value: number;
    /** Accessible name describing what the bar measures. */
    label: string;
    /** Minimum visible fill so empty values still show a sliver. */
    minVisible?: number;
  }>(),
  {
    minVisible: 0,
  },
);

/** Clamps the fill into 0–100 while honouring the minimum visible width. */
const fillWidth = computed(
  () => `${Math.min(100, Math.max(props.value, props.minVisible, 0))}%`,
);
</script>

<template>
  <div
    class="h-2 overflow-hidden rounded-full bg-dashboard-chart-track"
    role="progressbar"
    :aria-label="props.label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="props.value"
  >
    <div
      class="h-full rounded-full bg-dashboard-chart-volume"
      :style="{ width: fillWidth }"
    />
  </div>
</template>
