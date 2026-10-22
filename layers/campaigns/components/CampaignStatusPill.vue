<script setup lang="ts">
import type { ColorsType } from "~/utils/types/misc/Colors";
import {
  CAMPAIGN_STATUS_LABELS,
  type CampaignApiStatus,
} from "../composables/useCampaignStore";

const props = defineProps<{
  status: CampaignApiStatus;
}>();

const STATUS_COLORS: Record<CampaignApiStatus, ColorsType> = {
  running: "green",
  pending: "orange",
  closed: "gray",
};

/** Pill color for the campaign status, falling back to gray for unknown values. */
const color = computed<ColorsType>(() => STATUS_COLORS[props.status] ?? "gray");

/** Visible label for the campaign status. */
const label = computed(
  () => CAMPAIGN_STATUS_LABELS[props.status] ?? props.status,
);
</script>

<template>
  <AppPills :color="color">{{ label }}</AppPills>
</template>
