<script setup lang="ts">
const { summaryMetrics } = useDashboardMockData();
</script>

<template>
  <section
    class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    aria-label="Dashboard summary metrics"
  >
    <article
      v-for="metric in summaryMetrics"
      :key="metric.label"
      class="flex min-h-[124px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 shadow-sm shadow-black/2"
    >
      <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
      <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">
        {{ metric.value }}
      </p>
      <p class="mt-auto pt-3 text-[0.6875rem] text-dashboard-text">
        {{ metric.description }}
      </p>
    </article>
  </section>
</template>
