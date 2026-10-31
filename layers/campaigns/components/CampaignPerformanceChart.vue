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
import {
  formatBucketLabel,
  getNiceAxisMax,
} from "~/utils/helpers/AnalyticsFormatters";
import type {
  CampaignSeriesPeriod,
  ICampaignVerificationSeries,
} from "../composables/useCampaignStore";

ChartJS.register(
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const props = withDefaults(
  defineProps<{
    data: ICampaignVerificationSeries | null;
    /** Dims the card while a refresh is in flight. */
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

/** Selected chart window; the parent reloads the series when it changes. */
const period = defineModel<CampaignSeriesPeriod>("period", { required: true });

const { chartTheme } = useDashboardChartTheme();
const periodOptions: Array<{ label: string; value: CampaignSeriesPeriod }> = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "12M", value: "12m" },
];

/** Template-ready series with axis labels and numeric fallbacks. */
const series = computed(() => {
  const points = props.data?.series ?? [];
  const unit = props.data?.unit ?? "day";
  return {
    labels: points.map((point) => formatBucketLabel(point.bucket, unit)),
    verifiedUsers: points.map((point) => point.verifiedUsers ?? 0),
    tradedUsers: points.map((point) => point.tradedUsers ?? 0),
  };
});

/** Whether the selected window has no buckets to plot. */
const isEmpty = computed(() => series.value.labels.length === 0);

/** Rounded y-axis ceiling so the grid splits into four even steps. */
const axisMax = computed(() =>
  getNiceAxisMax([...series.value.verifiedUsers, ...series.value.tradedUsers]),
);

/** Maps the campaign series into the Chart.js line-chart shape. */
const chartData = computed<ChartData<"line">>(() => ({
  labels: series.value.labels,
  datasets: [
    {
      label: "Verify Users",
      data: series.value.verifiedUsers,
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
      data: series.value.tradedUsers,
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
      ticks: {
        color: chartTheme.value.mutedText,
        font: { size: 12 },
        autoSkip: true,
        maxTicksLimit: 12,
        maxRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      max: axisMax.value,
      border: { display: false },
      grid: { color: chartTheme.value.grid, borderDash: [4, 4] },
      ticks: {
        color: chartTheme.value.mutedText,
        font: { size: 12 },
        stepSize: axisMax.value / 4,
      },
    },
  },
}));
</script>

<template>
  <section
    class="flex min-h-[455px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 transition-opacity md:p-6"
    :class="{ 'opacity-60': props.loading }"
    :aria-busy="props.loading"
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
        v-model="period"
        :options="periodOptions"
        aria-label="Campaign reporting period"
      />
    </header>

    <AppErrorState
      v-if="props.failed"
      class="mt-5 flex-1 !border-0"
      compact
      heading="We couldn't load the chart"
      description="Check your connection and try again."
      :retrying="props.loading"
      @retry="emit('retry')"
    />

    <AppEmptyState
      v-else-if="isEmpty"
      heading="No performance data yet"
      empty-table-subtitle="No verifications or trades were recorded for this campaign in this period."
      height="275px"
      hide-image
    />

    <template v-else>
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
    </template>
  </section>
</template>
