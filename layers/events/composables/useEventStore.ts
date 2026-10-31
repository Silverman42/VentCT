import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import { downloadResponseFile } from "~/utils/helpers/FileDownload";
import { resolveLastPage } from "~/utils/helpers/Pagination";
import type {
  IPaginationMeta,
  IResponse,
} from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Lifecycle status of an event. */
export type EventStatus = "pending" | "running" | "completed" | "cancelled";

/** Status filter applied to the events list. */
export type EventStatusFilter = EventStatus | "all";

/** Display labels for each event status. */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Attendance status of a person recorded against an event. */
export type AttendeeStatus = "attended" | "not_attended";

/** Status filter applied to an event's attendee list. */
export type AttendeeStatusFilter = AttendeeStatus | "all";

/** Spreadsheet formats supported by the attendee export endpoint. */
export type ExportFormat = "xlsx" | "csv";

/** Attendance metrics returned with an event. */
export interface IEventMetrics {
  target: number;
  totalAttendees: number;
  attendedCount: number;
  notAttendedCount: number;
}

/** Event record returned by the events list endpoint. */
export interface IEvent extends ITableBodyData {
  id: string;
  campaignId?: string;
  name: string;
  slug: string;
  description?: string | null;
  venue: string;
  /** ISO date-time string. */
  eventDate: string;
  status: EventStatus;
  statusLabel?: string;
  target: number;
  bannerUrl?: string | null;
  autoCheckInOnScan?: boolean;
  registrationUrl?: string;
  metrics?: IEventMetrics;
  createdAt?: string;
  updatedAt?: string;
}

/** QR code payload embedded in the event detail response. */
export interface IEventQrCodePayload {
  registrationUrl: string;
  qrCodeSvg: string;
}

/** Campaign summary embedded in the event detail response. */
export interface IEventCampaign {
  id: string;
  name: string;
  slug: string | null;
  target: number;
  referralCode: string;
  status: string;
  statusLabel?: string;
  /** `YYYY-MM-DD` date string. */
  startsAt: string | null;
  /** `YYYY-MM-DD` date string. */
  endsAt: string | null;
  promotersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Attendance record embedded in the event detail response. */
export interface IEventAttendance {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  eventId: string;
  eventName: string | null;
  promoterId: string | null;
  promoterName: string | null;
  name: string;
  email: string;
  phone: string | null;
  referralCode: string | null;
  status: AttendeeStatus;
  statusLabel?: string;
  method?: string;
  methodLabel?: string;
  /** ISO date-time string. */
  attendedAt: string | null;
  createdAt?: string;
}

/** Event record returned by the event detail endpoint. */
export interface IEventDetails extends IEvent {
  qrCode?: IEventQrCodePayload | null;
  campaign?: IEventCampaign | null;
  attendances?: IEventAttendance[];
}

/** Event counts by status for the summary cards. */
export interface IEventSummary {
  totalEvents: number;
  pendingCount: number;
  runningCount: number;
  upcomingCount: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
}

/** Response data of the events list endpoint. */
export interface IEventListResponse {
  summary: IEventSummary;
  events: IEvent[];
}

/** Person recorded as an attendee of an event. */
export interface IEventAttendee extends ITableBodyData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: AttendeeStatus;
  statusLabel?: string;
  method?: string;
  methodLabel?: string;
  campaignId?: string | null;
  eventId?: string;
  promoterId?: string | null;
  promoterName?: string | null;
  referralCode?: string | null;
  /** ISO date-time the attendee checked in, or null when not yet attended. */
  attendedAt?: string | null;
  createdAt?: string;
}

/** Attendee counts for an event. */
export interface IEventAttendeeSummary {
  totalAttendees: number;
  attendedCount: number;
  notAttendedCount: number;
}

/** Response data of the event attendees endpoint. */
export interface IEventAttendeeListResponse {
  summary: IEventAttendeeSummary;
  attendees: IEventAttendee[];
}

/** Response data of the standalone event QR code endpoint (camelCase keys). */
export interface IEventQrCode {
  eventId: string;
  name: string;
  slug: string;
  registrationUrl: string;
  qrCodeSvg: string;
}

/** Pagination meta returned with list responses (re-exported for existing imports). */
export type { IPaginationMeta };

/** Payload for creating a new event. */
export interface ICreateEventPayload {
  campaign_id: string;
  name: string;
  venue: string;
  /** Formatted as `YYYY-MM-DD HH:mm:ss`. */
  event_date: string;
  description?: string;
  status: EventStatus;
  target: number;
  banner_url?: string;
  auto_check_in_on_scan: boolean;
}

/** Payload for updating an existing event. */
export type IUpdateEventPayload = Partial<ICreateEventPayload>;

/** Payload for manually creating an attendee for an event. */
export interface ICreateAttendancePayload {
  name: string;
  email: string;
  phone?: string;
}

/** Request body for manually recording an attendance. */
export interface ICreateAttendanceRequest extends ICreateAttendancePayload {
  event_id: string;
  campaign_id?: string;
  status: AttendeeStatus;
}

/** Response data of the manual attendance endpoint. */
export interface ICreatedAttendance {
  id: string;
  name: string;
  email: string;
  status: AttendeeStatus;
}

/** Payload for marking not-attended attendees as attended. */
export interface IMarkAttendancePayload {
  attendance_ids: string[];
}

/** Response data of the batch mark attendance endpoint. */
export interface IMarkAttendanceResponse {
  updated_count: number;
  status: AttendeeStatus;
}

/**
 * Maps a snake_case update payload onto the camelCase event shape so it can be
 * merged into stored events without adding stray request-only keys.
 */
const toEventChanges = (payload: IUpdateEventPayload): Partial<IEvent> => {
  const changes: Partial<IEvent> = {};
  if (payload.campaign_id !== undefined) changes.campaignId = payload.campaign_id;
  if (payload.name !== undefined) changes.name = payload.name;
  if (payload.venue !== undefined) changes.venue = payload.venue;
  if (payload.event_date !== undefined) changes.eventDate = payload.event_date;
  if (payload.description !== undefined) changes.description = payload.description;
  if (payload.status !== undefined) changes.status = payload.status;
  if (payload.target !== undefined) changes.target = payload.target;
  if (payload.banner_url !== undefined) changes.bannerUrl = payload.banner_url;
  if (payload.auto_check_in_on_scan !== undefined) {
    changes.autoCheckInOnScan = payload.auto_check_in_on_scan;
  }
  return changes;
};

/** Returns true when an API error is a 404 Not Found. */
const isNotFoundError = (error: unknown): boolean =>
  (error as { statusCode?: number })?.statusCode === 404;

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the session middleware already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Provides event API state and actions for the events layer. */
export const useEventStore = () => {
  const endpoints = {
    EVENTS: "/admin/events",
    EVENT: (id: string) => `/admin/events/${id}`,
    EVENT_QR_CODE: (id: string) => `/admin/events/${id}/qr-code`,
    EVENT_ATTENDEES: (id: string) => `/admin/events/${id}/attendees`,
    EVENT_EXPORT: (id: string) => `/admin/events/${id}/export`,
    ATTENDANCES: "/admin/attendances",
    MARK_ATTENDANCE: "/admin/attendances/mark-attendance",
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
    fetchingAttendanceCandidates: useState<boolean>(
      "useEventStore.fetchingAttendanceCandidates",
      () => false,
    ),
    fetchingQrCode: useState<boolean>(
      "useEventStore.fetchingQrCode",
      () => false,
    ),
    creatingEvent: useState<boolean>(
      "useEventStore.creatingEvent",
      () => false,
    ),
    updatingEvent: useState<boolean>(
      "useEventStore.updatingEvent",
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
    exportingAttendees: useState<boolean>(
      "useEventStore.exportingAttendees",
      () => false,
    ),

    events: useState<IEvent[]>("useEventStore.events", () => []),
    eventSummary: useState<IEventSummary | null>(
      "useEventStore.eventSummary",
      () => null,
    ),
    eventsPage: useState<number>("useEventStore.eventsPage", () => 1),
    eventsPerPage: useState<number>("useEventStore.eventsPerPage", () => 10),
    eventsLastPage: useState<number>("useEventStore.eventsLastPage", () => 1),
    eventsTotal: useState<number>("useEventStore.eventsTotal", () => 0),
    eventsSearch: useState<string>("useEventStore.eventsSearch", () => ""),
    eventsStatus: useState<EventStatusFilter>(
      "useEventStore.eventsStatus",
      () => "all",
    ),

    selectedEvent: useState<IEventDetails | null>(
      "useEventStore.selectedEvent",
      () => null,
    ),
    eventQrCode: useState<IEventQrCode | null>(
      "useEventStore.eventQrCode",
      () => null,
    ),

    attendees: useState<IEventAttendee[]>(
      "useEventStore.attendees",
      () => [],
    ),
    attendeeSummary: useState<IEventAttendeeSummary | null>(
      "useEventStore.attendeeSummary",
      () => null,
    ),
    attendeesPage: useState<number>("useEventStore.attendeesPage", () => 1),
    attendeesPerPage: useState<number>(
      "useEventStore.attendeesPerPage",
      () => 10,
    ),
    attendeesLastPage: useState<number>(
      "useEventStore.attendeesLastPage",
      () => 1,
    ),
    attendeesTotal: useState<number>("useEventStore.attendeesTotal", () => 0),
    attendeesSearch: useState<string>(
      "useEventStore.attendeesSearch",
      () => "",
    ),
    attendeesStatus: useState<AttendeeStatusFilter>(
      "useEventStore.attendeesStatus",
      () => "all",
    ),
    attendanceCandidates: useState<IEventAttendee[]>(
      "useEventStore.attendanceCandidates",
      () => [],
    ),
  };

  const getters = {
    /** Event counts per status for the index summary cards. */
    eventStats: computed(() => ({
      total: state.eventSummary.value?.totalEvents ?? 0,
      pending: state.eventSummary.value?.pendingCount ?? 0,
      running: state.eventSummary.value?.runningCount ?? 0,
      completed: state.eventSummary.value?.completedCount ?? 0,
      cancelled: state.eventSummary.value?.cancelledCount ?? 0,
    })),

    /** Total attendees of the selected event, preferring the attendee summary. */
    totalAttendees: computed(
      () =>
        state.attendeeSummary.value?.totalAttendees ??
        state.selectedEvent.value?.metrics?.totalAttendees ??
        0,
    ),
  };

  const actions = {
    /**
     * Fetches one page of events using the stored search/status filters.
     * When a page beyond the first comes back empty or fails, the page state
     * rolls back to the last valid page.
     */
    async fetchEvents(page: number = state.eventsPage.value) {
      const previousPage = state.eventsPage.value;
      state.eventsPage.value = page;
      state.fetchingEvents.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IEventListResponse, any, IPaginationMeta>>(
          endpoints.EVENTS,
          {
            method: "GET",
            query: {
              page,
              per_page: state.eventsPerPage.value,
              search: state.eventsSearch.value || undefined,
              status:
                state.eventsStatus.value === "all"
                  ? undefined
                  : state.eventsStatus.value,
            },
          },
        )
        .then((response) => {
          const events = response.data?.events ?? [];
          if (page > 1 && events.length === 0) {
            state.eventsPage.value = previousPage;
            return state.events.value;
          }

          state.events.value = events;
          state.eventSummary.value = response.data?.summary ?? null;
          state.eventsTotal.value = response.meta?.total ?? events.length;
          state.eventsLastPage.value = resolveLastPage(response.meta);
          state.eventsPage.value = response.meta?.currentPage ?? page;
          return events;
        })
        .catch((error) => {
          state.eventsPage.value = previousPage;
          handleApiError(error, "Event fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingEvents.value = false;
        });
    },

    /** Applies a search term, resets to page 1, and refetches events. */
    async setEventsSearch(search: string) {
      state.eventsSearch.value = search.trim();
      return actions.fetchEvents(1);
    },

    /** Applies a status filter, resets to page 1, and refetches events. */
    async setEventsStatus(status: EventStatusFilter) {
      state.eventsStatus.value = status;
      return actions.fetchEvents(1);
    },

    /**
     * Loads one event into `selectedEvent`. Resolves to null without a toast
     * when the event does not exist (404); other failures are rethrown.
     */
    async fetchEventDetails(eventId: string) {
      state.fetchingEventDetails.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IEventDetails>>(endpoints.EVENT(eventId), {
          method: "GET",
        })
        .then((response) => {
          state.selectedEvent.value = response.data ?? null;
          return state.selectedEvent.value;
        })
        .catch((error) => {
          state.selectedEvent.value = null;
          if (isNotFoundError(error)) return null;
          handleApiError(error, "Event detail fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingEventDetails.value = false;
        });
    },

    /** Fetches the event's self check-in QR code and registration link. */
    async fetchEventQrCode(eventId: string) {
      state.fetchingQrCode.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IEventQrCode>>(endpoints.EVENT_QR_CODE(eventId), {
          method: "GET",
        })
        .then((response) => {
          state.eventQrCode.value = response.data ?? null;
          return state.eventQrCode.value;
        })
        .catch((error) => {
          state.eventQrCode.value = null;
          handleApiError(error, "QR code fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingQrCode.value = false;
        });
    },

    /** Creates an event, then reloads the first page of the events list. */
    async createEvent(payload: ICreateEventPayload) {
      state.creatingEvent.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IEvent>>(endpoints.EVENTS, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            `${payload.name} has been created successfully.`,
            "success",
            "Event created",
            "large",
          );
          void actions.fetchEvents(1).catch(() => undefined);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Event creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingEvent.value = false;
        });
    },

    /** Updates an event and merges the changes into the stored records. */
    async updateEvent(eventId: string, payload: IUpdateEventPayload) {
      state.updatingEvent.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<Partial<IEvent>>>(endpoints.EVENT(eventId), {
          method: "PUT",
          body: payload,
        })
        .then((response) => {
          const changes: Partial<IEvent> = {
            ...toEventChanges(payload),
            ...(response.data ?? {}),
          };
          if (state.selectedEvent.value?.id === eventId) {
            state.selectedEvent.value = {
              ...state.selectedEvent.value,
              ...changes,
            };
          }
          state.events.value = state.events.value.map((event) =>
            event.id === eventId ? { ...event, ...changes } : event,
          );
          useToastHandler().triggerToast(
            "The event has been updated successfully.",
            "success",
            "Event updated",
            "large",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Event update failed");
          throw error;
        })
        .finally(() => {
          state.updatingEvent.value = false;
        });
    },

    /** Deletes an event and clears it from the list and selection. */
    async deleteEvent(eventId: string) {
      state.deletingEvent.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<{ id: string }>>(endpoints.EVENT(eventId), {
          method: "DELETE",
        })
        .then(() => {
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
        })
        .catch((error) => {
          handleApiError(error, "Event deletion failed");
          throw error;
        })
        .finally(() => {
          state.deletingEvent.value = false;
        });
    },

    /**
     * Fetches one page of an event's attendees using the stored filters.
     * Rolls the page back when a later page is empty or the request fails.
     */
    async fetchEventAttendees(
      eventId: string,
      page: number = state.attendeesPage.value,
    ) {
      const previousPage = state.attendeesPage.value;
      state.attendeesPage.value = page;
      state.fetchingAttendees.value = true;

      return useApiClientHandler()
        .$apiClient<
          IResponse<IEventAttendeeListResponse, any, IPaginationMeta>
        >(endpoints.EVENT_ATTENDEES(eventId), {
          method: "GET",
          query: {
            page,
            per_page: state.attendeesPerPage.value,
            search: state.attendeesSearch.value || undefined,
            status:
              state.attendeesStatus.value === "all"
                ? undefined
                : state.attendeesStatus.value,
          },
        })
        .then((response) => {
          const attendees = response.data?.attendees ?? [];
          if (page > 1 && attendees.length === 0) {
            state.attendeesPage.value = previousPage;
            return state.attendees.value;
          }

          state.attendees.value = attendees;
          state.attendeeSummary.value = response.data?.summary ?? null;
          state.attendeesTotal.value = response.meta?.total ?? attendees.length;
          state.attendeesLastPage.value = resolveLastPage(response.meta);
          state.attendeesPage.value = response.meta?.currentPage ?? page;
          return attendees;
        })
        .catch((error) => {
          state.attendeesPage.value = previousPage;
          handleApiError(error, "Attendance fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingAttendees.value = false;
        });
    },

    /** Applies an attendee search term, resets to page 1, and refetches. */
    async setAttendeesSearch(eventId: string, search: string) {
      state.attendeesSearch.value = search.trim();
      return actions.fetchEventAttendees(eventId, 1);
    },

    /** Applies an attendee status filter, resets to page 1, and refetches. */
    async setAttendeesStatus(eventId: string, status: AttendeeStatusFilter) {
      state.attendeesStatus.value = status;
      return actions.fetchEventAttendees(eventId, 1);
    },

    /** Clears attendee list filters and data, e.g. when switching events. */
    resetAttendees() {
      state.attendees.value = [];
      state.attendeeSummary.value = null;
      state.attendeesPage.value = 1;
      state.attendeesLastPage.value = 1;
      state.attendeesTotal.value = 0;
      state.attendeesSearch.value = "";
      state.attendeesStatus.value = "all";
    },

    /** Loads not-yet-attended attendees that can be marked as attended. */
    async fetchAttendanceCandidates(eventId: string, search: string = "") {
      state.fetchingAttendanceCandidates.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IEventAttendeeListResponse>>(
          endpoints.EVENT_ATTENDEES(eventId),
          {
            method: "GET",
            query: {
              page: 1,
              per_page: 100,
              status: "not_attended",
              search: search.trim() || undefined,
            },
          },
        )
        .then((response) => {
          state.attendanceCandidates.value = response.data?.attendees ?? [];
          return state.attendanceCandidates.value;
        })
        .catch((error) => {
          handleApiError(error, "Attendee fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingAttendanceCandidates.value = false;
        });
    },

    /** Refreshes the attendee table and event metrics after attendance changes. */
    async refreshAttendance(eventId: string) {
      await Promise.allSettled([
        actions.fetchEventAttendees(eventId),
        actions.fetchEventDetails(eventId),
      ]);
    },

    /** Manually records an attended attendee for the event. */
    async createAttendance(event: IEvent, payload: ICreateAttendancePayload) {
      state.creatingAttendance.value = true;

      const body: ICreateAttendanceRequest = {
        event_id: event.id,
        campaign_id: event.campaignId || undefined,
        name: payload.name,
        email: payload.email,
        phone: payload.phone || undefined,
        status: "attended",
      };

      return useApiClientHandler()
        .$apiClient<IResponse<ICreatedAttendance>>(endpoints.ATTENDANCES, {
          method: "POST",
          body,
        })
        .then((response) => {
          useToastHandler().triggerToast(
            `${payload.name} has been added to this event.`,
            "success",
            "Attendance created",
            "large",
          );
          void actions.refreshAttendance(event.id);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Attendance creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingAttendance.value = false;
        });
    },

    /** Marks the selected attendees as attended and refreshes the event data. */
    async markAttendance(eventId: string, payload: IMarkAttendancePayload) {
      state.markingAttendance.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IMarkAttendanceResponse>>(
          endpoints.MARK_ATTENDANCE,
          {
            method: "POST",
            body: { attendance_ids: payload.attendance_ids, status: "attended" },
          },
        )
        .then((response) => {
          const count =
            response.data?.updated_count ?? payload.attendance_ids.length;
          const markedIds = new Set(payload.attendance_ids);
          state.attendanceCandidates.value =
            state.attendanceCandidates.value.filter(
              (candidate) => !markedIds.has(candidate.id),
            );
          useToastHandler().triggerToast(
            `${count} attendee${count === 1 ? "" : "s"} marked as attended.`,
            "success",
            "Attendance updated",
            "large",
          );
          void actions.refreshAttendance(eventId);
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Mark attendance failed");
          throw error;
        })
        .finally(() => {
          state.markingAttendance.value = false;
        });
    },

    /** Downloads the event's attendees as a spreadsheet using the active filters. */
    async exportEventAttendees(eventId: string, format: ExportFormat) {
      state.exportingAttendees.value = true;

      return useApiClientHandler()
        .$apiClient.raw<Blob>(endpoints.EVENT_EXPORT(eventId), {
          method: "GET",
          responseType: "blob",
          query: {
            format,
            search: state.attendeesSearch.value || undefined,
            status:
              state.attendeesStatus.value === "all"
                ? undefined
                : state.attendeesStatus.value,
          },
        })
        .then((response) =>
          downloadResponseFile({
            responseData: response._data,
            contentType: response.headers.get("content-type"),
            contentDisposition: response.headers.get("content-disposition"),
            fallbackFileName: `${state.selectedEvent.value?.slug || "event"}-attendees`,
            fallbackExtension: format,
          }),
        )
        .catch((error) => {
          handleApiError(error, "Attendee export failed");
          throw error;
        })
        .finally(() => {
          state.exportingAttendees.value = false;
        });
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
