<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the campaign detail page. */
const props = withDefaults(
  defineProps<{
    /** Mirrors the analytics sections (financial row, overview, top promoters, chart). */
    showAnalytics?: boolean;
  }>(),
  { showAnalytics: true },
);
</script>

<template>
  <div
    class="flex w-full flex-col gap-6"
    aria-label="Loading campaign"
    role="status"
  >
    <section class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-2">
        <span class="h-7 w-64 max-w-full rounded-lg shimmer-bg" />
        <span class="h-3 w-96 max-w-full rounded shimmer-bg" />
        <span class="h-6 w-20 rounded-full shimmer-bg" />
      </div>
      <span class="h-9 w-9 rounded-lg shimmer-bg" />
    </section>

    <AppMetricRowsShimmer :rows="props.showAnalytics ? [3, 2, 4] : [3, 2]" />

    <template v-if="props.showAnalytics">
      <section
        class="flex flex-wrap items-center justify-between gap-2 border-b border-dashboard-card-border pb-5"
      >
        <span class="h-3 w-72 max-w-full rounded shimmer-bg" />
        <div class="flex flex-wrap items-center gap-2">
          <span class="h-11 w-40 rounded-lg shimmer-bg" />
          <span class="h-11 w-36 rounded-lg shimmer-bg" />
        </div>
      </section>

      <AppMetricRowsShimmer :rows="[4, 4]" />
    </template>

    <span
      v-else
      class="block h-12 w-full rounded-[14px] border border-dashboard-card-border shimmer-bg"
    />

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div
        class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        :class="props.showAnalytics ? 'xl:col-span-7' : 'xl:col-span-12'"
      >
        <span class="mb-5 block h-6 w-28 rounded shimmer-bg" />
        <div class="space-y-4">
          <div class="h-10 w-full rounded-md shimmer-bg" />
          <div
            v-for="row in 5"
            :key="row"
            class="h-12 w-full rounded-md shimmer-bg"
          />
        </div>
      </div>
      <CampaignTopPromotersShimmer
        v-if="props.showAnalytics"
        class="xl:col-span-5"
      />
    </section>

    <div
      class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <div class="mb-5 flex flex-col justify-between gap-4 lg:flex-row">
        <span class="h-6 w-24 rounded shimmer-bg" />
        <span class="h-10 w-full rounded-lg shimmer-bg sm:w-72" />
      </div>
      <div class="space-y-4">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div
          v-for="row in 6"
          :key="row"
          class="h-12 w-full rounded-md shimmer-bg"
        />
      </div>
    </div>

    <CampaignPerformanceChartShimmer v-if="props.showAnalytics" />
    <span class="sr-only">Loading campaign...</span>
  </div>
</template>
