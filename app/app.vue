<script setup lang="ts">
import { useThemeHandler } from "~/composables/useThemeHandler";

// Initialize theme on app load to ensure saved theme preference is applied immediately
const { initTheme } = useThemeHandler();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <AppToast />
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>
