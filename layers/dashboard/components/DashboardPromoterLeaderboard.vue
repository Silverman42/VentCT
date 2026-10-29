<script setup lang="ts">
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";
import type { IPromoterLeaderboardEntry } from "../composables/useDashboardStore";
import { formatCount, formatPercent } from "../utils/DashboardFormatters";

/** Table-ready leaderboard row with formatted values. */
interface LeaderboardRow extends ITableBodyData {
  id: string;
  rank: string;
  name: string;
  referralCode: string;
  campaignName: string;
  registeredCount: string;
  verifiedCount: string;
  transactedCount: string;
  conversionRate: string;
}

const props = withDefaults(
  defineProps<{
    entries: IPromoterLeaderboardEntry[] | null;
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

const headings: ITableHeaderData[] = [
  { id: "rank", name: "#", width: "3rem" },
  { id: "name", name: "Promoter" },
  { id: "campaignName", name: "Campaign", isHiddenOnMobile: true },
  { id: "registeredCount", name: "Registered", justify: "right" },
  { id: "verifiedCount", name: "Verified", justify: "right", isHiddenOnMobile: true },
  { id: "transactedCount", name: "Transacted", justify: "right" },
  { id: "conversionRate", name: "Conversion", justify: "right" },
];

/** Ranked, formatted rows for the shared table. */
const rows = computed<LeaderboardRow[]>(() =>
  (props.entries ?? []).map((entry, index) => ({
    id: entry.id,
    rank: String(index + 1),
    name: entry.name || "Unnamed promoter",
    referralCode: entry.referralCode ?? "",
    campaignName: entry.campaignName ?? "—",
    registeredCount: formatCount(entry.registeredCount),
    verifiedCount: formatCount(entry.verifiedCount),
    transactedCount: formatCount(entry.transactedCount),
    conversionRate: formatPercent(entry.conversionRate),
  })),
);
</script>

<template>
  <AppErrorState
    v-if="props.failed"
    heading="We couldn't load the leaderboard"
    description="Check your connection and try again."
    :retrying="props.loading"
    @retry="emit('retry')"
  />

  <TableComponent
    v-else
    :headings="headings"
    :body="rows"
    :is-loading="props.loading && !props.entries"
    empty-heading="No promoters ranked yet"
    empty-subtitle="Promoters appear here once their referrals register."
  >
    <template #table-heading>
      <h2 class="text-base font-medium tracking-tight text-dashboard-heading">
        Promoter Leaderboard
      </h2>
      <p class="mt-0.5 text-xs text-dashboard-text">
        Top 10 promoters by referred registrations and conversions
      </p>
    </template>

    <template #col_name="{ rowData }">
      <p class="font-medium">{{ rowData.name }}</p>
      <p v-if="rowData.referralCode" class="text-xs text-dashboard-text">
        {{ rowData.referralCode }}
      </p>
    </template>
  </TableComponent>
</template>
