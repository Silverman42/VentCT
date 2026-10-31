import {
  formatCount,
  formatUsd,
  type AnalyticsTimeframe,
} from "~/utils/helpers/AnalyticsFormatters";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type {
  AudienceStatusFilter,
  IAudienceMetrics,
  IAudienceVolumeCount,
} from "../composables/useAudienceStore";

/** Metric tabs on the audience profile. */
export type AudienceDetailTab = "transactions" | "withdrawal" | "utility";

/** Timeframes offered by the profile period dropdown. */
export type AudiencePeriod = Extract<
  AnalyticsTimeframe,
  "today" | "last_7_days" | "last_30_days" | "last_90_days" | "all_time"
>;

/** Options for the profile period dropdown. */
export const AUDIENCE_PERIOD_OPTIONS: Array<{
  label: string;
  value: AudiencePeriod;
}> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 days", value: "last_90_days" },
  { label: "All time", value: "all_time" },
];

/** Options for the audience list "Filter by" dropdown. */
export const AUDIENCE_STATUS_FILTER_OPTIONS: Array<{
  value: AudienceStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Not verified" },
  { value: "transacted", label: "With transaction" },
  { value: "not_transacted", label: "Without transaction" },
];

/** Describes a ledger slice's completed transaction count. */
const completed = (slice: IAudienceVolumeCount | undefined): string =>
  `${formatCount(slice?.count)} transactions completed`;

/**
 * Builds the metric card rows for every profile tab from the API metrics.
 * Returns `null` per tab when the user cannot see financial figures.
 */
export const buildAudienceMetricRows = (
  metrics: IAudienceMetrics | null | undefined,
): Record<AudienceDetailTab, IAppMetric[][] | null> => {
  if (!metrics) {
    return { transactions: null, withdrawal: null, utility: null };
  }

  return {
    transactions: [
      [
        {
          label: "Total Volume",
          value: formatUsd(metrics.transactions?.volume),
          description: "EasyPay and SafeWallet volume",
        },
        {
          label: "Transaction counts",
          value: formatCount(metrics.transactions?.count),
          description: "Total counts for all transactions",
        },
      ],
      [
        {
          label: "EasyPay Volume",
          value: formatUsd(metrics.transactions?.easypay?.volume),
          description: completed(metrics.transactions?.easypay),
        },
        {
          label: "SafeWallet Volume",
          value: formatUsd(metrics.transactions?.safewallet?.volume),
          description: completed(metrics.transactions?.safewallet),
        },
        {
          label: "SafeWallet Cash Volume",
          value: formatUsd(metrics.transactions?.safewallet?.cash?.volume),
          description: completed(metrics.transactions?.safewallet?.cash),
        },
        {
          label: "SafeWallet Crypto Volume",
          value: formatUsd(metrics.transactions?.safewallet?.crypto?.volume),
          description: completed(metrics.transactions?.safewallet?.crypto),
        },
      ],
    ],
    withdrawal: [
      [
        {
          label: "Total Withdrawal",
          value: formatUsd(metrics.withdrawals?.volume),
          description: completed(metrics.withdrawals),
        },
        {
          label: "Cash Withdrawal",
          value: formatUsd(metrics.withdrawals?.cash?.volume),
          description: completed(metrics.withdrawals?.cash),
        },
        {
          label: "Crypto Withdrawal",
          value: formatUsd(metrics.withdrawals?.crypto?.volume),
          description: completed(metrics.withdrawals?.crypto),
        },
      ],
    ],
    utility: [
      [
        {
          label: "Total Utility Volume",
          value: formatUsd(metrics.utility?.volume),
          description: completed(metrics.utility),
        },
        {
          label: "Airtime",
          value: formatUsd(metrics.utility?.airtime?.volume),
          description: completed(metrics.utility?.airtime),
        },
        {
          label: "Data",
          value: formatUsd(metrics.utility?.data?.volume),
          description: completed(metrics.utility?.data),
        },
      ],
    ],
  };
};

/** Card counts per row for each tab, used by the metric shimmer during refetches. */
export const AUDIENCE_METRIC_SHIMMER_ROWS: Record<AudienceDetailTab, number[]> =
  {
    transactions: [2, 4],
    withdrawal: [3],
    utility: [3],
  };
