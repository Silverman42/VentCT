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
  metrics: CampaignMetric[];
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

const campaignMetrics: CampaignMetric[] = [
  { label: "Promoters", value: "7", description: "Total campaign promoters" },
  { label: "Audience", value: "149", description: "Total unique audience" },
  { label: "Verify Audience", value: "119", description: "Unique verified audience" },
  { label: "Total Transactions", value: "4", description: "Total transactions" },
  { label: "Successful Transactions", value: "3", description: "Successful transactions" },
  { label: "EazyPay Volume", value: "$5,221", description: "Aggregated volume across EazyPay" },
  { label: "Safewallet Volume", value: "$6,000", description: "Aggregated volume across Safewallet" },
  { label: "Total Volume", value: "$11,221", description: "Aggregated volume" },
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
    metrics: campaignMetrics,
    promoters: campaignPromoters,
    audience: campaignAudience,
    topPromoters,
    totalVolume: "$11,221",
    performance,
  };
};

/** Provides typed campaign fixtures until the campaign API contract is available. */
export const useCampaignMockData = () => ({
  campaigns,
  campaignMetrics,
  getCampaignById,
  getCampaignDetails,
});
