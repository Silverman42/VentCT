<script setup lang="ts">
import type { ICampaignOverviewBreakdown } from "../composables/useCampaignStore";
import {
  buildMetricBreakdown,
  type CampaignMetricKey,
} from "../utils/CampaignOverview";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  /** Ledger breakdown from the campaign overview for the active filters. */
  breakdown: ICampaignOverviewBreakdown | null;
}>();

const modal = ref<ModalController | null>(null);
const activeKey = ref<CampaignMetricKey>("transactionCount");

/** Builds the breakdown view model for the active metric. */
const view = computed(() =>
  buildMetricBreakdown(activeKey.value, props.breakdown),
);

/** Opens the modal on the breakdown for the selected overview metric. */
const open = (key: CampaignMetricKey): void => {
  activeKey.value = key;
  modal.value?.showDialogBox();
};

/** Closes the breakdown modal. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Switches the modal content to a nested breakdown, such as SafeWallet cash and crypto. */
const drillDown = (key: CampaignMetricKey): void => {
  activeKey.value = key;
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="470px" :hide-pattern="true">
    <section
      class="flex flex-col gap-3"
      :aria-label="`${view.title} breakdown`"
    >
      <header class="mb-4 flex flex-col items-center text-center">
        <p class="text-xs text-dashboard-heading">{{ view.title }}</p>
        <p
          class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ view.total }}
        </p>
      </header>

      <div class="grid grid-cols-2 gap-3">
        <component
          :is="card.drillDown ? 'button' : 'article'"
          v-for="card in view.cards"
          :key="card.label"
          :type="card.drillDown ? 'button' : undefined"
          class="flex min-h-[86px] flex-col justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-4 text-left"
          :class="{
            'cursor-pointer transition hover:border-brand-color-default focus-visible:border-brand-color-default focus-visible:outline-none':
              card.drillDown,
          }"
          @click="card.drillDown && drillDown(card.drillDown)"
        >
          <p class="text-[0.6875rem] text-dashboard-text">{{ card.label }}</p>
          <p
            class="mt-2 text-xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ card.value }}
          </p>
          <p
            v-if="card.caption"
            class="mt-2 flex items-center gap-1.5 text-[0.625rem] text-dashboard-text"
          >
            {{ card.caption }}
            <Icon name="vent:arrow-right" size="0.65rem" aria-hidden="true" />
          </p>
        </component>
      </div>
    </section>
  </AppModal>
</template>
