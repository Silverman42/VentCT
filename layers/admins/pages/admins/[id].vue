<script setup lang="ts">
import type { BreadcrumbData } from "~/utils/types/misc/BreadcrumbData";

definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});

const route = useRoute();

/** Resolves the dynamic admin ID parameter from the active route. */
const adminId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
});

const breadcrumb: BreadcrumbData[] = [
  {
    name: "Admins",
    route: "/admins",
  },
  {
    name: "Admin Profile",
    route: "",
  },
];
</script>

<template>
  <div class="flex flex-col w-full gap-6">
    <AppBreadcrumb :list="breadcrumb" />
    <AdminDetail :admin-id="adminId" />
  </div>
</template>
