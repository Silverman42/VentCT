<script setup lang="ts">
const { promoterTotal, topPromoters } = useDashboardMockData();

/**
 * Keeps non-zero contributions perceptible while preserving the exact value in
 * the accompanying label and accessibility metadata.
 */
const getVisibleContribution = (contribution: number): string => {
  return `${Math.max(contribution, 6)}%`;
};
</script>

<template>
  <section
    class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6"
    aria-labelledby="top-promoters-title"
  >
    <header>
      <h2
        id="top-promoters-title"
        class="text-base font-medium tracking-tight text-dashboard-heading"
      >
        Top Promoters by Volume
      </h2>
      <p class="mt-0.5 text-xs text-dashboard-text">
        Top Promoters by Transaction Volume
      </p>
    </header>

    <div class="ml-auto mt-5 w-full max-w-75">
      <p class="text-2xl font-medium tracking-tight text-dashboard-heading">
        {{ promoterTotal }}
      </p>
      <p class="mt-1 text-xs text-dashboard-text">Total Transaction volume</p>
    </div>

    <ul class="mt-5 space-y-5">
      <li v-for="promoter in topPromoters" :key="promoter.name">
        <div class="flex items-baseline gap-3 text-sm">
          <p class="min-w-0 flex-1 truncate text-dashboard-heading">
            {{ promoter.name }}
          </p>
          <p class="shrink-0 text-dashboard-heading">{{ promoter.volume }}</p>
          <p class="w-10 shrink-0 text-right text-dashboard-text">
            {{ promoter.contribution }}%
          </p>
        </div>
        <div
          class="mt-1.5 h-2 overflow-hidden rounded-full bg-dashboard-chart-track"
          role="progressbar"
          :aria-label="`${promoter.name} contribution to transaction volume`"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="promoter.contribution"
        >
          <div
            class="h-full rounded-l-full bg-dashboard-chart-volume"
            :style="{ width: getVisibleContribution(promoter.contribution) }"
          />
        </div>
      </li>
    </ul>

    <p class="mt-9 text-center text-sm text-dashboard-heading">
      Percentage represent each promoters contribution to total volume
    </p>
  </section>
</template>
