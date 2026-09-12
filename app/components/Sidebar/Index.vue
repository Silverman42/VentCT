<script setup lang="ts">
const { minimizeSideBar, sidebarOpened } = useSidebarHandler();
</script>

<template>
  <nav
    class="fixed top-0 left-0 z-30 flex h-svh shrink-0 flex-col border-r border-dashboard-card-border bg-dashboard-bg transition-all duration-300 ease-in-out md:sticky"
    :class="{
      'hide-sidebar': !sidebarOpened,
      'minimize-sidebar': minimizeSideBar,
      'maximize-sidebar': !minimizeSideBar,
    }"
    aria-label="Dashboard navigation"
  >
    <SidebarHeader />
    <SidebarBody />
  </nav>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.hide-sidebar {
  @apply translate-x-[-130%] md:translate-x-0;
}

.minimize-sidebar {
  @apply w-full md:w-[120px];
}

.maximize-sidebar {
  @apply w-full md:w-[260px];
}
</style>
