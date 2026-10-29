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
import type {
  DashboardSeriesPeriod,
  ITransactionVolumeSeries,
} from "../composables/useDashboardStore";
import {
  dashboardPeriodOptions,
  formatBucketLabel,
  formatCount,
  formatUsd,
  getNiceAxisMax,
} from "../utils/DashboardFormatters";
import { NumberFormatter } from "~/utils/helpers/NumberFormatter";

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const props = withDefaults(
  defineProps<{
    data: ITransactionVolumeSeries | null;
    /** Dims the chart while a refresh is in flight. */
    loading?: boolean;
    /** Shows the error state instead of the chart. */
    failed?: boolean;
  }>(),
  {
    loading: false,
    failed: false,
  },
);

const emit = defineEmits<{
  /** Fired when the user asks to repeat the failed request. */
  retry: [];
}>();

const period = defineModel<DashboardSeriesPeriod>("period", { required: true });

const { chartTheme } = useDashboardChartTheme();

/** Chart-ready labels, datasets and axis ceilings derived from the API series. */
const view = computed(() => {
  const unit = props.data?.unit ?? "day";
  const points = props.data?.series ?? [];
  const volumes = points.map((point) => point.volume ?? 0);
  const counts = points.map((point) => point.count ?? 0);

  return {
    labels: points.map((point) => formatBucketLabel(point.bucket, unit)),
    volumes,
    counts,
    volumeMax: getNiceAxisMax(volumes),
    countMax: getNiceAxisMax(counts),
    isEmpty: [...volumes, ...counts].every((value) => value === 0),
  };
});

/** Shared bar styling for both datasets. */
const barStyle = {
  borderRadius: 4,
  borderSkipped: false,
  categoryPercentage: 0.78,
  barPercentage: 0.92,
} as const;

const chartData = computed<ChartData<"bar">>(() => ({
  labels: view.value.labels,
  datasets: [
    {
      ...barStyle,
      label: "Transaction volume",
      data: view.value.volumes,
      yAxisID: "y",
      backgroundColor: chartTheme.value.volume,
      borderColor: chartTheme.value.volume,
    },
    {
      ...barStyle,
      label: "Counts",
      data: view.value.counts,
      yAxisID: "count",
      backgroundColor: chartTheme.value.count,
      borderColor: chartTheme.value.count,
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
      callbacks: {
        /** Formats tooltip values as USD for volume and a plain number for counts. */
        label: (context) =>
          context.dataset.yAxisID === "count"
            ? `Counts: ${formatCount(context.parsed.y)}`
            : `Volume: ${formatUsd(context.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: chartTheme.value.mutedText,
        font: { size: 12 },
        autoSkip: true,
        maxTicksLimit: 10,
        maxRotation: 0,
      },
    },
    y: {
      position: "left",
      beginAtZero: true,
      max: view.value.volumeMax,
      border: { display: false },
      grid: { color: chartTheme.value.grid },
      ticks: {
        color: chartTheme.value.mutedText,
        font: { size: 12 },
        stepSize: view.value.volumeMax / 4,
        /** Shows compact USD ticks such as `$1.5K`. */
        callback: (value) =>
          `$${NumberFormatter.format(Number(value), { compact: true, decimals: 1 })}`,
      },
    },
    count: {
      position: "right",
      beginAtZero: true,
      max: view.value.countMax,
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: chartTheme.value.mutedText,
        font: { size: 12 },
        stepSize: view.value.countMax / 4,
        precision: 0,
      },
    },
  },
}));
</script>

<template>
  <section
    class="flex min-h-[590px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6"
    :aria-busy="props.loading"
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
          Deposit volume (left axis, USD) and number of deposits (right axis)
        </p>
      </div>
      <AppPeriodSelector v-model="period" :options="dashboardPeriodOptions" />
    </header>

    <AppErrorState
      v-if="props.failed"
      class="mt-8 flex-1 !border-0"
      compact
      heading="We couldn't load this chart"
      description="Check your connection and try again."
      :retrying="props.loading"
      @retry="emit('retry')"
    />

    <AppEmptyState
      v-else-if="view.isEmpty && !props.loading"
      heading="No deposits in this period"
      empty-table-subtitle="Try a longer window or a different country."
      height="410px"
      hide-image
    />

    <template v-else>
      <div
        class="mt-8 min-h-[410px] flex-1 transition-opacity"
        :class="{ 'opacity-50': props.loading }"
        aria-label="Transaction volume and count chart"
      >
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
    </template>
  </section>
</template>
