import type { IAppMetric } from "~/utils/types/misc/Metric";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Supported verification status for an audience member. */
export type AudienceStatus = "verified" | "not_verified";

/** Supported verification filter state for audience table filtering. */
export type AudienceVerificationFilter = "all" | "verified" | "not_verified";

/** Supported transaction filter state for audience table filtering. */
export type AudienceTransactionFilter = "all" | "has_transaction" | "no_transaction";

/** Interface representing an audience record in table lists and detail modals. */
export interface IAudienceMember extends ITableBodyData {
  id: string;
  name: string;
  campaign: string;
  email: string;
  phone: string;
  promoter: string;
  hasTransaction: boolean;
  isVerified: boolean;
  joinedDate: string;
}

/** Metric dashboard tabs available on the single audience page. */
export type AudienceDetailTab = "transactions" | "withdrawal" | "utility";

/** Reporting windows available on the single audience page. */
export type AudiencePeriod = "today" | "7d" | "30d" | "90d";

/** Lists the reporting windows offered by the audience period dropdown. */
export const audiencePeriodOptions: Array<{
  label: string;
  value: AudiencePeriod;
}> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

/** Full profile and metric dashboard for a single audience member. */
export interface IAudienceDetails extends IAudienceMember {
  fullName: string;
  level: string;
  country: string;
  countryCode: string;
  lastTransactionDate: string;
  /** Metric cards per tab; each inner array renders as one grid row. */
  metricRows: Record<AudienceDetailTab, IAppMetric[][]>;
}

/** Summary metric structure rendered in top statistics cards. */
export interface IAudienceMetric {
  label: string;
  value: number | string;
  description: string;
}

/** Pre-populated summary statistics mirroring design requirements. */
const audienceMetrics: IAudienceMetric[] = [
  {
    label: "Registered Audience",
    value: "9,879",
    description: "Total number of registered audience",
  },
  {
    label: "Verified Audience",
    value: "6,890",
    description: "Number of verified audience",
  },
  {
    label: "Audience With Transaction",
    value: "1,923",
    description: "Audience with transactions",
  },
  {
    label: "Today's Registration",
    value: "0",
    description: "Number of audience that registered today",
  },
  {
    label: "This Week Registration",
    value: "9",
    description: "Number of audience that registered this week",
  },
  {
    label: "This Month Registration",
    value: "14",
    description: "Number of audience that registered this month",
  },
  {
    label: "This Year Registration",
    value: "1000",
    description: "Number of audience that registered this year",
  },
  {
    label: "Unverified Audience",
    value: "2,989",
    description: "Audience that has not done their verification",
  },
];

/** Mock list of audience members exactly matching design fixture lists. */
const audienceList: IAudienceMember[] = [
  {
    id: "aud-1",
    name: "Musa",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Mercy@gmail.com",
    phone: "08071715904",
    promoter: "Mercy",
    hasTransaction: true,
    isVerified: true,
    joinedDate: "Jun 5, 2026",
  },
  {
    id: "aud-2",
    name: "Henry",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolex@gmail.com",
    phone: "08071715904",
    promoter: "Kay Kay",
    hasTransaction: false,
    isVerified: true,
    joinedDate: "Jun 4, 2026",
  },
  {
    id: "aud-3",
    name: "Bright",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Naskid@gmail.com",
    phone: "08071715904",
    promoter: "Kay Kay",
    hasTransaction: true,
    isVerified: true,
    joinedDate: "Jun 3, 2026",
  },
  {
    id: "aud-4",
    name: "Christopher",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Transconnect@gmail.com",
    phone: "08071715904",
    promoter: "Trans Connect",
    hasTransaction: true,
    isVerified: true,
    joinedDate: "Jun 2, 2026",
  },
  {
    id: "aud-5",
    name: "Progress",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolu@gmail.com",
    phone: "08071715904",
    promoter: "Kay kay",
    hasTransaction: false,
    isVerified: false,
    joinedDate: "Jun 1, 2026",
  },
  {
    id: "aud-6",
    name: "Progress",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolu@gmail.com",
    phone: "08071715904",
    promoter: "Mercy",
    hasTransaction: false,
    isVerified: false,
    joinedDate: "May 29, 2026",
  },
  {
    id: "aud-7",
    name: "Progress",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolu@gmail.com",
    phone: "08071715904",
    promoter: "Mercy",
    hasTransaction: true,
    isVerified: true,
    joinedDate: "May 28, 2026",
  },
  {
    id: "aud-8",
    name: "Progress",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolu@gmail.com",
    phone: "08071715904",
    promoter: "Kay Kay",
    hasTransaction: false,
    isVerified: false,
    joinedDate: "May 25, 2026",
  },
  {
    id: "aud-9",
    name: "Progress",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolu@gmail.com",
    phone: "08071715904",
    promoter: "Trans Connect",
    hasTransaction: false,
    isVerified: true,
    joinedDate: "May 22, 2026",
  },
  {
    id: "aud-10",
    name: "Progress",
    campaign: "Campus Ambassador Program (CAP)",
    email: "Bolu@gmail.com",
    phone: "08071715904",
    promoter: "Mercy",
    hasTransaction: true,
    isVerified: true,
    joinedDate: "May 20, 2026",
  },
  {
    id: "aud-11",
    name: "Amina",
    campaign: "Outdoor Movie Rave 2.0 (OAU)",
    email: "amina@gmail.com",
    phone: "08071715904",
    promoter: "Boluwatife",
    hasTransaction: true,
    isVerified: true,
    joinedDate: "May 18, 2026",
  },
  {
    id: "aud-12",
    name: "Samuel",
    campaign: "Outdoor Movie Rave 2.0 (OAU)",
    email: "samuel@gmail.com",
    phone: "08071715904",
    promoter: "Abishir",
    hasTransaction: false,
    isVerified: true,
    joinedDate: "May 15, 2026",
  },
  {
    id: "aud-13",
    name: "Tobi",
    campaign: "Advert",
    email: "tobi@gmail.com",
    phone: "08071715904",
    promoter: "Naskid",
    hasTransaction: true,
    isVerified: false,
    joinedDate: "May 10, 2026",
  },
];

/** Campaign dropdown selection options for creation forms. */
const campaignOptions = [
  "Outdoor Movie Rave 2.0",
  "Campus Ambassador Program (CAP)",
  "Advert",
  "Campus Ambassador",
  "Uniport Signups",
  "De9jasprit Talent Hunt",
  "Freshers Connect",
];

/** Promoter dropdown selection options for creation forms. */
const promoterOptions = [
  "Mercy",
  "Kay Kay",
  "Trans Connect",
  "Boluwatife",
  "Naskid",
  "Abishir",
  "Bolex",
];

/** Detail fixture metrics mirroring the View Audience designs. */
const audienceDetailMetricRows: Record<AudienceDetailTab, IAppMetric[][]> = {
  transactions: [
    [
      { label: "Total Volume", value: "$10,792", description: "EasyPay and SafeWallet volume" },
      { label: "Transaction counts", value: "220", description: "Total counts for all transactions" },
    ],
    [
      { label: "EasyPay Volume", value: "$5,792", description: "100 transactions completed" },
      { label: "SafeWallet Volume", value: "$5,000", description: "120 transactions completed" },
      { label: "SafeWallet Cash Volume", value: "$2,000", description: "60 transactions completed" },
      { label: "SafeWallet Crypto Volume", value: "$3,000", description: "60 transactions completed" },
    ],
  ],
  withdrawal: [
    [
      { label: "Total Withdrawal", value: "$23,000", description: "100 transactions completed" },
      { label: "Cash Withdrawal", value: "$13,000", description: "62 transactions completed" },
      { label: "Crypto Withdrawal", value: "$10,000", description: "38 transactions completed" },
    ],
  ],
  utility: [
    [
      { label: "Total Utility Volume", value: "$1,000", description: "261 transactions completed" },
      { label: "Airtime", value: "$600", description: "150 transactions completed" },
      { label: "Data", value: "$400", description: "111 transactions completed" },
    ],
  ],
};

/** Extra profile fields keyed by audience ID; unlisted members use defaults. */
const audienceProfileOverrides: Record<string, { fullName: string }> = {
  "aud-1": { fullName: "Ibrahim Musa" },
};

/** Expands a list audience member into the detail fixture shown on its page. */
const buildAudienceDetails = (member: IAudienceMember): IAudienceDetails => {
  return {
    ...member,
    fullName: audienceProfileOverrides[member.id]?.fullName ?? member.name,
    level: member.isVerified ? "Level 2" : "Level 1",
    country: "Nigeria",
    countryCode: "NG",
    lastTransactionDate: member.hasTransaction ? member.joinedDate : "",
    metricRows: audienceDetailMetricRows,
  };
};

/** Composable providing typed audience mock datasets and options. */
export const useAudienceMockData = () => {
  return {
    audienceMetrics,
    audienceList,
    campaignOptions,
    promoterOptions,
    buildAudienceDetails,
  };
};
