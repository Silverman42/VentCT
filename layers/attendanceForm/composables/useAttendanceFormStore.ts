import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";

/** External Vent sign-up page linked from the check-in form. Placeholder until the real URL is confirmed. */
export const VENT_SIGN_UP_URL = "https://dashboard.vent.africa/sign-up";

/** Public event details shown at the top of the check-in form. */
export interface IPublicEvent {
  id: string;
  name: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  location: string;
}

/** Payload submitted when an attendee checks in to an event. */
export interface ICheckInPayload {
  name: string;
  email: string;
}

/** Attendee record returned after a successful check-in. */
export interface ICheckInResult {
  name: string;
  email: string;
}

/** Simulated network latency for the fixture-backed actions. */
const MOCK_DELAY_MS = 800;

/** Resolves after `ms` milliseconds to simulate a network round trip. */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Provides public event check-in state and fixture-backed actions. */
export const useAttendanceFormStore = () => {
  // Declared for the upcoming backend; the actions below are fixture-backed until it ships.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const endpoints = {
    EVENT: (id: string) => `/events/${id}/public`,
    CHECK_IN: (id: string) => `/events/${id}/check-in`,
  };

  const state = {
    fetchingEvent: useState<boolean>(
      "useAttendanceFormStore.fetchingEvent",
      () => false,
    ),
    checkingIn: useState<boolean>(
      "useAttendanceFormStore.checkingIn",
      () => false,
    ),
    event: useState<IPublicEvent | null>(
      "useAttendanceFormStore.event",
      () => null,
    ),
    eventError: useState<boolean>(
      "useAttendanceFormStore.eventError",
      () => false,
    ),
    registeredEmails: useState<string[]>(
      "useAttendanceFormStore.registeredEmails",
      () => ["clement@example.com"],
    ),
  };

  const actions = {
    /** Loads the public details of an event into `event`; flags `eventError` on failure. */
    async fetchEvent(eventId: string) {
      state.fetchingEvent.value = true;
      state.eventError.value = false;
      try {
        await wait(MOCK_DELAY_MS);
        const event: IPublicEvent = {
          id: eventId,
          name: "Campus Ambassador Program (CAP)",
          date: "2026-07-10",
          location: "University of Benin, Benin City, Edo State Nigeria.",
        };
        state.event.value = event;
        return event;
      } catch (error) {
        state.eventError.value = true;
        ApiErrorHandler(error, true, false, "Event fetch failed");
        throw error;
      } finally {
        state.fetchingEvent.value = false;
      }
    },

    /**
     * Registers an attendee for an event.
     * Shows an error toast and rethrows when the email is already registered.
     */
    async checkIn(eventId: string, payload: ICheckInPayload) {
      state.checkingIn.value = true;
      try {
        await wait(MOCK_DELAY_MS);
        const email = payload.email.trim().toLowerCase();
        if (state.registeredEmails.value.includes(email)) {
          throw {
            statusCode: 409,
            data: { message: "We found an existing record for this email." },
          };
        }
        state.registeredEmails.value.push(email);
        // Dismiss any lingering error toast from a previous attempt.
        useToastHandler().closeToast();
        const result: ICheckInResult = { name: payload.name.trim(), email };
        return result;
      } catch (error) {
        const isDuplicate = (error as { statusCode?: number })?.statusCode === 409;
        ApiErrorHandler(
          error,
          true,
          false,
          isDuplicate ? "You're already registered" : "Registration failed",
        );
        throw error;
      } finally {
        state.checkingIn.value = false;
      }
    },
  };

  return {
    ...state,
    ...actions,
  };
};
