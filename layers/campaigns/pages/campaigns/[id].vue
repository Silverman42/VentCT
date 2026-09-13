<script setup lang="ts">
import type { BreadcrumbData } from "~/utils/types/misc/BreadcrumbData";

definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});

const route = useRoute();

/** Converts the dynamic route parameter into the campaign fixture identifier. */
const campaignId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
});

const breadcrumb: BreadcrumbData[] = [
  {
    name: "Campaigns",
    route: "/campaigns",
  },
  {
    name: `Campaign Detail`,
    route: ``,
  },
];
</script>

<template>
  <div class="flex flex-col w-full gap-8">
    <AppBreadcrumb :list="breadcrumb"></AppBreadcrumb>
    <CampaignDetail :campaign-id="campaignId" />
  </div>
</template>
