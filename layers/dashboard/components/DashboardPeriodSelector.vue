<script setup lang="ts">
import type { DashboardPeriod } from "../composables/useDashboardMockData";

const props = defineProps<{
  modelValue: DashboardPeriod;
}>();

const emit = defineEmits<{
  "update:modelValue": [period: DashboardPeriod];
}>();

const { periodOptions } = useDashboardMockData();

/** Emits a selected reporting window to the containing chart card. */
const selectPeriod = (period: DashboardPeriod) => {
  emit("update:modelValue", period);
};
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-full bg-dashboard-bg-dark p-0.5"
    aria-label="Reporting period"
    role="group"
  >
    <button
      v-for="period in periodOptions"
      :key="period.value"
      class="min-w-9 cursor-pointer rounded-full px-2.5 py-1 text-xs text-dashboard-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-color-default/40"
      :class="{
        'bg-dashboard-bg text-dashboard-heading shadow-sm':
          props.modelValue === period.value,
        'hover:text-dashboard-heading': props.modelValue !== period.value,
      }"
      type="button"
      :aria-pressed="props.modelValue === period.value"
      @click="selectPeriod(period.value)"
    >
      {{ period.label }}
    </button>
  </div>
</template>
