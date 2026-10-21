<script setup lang="ts">
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { EventStatus, IEvent } from "../composables/useEventStore";

interface ModalController {
  open: (event?: IEvent) => Promise<void> | void;
}

const props = defineProps<{
  eventId: string;
}>();

const {
  selectedEvent,
  attendeeSummary,
  fetchingEventDetails,
  fetchingAttendees,
  fetchEventDetails,
  fetchEventAttendees,
  resetAttendees,
} = useEventStore();

const createAttendanceModal = ref<ModalController | null>(null);
const editModal = ref<ModalController | null>(null);
const deleteModal = ref<ModalController | null>(null);
const hasLoaded = ref(false);
const detailsFailed = ref(false);
const attendeesFailed = ref(false);

/** Formats a count for display. */
const formatCount = (value: number): string => value.toLocaleString("en-US");

/** Template-ready view of the selected event with fallbacks for missing fields. */
const eventView = computed(() => {
  const event = selectedEvent.value;
  const metrics = event?.metrics;
  const summary = attendeeSummary.value;
  const target = metrics?.target ?? event?.target ?? 0;

  return {
    exists: Boolean(event),
    name: event?.name ?? "Untitled event",
    venue: event?.venue || "Venue not set",
    date: event?.event_date
      ? DateFormatter.formatWithPattern(event.event_date, "MMM d, yyyy · h:mm a")
      : "Date not set",
    target: formatCount(target),
    status: (event?.status ?? "pending") as EventStatus,
    statusLabel: event?.status_label,
    metricCards: [
      { label: "Target", value: formatCount(target), fromAttendees: false },
      {
        label: "Total Attendees",
        value: formatCount(summary?.total_attendees ?? metrics?.total_attendees ?? 0),
        fromAttendees: true,
      },
      {
        label: "Attended",
        value: formatCount(summary?.attended_count ?? metrics?.attended_count ?? 0),
        fromAttendees: true,
      },
      {
        label: "Not Attended",
        value: formatCount(
          summary?.not_attended_count ?? metrics?.not_attended_count ?? 0,
        ),
        fromAttendees: true,
      },
    ],
  };
});

/** Loads the first page of attendees, recording a failure for the table's error state. */
const loadAttendees = async (): Promise<void> => {
  attendeesFailed.value = false;
  try {
    await fetchEventAttendees(props.eventId, 1);
  } catch {
    attendeesFailed.value = true;
  }
};

/** Loads the event details and, when the event exists, its attendees. */
const loadEvent = async (): Promise<void> => {
  hasLoaded.value = false;
  detailsFailed.value = false;
  resetAttendees();
  try {
    const event = await fetchEventDetails(props.eventId);
    if (event) void loadAttendees();
  } catch {
    detailsFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Opens the Create Attendance modal. */
const openCreateAttendance = (): void => {
  void createAttendanceModal.value?.open();
};

/** Opens the event form prefilled for editing. */
const openEditModal = (): void => {
  if (selectedEvent.value) void editModal.value?.open(selectedEvent.value);
};

/** Opens the Delete Event confirmation modal. */
const openDeleteModal = (): void => {
  void deleteModal.value?.open();
};

watch(() => props.eventId, loadEvent, { immediate: true });
</script>

<template>
  <div class="flex w-full flex-col gap-8">
    <EventDetailShimmer v-if="!hasLoaded" />

    <section
      v-else-if="detailsFailed"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">
        We couldn't load this event
      </h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        Something went wrong while fetching the event details.
      </p>
      <AppButton type="button" size="md" class="mt-5" @click="loadEvent">
        Retry
      </AppButton>
    </section>

    <section
      v-else-if="!eventView.exists"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">
        Event not found
      </h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        This event may have been deleted or the link is incorrect.
      </p>
      <NuxtLink
        to="/events"
        class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
      >
        Back to events
      </NuxtLink>
    </section>

    <template v-else-if="selectedEvent">
      <section class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2
            class="text-2xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ eventView.name }}
          </h2>
          <p
            class="mt-1.5 flex items-center gap-1.5 text-sm text-brand-color-005 dark:text-brand-color-default"
          >
            <Icon name="vent:location" size="1rem" class="shrink-0" />
            <span class="truncate">{{ eventView.venue }}</span>
          </p>
          <div
            class="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-dashboard-text"
          >
            <span class="flex items-center gap-1.5">
              <Icon name="vent:calendar" size="0.95rem" class="shrink-0" />
              {{ eventView.date }}
            </span>
            <EventStatusPill
              :status="eventView.status"
              :status-label="eventView.statusLabel"
            />
          </div>
        </div>

        <EventActionsMenu
          @new-attendance="openCreateAttendance"
          @edit="openEditModal"
          @delete="openDeleteModal"
        />
      </section>

      <section
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Event metrics"
      >
        <article
          v-for="card in eventView.metricCards"
          :key="card.label"
          class="flex min-h-[104px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        >
          <p class="text-xs font-normal text-dashboard-text">
            {{ card.label }}
          </p>
          <span
            v-if="card.fromAttendees && fetchingAttendees && !attendeeSummary"
            class="mt-1 h-8 w-20 rounded-lg shimmer-bg"
          />
          <p
            v-else
            class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ card.value }}
          </p>
        </article>
      </section>

      <EventAttendanceTable
        :event-id="props.eventId"
        :load-failed="attendeesFailed"
        @retry="loadAttendees"
      />

      <EventCreateAttendanceModal
        ref="createAttendanceModal"
        :event="selectedEvent"
      />
      <EventNewModal ref="editModal" />
      <EventDeleteModal ref="deleteModal" :event-id="props.eventId" />
    </template>
  </div>
</template>
