<script setup lang="ts">
import type { BreadcrumbData } from "~/utils/types/misc/BreadcrumbData";

/** Route shell for a single event's details and attendance. */
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});

const route = useRoute();

/** Resolves the dynamic event ID parameter from the active route. */
const eventId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
});

const breadcrumb: BreadcrumbData[] = [
  {
    name: "Events",
    route: "/events",
  },
  {
    name: "Event Details",
    route: "",
  },
];
</script>

<template>
  <div class="flex flex-col w-full gap-6">
    <AppBreadcrumb :list="breadcrumb" />
    <EventDetail :event-id="eventId" />
  </div>
</template>
