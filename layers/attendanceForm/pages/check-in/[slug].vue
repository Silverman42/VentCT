<script setup lang="ts">
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
});

const route = useRoute();

/** Event slug taken from the QR-code self-registration link. */
const slug = computed(() => {
  const value = route.params.slug;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
});
</script>
<template>
  <AttendanceFormCheckIn :slug="slug" />
</template>
