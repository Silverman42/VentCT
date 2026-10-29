<script setup lang="ts">
import type { IDashboardOverview } from "../composables/useDashboardStore";
import { formatCount, formatUsd } from "../utils/DashboardFormatters";

/** One tile in the summary grid. */
interface DashboardSummaryMetric {
  label: string;
  value: string;
  description: string;
}

const props = defineProps<{
  overview: IDashboardOverview;
}>();

/** Template-ready tiles built from the overview counts and volumes. */
const metrics = computed<DashboardSummaryMetric[]>(() => {
  const { audiences, campaigns, promoters, volumes } = props.overview;

  return [
    {
      label: "Total Sign-ups",
      value: formatCount(audiences?.total),
      description: `${formatCount(audiences?.verified)} verified users`,
    },
    {
      label: "Active Campaigns",
      value: formatCount(campaigns?.running),
      description: `${formatCount(campaigns?.total)} total campaigns`,
    },
    {
      label: "Total Promoters",
      value: formatCount(promoters?.total),
      description: "Onboarded in Citiservice",
    },
    {
      label: "Total Trading Volume",
      value: formatUsd(volumes?.tradingVolume),
      description: `${formatCount(volumes?.transactionCount)} transactions across EasyPay and SafeWallet`,
    },
    {
      label: "EasyPay Volume",
      value: formatUsd(volumes?.easypayVolume),
      description: "Aggregated payout volume",
    },
    {
      label: "SafeWallet Volume",
      value: formatUsd(volumes?.safewalletVolume),
      description: "Accumulated deposit",
    },
  ];
});
</script>

<template>
  <section
    class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    aria-label="Dashboard summary metrics"
  >
    <article
      v-for="metric in metrics"
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
