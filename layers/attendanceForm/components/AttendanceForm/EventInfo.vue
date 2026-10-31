<script setup lang="ts">
import type { IPublicEvent } from "../../composables/useAttendanceFormStore";

const props = defineProps<{
  event: IPublicEvent | null;
}>();

/** Template-ready view of the event with formatted date and fallbacks. */
const eventView = computed(() => {
  const rawDate = props.event?.eventDate ?? "";
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const hasValidDate = !!parsedDate && !Number.isNaN(parsedDate.getTime());
  const venue = props.event?.venue?.trim() ?? "";
  const description = props.event?.description?.trim() ?? "";

  return {
    name: props.event?.name || "Untitled event",
    date: hasValidDate
      ? parsedDate!.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "",
    venue,
    description,
    hasDate: hasValidDate,
    hasVenue: !!venue,
    hasDescription: !!description,
  };
});
</script>
<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-dashboard-heading-blue">You are checking in to</p>
    <h1
      class="text-xl font-semibold uppercase tracking-tight text-dashboard-heading-blue"
    >
      {{ eventView.name }}
    </h1>
    <p
      v-if="eventView.hasDescription"
      class="text-sm text-dashboard-heading-blue"
    >
      {{ eventView.description }}
    </p>
    <div class="flex flex-col gap-2 pt-1 text-sm text-dashboard-heading-blue">
      <p v-if="eventView.hasDate" class="flex items-center gap-2">
        <Icon name="vent:calendar" size="1.1rem" class="shrink-0" />
        <span>{{ eventView.date }}</span>
      </p>
      <p v-if="eventView.hasVenue" class="flex items-start gap-2">
        <Icon name="vent:location" size="1.1rem" class="shrink-0" />
        <span>{{ eventView.venue }}</span>
      </p>
    </div>
  </div>
</template>
