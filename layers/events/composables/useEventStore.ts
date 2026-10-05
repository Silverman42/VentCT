import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";
import { useEventMockData } from "./useEventMockData";

/** Lifecycle status of an event. */
export type EventStatus = "completed" | "pending" | "running";

/** Display labels for each event status. */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  running: "Running",
};

/** Verification filter applied to an event's attendance list. */
export type AttendanceVerificationFilter = "all" | "verified" | "not_verified";

/** Event record shown on the events list and detail pages. */
export interface IEvent extends ITableBodyData {
  id: string;
  name: string;
  target: number;
  location: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  status: EventStatus;
}

/** Person recorded as attending an event. */
export interface IEventAttendee extends ITableBodyData {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  hasTransaction: boolean;
  isVerified: boolean;
}

/** Registered person who can be marked as attending an event. */
export interface IAttendanceCandidate {
  id: string;
  name: string;
  email: string;
}

/** Counts of events by status for the summary cards. */
export interface IEventStats {
  completed: number;
  pending: number;
  running: number;
}

/** Payload for creating a new event. */
export interface ICreateEventPayload {
  name: string;
  target: number;
  location: string;
  date: string;
  status: EventStatus;
}

/** Payload for manually creating an attendee for an event. */
export interface ICreateAttendancePayload {
  name: string;
  email: string;
}

/** Payload for marking registered candidates as attendees. */
export interface IMarkAttendancePayload {
  candidateIds: string[];
}

/** Provides event state and fixture-backed actions for the events layer. */
export const useEventStore = () => {
  const { eventList, getEventAttendees, getAttendanceCandidates } =
    useEventMockData();

  const endpoints = {
    EVENTS: "/admin/events",
    EVENT: (id: string) => `/admin/events/${id}`,
    EVENT_ATTENDEES: (id: string) => `/admin/events/${id}/attendees`,
    EVENT_MARK_ATTENDANCE: (id: string) => `/admin/events/${id}/attendance`,
    EVENT_QR_CODE: (id: string) => `/admin/events/${id}/qr-code`,
  };

  const state = {
    fetchingEvents: useState<boolean>(
      "useEventStore.fetchingEvents",
      () => false,
    ),
    fetchingEventDetails: useState<boolean>(
      "useEventStore.fetchingEventDetails",
      () => false,
    ),
    fetchingAttendees: useState<boolean>(
      "useEventStore.fetchingAttendees",
      () => false,
    ),
    creatingEvent: useState<boolean>(
      "useEventStore.creatingEvent",
      () => false,
    ),
    deletingEvent: useState<boolean>(
      "useEventStore.deletingEvent",
      () => false,
    ),
    creatingAttendance: useState<boolean>(
      "useEventStore.creatingAttendance",
      () => false,
    ),
    markingAttendance: useState<boolean>(
      "useEventStore.markingAttendance",
      () => false,
    ),
    savingQrCode: useState<boolean>(
      "useEventStore.savingQrCode",
      () => false,
    ),
    events: useState<IEvent[]>("useEventStore.events", () => eventList),
    selectedEvent: useState<IEvent | null>(
      "useEventStore.selectedEvent",
      () => null,
    ),
    attendees: useState<IEventAttendee[]>(
      "useEventStore.attendees",
      () => [],
    ),
    attendanceCandidates: useState<IAttendanceCandidate[]>(
      "useEventStore.attendanceCandidates",
      () => [],
    ),
  };

  const getters = {
    /** Counts events per status for the index summary cards. */
    eventStats: computed<IEventStats>(() =>
      state.events.value.reduce<IEventStats>(
        (stats, event) => {
          stats[event.status] += 1;
          return stats;
        },
        { completed: 0, pending: 0, running: 0 },
      ),
    ),

    /** Number of attendees recorded for the selected event. */
    totalAttendees: computed(() => state.attendees.value.length),
  };

  const actions = {
    /** Loads the event list into state and returns it. */
    async fetchEvents() {
      state.fetchingEvents.value = true;
      try {
        return state.events.value;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Event fetch failed");
        throw error;
      } finally {
        state.fetchingEvents.value = false;
      }
    },

    /** Loads one event into `selectedEvent`; returns null when it does not exist. */
    async fetchEventDetails(eventId: string) {
      state.fetchingEventDetails.value = true;
      try {
        const event =
          state.events.value.find((item) => item.id === eventId) ?? null;
        state.selectedEvent.value = event;
        return event;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Event detail fetch failed");
        throw error;
      } finally {
        state.fetchingEventDetails.value = false;
      }
    },

    /** Loads the attendees and markable candidates for one event. */
    async fetchEventAttendees(eventId: string) {
      state.fetchingAttendees.value = true;
      try {
        state.attendees.value = getEventAttendees(eventId);
        state.attendanceCandidates.value = getAttendanceCandidates(eventId);
        return state.attendees.value;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Attendance fetch failed");
        throw error;
      } finally {
        state.fetchingAttendees.value = false;
      }
    },

    /** Creates an event and prepends it to the event list. */
    async createEvent(payload: ICreateEventPayload) {
      state.creatingEvent.value = true;
      try {
        const newEvent: IEvent = { id: `evt-${Date.now()}`, ...payload };
        state.events.value.unshift(newEvent);
        useToastHandler().triggerToast(
          `${payload.name} has been created successfully.`,
          "success",
          "Event created",
          "large",
        );
        return newEvent;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Event creation failed");
        throw error;
      } finally {
        state.creatingEvent.value = false;
      }
    },

    /** Deletes an event and clears it from the selection; returns true on success. */
    async deleteEvent(eventId: string) {
      state.deletingEvent.value = true;
      try {
        state.events.value = state.events.value.filter(
          (event) => event.id !== eventId,
        );
        if (state.selectedEvent.value?.id === eventId) {
          state.selectedEvent.value = null;
        }
        useToastHandler().triggerToast(
          "The event has been permanently deleted.",
          "success",
          "Event deleted",
          "large",
        );
        return true;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Event deletion failed");
        throw error;
      } finally {
        state.deletingEvent.value = false;
      }
    },

    /** Adds a manually entered attendee to the event's attendance list. */
    async createAttendance(eventId: string, payload: ICreateAttendancePayload) {
      state.creatingAttendance.value = true;
      try {
        const attendee: IEventAttendee = {
          id: `${eventId}-att-${Date.now()}`,
          eventId,
          name: payload.name,
          email: payload.email,
          phone: "—",
          hasTransaction: false,
          isVerified: false,
        };
        state.attendees.value.unshift(attendee);
        useToastHandler().triggerToast(
          `${payload.name} has been added to this event.`,
          "success",
          "Attendance created",
          "large",
        );
        return attendee;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Attendance creation failed");
        throw error;
      } finally {
        state.creatingAttendance.value = false;
      }
    },

    /** Moves the selected candidates into the attendance list; returns the new attendees. */
    async markAttendance(eventId: string, payload: IMarkAttendancePayload) {
      state.markingAttendance.value = true;
      try {
        const selectedIds = new Set(payload.candidateIds);
        const marked = state.attendanceCandidates.value
          .filter((candidate) => selectedIds.has(candidate.id))
          .map<IEventAttendee>((candidate) => ({
            id: `${eventId}-att-${candidate.id}`,
            eventId,
            name: candidate.name,
            email: candidate.email,
            phone: "—",
            hasTransaction: false,
            isVerified: false,
          }));

        state.attendees.value.unshift(...marked);
        state.attendanceCandidates.value =
          state.attendanceCandidates.value.filter(
            (candidate) => !selectedIds.has(candidate.id),
          );

        useToastHandler().triggerToast(
          `${marked.length} attendee${marked.length === 1 ? "" : "s"} marked as attended.`,
          "success",
          "Attendance updated",
          "large",
        );
        return marked;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Mark attendance failed");
        throw error;
      } finally {
        state.markingAttendance.value = false;
      }
    },

    /** Saves the event's check-in QR code so attendees can self-register. */
    async saveEventQrCode(eventId: string) {
      state.savingQrCode.value = true;
      try {
        useToastHandler().triggerToast(
          "The check-in QR code has been saved for this event.",
          "success",
          "QR code saved",
          "large",
        );
        return eventId;
      } catch (error) {
        ApiErrorHandler(error, true, false, "QR code save failed");
        throw error;
      } finally {
        state.savingQrCode.value = false;
      }
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
