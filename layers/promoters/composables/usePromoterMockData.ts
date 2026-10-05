import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Controls the detail dashboard content visible for a promoter. */
export type PromoterDetailTab =
  | "audiences"
  | "transactions"
  | "withdrawal"
  | "utility";

/** Defines the selectable reporting windows in the promoter detail dashboard. */
export type PromoterPeriod = "today" | "7d" | "30d" | "90d";

/** Lists the reporting windows offered by the promoter period dropdown. */
export const promoterPeriodOptions: Array<{
  label: string;
  value: PromoterPeriod;
}> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

/** Represents the visible verification and transaction filtering choices. */
export type PromoterAudienceFilter =
  | "all"
  | "verified"
  | "not-verified"
  | "with-transaction"
  | "without-transaction";

/** Defines a single promoter shown in the list and export picker. */
export interface Promoter extends ITableBodyData {
  id: string;
  name: string;
  profileName: string;
  email: string;
  phone: string;
  campaign: string;
  referralCode: string;
  joinedDate: string;
  avatar: string;
  exportRecordCount: number;
}

/** Defines a summary card displayed in the promoter list or detail view. */
export interface PromoterMetric {
  label: string;
  value: string;
  description: string;
}

/** Defines an audience member attributed to a promoter referral link. */
export interface PromoterAudienceMember extends ITableBodyData {
  id: string;
  name: string;
  campaign: string;
  email: string;
  phone: string;
  hasTransaction: boolean;
  isVerified: boolean;
}

/** Groups the complete fixture dashboard required for one promoter profile. */
export interface PromoterDetails {
  promoter: Promoter;
  referral: {
    appLink: string;
    webLink: string;
  };
  /** Metric cards per tab; each inner array renders as one grid row. */
  metricRows: Record<PromoterDetailTab, PromoterMetric[][]>;
  audience: PromoterAudienceMember[];
}

const mercyAvatar = "/img/promoters/mercy-adaeze.png";
const defaultAvatar = "/img/promoters/mercy-adaeze.png";
const campusCampaign = "Campus Ambassador Program (CAP)";

const promoterSeed: Array<
  Pick<Promoter, "id" | "name" | "email" | "phone" | "campaign" | "referralCode" | "exportRecordCount">
> = [
  { id: "mercy-adaeze", name: "Mercy", email: "mercy@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "Mercy", exportRecordCount: 270 },
  { id: "bolex", name: "Bolex", email: "bolex@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "Bolex", exportRecordCount: 1100 },
  { id: "abishir", name: "Abishir", email: "abishir@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "Abishir", exportRecordCount: 482 },
  { id: "naskid", name: "Naskid", email: "naskid@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "Naskid", exportRecordCount: 503 },
  { id: "trans-connect", name: "Trans Connect", email: "transconnect@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "Transconnect", exportRecordCount: 358 },
  { id: "boluwatife", name: "Boluwatife", email: "bolu@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "Passive", exportRecordCount: 196 },
  { id: "kay-kay", name: "Kay Kay", email: "kaykay@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "CAP", exportRecordCount: 2763 },
  { id: "outdoor-movie-rave", name: "Outdoor Movie Rave 2.0", email: "oau@gmail.com", phone: "08071715904", campaign: "Outdoor Movie Rave 2.0 (OAU)", referralCode: "OMR", exportRecordCount: 461 },
  { id: "afolabi-elijah", name: "Afolabi Elijah", email: "afolabi.elijah@gmail.com", phone: "08071715904", campaign: "Campus Ambassador", referralCode: "Elikeyz", exportRecordCount: 187 },
  { id: "nevila-saiki", name: "Nevila Saiki", email: "nevila.saiki@gmail.com", phone: "08071715904", campaign: "Campus Ambassador", referralCode: "Nevilla", exportRecordCount: 121 },
  { id: "passive", name: "Passive", email: "passive@gmail.com", phone: "08071715904", campaign: "Campus Ambassador", referralCode: "Passive2", exportRecordCount: 146 },
  { id: "cap", name: "CAP", email: "cap@gmail.com", phone: "08071715904", campaign: campusCampaign, referralCode: "CAP2", exportRecordCount: 365 },
  { id: "clement-ikhide", name: "Clement Ikhide", email: "clement@gmail.com", phone: "08071715904", campaign: "Lagos Tech Meetup", referralCode: "Clement", exportRecordCount: 216 },
  { id: "kayode-oluwaseun", name: "Kayode Oluwaseun", email: "kayode@gmail.com", phone: "08071715904", campaign: "Uniport Signups", referralCode: "Kayode", exportRecordCount: 185 },
  { id: "afolabi-olamide", name: "Afolabi Olamide", email: "olamide@gmail.com", phone: "08071715904", campaign: "Campus Ambassador", referralCode: "Olamide", exportRecordCount: 142 },
  { id: "deborah-okafor", name: "Deborah Okafor", email: "deborah@gmail.com", phone: "08071715904", campaign: "Creator Week", referralCode: "Deborah", exportRecordCount: 97 },
  { id: "ifeoma-nwosu", name: "Ifeoma Nwosu", email: "ifeoma@gmail.com", phone: "08071715904", campaign: "Ibadan Campus Tour", referralCode: "Ifeoma", exportRecordCount: 276 },
  { id: "mariam-usman", name: "Mariam Usman", email: "mariam@gmail.com", phone: "08071715904", campaign: "Trade Fair Launch", referralCode: "Mariam", exportRecordCount: 118 },
  { id: "uche-okoro", name: "Uche Okoro", email: "uche@gmail.com", phone: "08071715904", campaign: "City Vibes", referralCode: "Uche", exportRecordCount: 205 },
  { id: "bassey-etim", name: "Bassey Etim", email: "bassey@gmail.com", phone: "08071715904", campaign: "Dreamville Fest", referralCode: "Bassey", exportRecordCount: 164 },
  { id: "zainab-sani", name: "Zainab Sani", email: "zainab@gmail.com", phone: "08071715904", campaign: "Trade Arena", referralCode: "Zainab", exportRecordCount: 154 },
  { id: "tobi-adewale", name: "Tobi Adewale", email: "tobi@gmail.com", phone: "08071715904", campaign: "Aso Rock Connect", referralCode: "Tobi", exportRecordCount: 228 },
  { id: "grace-ibe", name: "Grace Ibe", email: "grace@gmail.com", phone: "08071715904", campaign: "Freshers Connect", referralCode: "Grace", exportRecordCount: 132 },
  { id: "chidera-obi", name: "Chidera Obi", email: "chidera@gmail.com", phone: "08071715904", campaign: "Market Day Rewards", referralCode: "Chidera", exportRecordCount: 169 },
  { id: "victor-okeke", name: "Victor Okeke", email: "victor@gmail.com", phone: "08071715904", campaign: "Citi Campus Bash", referralCode: "Victor", exportRecordCount: 152 },
  { id: "ruth-oyelami", name: "Ruth Oyelami", email: "ruth@gmail.com", phone: "08071715904", campaign: "Campus Pitch", referralCode: "Ruth", exportRecordCount: 211 },
];

/** Creates stable promoter fixtures from the compact source records. */
const buildPromoters = (): Promoter[] =>
  promoterSeed.map((promoter) => ({
    ...promoter,
    profileName: promoter.id === "mercy-adaeze" ? "Mercy Adaeze" : promoter.name,
    joinedDate: "Jun 5, 2026",
    avatar: promoter.id === "mercy-adaeze" ? mercyAvatar : defaultAvatar,
  }));

const promoters = buildPromoters();

const audience: PromoterAudienceMember[] = [
  { id: "audience-1", name: "Musa", campaign: campusCampaign, email: "mercy@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-2", name: "Henry", campaign: campusCampaign, email: "bolex@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-3", name: "Bright", campaign: campusCampaign, email: "naskid@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-4", name: "Christopher", campaign: campusCampaign, email: "transconnect@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-5", name: "Progress", campaign: campusCampaign, email: "bolu@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-6", name: "Ahmed", campaign: campusCampaign, email: "ahmed@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-7", name: "Godswill", campaign: campusCampaign, email: "godswill@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-8", name: "Faith", campaign: campusCampaign, email: "faith@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-9", name: "Orecious", campaign: campusCampaign, email: "orecious@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-10", name: "Saviour", campaign: campusCampaign, email: "saviour@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-11", name: "Ada", campaign: campusCampaign, email: "ada@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-12", name: "Femi", campaign: campusCampaign, email: "femi@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-13", name: "Mariam", campaign: campusCampaign, email: "mariam@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-14", name: "Uche", campaign: campusCampaign, email: "uche@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-15", name: "Bassey", campaign: campusCampaign, email: "bassey@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-16", name: "Zainab", campaign: campusCampaign, email: "zainab@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-17", name: "Olamide", campaign: campusCampaign, email: "olamide@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-18", name: "Tobi", campaign: campusCampaign, email: "tobi@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-19", name: "Grace", campaign: campusCampaign, email: "grace@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-20", name: "Chidera", campaign: campusCampaign, email: "chidera@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-21", name: "Victor", campaign: campusCampaign, email: "victor@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-22", name: "Kemi", campaign: campusCampaign, email: "kemi@gmail.com", phone: "08071715904", hasTransaction: true, isVerified: true },
  { id: "audience-23", name: "Samuel", campaign: campusCampaign, email: "samuel@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
  { id: "audience-24", name: "Deborah", campaign: campusCampaign, email: "deborah@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-25", name: "Ife", campaign: campusCampaign, email: "ife@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: true },
  { id: "audience-26", name: "Ruth", campaign: campusCampaign, email: "ruth@gmail.com", phone: "08071715904", hasTransaction: false, isVerified: false },
];

const metricRows: Record<PromoterDetailTab, PromoterMetric[][]> = {
  audiences: [
    [
      { label: "Total Audience", value: "26", description: "Total number of audience for this promoter" },
      { label: "Verified Audience", value: "20", description: "Number of verified audience" },
      { label: "Unverified Audience", value: "12", description: "Number of unverified audience" },
      { label: "Audience with Transaction", value: "1", description: "Number of audience with transactions" },
    ],
  ],
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

const campaignOptions = Array.from(
  new Set(promoters.map((promoter) => promoter.campaign)),
);

/** Finds one promoter fixture by its route-safe identifier. */
const getPromoterById = (id: string): Promoter | undefined =>
  promoters.find((promoter) => promoter.id === id);

/** Builds the fixture detail dashboard for a valid promoter. */
const getPromoterDetails = (id: string): PromoterDetails | undefined => {
  const promoter = getPromoterById(id);
  if (!promoter) return undefined;

  return {
    promoter,
    referral: {
      appLink: `https://vent.africa.app.link/CH3BsJBE04b?ref=${promoter.referralCode}`,
      webLink: `https://dashboard.vent.africa/auth/sign-up?ref=${promoter.referralCode}`,
    },
    metricRows,
    audience,
  };
};

/** Provides typed mock records while the promoters API contract is unavailable. */
export const usePromoterMockData = () => ({
  promoters,
  audience,
  campaignOptions,
  getPromoterById,
  getPromoterDetails,
});
