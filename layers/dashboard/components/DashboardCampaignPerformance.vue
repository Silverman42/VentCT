<script setup lang="ts">
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import type { ColorsType } from "~/utils/types/misc/Colors";
import type {
  DashboardCampaignStatus,
  ICampaignPerformance,
} from "../composables/useDashboardStore";
import { formatCount, formatPercent } from "../utils/DashboardFormatters";

/** Table-ready campaign row with formatted values. */
interface CampaignPerformanceRow extends ITableBodyData {
  id: string;
  name: string;
  status: string;
  statusColor: ColorsType;
  target: string;
  promotersCount: string;
  registeredCount: string;
  verifiedCount: string;
  transactedCount: string;
  targetAchievementRate: number;
  targetAchievementLabel: string;
  conversionRate: string;
}

const props = withDefaults(
  defineProps<{
    campaigns: ICampaignPerformance[] | null;
    loading?: boolean;
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

const STATUS_META: Record<DashboardCampaignStatus, { label: string; color: ColorsType }> = {
  running: { label: "Running", color: "green" },
  pending: { label: "Pending", color: "orange" },
  closed: { label: "Closed", color: "gray" },
};

const headings: ITableHeaderData[] = [
  { id: "name", name: "Campaign", width: "12rem" },
  { id: "status", name: "Status" },
  { id: "target", name: "Target", justify: "right", isHiddenOnMobile: true },
  { id: "promotersCount", name: "Promoters", justify: "right", isHiddenOnMobile: true },
  { id: "registeredCount", name: "Registered", justify: "right" },
  { id: "verifiedCount", name: "Verified", justify: "right", isHiddenOnMobile: true },
  { id: "transactedCount", name: "Transacted", justify: "right" },
  { id: "targetAchievementRate", name: "Target reached", width: "16%" },
  { id: "conversionRate", name: "Conversion", justify: "right" },
];

/** Formatted rows for the shared table. */
const rows = computed<CampaignPerformanceRow[]>(() =>
  (props.campaigns ?? []).map((campaign) => {
    const status = STATUS_META[campaign.status] ?? {
      label: campaign.status ?? "Unknown",
      color: "gray" as ColorsType,
    };

    return {
      id: campaign.id,
      name: campaign.name || "Untitled campaign",
      status: status.label,
      statusColor: status.color,
      target: formatCount(campaign.target),
      promotersCount: formatCount(campaign.promotersCount),
      registeredCount: formatCount(campaign.registeredCount),
      verifiedCount: formatCount(campaign.verifiedCount),
      transactedCount: formatCount(campaign.transactedCount),
      targetAchievementRate: campaign.targetAchievementRate ?? 0,
      targetAchievementLabel: formatPercent(campaign.targetAchievementRate),
      conversionRate: formatPercent(campaign.conversionRate),
    };
  }),
);
</script>

<template>
  <AppErrorState
    v-if="props.failed"
    heading="We couldn't load campaign performance"
    description="Check your connection and try again."
    :retrying="props.loading"
    @retry="emit('retry')"
  />

  <TableComponent
    v-else
    :headings="headings"
    :body="rows"
    :is-loading="props.loading && !props.campaigns"
    empty-heading="No campaigns yet"
    empty-subtitle="Campaign performance appears once a campaign is created."
  >
    <template #table-heading>
      <h2 class="text-base font-medium tracking-tight text-dashboard-heading">
        Campaign Performance
      </h2>
      <p class="mt-0.5 text-xs text-dashboard-text">
        Target progress and conversion for every campaign
      </p>
    </template>

    <template #col_name="{ rowData }">
      <span class="font-medium">{{ rowData.name }}</span>
    </template>

    <template #col_status="{ rowData }">
      <AppPills :color="rowData.statusColor" class="text-xs">
        {{ rowData.status }}
      </AppPills>
    </template>

    <template #col_targetAchievementRate="{ rowData }">
      <div class="flex items-center gap-2">
        <AppProgressBar
          class="flex-1"
          :value="rowData.targetAchievementRate"
          :min-visible="rowData.targetAchievementRate > 0 ? 4 : 0"
          :label="`${rowData.name} target reached`"
        />
        <span class="w-12 shrink-0 text-right text-xs text-dashboard-text">
          {{ rowData.targetAchievementLabel }}
        </span>
      </div>
    </template>
  </TableComponent>
</template>
