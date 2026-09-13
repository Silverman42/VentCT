<script setup lang="ts">
import type { CampaignPromoterContribution } from "../composables/useCampaignMockData";

const props = defineProps<{
  totalVolume: string;
  promoters: CampaignPromoterContribution[];
}>();

/** Keeps a non-zero bar visible while labels retain the exact contribution value. */
const getVisibleContribution = (contribution: number): string =>
  `${Math.max(contribution, 4)}%`;
</script>

<template>
  <section
    class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 md:p-6"
    aria-labelledby="campaign-top-promoters-title"
  >
    <header>
      <h2
        id="campaign-top-promoters-title"
        class="text-base font-medium tracking-tight text-dashboard-heading"
      >
        Top Promoters by Volume
      </h2>
      <p class="mt-0.5 text-xs text-dashboard-text">
        Top Promoters by Transaction Volume
      </p>
    </header>

    <div class="mx-auto mt-6 w-full flex flex-col items-center">
      <p class="text-2xl font-medium tracking-tight text-dashboard-heading">
        {{ props.totalVolume }}
      </p>
      <p class="mt-1 text-xs text-dashboard-text">Total Transaction volume</p>
    </div>

    <ul class="mt-6 space-y-5">
      <li v-for="promoter in props.promoters" :key="promoter.name">
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
      Percentage represents each promoter's contribution to total volume
    </p>
  </section>
</template>
