<script setup lang="ts">
import type { IConversionFunnel } from "../composables/useDashboardStore";
import { formatCount, formatPercent } from "../utils/DashboardFormatters";

const props = withDefaults(
  defineProps<{
    data: IConversionFunnel | null;
    /** Dims the card while a refresh is in flight. */
    loading?: boolean;
    /** Shows the error state instead of the funnel. */
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

/** Template-ready funnel stages and headline rates. */
const view = computed(() => {
  const stages = (props.data?.stages ?? []).map((stage) => ({
    key: stage.stage,
    label: stage.stage,
    count: formatCount(stage.count),
    percentage: stage.percentage ?? 0,
    percentageLabel: formatPercent(stage.percentage),
  }));

  return {
    stages,
    rates: [
      {
        label: "Verification rate",
        value: formatPercent(props.data?.verificationRate),
      },
      {
        label: "Trade rate (from verified)",
        value: formatPercent(props.data?.transactionRateFromVerified),
      },
      {
        label: "Overall conversion",
        value: formatPercent(props.data?.overallConversionRate),
      },
    ],
    isEmpty: (props.data?.registeredCount ?? 0) === 0,
  };
});
</script>

<template>
  <section
    class="flex flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 transition-opacity"
    :class="{ 'opacity-60': props.loading }"
    :aria-busy="props.loading"
    aria-labelledby="conversion-funnel-title"
  >
    <header>
      <h2
        id="conversion-funnel-title"
        class="text-base font-medium tracking-tight text-dashboard-heading"
      >
        Conversion Funnel
      </h2>
      <p class="mt-0.5 text-xs text-dashboard-text">
        Registered leads through KYC to first trade
      </p>
    </header>

    <AppErrorState
      v-if="props.failed"
      class="mt-5 flex-1 !border-0"
      compact
      heading="We couldn't load the funnel"
      description="Check your connection and try again."
      :retrying="props.loading"
      @retry="emit('retry')"
    />

    <AppEmptyState
      v-else-if="view.isEmpty"
      heading="No registrations yet"
      empty-table-subtitle="The funnel fills in once leads register in this period."
      height="18rem"
      hide-image
    />

    <template v-else>
      <ul class="mt-6 space-y-5">
        <li v-for="stage in view.stages" :key="stage.key">
          <div class="flex items-baseline gap-3 text-sm">
            <p class="min-w-0 flex-1 truncate text-dashboard-heading">
              {{ stage.label }}
            </p>
            <p class="shrink-0 text-dashboard-heading">{{ stage.count }}</p>
            <p class="w-14 shrink-0 text-right text-dashboard-text">
              {{ stage.percentageLabel }}
            </p>
          </div>
          <AppProgressBar
            class="mt-1.5"
            :value="stage.percentage"
            :min-visible="stage.percentage > 0 ? 4 : 0"
            :label="`${stage.label}: ${stage.percentageLabel} of registered leads`"
          />
        </li>
      </ul>

      <dl class="mt-auto grid grid-cols-1 gap-3 pt-8 sm:grid-cols-3">
        <div
          v-for="rate in view.rates"
          :key="rate.label"
          class="rounded-xl bg-dashboard-bg-dark p-4"
        >
          <dt class="text-[0.6875rem] text-dashboard-text">{{ rate.label }}</dt>
          <dd class="mt-1 text-lg font-medium tracking-tight text-dashboard-heading">
            {{ rate.value }}
          </dd>
        </div>
      </dl>
    </template>
  </section>
</template>
