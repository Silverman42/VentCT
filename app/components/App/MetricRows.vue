<script setup lang="ts">
import type { IAppMetric } from "~/utils/types/misc/Metric";

const props = withDefaults(
  defineProps<{
    /** Metric cards; each inner array renders as one grid row. */
    rows: IAppMetric[][];
    ariaLabel?: string;
  }>(),
  {
    ariaLabel: "Summary metrics",
  },
);

const emit = defineEmits<{
  /** Fired when an actionable metric card is clicked. */
  select: [metric: IAppMetric];
}>();

/** Picks responsive grid columns so each row fills the width with its card count. */
const getRowColumns = (cardCount: number): string => {
  if (cardCount >= 4) return "sm:grid-cols-2 xl:grid-cols-4";
  if (cardCount === 3) return "md:grid-cols-3";
  if (cardCount === 2) return "sm:grid-cols-2";
  return "";
};
</script>

<template>
  <div class="flex flex-col gap-4" :aria-label="props.ariaLabel">
    <section
      v-for="(row, rowIndex) in props.rows"
      :key="rowIndex"
      class="grid grid-cols-1 gap-4"
      :class="getRowColumns(row.length)"
    >
      <component
        :is="metric.actionable ? 'button' : 'article'"
        v-for="metric in row"
        :key="metric.key ?? metric.label"
        :type="metric.actionable ? 'button' : undefined"
        class="flex min-h-[132px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 text-left"
        :class="{
          'cursor-pointer transition hover:border-brand-color-default focus-visible:border-brand-color-default focus-visible:outline-none':
            metric.actionable,
        }"
        @click="metric.actionable && emit('select', metric)"
      >
        <p class="text-sm text-dashboard-heading">{{ metric.label }}</p>
        <p
          class="mt-3 text-3xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ metric.value }}
        </p>
        <p
          class="mt-auto flex items-center gap-2 pt-3 text-[0.6875rem] text-dashboard-text"
        >
          {{ metric.description }}
          <Icon
            v-if="metric.actionable"
            name="vent:arrow-right"
            size="0.75rem"
            aria-hidden="true"
          />
        </p>
      </component>
    </section>
  </div>
</template>
