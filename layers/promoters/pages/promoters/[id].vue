<script setup lang="ts">
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});

const route = useRoute();

/** Resolves the scalar promoter route parameter used by the fixture lookup. */
const promoterId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
});
</script>

<template>
  <PromoterDetail :promoter-id="promoterId" />
</template>
