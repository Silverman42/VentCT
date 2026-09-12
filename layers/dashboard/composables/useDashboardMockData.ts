/** Available reporting windows for dashboard charts. */
export type DashboardPeriod = "1D" | "1W" | "2W" | "1M";

/** A compact metric shown in the summary-card grid. */
export interface DashboardSummaryMetric {
  label: string;
  value: string;
  description: string;
}

/** A promoter's contribution to the dashboard transaction total. */
export interface DashboardPromoter {
  name: string;
  volume: string;
  contribution: number;
}

/** Line-chart values used by the verification performance card. */
export interface DashboardVerificationSeries {
  labels: string[];
  verifiedUsers: number[];
  usersThatTraded: number[];
  maximum: number;
}

/** Bar-chart values used by the transaction-volume card. */
export interface DashboardTransactionSeries {
  labels: string[];
  transactionVolume: number[];
  counts: number[];
  maximum: number;
}

/** A selectable label/value pair for dashboard reporting windows. */
export interface DashboardPeriodOption {
  value: DashboardPeriod;
  label: DashboardPeriod;
}

const periodOptions: DashboardPeriodOption[] = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "2W", label: "2W" },
  { value: "1M", label: "1M" },
];

const summaryMetrics: DashboardSummaryMetric[] = [
  {
    label: "Total Sign-ups",
    value: "12,470",
    description: "7,890 verified users",
  },
  {
    label: "Active Campaigns",
    value: "26",
    description: "40 total campaigns",
  },
  {
    label: "Total Promoters",
    value: "104",
    description: "Onboarded in Citiservice",
  },
  {
    label: "Total Trading Volume",
    value: "$659,081.83",
    description: "Summation of EasyPay and SafeWallet",
  },
  {
    label: "EasyPay Volume",
    value: "$300,081.83",
    description: "Aggregated payout volume",
  },
  {
    label: "SafeWallet Volume",
    value: "$359,000.00",
    description: "Accumulated deposit",
  },
];

const topPromoters: DashboardPromoter[] = [
  { name: "Obi Kenneth", volume: "$325,890.65", contribution: 49.4 },
  { name: "Anita Oghenero", volume: "$5,987", contribution: 0.9 },
  { name: "Kay Kay", volume: "$8,124", contribution: 1.2 },
  { name: "Clement Ikhide", volume: "$3,097", contribution: 0.4 },
  { name: "Michael A.", volume: "$3,097", contribution: 0.4 },
];

const verificationSeries: Record<DashboardPeriod, DashboardVerificationSeries> = {
  "1D": {
    labels: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
    verifiedUsers: [66, 118, 173, 205, 184, 229],
    usersThatTraded: [4, 9, 15, 18, 15, 25],
    maximum: 300,
  },
  "1W": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    verifiedUsers: [240, 310, 300, 410, 380, 520, 460],
    usersThatTraded: [18, 20, 22, 30, 28, 42, 38],
    maximum: 600,
  },
  "2W": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
    verifiedUsers: [412, 458, 440, 521, 550, 607, 578],
    usersThatTraded: [39, 48, 45, 58, 61, 75, 70],
    maximum: 750,
  },
  "1M": {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    verifiedUsers: [1260, 1490, 1430, 1684, 1602, 1880, 1755],
    usersThatTraded: [142, 174, 167, 206, 196, 238, 226],
    maximum: 2100,
  },
};

const transactionSeries: Record<DashboardPeriod, DashboardTransactionSeries> = {
  "1D": {
    labels: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
    transactionVolume: [0.36, 0.72, 1.03, 0.91, 1.24, 0.66],
    counts: [0.08, 0.13, 0.22, 0.17, 0.29, 0.12],
    maximum: 1.5,
  },
  "1W": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    transactionVolume: [1.6, 0.96, 0.74, 0.91, 0.8, 0.92, 0.59],
    counts: [0.31, 0.09, 0.04, 0.2, 0.2, 0.14, 0.31],
    maximum: 2,
  },
  "2W": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
    transactionVolume: [1.35, 1.08, 1.19, 1.42, 1.27, 1.51, 1.34],
    counts: [0.23, 0.18, 0.21, 0.27, 0.24, 0.31, 0.29],
    maximum: 2,
  },
  "1M": {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    transactionVolume: [1.84, 2.04, 1.93, 2.3, 2.18, 2.48, 2.36],
    counts: [0.33, 0.37, 0.35, 0.42, 0.39, 0.47, 0.44],
    maximum: 3,
  },
};

/**
 * Provides local typed fixtures while the dashboard API is not yet connected.
 */
export const useDashboardMockData = () => {
  return {
    periodOptions,
    summaryMetrics,
    topPromoters,
    promoterTotal: "$659,081.83",
    verificationSeries,
    transactionSeries,
  };
};
