<script setup lang="ts">
const props = defineProps<{
  /** Number of placeholder cards in each grid row. */
  rows: number[];
}>();

/** Picks the same responsive grid columns as `AppMetricRows` for a card count. */
const getRowColumns = (cardCount: number): string => {
  if (cardCount >= 4) return "sm:grid-cols-2 xl:grid-cols-4";
  if (cardCount === 3) return "md:grid-cols-3";
  if (cardCount === 2) return "sm:grid-cols-2";
  return "";
};
</script>

<template>
  <div class="flex flex-col gap-4" aria-hidden="true">
    <section
      v-for="(cardCount, rowIndex) in props.rows"
      :key="rowIndex"
      class="grid grid-cols-1 gap-4"
      :class="getRowColumns(cardCount)"
    >
      <article
        v-for="card in cardCount"
        :key="card"
        class="flex min-h-[132px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <span class="h-4 w-28 rounded shimmer-bg" />
        <span class="mt-3 h-8 w-32 rounded-lg shimmer-bg" />
        <span class="mt-auto h-3 w-40 max-w-full rounded shimmer-bg" />
      </article>
    </section>
  </div>
</template>
