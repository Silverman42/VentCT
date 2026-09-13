<script setup lang="ts">
/** Route shell for the main audience management dashboard. */
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});
</script>

<template>
  <AudienceList />
</template>
