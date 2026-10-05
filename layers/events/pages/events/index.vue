<script setup lang="ts">
/** Route shell for the events list page. */
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});
</script>

<template>
  <EventList />
</template>
