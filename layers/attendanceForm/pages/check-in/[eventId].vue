<script setup lang="ts">
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
});

const route = useRoute();

/** Event identifier taken from the QR-code check-in link. */
const eventId = computed(() => String(route.params.eventId ?? ""));
</script>
<template>
  <AttendanceFormCheckIn :eventId="eventId" />
</template>
