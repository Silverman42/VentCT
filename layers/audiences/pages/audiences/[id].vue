<script setup lang="ts">
import type { BreadcrumbData } from "~/utils/types/misc/BreadcrumbData";

/** Route shell for a single audience member's profile and metrics. */
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});

const route = useRoute();

/** Resolves the dynamic audience ID parameter from the active route. */
const audienceId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
});

const breadcrumb: BreadcrumbData[] = [
  {
    name: "Audiences",
    route: "/audiences",
  },
  {
    name: "View Audience",
    route: "",
  },
];
</script>

<template>
  <div class="flex flex-col w-full gap-6">
    <AppBreadcrumb :list="breadcrumb" />
    <AudienceDetail :audience-id="audienceId" />
  </div>
</template>
