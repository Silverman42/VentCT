import {
  formatCount,
  formatUsd,
} from "~/utils/helpers/AnalyticsFormatters";
import type { IAppMetric } from "~/utils/types/misc/Metric";
import type {
  ICampaignOverview,
  ICampaignOverviewBreakdown,
  IVolumeCount,
} from "../composables/useCampaignStore";

/** Overview metrics that open a breakdown, including SafeWallet drill-downs. */
export type CampaignMetricKey =
  | "transactionCount"
  | "transactionVolume"
  | "utilityCount"
  | "withdrawalCount"
  | "safeWalletCount"
  | "safeWalletVolume";

/** A sub-card inside a breakdown modal. */
export interface CampaignBreakdownCard {
  label: string;
  value: string;
  caption?: string;
  drillDown?: CampaignMetricKey;
}

/** Template-ready view model for a metric breakdown modal. */
export interface CampaignMetricBreakdown {
  title: string;
  total: string;
  cards: CampaignBreakdownCard[];
}

/** Builds the eight overview cards; cards with an API split open a breakdown. */
export const buildOverviewMetrics = (
  overview: ICampaignOverview | null | undefined,
): IAppMetric[] => [
  {
    label: "Promoters",
    value: formatCount(overview?.promoters),
    description: "Total campaign promoters",
  },
  {
    label: "Audience",
    value: formatCount(overview?.audience),
    description: "Audience registered in this period",
  },
  {
    key: "transactionCount",
    actionable: true,
    label: "Transaction Count",
    value: formatCount(overview?.transactionCount),
    description: "EasyPay and SafeWallet deposits",
  },
  {
    label: "Deposit Counts",
    value: formatCount(overview?.depositCount),
    description: "SafeWallet deposit counts",
  },
  {
    key: "transactionVolume",
    actionable: true,
    label: "Transaction Volume",
    value: formatUsd(overview?.transactionVolume),
    description: "Total transaction volume",
  },
  {
    label: "Deposit Volume",
    value: formatUsd(overview?.depositVolume),
    description: "SafeWallet deposit volume",
  },
  {
    key: "utilityCount",
    actionable: true,
    label: "Utility Count",
    value: formatCount(overview?.utilityCount),
    description: "Airtime and Data counts",
  },
  {
    key: "withdrawalCount",
    actionable: true,
    label: "Withdraw Counts",
    value: formatCount(overview?.withdrawCount),
    description: "Aggregate withdrawal count",
  },
];

/** Copy and value selectors for each breakdown modal. */
const breakdownDefinitions: Record<
  CampaignMetricKey,
  {
    title: string;
    isVolume: boolean;
    total: (breakdown: ICampaignOverviewBreakdown) => IVolumeCount;
    cards: Array<{
      label: string;
      select: (breakdown: ICampaignOverviewBreakdown) => IVolumeCount;
      caption?: string;
      drillDown?: CampaignMetricKey;
    }>;
  }
> = {
  transactionCount: {
    title: "Transaction counts",
    isVolume: false,
    total: (b) => b.transactions,
    cards: [
      { label: "EasyPay Counts", select: (b) => b.transactions.easypay },
      {
        label: "SafeWallet Counts",
        select: (b) => b.transactions.safewallet,
        caption: "SafeWallet cash & Crypto",
        drillDown: "safeWalletCount",
      },
    ],
  },
  transactionVolume: {
    title: "Transaction volume",
    isVolume: true,
    total: (b) => b.transactions,
    cards: [
      { label: "EasyPay volume", select: (b) => b.transactions.easypay },
      {
        label: "SafeWallet volume",
        select: (b) => b.transactions.safewallet,
        caption: "SafeWallet cash & Crypto",
        drillDown: "safeWalletVolume",
      },
    ],
  },
  utilityCount: {
    title: "Utility counts",
    isVolume: false,
    total: (b) => b.utility,
    cards: [
      { label: "Airtime", select: (b) => b.utility.airtime },
      { label: "Data", select: (b) => b.utility.data },
    ],
  },
  withdrawalCount: {
    title: "Withdrawal counts",
    isVolume: false,
    total: (b) => b.withdrawals,
    cards: [
      { label: "Cash", select: (b) => b.withdrawals.cash },
      { label: "Crypto", select: (b) => b.withdrawals.crypto },
    ],
  },
  safeWalletCount: {
    title: "SafeWallet Counts",
    isVolume: false,
    total: (b) => b.transactions.safewallet,
    cards: [
      {
        label: "SafeWallet Cash Counts",
        select: (b) => b.transactions.safewallet.cash,
      },
      {
        label: "SafeWallet Crypto Counts",
        select: (b) => b.transactions.safewallet.crypto,
      },
    ],
  },
  safeWalletVolume: {
    title: "SafeWallet Volume",
    isVolume: true,
    total: (b) => b.transactions.safewallet,
    cards: [
      {
        label: "SafeWallet Cash Volume",
        select: (b) => b.transactions.safewallet.cash,
      },
      {
        label: "SafeWallet Crypto Volume",
        select: (b) => b.transactions.safewallet.crypto,
      },
    ],
  },
};

/**
 * Builds the template-ready breakdown for one metric. Missing API blocks fall
 * back to zero so the modal never reads into undefined data.
 */
export const buildMetricBreakdown = (
  key: CampaignMetricKey,
  breakdown: ICampaignOverviewBreakdown | null | undefined,
): CampaignMetricBreakdown => {
  const definition = breakdownDefinitions[key];
  /** Reads one block, returning zeros when the breakdown is missing or partial. */
  const read = (
    select: (b: ICampaignOverviewBreakdown) => IVolumeCount,
  ): IVolumeCount => {
    if (!breakdown) return { volume: 0, count: 0 };
    try {
      return select(breakdown) ?? { volume: 0, count: 0 };
    } catch {
      return { volume: 0, count: 0 };
    }
  };
  /** Formats a block as currency or count depending on the metric. */
  const format = (block: IVolumeCount) =>
    definition.isVolume ? formatUsd(block.volume) : formatCount(block.count);

  return {
    title: definition.title,
    total: format(read(definition.total)),
    cards: definition.cards.map((card) => ({
      label: card.label,
      value: format(read(card.select)),
      caption: card.caption,
      drillDown: card.drillDown,
    })),
  };
};
