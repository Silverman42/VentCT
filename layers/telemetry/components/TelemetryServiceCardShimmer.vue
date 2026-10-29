<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Number of placeholder detail rows. */
    detailRows?: number;
    /** Renders a placeholder progress bar below the detail rows. */
    showProgress?: boolean;
  }>(),
  {
    detailRows: 3,
    showProgress: false,
  },
);
</script>

<template>
  <article
    class="flex flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    aria-hidden="true"
  >
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="size-9 rounded-lg shimmer-bg" />
        <span class="h-4 w-28 rounded shimmer-bg" />
      </div>
      <span class="h-6 w-20 rounded-full shimmer-bg" />
    </header>

    <div class="mt-4 divide-y divide-dashboard-card-border">
      <div
        v-for="row in props.detailRows"
        :key="row"
        class="flex items-center justify-between gap-4 py-3"
      >
        <span class="h-3.5 w-24 rounded shimmer-bg" />
        <span class="h-3.5 w-16 rounded shimmer-bg" />
      </div>
    </div>

    <span v-if="props.showProgress" class="mt-3 h-2 w-full rounded-full shimmer-bg" />
  </article>
</template>
