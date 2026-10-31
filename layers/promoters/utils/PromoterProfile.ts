import {
  formatCount,
  formatUsd,
  type AnalyticsTimeframe,
} from "~/utils/helpers/AnalyticsFormatters";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type {
  IPromoterMetrics,
  IPromoterVolumeCount,
  PromoterAudienceStatusFilter,
} from "../composables/usePromotersStore";

/** Tabs on the promoter profile dashboard. */
export type PromoterDetailTab =
  | "audiences"
  | "transactions"
  | "withdrawal"
  | "utility";

/** Timeframes offered by the profile period dropdown. */
export type PromoterPeriod = Extract<
  AnalyticsTimeframe,
  "today" | "last_7_days" | "last_30_days" | "last_90_days" | "all_time"
>;

/** Options for the profile period dropdown. */
export const PROMOTER_PERIOD_OPTIONS: Array<{
  label: string;
  value: PromoterPeriod;
}> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 days", value: "last_90_days" },
  { label: "All time", value: "all_time" },
];

/** Options for the referred-audience status filter. */
export const PROMOTER_AUDIENCE_FILTER_OPTIONS: Array<{
  value: PromoterAudienceStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Not verified" },
  { value: "transacted", label: "With transaction" },
  { value: "not_transacted", label: "Without transaction" },
];

/** Describes a ledger slice's completed transaction count. */
const completed = (slice: IPromoterVolumeCount | undefined): string =>
  `${formatCount(slice?.count)} transactions completed`;

/**
 * Builds the metric card rows for every profile tab from the API metrics.
 * Transaction tabs are `null` when the user cannot see financial figures.
 */
export const buildPromoterMetricRows = (
  metrics: IPromoterMetrics | null | undefined,
): Record<PromoterDetailTab, IAppMetric[][] | null> => {
  const audience = metrics?.audience;
  const breakdown = metrics?.breakdown;

  return {
    audiences: [
      [
        {
          label: "Total Audience",
          value: formatCount(audience?.totalAudience),
          description: "Total number of audience for this promoter",
        },
        {
          label: "Verified Audience",
          value: formatCount(audience?.verifiedAudience),
          description: "Number of verified audience",
        },
        {
          label: "Unverified Audience",
          value: formatCount(audience?.unverifiedAudience),
          description: "Number of unverified audience",
        },
        {
          label: "Audience with Transaction",
          value: formatCount(audience?.audienceWithTransaction),
          description: "Number of audience with transactions",
        },
      ],
    ],
    transactions: breakdown
      ? [
          [
            {
              label: "Total Volume",
              value: formatUsd(breakdown.transactions?.volume),
              description: "EasyPay and SafeWallet volume",
            },
            {
              label: "Transaction counts",
              value: formatCount(breakdown.transactions?.count),
              description: "Total counts for all transactions",
            },
          ],
          [
            {
              label: "EasyPay Volume",
              value: formatUsd(breakdown.transactions?.easypay?.volume),
              description: completed(breakdown.transactions?.easypay),
            },
            {
              label: "SafeWallet Volume",
              value: formatUsd(breakdown.transactions?.safewallet?.volume),
              description: completed(breakdown.transactions?.safewallet),
            },
            {
              label: "SafeWallet Cash Volume",
              value: formatUsd(breakdown.transactions?.safewallet?.cash?.volume),
              description: completed(breakdown.transactions?.safewallet?.cash),
            },
            {
              label: "SafeWallet Crypto Volume",
              value: formatUsd(
                breakdown.transactions?.safewallet?.crypto?.volume,
              ),
              description: completed(breakdown.transactions?.safewallet?.crypto),
            },
          ],
        ]
      : null,
    withdrawal: breakdown
      ? [
          [
            {
              label: "Total Withdrawal",
              value: formatUsd(breakdown.withdrawals?.volume),
              description: completed(breakdown.withdrawals),
            },
            {
              label: "Cash Withdrawal",
              value: formatUsd(breakdown.withdrawals?.cash?.volume),
              description: completed(breakdown.withdrawals?.cash),
            },
            {
              label: "Crypto Withdrawal",
              value: formatUsd(breakdown.withdrawals?.crypto?.volume),
              description: completed(breakdown.withdrawals?.crypto),
            },
          ],
        ]
      : null,
    utility: breakdown
      ? [
          [
            {
              label: "Total Utility Volume",
              value: formatUsd(breakdown.utility?.volume),
              description: completed(breakdown.utility),
            },
            {
              label: "Airtime",
              value: formatUsd(breakdown.utility?.airtime?.volume),
              description: completed(breakdown.utility?.airtime),
            },
            {
              label: "Data",
              value: formatUsd(breakdown.utility?.data?.volume),
              description: completed(breakdown.utility?.data),
            },
          ],
        ]
      : null,
  };
};

/** Card counts per row for each tab, used by the metric shimmer during refetches. */
export const PROMOTER_METRIC_SHIMMER_ROWS: Record<PromoterDetailTab, number[]> =
  {
    audiences: [4],
    transactions: [2, 4],
    withdrawal: [3],
    utility: [3],
  };

/** Returns up to two initials for an avatar placeholder. */
export const getPromoterInitials = (name: string | null | undefined): string =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
