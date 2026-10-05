<script setup lang="ts">
import type { PromoterMetric } from "../composables/usePromoterMockData";

const props = defineProps<{
  rows: PromoterMetric[][];
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
  <div class="flex flex-col gap-4" aria-label="Promoter summary metrics">
    <section
      v-for="(row, rowIndex) in props.rows"
      :key="rowIndex"
      class="grid grid-cols-1 gap-4"
      :class="getRowColumns(row.length)"
    >
      <article
        v-for="metric in row"
        :key="metric.label"
        class="flex min-h-[132px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <p class="text-sm text-dashboard-heading">{{ metric.label }}</p>
        <p
          class="mt-3 text-3xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ metric.value }}
        </p>
        <p class="mt-auto pt-3 text-[0.6875rem] text-dashboard-text">
          {{ metric.description }}
        </p>
      </article>
    </section>
  </div>
</template>
