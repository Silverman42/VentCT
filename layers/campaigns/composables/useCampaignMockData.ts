import { NumberFormatter } from "~/utils/helpers/NumberFormatter";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Supported lifecycle states for fixture-backed campaigns. */
export type CampaignStatus = "pending" | "running" | "closed";

/** Supported verification filters for a campaign audience. */
export type AudienceVerificationFilter = "all" | "verified" | "not-verified";

/** Supported audience-count filters for campaign promoters. */
export type PromoterAudienceFilter = "all" | "has-audience" | "no-audience";

/** Reporting windows available in the campaign performance chart. */
export type CampaignPeriod = "7D" | "30D" | "90D" | "12M";

/** Represents an individual campaign in the campaign list. */
export interface Campaign extends ITableBodyData {
  id: string;
  name: string;
  target: number;
  status: CampaignStatus;
  referralCode: string;
  eventDate: string;
  location: string;
}

/** A small value card used in campaign list and detail summaries. */
export interface CampaignMetric {
  label: string;
  value: string;
  description?: string;
}

/** Country scopes available in the campaign overview filter. */
export type CampaignCountryFilter = "all" | "NG" | "GH";

/** Date window forwarded to overview queries; ignored by fixtures until the API exists. */
export interface CampaignDateRange {
  start: string;
  end: string;
}

/** Filters applied to the campaign overview metrics. */
export interface CampaignOverviewFilters {
  country: CampaignCountryFilter;
  dateRange?: CampaignDateRange | null;
}

/** Cash and crypto split for SafeWallet-only figures. */
export interface CampaignSafeWalletSplit {
  safeWalletCash: number;
  safeWalletCrypto: number;
}

/** EasyPay and SafeWallet split for transaction figures. */
export interface CampaignProviderSplit extends CampaignSafeWalletSplit {
  easyPay: number;
}

/** Raw overview figures for one country in a campaign. Volumes are in USD. */
export interface CampaignOverviewCountry {
  countryCode: Exclude<CampaignCountryFilter, "all">;
  countryName: string;
  promoters: number;
  audience: { verified: number; unverified: number };
  transactionCount: CampaignProviderSplit;
  transactionVolume: CampaignProviderSplit;
  depositCount: CampaignSafeWalletSplit;
  depositVolume: CampaignSafeWalletSplit;
  utilityCount: { airtime: number; data: number };
  withdrawalCount: CampaignSafeWalletSplit;
}

/** Overview metrics that open a breakdown, including SafeWallet drill-downs. */
export type CampaignMetricKey =
  | "audience"
  | "transactionCount"
  | "transactionVolume"
  | "depositCount"
  | "depositVolume"
  | "utilityCount"
  | "withdrawalCount"
  | "safeWalletCount"
  | "safeWalletVolume";

/** An overview card; cards with a key open a breakdown modal. */
export interface CampaignOverviewMetric extends CampaignMetric {
  description: string;
  key?: CampaignMetricKey;
}

/** A sub-card inside a breakdown modal. */
export interface CampaignBreakdownCard {
  label: string;
  value: string;
  caption?: string;
  drillDown?: CampaignMetricKey;
}

/** One country row inside a breakdown modal. */
export interface CampaignBreakdownCountry {
  name: string;
  value: string;
  percent: number;
  caption: string;
  totalLabel: string;
}

/** Template-ready view model for a metric breakdown modal. */
export interface CampaignMetricBreakdown {
  title: string;
  total: string;
  cards: CampaignBreakdownCard[];
  countryHeading?: string;
  countries: CampaignBreakdownCountry[];
}

/** Represents one promoter attached to a campaign. */
export interface CampaignPromoter extends ITableBodyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  audience: number;
  volume: number;
}

/** Represents one audience member attributed to a campaign promoter. */
export interface CampaignAudienceMember extends ITableBodyData {
  id: string;
  name: string;
  promoter: string;
  email: string;
  phone: string;
  hasTransaction: boolean;
  isVerified: boolean;
}

/** A promoter contribution shown in the campaign volume card. */
export interface CampaignPromoterContribution {
  name: string;
  volume: string;
  contribution: number;
}

/** A single two-series data set displayed in the campaign performance chart. */
export interface CampaignPerformanceSeries {
  labels: string[];
  verifiedUsers: number[];
  usersThatTraded: number[];
  maximum: number;
}

/** Bundles every fixture required by the single-campaign dashboard. */
export interface CampaignDetails {
  campaign: Campaign;
  promoters: CampaignPromoter[];
  audience: CampaignAudienceMember[];
  topPromoters: CampaignPromoterContribution[];
  totalVolume: string;
  performance: Record<CampaignPeriod, CampaignPerformanceSeries>;
}

const campaignSeed: Array<Pick<Campaign, "name" | "target" | "status" | "referralCode">> = [
  { name: "Campus Ambassador Program (CAP)", target: 5000, status: "running", referralCode: "CAP" },
  { name: "Outdoor Movie Rave 2.0 (OAU)", target: 500, status: "running", referralCode: "OAU" },
  { name: "Advert", target: 1000, status: "running", referralCode: "ADVERT" },
  { name: "Campus Ambassador", target: 5000, status: "running", referralCode: "CAMPUS" },
  { name: "Uniport Signups", target: 322, status: "running", referralCode: "UNIPORT" },
  { name: "De9jasprit Talent Hunt", target: 5000, status: "running", referralCode: "TALENT" },
  { name: "De9jasprit", target: 20000, status: "running", referralCode: "DE9JA" },
  { name: "Merch", target: 5000, status: "running", referralCode: "MERCH" },
  { name: "Denzy", target: 5000, status: "running", referralCode: "DENZY" },
  { name: "FamTam", target: 1000, status: "running", referralCode: "FAMTAM" },
  { name: "Freshers Connect", target: 2000, status: "pending", referralCode: "FRESH" },
  { name: "Lagos Tech Meetup", target: 750, status: "pending", referralCode: "LTM" },
  { name: "Trade Fair Launch", target: 1200, status: "closed", referralCode: "TFL" },
  { name: "Ibadan Campus Tour", target: 3000, status: "running", referralCode: "IBCT" },
  { name: "Creator Week", target: 1500, status: "running", referralCode: "CREATOR" },
  { name: "Market Day Rewards", target: 1800, status: "closed", referralCode: "MDR" },
  { name: "Student Rush", target: 10000, status: "running", referralCode: "RUSH" },
  { name: "City Vibes", target: 850, status: "pending", referralCode: "VIBES" },
  { name: "Gburugburu", target: 2700, status: "running", referralCode: "GBR" },
  { name: "Wuse Pop Up", target: 600, status: "closed", referralCode: "WUSE" },
  { name: "Citi Campus Bash", target: 4400, status: "running", referralCode: "CCB" },
  { name: "Aso Rock Connect", target: 1000, status: "running", referralCode: "ASO" },
  { name: "Dreamville Fest", target: 7500, status: "pending", referralCode: "DREAM" },
  { name: "Trade Arena", target: 2250, status: "running", referralCode: "ARENA" },
  { name: "The Pop List", target: 900, status: "closed", referralCode: "POP" },
  { name: "Campus Pitch", target: 5000, status: "running", referralCode: "PITCH" },
];

const defaultCampaignEvent = {
  eventDate: "July 10, 2026",
  location: "University of Benin, Benin City, Edo State, Nigeria.",
};

/** Converts the static campaign seed into records with stable route identifiers. */
const buildCampaigns = (): Campaign[] =>
  campaignSeed.map((campaign, index) => ({
    ...defaultCampaignEvent,
    ...campaign,
    id: index === 0 ? "campus-ambassador-program" : `campaign-${index + 1}`,
  }));

const campaigns = buildCampaigns();

const campaignOverviewCountries: CampaignOverviewCountry[] = [
  {
    countryCode: "NG",
    countryName: "Nigeria",
    promoters: 5,
    audience: { verified: 70, unverified: 32 },
    transactionCount: { easyPay: 41, safeWalletCash: 19, safeWalletCrypto: 15 },
    transactionVolume: {
      easyPay: 4000,
      safeWalletCash: 600,
      safeWalletCrypto: 600,
    },
    depositCount: { safeWalletCash: 18, safeWalletCrypto: 84 },
    depositVolume: { safeWalletCash: 1700, safeWalletCrypto: 2300 },
    utilityCount: { airtime: 57, data: 36 },
    withdrawalCount: { safeWalletCash: 100, safeWalletCrypto: 60 },
  },
  {
    countryCode: "GH",
    countryName: "Ghana",
    promoters: 2,
    audience: { verified: 29, unverified: 18 },
    transactionCount: { easyPay: 24, safeWalletCash: 11, safeWalletCrypto: 9 },
    transactionVolume: {
      easyPay: 500,
      safeWalletCash: 100,
      safeWalletCrypto: 200,
    },
    depositCount: { safeWalletCash: 4, safeWalletCrypto: 16 },
    depositVolume: { safeWalletCash: 500, safeWalletCrypto: 721 },
    utilityCount: { airtime: 15, data: 10 },
    withdrawalCount: { safeWalletCash: 30, safeWalletCrypto: 20 },
  },
];

const campaignCountryOptions: Array<{
  value: CampaignCountryFilter;
  label: string;
}> = [
  { value: "all", label: "All Country" },
  ...campaignOverviewCountries.map((country) => ({
    value: country.countryCode,
    label: country.countryName,
  })),
];

const campaignPromoters: CampaignPromoter[] = [
  { id: "promoter-1", name: "Kay Kay", email: "kaykay@gmail.com", phone: "08087366278", referralCode: "Cap", audience: 150, volume: 8124 },
  { id: "promoter-2", name: "Boluwatife", email: "bolu@gmail.com", phone: "08087366278", referralCode: "Obi", audience: 100, volume: 3097 },
  { id: "promoter-3", name: "Trans Connect", email: "transconnect@gmail.com", phone: "08087366278", referralCode: "Anita", audience: 50, volume: 0 },
  { id: "promoter-4", name: "Naskid", email: "naskid@gmail.com", phone: "08087366278", referralCode: "Clement", audience: 60, volume: 0 },
  { id: "promoter-5", name: "Abishir", email: "abishir@gmail.com", phone: "08087366278", referralCode: "Mikky", audience: 60, volume: 0 },
  { id: "promoter-6", name: "Bolex", email: "bolex@gmail.com", phone: "08087366278", referralCode: "Ayoyo", audience: 60, volume: 0 },
  { id: "promoter-7", name: "Mercy", email: "mercy@gmail.com", phone: "08087366278", referralCode: "Next", audience: 0, volume: 0 },
  { id: "promoter-8", name: "OAU", email: "oau@gmail.com", phone: "08087366278", referralCode: "VECO", audience: 0, volume: 0 },
  { id: "promoter-9", name: "Da Saint", email: "dasaint@gmail.com", phone: "08087366278", referralCode: "Saint24", audience: 0, volume: 0 },
  { id: "promoter-10", name: "NYSC", email: "nysc@gmail.com", phone: "08087366278", referralCode: "NYSC", audience: 0, volume: 0 },
  { id: "promoter-11", name: "Nextgenic", email: "nextgenic@gmail.com", phone: "08087366278", referralCode: "NEXT", audience: 0, volume: 0 },
  { id: "promoter-12", name: "Temi", email: "temi@gmail.com", phone: "08087366278", referralCode: "TEMI", audience: 25, volume: 0 },
];

const campaignAudience: CampaignAudienceMember[] = [
  { id: "audience-1", name: "Musa", promoter: "Kay Kay", email: "mercy@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-2", name: "Henry", promoter: "Boluwatife", email: "bolex@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-3", name: "Bright", promoter: "Kay Kay", email: "naskid@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-4", name: "Christopher", promoter: "Trans Connect", email: "transconnect@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-5", name: "Progress", promoter: "Boluwatife", email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-6", name: "Ahmed", promoter: "Kay Kay", email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-7", name: "Godswill", promoter: "Boluwatife", email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-8", name: "Faith", promoter: "Boluwatife", email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-9", name: "Orecious", promoter: "Kay Kay", email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-10", name: "Saviour", promoter: "Bolex", email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-11", name: "Ada", promoter: "Naskid", email: "ada@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-12", name: "Femi", promoter: "Abishir", email: "femi@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-13", name: "Mariam", promoter: "Kay Kay", email: "mariam@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-14", name: "Uche", promoter: "Boluwatife", email: "uche@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-15", name: "Bassey", promoter: "Trans Connect", email: "bassey@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-16", name: "Zainab", promoter: "Naskid", email: "zainab@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-17", name: "Olamide", promoter: "Abishir", email: "olamide@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-18", name: "Tobi", promoter: "Bolex", email: "tobi@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-19", name: "Grace", promoter: "Mercy", email: "grace@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-20", name: "Chidera", promoter: "OAU", email: "chidera@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-21", name: "Victor", promoter: "Da Saint", email: "victor@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-22", name: "Kemi", promoter: "NYSC", email: "kemi@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-23", name: "Samuel", promoter: "Nextgenic", email: "samuel@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-24", name: "Deborah", promoter: "Kay Kay", email: "deborah@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-25", name: "Ife", promoter: "Boluwatife", email: "ife@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-26", name: "Ruth", promoter: "Bolex", email: "ruth@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
];

const topPromoters: CampaignPromoterContribution[] = [
  { name: "Kay Kay", volume: "$8,124", contribution: 72.3 },
  { name: "Boluwatife", volume: "$3,097", contribution: 27.6 },
  { name: "Trans Connect", volume: "$0", contribution: 0 },
  { name: "Naskid", volume: "$0", contribution: 0 },
  { name: "Abishir", volume: "$0", contribution: 0 },
  { name: "Bolex", volume: "$0", contribution: 0 },
  { name: "Nextgenic", volume: "$0", contribution: 0 },
];

const performance: Record<CampaignPeriod, CampaignPerformanceSeries> = {
  "7D": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    verifiedUsers: [240, 310, 300, 410, 380, 520, 460],
    usersThatTraded: [18, 20, 22, 30, 28, 42, 38],
    maximum: 600,
  },
  "30D": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    verifiedUsers: [620, 810, 760, 940],
    usersThatTraded: [64, 89, 84, 112],
    maximum: 1200,
  },
  "90D": {
    labels: ["Jun", "Jul", "Aug"],
    verifiedUsers: [1640, 2140, 2570],
    usersThatTraded: [178, 263, 328],
    maximum: 3000,
  },
  "12M": {
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    verifiedUsers: [510, 730, 880, 940, 1260, 1480, 1630, 1760, 1840, 2120, 2430, 2620],
    usersThatTraded: [38, 51, 65, 74, 110, 137, 162, 195, 221, 259, 302, 337],
    maximum: 3000,
  },
};

/** Finds one campaign fixture by the route-safe campaign identifier. */
const getCampaignById = (id: string): Campaign | undefined =>
  campaigns.find((campaign) => campaign.id === id);

/** Builds a complete details fixture for any valid campaign list entry. */
const getCampaignDetails = (id: string): CampaignDetails | undefined => {
  const campaign = getCampaignById(id);

  if (!campaign) return undefined;

  return {
    campaign,
    promoters: campaignPromoters,
    audience: campaignAudience,
    topPromoters,
    totalVolume: "$11,221",
    performance,
  };
};

/**
 * Returns the per-country overview rows for a campaign, narrowed by the country filter.
 * `dateRange` is accepted for API parity; fixtures do not vary by date.
 */
const getCampaignOverview = (
  id: string,
  filters: CampaignOverviewFilters,
): CampaignOverviewCountry[] => {
  if (!getCampaignById(id)) return [];
  if (filters.country === "all") return campaignOverviewCountries;
  return campaignOverviewCountries.filter(
    (country) => country.countryCode === filters.country,
  );
};

/** Formats a count with thousands separators. */
const formatCount = (value: number): string => value.toLocaleString("en-US");

/** Formats a USD amount for display, dropping cents on whole numbers. */
const formatUsd = (value: number): string =>
  `$${NumberFormatter.format(value, { decimals: Number.isInteger(value) ? 0 : 2 })}`;

/** Sums a numeric field selected from every overview row. */
const sumRows = (
  rows: CampaignOverviewCountry[],
  select: (row: CampaignOverviewCountry) => number,
): number => rows.reduce((total, row) => total + select(row), 0);

/** Sums the SafeWallet cash and crypto parts of a split. */
const safeWalletTotal = (split: CampaignSafeWalletSplit): number =>
  split.safeWalletCash + split.safeWalletCrypto;

/** Computes a one-decimal percentage, returning 0 when the total is empty. */
const toPercent = (value: number, total: number): number =>
  total > 0 ? Math.round((value / total) * 1000) / 10 : 0;

/** Selects each breakdown's per-country total from a raw overview row. */
const metricTotals: Record<
  CampaignMetricKey,
  (row: CampaignOverviewCountry) => number
> = {
  audience: (row) => row.audience.verified + row.audience.unverified,
  transactionCount: (row) =>
    row.transactionCount.easyPay + safeWalletTotal(row.transactionCount),
  transactionVolume: (row) =>
    row.transactionVolume.easyPay + safeWalletTotal(row.transactionVolume),
  depositCount: (row) => safeWalletTotal(row.depositCount),
  depositVolume: (row) => safeWalletTotal(row.depositVolume),
  utilityCount: (row) => row.utilityCount.airtime + row.utilityCount.data,
  withdrawalCount: (row) => safeWalletTotal(row.withdrawalCount),
  safeWalletCount: (row) => safeWalletTotal(row.transactionCount),
  safeWalletVolume: (row) => safeWalletTotal(row.transactionVolume),
};

/** Builds the eight overview cards from the filtered country rows. */
const getCampaignMetrics = (
  rows: CampaignOverviewCountry[],
): CampaignOverviewMetric[] => {
  /** Sums a breakdown total across the filtered rows. */
  const total = (key: CampaignMetricKey) => sumRows(rows, metricTotals[key]);

  return [
    {
      label: "Promoters",
      value: formatCount(sumRows(rows, (row) => row.promoters)),
      description: "Total campaign promoters",
    },
    {
      key: "audience",
      label: "Audience",
      value: formatCount(total("audience")),
      description: "Total unique audience",
    },
    {
      key: "transactionCount",
      label: "Transaction Count",
      value: formatCount(total("transactionCount")),
      description: "Total transaction counts",
    },
    {
      key: "depositCount",
      label: "Deposit Counts",
      value: formatCount(total("depositCount")),
      description: "Total deposit counts",
    },
    {
      key: "transactionVolume",
      label: "Transaction Volume",
      value: formatUsd(total("transactionVolume")),
      description: "Total transaction volume",
    },
    {
      key: "depositVolume",
      label: "Deposit Volume",
      value: formatUsd(total("depositVolume")),
      description: "Aggregate deposit volume",
    },
    {
      key: "utilityCount",
      label: "Utility Count",
      value: formatCount(total("utilityCount")),
      description: "Airtime and Data counts",
    },
    {
      key: "withdrawalCount",
      label: "Withdraw Counts",
      value: formatCount(total("withdrawalCount")),
      description: "Aggregate withdrawal count",
    },
  ];
};

/** Static copy and sub-card selectors for each breakdown modal. */
const breakdownDefinitions: Record<
  CampaignMetricKey,
  {
    title: string;
    isVolume: boolean;
    countryHeading?: string;
    countryNoun?: string;
    cards: Array<{
      label: string;
      select: (row: CampaignOverviewCountry) => number;
      caption?: string;
      drillDown?: CampaignMetricKey;
    }>;
  }
> = {
  audience: {
    title: "Audiences",
    isVolume: false,
    countryHeading: "Audiences by country",
    countryNoun: "audiences",
    cards: [
      { label: "Verified Audiences", select: (row) => row.audience.verified },
      {
        label: "Unverified Audiences",
        select: (row) => row.audience.unverified,
      },
    ],
  },
  transactionCount: {
    title: "Transaction counts",
    isVolume: false,
    countryHeading: "Transaction count by country",
    countryNoun: "transaction counts",
    cards: [
      {
        label: "EasyPay Counts",
        select: (row) => row.transactionCount.easyPay,
      },
      {
        label: "SafeWallet Counts",
        select: (row) => safeWalletTotal(row.transactionCount),
        caption: "SafeWallet cash & Crypto",
        drillDown: "safeWalletCount",
      },
    ],
  },
  transactionVolume: {
    title: "Transaction volume",
    isVolume: true,
    countryHeading: "Transaction volume by country",
    countryNoun: "transaction volume",
    cards: [
      {
        label: "EasyPay volume",
        select: (row) => row.transactionVolume.easyPay,
      },
      {
        label: "SafeWallet volume",
        select: (row) => safeWalletTotal(row.transactionVolume),
        caption: "SafeWallet cash & Crypto",
        drillDown: "safeWalletVolume",
      },
    ],
  },
  depositCount: {
    title: "Deposit counts",
    isVolume: false,
    countryHeading: "Deposit counts by country",
    countryNoun: "deposit counts",
    cards: [
      {
        label: "SafeWallet Cash",
        select: (row) => row.depositCount.safeWalletCash,
      },
      {
        label: "SafeWallet Crypto",
        select: (row) => row.depositCount.safeWalletCrypto,
      },
    ],
  },
  depositVolume: {
    title: "Deposit volume",
    isVolume: true,
    countryHeading: "Deposit volume by country",
    countryNoun: "deposit volume",
    cards: [
      {
        label: "SafeWallet Cash",
        select: (row) => row.depositVolume.safeWalletCash,
      },
      {
        label: "SafeWallet Crypto",
        select: (row) => row.depositVolume.safeWalletCrypto,
      },
    ],
  },
  utilityCount: {
    title: "Utility counts",
    isVolume: false,
    countryHeading: "Utility counts by country",
    countryNoun: "utility counts",
    cards: [
      { label: "Airtime", select: (row) => row.utilityCount.airtime },
      { label: "Data", select: (row) => row.utilityCount.data },
    ],
  },
  withdrawalCount: {
    title: "Withdrawal counts",
    isVolume: false,
    countryHeading: "Withdrawal counts by country",
    countryNoun: "withdrawal counts",
    cards: [
      {
        label: "SafeWallet Cash",
        select: (row) => row.withdrawalCount.safeWalletCash,
      },
      {
        label: "SafeWallet Crypto",
        select: (row) => row.withdrawalCount.safeWalletCrypto,
      },
    ],
  },
  safeWalletCount: {
    title: "SafeWallet Counts",
    isVolume: false,
    cards: [
      {
        label: "SafeWallet Cash Counts",
        select: (row) => row.transactionCount.safeWalletCash,
      },
      {
        label: "SafeWallet Crypto Counts",
        select: (row) => row.transactionCount.safeWalletCrypto,
      },
    ],
  },
  safeWalletVolume: {
    title: "SafeWallet Volume",
    isVolume: true,
    cards: [
      {
        label: "SafeWallet Cash Volume",
        select: (row) => row.transactionVolume.safeWalletCash,
      },
      {
        label: "SafeWallet Crypto Volume",
        select: (row) => row.transactionVolume.safeWalletCrypto,
      },
    ],
  },
};

/** Builds the template-ready breakdown for one metric over the filtered country rows. */
const getMetricBreakdown = (
  key: CampaignMetricKey,
  rows: CampaignOverviewCountry[],
): CampaignMetricBreakdown => {
  const definition = breakdownDefinitions[key];
  /** Formats a value as currency or count depending on the metric. */
  const format = (value: number) =>
    definition.isVolume ? formatUsd(value) : formatCount(value);
  const total = sumRows(rows, metricTotals[key]);

  return {
    title: definition.title,
    total: format(total),
    cards: definition.cards.map((card) => ({
      label: card.label,
      value: format(sumRows(rows, card.select)),
      caption: card.caption,
      drillDown: card.drillDown,
    })),
    countryHeading: definition.countryHeading,
    countries: definition.countryHeading
      ? rows.map((row) => {
          const value = metricTotals[key](row);
          const percent = toPercent(value, total);
          return {
            name: row.countryName,
            value: format(value),
            percent,
            caption: `${percent}% of total ${definition.countryNoun}`,
            totalLabel: `out of ${format(total)}`,
          };
        })
      : [],
  };
};

/** Provides typed campaign fixtures until the campaign API contract is available. */
export const useCampaignMockData = () => ({
  campaigns,
  campaignCountryOptions,
  getCampaignById,
  getCampaignDetails,
  getCampaignOverview,
  getCampaignMetrics,
  getMetricBreakdown,
});
