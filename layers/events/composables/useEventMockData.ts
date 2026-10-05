import type {
  IAttendanceCandidate,
  IEvent,
  IEventAttendee,
} from "./useEventStore";

const EVENT_FIXTURES: IEvent[] = [
  { id: "evt-001", name: "Outdoor Movie Rave 2.0 (OAU)", target: 500, location: "Obafemi Awolowo University, Ile-Ife, Osun State Nigeria.", date: "2026-10-26", status: "completed" },
  { id: "evt-002", name: "Campus Ambassador", target: 5000, location: "University of Benin, Benin City, Edo State Nigeria.", date: "2026-09-12", status: "completed" },
  { id: "evt-003", name: "Uniport Signups", target: 322, location: "University of Port Harcourt, Rivers State Nigeria.", date: "2026-08-30", status: "completed" },
  { id: "evt-004", name: "De9jaspirit Talent Hunt", target: 5000, location: "Eko Hotel, Victoria Island, Lagos Nigeria.", date: "2026-08-14", status: "completed" },
  { id: "evt-005", name: "De9jaspirit", target: 20000, location: "Tafawa Balewa Square, Lagos Nigeria.", date: "2026-07-21", status: "completed" },
  { id: "evt-006", name: "Merch", target: 5000, location: "University of Lagos, Akoka, Lagos Nigeria.", date: "2026-07-02", status: "completed" },
  { id: "evt-007", name: "FamTam", target: 1000, location: "University of Ibadan, Oyo State Nigeria.", date: "2026-11-18", status: "pending" },
  { id: "evt-008", name: "Outdoor Movie Rave 2.0", target: 5000, location: "University of Benin, Benin City, Edo State Nigeria.", date: "2026-10-26", status: "completed" },
  { id: "evt-009", name: "UNILAG Freshers Fair", target: 2500, location: "University of Lagos, Akoka, Lagos Nigeria.", date: "2026-11-02", status: "pending" },
  { id: "evt-010", name: "Covenant Tech Week", target: 1200, location: "Covenant University, Ota, Ogun State Nigeria.", date: "2026-11-09", status: "pending" },
  { id: "evt-011", name: "ABU Game Night", target: 800, location: "Ahmadu Bello University, Zaria, Kaduna State Nigeria.", date: "2026-06-19", status: "completed" },
  { id: "evt-012", name: "Vent Campus Tour - UNN", target: 3000, location: "University of Nigeria, Nsukka, Enugu State Nigeria.", date: "2026-06-05", status: "completed" },
  { id: "evt-013", name: "LASU Creators Hangout", target: 600, location: "Lagos State University, Ojo, Lagos Nigeria.", date: "2026-11-23", status: "pending" },
  { id: "evt-014", name: "UI Hall Week", target: 1500, location: "University of Ibadan, Oyo State Nigeria.", date: "2026-05-28", status: "completed" },
  { id: "evt-015", name: "FUTA Hackathon", target: 400, location: "Federal University of Technology, Akure, Ondo State Nigeria.", date: "2026-12-01", status: "pending" },
  { id: "evt-016", name: "Afrobeats Night Out", target: 10000, location: "Muri Okunola Park, Lagos Nigeria.", date: "2026-05-10", status: "completed" },
  { id: "evt-017", name: "UNIBEN Sports Fiesta", target: 2000, location: "University of Benin, Benin City, Edo State Nigeria.", date: "2026-04-22", status: "completed" },
  { id: "evt-018", name: "Vent Referral Rally", target: 7500, location: "Online", date: "2026-12-08", status: "pending" },
  { id: "evt-019", name: "Babcock Career Day", target: 900, location: "Babcock University, Ilishan-Remo, Ogun State Nigeria.", date: "2026-04-03", status: "completed" },
  { id: "evt-020", name: "OAU Cultural Day", target: 1800, location: "Obafemi Awolowo University, Ile-Ife, Osun State Nigeria.", date: "2026-12-12", status: "pending" },
  { id: "evt-021", name: "Unilorin Fashion Show", target: 1100, location: "University of Ilorin, Kwara State Nigeria.", date: "2026-03-18", status: "completed" },
  { id: "evt-022", name: "Abuja Campus Connect", target: 4000, location: "University of Abuja, FCT Nigeria.", date: "2026-12-15", status: "pending" },
  { id: "evt-023", name: "Lagos Startup Mixer", target: 350, location: "Yaba, Lagos Nigeria.", date: "2026-03-02", status: "completed" },
  { id: "evt-024", name: "Delsu Comedy Night", target: 1300, location: "Delta State University, Abraka, Delta State Nigeria.", date: "2026-12-19", status: "pending" },
  { id: "evt-025", name: "PH Beach Party", target: 6000, location: "Port Harcourt, Rivers State Nigeria.", date: "2026-02-14", status: "completed" },
  { id: "evt-026", name: "Vent Year End Bash", target: 15000, location: "Eko Convention Centre, Lagos Nigeria.", date: "2026-12-27", status: "pending" },
];

type AttendeeSeed = Pick<
  IEventAttendee,
  "name" | "email" | "phone" | "hasTransaction" | "isVerified"
>;

const ATTENDEE_SEED: AttendeeSeed[] = [
  { name: "Ajremy", email: "ajremy.owolabi@gmail.com", phone: "08131251578", hasTransaction: true, isVerified: true },
  { name: "Kolade Akinrotoye", email: "iamstephenboi@gmail.com", phone: "07039610155", hasTransaction: true, isVerified: true },
  { name: "Audu Victoria", email: "ahappiness359@gmail.com", phone: "07083200491", hasTransaction: false, isVerified: false },
  { name: "Taiwo Racheal", email: "taiworachealmojisola005@gmail.com", phone: "07015009551", hasTransaction: true, isVerified: true },
  { name: "Akinde Taiwo", email: "taiwopeter196010@gmail.com", phone: "08113906359", hasTransaction: false, isVerified: false },
  { name: "Balogun Alexender", email: "alexenderbalogun41@gmail.com", phone: "08131251578", hasTransaction: false, isVerified: false },
  { name: "Ayomide Oyewole", email: "aoyewole430@gmail.com", phone: "08063191219", hasTransaction: true, isVerified: true },
  { name: "Chiamaka Obi", email: "chiamaka.obi@gmail.com", phone: "08022314455", hasTransaction: true, isVerified: true },
  { name: "Ibrahim Musa", email: "ibrahim.musa21@gmail.com", phone: "09031122334", hasTransaction: false, isVerified: true },
  { name: "Grace Eze", email: "grace.eze@yahoo.com", phone: "08164431290", hasTransaction: true, isVerified: false },
  { name: "Tunde Bakare", email: "tbakare@gmail.com", phone: "07066554433", hasTransaction: false, isVerified: false },
  { name: "Ngozi Adeyemi", email: "ngozi.adeyemi@gmail.com", phone: "08099887766", hasTransaction: true, isVerified: true },
];

const CANDIDATE_SEED: Array<Omit<IAttendanceCandidate, "id">> = [
  { name: "Clement Ikhide", email: "clement.ikhide@example.com" },
  { name: "Esther Okafor", email: "esther.okafor@example.com" },
  { name: "Samuel Adebayo", email: "samuel.adebayo@example.com" },
  { name: "Fatima Bello", email: "fatima.bello@example.com" },
  { name: "David Nwosu", email: "david.nwosu@example.com" },
  { name: "Blessing Etim", email: "blessing.etim@example.com" },
];

/** Provides fixture data for the events layer until the events API is available. */
export const useEventMockData = () => {
  /** Builds a deterministic attendee list for one event from the seed rows. */
  const getEventAttendees = (eventId: string): IEventAttendee[] =>
    ATTENDEE_SEED.map((attendee, index) => ({
      ...attendee,
      id: `${eventId}-att-${index + 1}`,
      eventId,
    }));

  /** Builds the not-yet-attended candidates that can be marked for one event. */
  const getAttendanceCandidates = (eventId: string): IAttendanceCandidate[] =>
    CANDIDATE_SEED.map((candidate, index) => ({
      ...candidate,
      id: `${eventId}-cand-${index + 1}`,
    }));

  return {
    eventList: EVENT_FIXTURES.map((event) => ({ ...event })),
    getEventAttendees,
    getAttendanceCandidates,
  };
};
