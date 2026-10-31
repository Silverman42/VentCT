import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

/** External Vent sign-up page linked from the check-in form. Placeholder until the real URL is confirmed. */
export const VENT_SIGN_UP_URL = "https://dashboard.vent.africa/sign-up";

/** Public event details shown when an attendee scans the event QR code. */
export interface IPublicEvent {
  name: string;
  slug: string;
  venue: string | null;
  /** ISO-8601 UTC timestamp. */
  eventDate: string | null;
  description: string | null;
  bannerUrl: string | null;
}

/** Payload submitted when an attendee self-registers for an event. */
export interface IRegisterAttendeePayload {
  name: string;
  email: string;
  phone?: string;
}

/** `attended` when the event auto-checks attendees in on scan, otherwise `not_attended`. */
export type IRegistrationStatus = "attended" | "not_attended";

/** Event summary returned with a successful registration. */
export interface IRegistrationEventSummary {
  name: string;
  venue: string | null;
  eventDate: string | null;
}

/** Attendee record returned after a successful self-registration. */
export interface IRegisteredAttendee {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string | null;
  status: IRegistrationStatus;
  method: string | null;
  event: IRegistrationEventSummary | null;
  /** Link for the "Download the app" call to action. */
  downloadUrl: string | null;
}

/** Data returned with a `409 Conflict` when the attendee is already registered. */
export interface IDuplicateRegistrationData {
  email: string;
  eventName: string;
}

/** Why the public event could not be shown. */
export type IPublicEventError = "not_found" | "failed";

/** Reads the HTTP status code from a failed `$fetch` call. */
const getStatusCode = (error: unknown): number | undefined =>
  (error as { statusCode?: number; status?: number })?.statusCode ??
  (error as { status?: number })?.status;

/** Provides public event QR self-registration state and actions. */
export const useAttendanceFormStore = () => {
  const endpoints = {
    EVENT: (slug: string) => `/public/events/${encodeURIComponent(slug)}`,
    REGISTER: (slug: string) =>
      `/public/events/${encodeURIComponent(slug)}/register`,
  };

  const state = {
    fetchingEvent: useState<boolean>(
      "useAttendanceFormStore.fetchingEvent",
      () => false,
    ),
    registering: useState<boolean>(
      "useAttendanceFormStore.registering",
      () => false,
    ),
    event: useState<IPublicEvent | null>(
      "useAttendanceFormStore.event",
      () => null,
    ),
    eventError: useState<IPublicEventError | null>(
      "useAttendanceFormStore.eventError",
      () => null,
    ),
    registration: useState<IRegisteredAttendee | null>(
      "useAttendanceFormStore.registration",
      () => null,
    ),
  };

  const actions = {
    /**
     * Loads the public details of an event by its slug into `event`.
     * Sets `eventError` to `not_found` for an unknown slug (no toast, the page
     * shows its own state) or `failed` for any other error, then rethrows.
     */
    async fetchEvent(slug: string) {
      state.fetchingEvent.value = true;
      state.eventError.value = null;

      return useApiClientHandler()
        .$apiClient<IResponse<IPublicEvent>>(endpoints.EVENT(slug), {
          method: "GET",
        })
        .then((response) => {
          state.event.value = response.data;
          return response.data;
        })
        .catch((error) => {
          const isNotFound = getStatusCode(error) === 404;
          state.event.value = null;
          state.eventError.value = isNotFound ? "not_found" : "failed";
          ApiErrorHandler(error, !isNotFound, false, "Event fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingEvent.value = false;
        });
    },

    /**
     * Registers (and, when the event allows it, checks in) an attendee.
     * Shows an "Already registered" toast for duplicates and rethrows every failure.
     */
    async registerAttendee(slug: string, payload: IRegisterAttendeePayload) {
      state.registering.value = true;

      const phone = payload.phone?.trim();
      const body: IRegisterAttendeePayload = {
        name: payload.name.trim(),
        email: payload.email.trim(),
        ...(phone ? { phone } : {}),
      };

      return useApiClientHandler()
        .$apiClient<IResponse<IRegisteredAttendee>>(endpoints.REGISTER(slug), {
          method: "POST",
          body,
        })
        .then((response) => {
          state.registration.value = response.data;
          // Dismiss any lingering error toast from a previous attempt.
          useToastHandler().closeToast();
          return response.data;
        })
        .catch((error) => {
          const isDuplicate = getStatusCode(error) === 409;
          ApiErrorHandler(
            error,
            true,
            false,
            isDuplicate ? "Already registered" : "Registration failed",
          );
          throw error;
        })
        .finally(() => {
          state.registering.value = false;
        });
    },

    /** Clears the last registration so the next attendee starts fresh. */
    resetRegistration() {
      state.registration.value = null;
    },
  };

  return {
    ...state,
    ...actions,
  };
};
