import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Describes whether an attendee has completed campaign attendance. */
export type AttendanceStatus = "attended" | "not-attended";

/** Identifies the method recorded when an attendance entry is created. */
export type AttendanceMethod = "qr-scan" | "manual";

/** Describes an event shown in the attendance profile activity card. */
export interface AttendanceActivity {
  id: string;
  title: string;
  timestamp: string;
  tone: "info" | "success";
}

/** Represents one locally managed campaign attendance record. */
export interface AttendanceRecord extends ITableBodyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  campaign: string;
  referralCode: string;
  promoter: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  activities: AttendanceActivity[];
}

/** Defines the input accepted by the fixture-backed creation flow. */
export interface CreateAttendancePayload {
  campaign: string;
  method: AttendanceMethod;
  name: string;
  email: string;
  phone: string;
  date: string;
  referralCode: string;
}

/** Defines a batch of candidate records to mark as attended. */
export interface MarkAttendancePayload {
  campaign: string;
  recordIds: string[];
}

/** Supplies the three aggregate values displayed by the attendance index. */
export interface AttendanceSummary {
  totalAttendees: number;
  attended: number;
  notAttended: number;
}

const defaultCampaign = "Outdoor Movie Rave 2.0 (OMR)";

const campaignOptions = [
  defaultCampaign,
  "Campus Ambassador Program (CAP)",
  "OAU Freshers Connect",
  "Lagos Tech Meetup",
];

const attendeeSeed: Array<
  Pick<
    AttendanceRecord,
    "name" | "email" | "phone" | "campaign" | "referralCode" | "promoter" | "status"
  >
> = [
  { name: "Ajremy", email: "ajremy.owolabi@gmail.com", phone: "08131251578", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "attended" },
  { name: "Kolade Akinrotoye", email: "iamstephenboi@gmail.com", phone: "07039610155", campaign: "Campus Ambassador Program (CAP)", referralCode: "CAP", promoter: "Clement", status: "attended" },
  { name: "Audu Victoria", email: "ahappiness359@gmail.com", phone: "07083200491", campaign: defaultCampaign, referralCode: "OAU", promoter: "Obi", status: "not-attended" },
  { name: "Taiwo Racheal", email: "taiworachealmojisola005@gmail.com", phone: "07015009551", campaign: "OAU Freshers Connect", referralCode: "Obi", promoter: "Taiwo", status: "attended" },
  { name: "Akinde Taiwo", email: "taiwopeter196010@gmail.com", phone: "08113906359", campaign: "Campus Ambassador Program (CAP)", referralCode: "CAP", promoter: "Clement", status: "attended" },
  { name: "Balogun Alexander", email: "alexanderbalogun41@gmail.com", phone: "08131251578", campaign: defaultCampaign, referralCode: "Obi", promoter: "Obi", status: "not-attended" },
  { name: "Ayomide Oyewole", email: "aoyewole430@gmail.com", phone: "08063191219", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "attended" },
  { name: "Uzochukwu Best", email: "uzochukwu.best@gmail.com", phone: "08129384114", campaign: "Lagos Tech Meetup", referralCode: "LTM", promoter: "Kay", status: "attended" },
  { name: "Clement Ikhide", email: "clement.ikhide@example.com", phone: "08123456789", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "not-attended" },
  { name: "Favour Oke", email: "favour.oke@example.com", phone: "08045129388", campaign: "OAU Freshers Connect", referralCode: "OAU", promoter: "Taiwo", status: "attended" },
  { name: "Ifeoma Nwosu", email: "ifeoma.nwosu@example.com", phone: "07081234901", campaign: "Lagos Tech Meetup", referralCode: "LTM", promoter: "Kay", status: "attended" },
  { name: "David James", email: "david.james@example.com", phone: "09031254555", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "attended" },
  { name: "Blessing Okafor", email: "blessing.okafor@example.com", phone: "08109001234", campaign: "Campus Ambassador Program (CAP)", referralCode: "CAP", promoter: "Clement", status: "attended" },
  { name: "Olamide Afolabi", email: "olamide.afolabi@example.com", phone: "07034561234", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "attended" },
  { name: "Mariam Usman", email: "mariam.usman@example.com", phone: "08024569876", campaign: "OAU Freshers Connect", referralCode: "OAU", promoter: "Taiwo", status: "attended" },
  { name: "Ruth Oyelami", email: "ruth.oyelami@example.com", phone: "08147890562", campaign: "Lagos Tech Meetup", referralCode: "LTM", promoter: "Kay", status: "attended" },
  { name: "Grace Ibe", email: "grace.ibe@example.com", phone: "07085671234", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "attended" },
  { name: "Samuel Adeyemi", email: "samuel.adeyemi@example.com", phone: "09077234561", campaign: "Campus Ambassador Program (CAP)", referralCode: "CAP", promoter: "Clement", status: "attended" },
  { name: "Zainab Sani", email: "zainab.sani@example.com", phone: "08156789345", campaign: defaultCampaign, referralCode: "OMR", promoter: "Obi", status: "attended" },
  { name: "Tobi Adewale", email: "tobi.adewale@example.com", phone: "07039481234", campaign: "OAU Freshers Connect", referralCode: "OAU", promoter: "Taiwo", status: "attended" },
];

/** Builds a stable fixture record with appropriate registration activity. */
const createFixtureRecord = (
  attendee: (typeof attendeeSeed)[number],
  index: number,
): AttendanceRecord => {
  const createdAt = "2026-06-30 - 09:30 AM";
  const activities: AttendanceActivity[] = [
    {
      id: `activity-${index + 1}-registered`,
      title: `Registered for ${attendee.referralCode}`,
      timestamp: createdAt,
      tone: "info",
    },
  ];

  if (attendee.status === "attended") {
    activities.push({
      id: `activity-${index + 1}-attended`,
      title: "Attendance Marked",
      timestamp: "2026-06-30 - 09:50 AM",
      tone: "success",
    });
  }

  return {
    ...attendee,
    id: `attendance-${index + 1}`,
    createdAt,
    method: "manual",
    activities,
  };
};

const initialRecords = attendeeSeed.map(createFixtureRecord);

/** Converts an ISO date selection into the table and activity timestamp format. */
const formatAttendanceDate = (date: string): string => {
  const dateValue = new Date(`${date}T09:30:00`);

  if (Number.isNaN(dateValue.getTime())) return "—";

  const datePart = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateValue);

  return `${datePart} - 09:30 AM`;
};

/** Creates a route-safe record identifier for a new local attendance entry. */
const createAttendanceId = (name: string): string =>
  `attendance-${name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}`;

/** Provides fixture-backed attendance state and local interaction actions. */
export const useAttendanceStore = () => {
  const state = {
    records: useState<AttendanceRecord[]>(
      "useAttendanceStore.records",
      () => initialRecords.map((record) => ({ ...record, activities: [...record.activities] })),
    ),
    summary: useState<AttendanceSummary>("useAttendanceStore.summary", () => ({
      totalAttendees: 1842,
      attended: 1839,
      notAttended: 3,
    })),
  };

  /** Finds the latest local version of one attendance record. */
  const getAttendanceById = (id: string): AttendanceRecord | undefined =>
    state.records.value.find((record) => record.id === id);

  /** Returns outstanding campaign candidates that may be marked as attended. */
  const getMarkingCandidates = (campaign: string): AttendanceRecord[] =>
    state.records.value.filter(
      (record) => record.campaign === campaign && record.status === "not-attended",
    );

  /** Adds a complete attendance entry to the current local session. */
  const createAttendance = (
    payload: CreateAttendancePayload,
  ): AttendanceRecord => {
    const createdAt = formatAttendanceDate(payload.date);
    const record: AttendanceRecord = {
      id: createAttendanceId(payload.name),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      createdAt,
      campaign: payload.campaign,
      referralCode: payload.referralCode.toLocaleUpperCase(),
      promoter: "—",
      status: "attended",
      method: payload.method,
      activities: [
        {
          id: `activity-${Date.now()}-registered`,
          title: `Registered for ${payload.referralCode.toLocaleUpperCase()}`,
          timestamp: createdAt,
          tone: "info",
        },
        {
          id: `activity-${Date.now()}-attended`,
          title: "Attendance Marked",
          timestamp: createdAt,
          tone: "success",
        },
      ],
    };

    state.records.value = [record, ...state.records.value];
    state.summary.value = {
      ...state.summary.value,
      totalAttendees: state.summary.value.totalAttendees + 1,
      attended: state.summary.value.attended + 1,
    };

    return record;
  };

  /** Marks outstanding candidates and records a timestamped attendance activity. */
  const markAttendance = (payload: MarkAttendancePayload): number => {
    const selectedIds = new Set(payload.recordIds);
    let markedCount = 0;
    const markedAt = "2026-06-30 - 09:50 AM";

    state.records.value = state.records.value.map((record) => {
      const shouldMark =
        selectedIds.has(record.id) &&
        record.campaign === payload.campaign &&
        record.status === "not-attended";

      if (!shouldMark) return record;

      markedCount += 1;
      return {
        ...record,
        status: "attended",
        activities: [
          ...record.activities,
          {
            id: `activity-${record.id}-${Date.now()}`,
            title: "Attendance Marked",
            timestamp: markedAt,
            tone: "success",
          },
        ],
      };
    });

    if (markedCount > 0) {
      state.summary.value = {
        ...state.summary.value,
        attended: state.summary.value.attended + markedCount,
        notAttended: Math.max(0, state.summary.value.notAttended - markedCount),
      };
    }

    return markedCount;
  };

  return {
    ...state,
    campaignOptions,
    defaultCampaign,
    getAttendanceById,
    getMarkingCandidates,
    createAttendance,
    markAttendance,
  };
};
