<script setup lang="ts">
import {
  formatPercent,
  formatUsd,
} from "~/utils/helpers/AnalyticsFormatters";
import type { ICampaignTopPromoters } from "../composables/useCampaignStore";

/** Template-ready promoter row. */
interface PromoterRow {
  key: string;
  name: string;
  volume: string;
  share: number;
  shareLabel: string;
}

const props = withDefaults(
  defineProps<{
    data: ICampaignTopPromoters | null;
    /** Dims the card while a refresh is in flight. */
    loading?: boolean;
    /** Shows the error state instead of the list. */
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

/** Total deposit volume for the campaign and filters, formatted for display. */
const totalVolume = computed(() => formatUsd(props.data?.totalVolume));

/**
 * Promoter rows, plus an "Unattributed" row when part of the volume has no
 * promoter, so the shares reconcile with the total.
 */
const rows = computed<PromoterRow[]>(() => {
  const total = props.data?.totalVolume ?? 0;
  const promoterRows: PromoterRow[] = (props.data?.promoters ?? []).map(
    (promoter) => ({
      key: promoter.id,
      name: promoter.name || "Unnamed promoter",
      volume: formatUsd(promoter.volume),
      share: promoter.share ?? 0,
      shareLabel: formatPercent(promoter.share),
    }),
  );

  const unattributed = props.data?.unattributedVolume ?? 0;
  if (unattributed > 0) {
    const share = total > 0 ? (unattributed / total) * 100 : 0;
    promoterRows.push({
      key: "unattributed",
      name: "Unattributed",
      volume: formatUsd(unattributed),
      share,
      shareLabel: formatPercent(share),
    });
  }

  return promoterRows;
});

/** Whether the campaign has no promoters to list for the filters. */
const isEmpty = computed(() => rows.value.length === 0);
</script>

<template>
  <section
    class="flex flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 transition-opacity md:p-6"
    :class="{ 'opacity-60': props.loading }"
    :aria-busy="props.loading"
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

    <AppErrorState
      v-if="props.failed"
      class="mt-5 flex-1 !border-0"
      compact
      heading="We couldn't load top promoters"
      description="Check your connection and try again."
      :retrying="props.loading"
      @retry="emit('retry')"
    />

    <template v-else>
      <div class="mx-auto mt-6 flex w-full flex-col items-center">
        <p class="text-2xl font-medium tracking-tight text-dashboard-heading">
          {{ totalVolume }}
        </p>
        <p class="mt-1 text-xs text-dashboard-text">Total Transaction volume</p>
      </div>

      <AppEmptyState
        v-if="isEmpty"
        heading="No promoter volume yet"
        empty-table-subtitle="No deposits were attributed to this campaign's promoters in this period."
        height="14rem"
        hide-image
      />

      <template v-else>
        <ul class="mt-6 space-y-5">
          <li v-for="row in rows" :key="row.key">
            <div class="flex items-baseline gap-3 text-sm">
              <p class="min-w-0 flex-1 truncate text-dashboard-heading">
                {{ row.name }}
              </p>
              <p class="shrink-0 text-dashboard-heading">{{ row.volume }}</p>
              <p class="w-12 shrink-0 text-right text-dashboard-text">
                {{ row.shareLabel }}
              </p>
            </div>
            <AppProgressBar
              class="mt-1.5"
              :value="row.share"
              :min-visible="4"
              :label="`${row.name} contribution to transaction volume`"
            />
          </li>
        </ul>

        <p class="mt-9 text-center text-sm text-dashboard-heading">
          Percentage represents each promoter's contribution to total volume
        </p>
      </template>
    </template>
  </section>
</template>
