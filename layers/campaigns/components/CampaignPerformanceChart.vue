<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Line } from "vue-chartjs";
import type {
  CampaignPeriod,
  CampaignPerformanceSeries,
} from "../composables/useCampaignMockData";

ChartJS.register(
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const props = defineProps<{
  performance: Record<CampaignPeriod, CampaignPerformanceSeries>;
}>();

const { chartTheme } = useDashboardChartTheme();
const selectedPeriod = ref<CampaignPeriod>("7D");
const periodOptions: Array<{ label: CampaignPeriod; value: CampaignPeriod }> = [
  { label: "7D", value: "7D" },
  { label: "30D", value: "30D" },
  { label: "90D", value: "90D" },
  { label: "12M", value: "12M" },
];

/** Resolves the fixture series for the reporting window selected by the user. */
const activeSeries = computed(() => props.performance[selectedPeriod.value]);

/** Maps campaign verification data into the Chart.js line-chart shape. */
const chartData = computed<ChartData<"line">>(() => ({
  labels: activeSeries.value.labels,
  datasets: [
    {
      label: "Verify Users",
      data: activeSeries.value.verifiedUsers,
      borderColor: chartTheme.value.verified,
      backgroundColor: chartTheme.value.verified,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHitRadius: 12,
      tension: 0.38,
    },
    {
      label: "Users that traded",
      data: activeSeries.value.usersThatTraded,
      borderColor: chartTheme.value.traded,
      backgroundColor: chartTheme.value.traded,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHitRadius: 12,
      tension: 0.38,
    },
  ],
}));

/** Configures a theme-aware, responsive Chart.js rendering for campaign data. */
const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 250 },
  interaction: { intersect: false, mode: "index" },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      backgroundColor: chartTheme.value.card,
      bodyColor: chartTheme.value.text,
      titleColor: chartTheme.value.text,
      borderColor: chartTheme.value.grid,
      borderWidth: 1,
      padding: 10,
    },
  },
  scales: {
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: { color: chartTheme.value.mutedText, font: { size: 12 } },
    },
    y: {
      beginAtZero: true,
      max: activeSeries.value.maximum,
      border: { display: false },
      grid: { color: chartTheme.value.grid, borderDash: [4, 4] },
      ticks: {
        color: chartTheme.value.mutedText,
        font: { size: 12 },
        stepSize: activeSeries.value.maximum / 4,
      },
    },
  },
}));
</script>

<template>
  <section
    class="flex min-h-[455px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 md:p-6"
    aria-labelledby="campaign-performance-title"
  >
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 id="campaign-performance-title" class="text-base font-medium tracking-tight text-dashboard-heading">
          Verification vs Trade Performance
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">Verified users and trade performance stats</p>
      </div>
      <AppPeriodSelector
        v-model="selectedPeriod"
        :options="periodOptions"
        aria-label="Campaign reporting period"
      />
    </header>

    <div class="mt-8 min-h-[275px] flex-1" aria-label="Campaign verification and trade performance chart">
      <ClientOnly>
        <Line
          :data="chartData"
          :options="chartOptions"
          aria-label="Line chart comparing verified campaign audience with audience members that traded"
          role="img"
        />
        <template #fallback>
          <div class="h-[275px]" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <div class="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-dashboard-heading">
      <span class="inline-flex items-center gap-2">
        <i class="h-2 w-2 rounded-full bg-dashboard-chart-verified" aria-hidden="true" />
        Verify Users
      </span>
      <span class="inline-flex items-center gap-2">
        <i class="h-2 w-2 rounded-full bg-dashboard-chart-traded" aria-hidden="true" />
        Users that traded
      </span>
    </div>
  </section>
</template>
