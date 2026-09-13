<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar } from "vue-chartjs";
import type { DashboardPeriod } from "../composables/useDashboardMockData";

ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
);

const { periodOptions, transactionSeries } = useDashboardMockData();
const { chartTheme } = useDashboardChartTheme();
const selectedPeriod = ref<DashboardPeriod>("1W");

const activeSeries = computed(() => transactionSeries[selectedPeriod.value]);

const chartData = computed<ChartData<"bar">>(() => ({
  labels: activeSeries.value.labels,
  datasets: [
    {
      label: "Transaction volume",
      data: activeSeries.value.transactionVolume,
      backgroundColor: chartTheme.value.volume,
      borderColor: chartTheme.value.volume,
      borderRadius: 4,
      borderSkipped: false,
      categoryPercentage: 0.78,
      barPercentage: 0.92,
    },
    {
      label: "Counts",
      data: activeSeries.value.counts,
      backgroundColor: chartTheme.value.count,
      borderColor: chartTheme.value.count,
      borderRadius: 4,
      borderSkipped: false,
      categoryPercentage: 0.78,
      barPercentage: 0.92,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"bar">>(() => ({
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
    class="flex min-h-[590px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6"
    aria-labelledby="transaction-volume-title"
  >
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2
          id="transaction-volume-title"
          class="text-base font-medium tracking-tight text-dashboard-heading"
        >
          Transaction Volume and Count
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Verified users and trade performance stats
        </p>
      </div>
      <AppPeriodSelector v-model="selectedPeriod" :options="periodOptions" />
    </header>

    <div class="mt-8 min-h-[410px] flex-1" aria-label="Transaction volume and count chart">
      <ClientOnly>
        <Bar
          :data="chartData"
          :options="chartOptions"
          aria-label="Grouped bar chart comparing transaction volume and counts"
          role="img"
        />
        <template #fallback>
          <div class="h-[410px]" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <div class="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-dashboard-heading">
      <span class="inline-flex items-center gap-2">
        <i class="h-2 w-2 rounded-full bg-dashboard-chart-volume" aria-hidden="true" />
        Transaction volume
      </span>
      <span class="inline-flex items-center gap-2">
        <i class="h-2 w-2 rounded-full bg-dashboard-chart-count" aria-hidden="true" />
        Counts
      </span>
    </div>
  </section>
</template>
