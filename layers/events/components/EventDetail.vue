<script setup lang="ts">
import type { EventStatus } from "../composables/useEventStore";

interface ModalController {
  open: () => Promise<void> | void;
}

const props = defineProps<{
  eventId: string;
}>();

const {
  selectedEvent,
  totalAttendees,
  fetchingEventDetails,
  fetchingAttendees,
  fetchEventDetails,
  fetchEventAttendees,
} = useEventStore();

const createAttendanceModal = ref<ModalController | null>(null);
const deleteModal = ref<ModalController | null>(null);
const hasLoaded = ref(false);
const detailsFailed = ref(false);
const attendeesFailed = ref(false);

/** Template-ready view of the selected event with fallbacks for missing fields. */
const eventView = computed(() => {
  const event = selectedEvent.value;
  return {
    exists: Boolean(event),
    name: event?.name ?? "Untitled event",
    location: event?.location || "Location not set",
    target: (event?.target ?? 0).toLocaleString("en-US"),
    status: (event?.status ?? "pending") as EventStatus,
    totalAttendees: totalAttendees.value.toLocaleString("en-US"),
  };
});

/** Loads the event's attendees, recording a failure for the table's error state. */
const loadAttendees = async (): Promise<void> => {
  attendeesFailed.value = false;
  try {
    await fetchEventAttendees(props.eventId);
  } catch {
    attendeesFailed.value = true;
  }
};

/** Loads the event details and, when the event exists, its attendees. */
const loadEvent = async (): Promise<void> => {
  hasLoaded.value = false;
  detailsFailed.value = false;
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

/** Opens the Delete Event confirmation modal. */
const openDeleteModal = (): void => {
  void deleteModal.value?.open();
};

watch(() => props.eventId, loadEvent, { immediate: true });
</script>

<template>
  <div class="flex w-full flex-col gap-8">
    <EventDetailShimmer v-if="fetchingEventDetails || !hasLoaded" />

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
            <span class="truncate">{{ eventView.location }}</span>
          </p>
          <div class="mt-1.5 flex items-center gap-2 text-sm text-dashboard-text">
            <span>Target - {{ eventView.target }}</span>
            <EventStatusPill :status="eventView.status" />
          </div>
        </div>

        <EventActionsMenu
          @new-attendance="openCreateAttendance"
          @delete="openDeleteModal"
        />
      </section>

      <article
        class="flex min-h-[104px] w-full flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 lg:w-1/2"
      >
        <p class="text-xs font-normal text-dashboard-text">Total Attendees</p>
        <span
          v-if="fetchingAttendees"
          class="mt-1 h-8 w-20 rounded-lg shimmer-bg"
        />
        <span
          v-else-if="attendeesFailed"
          class="mt-1 text-2xl font-medium tracking-tight text-dashboard-text"
        >
          —
        </span>
        <p
          v-else
          class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ eventView.totalAttendees }}
        </p>
      </article>

      <EventAttendanceTable
        :event-id="props.eventId"
        :load-failed="attendeesFailed"
        @retry="loadAttendees"
      />

      <EventCreateAttendanceModal
        ref="createAttendanceModal"
        :event="selectedEvent"
      />
      <EventDeleteModal ref="deleteModal" :event-id="props.eventId" />
    </template>
  </div>
</template>
