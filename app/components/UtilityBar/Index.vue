<script setup lang="ts">
const { openSidebar } = useSidebarHandler();
</script>

<template>
  <aside
    class="sticky top-0 z-10 flex items-stretch justify-between border-b border-dashboard-card-border bg-dashboard-bg/60 p-5 backdrop-blur-md md:px-8 md:py-[0.98rem]"
  >
    <div class="inline-flex items-center">
      <button
        class="flex h-10 aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashboard-card-border text-brand-color-default hover:border-brand-color-default md:hidden"
        type="button"
        aria-label="Open navigation"
        @click="openSidebar"
      >
        <Icon name="vent:menu" size="1.3rem" />
      </button>

      <div class="hidden md:inline-block">
        <button
          class="flex cursor-pointer item-center w-80 gap-2 px-2 py-2 rounded-full border hover:border-brand-color-default hover:ring-brand-color-010/40 ring-4 ring-transparent text-dashboard-text-light border-dashboard-card-border transition ease-in-out duration-300"
        >
          <icon name="vent:search-normal" size="1.3rem"></icon>
          <span class="text-sm">Search anything...</span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- search -->
      <button
        class="md:hidden w-12 h-12 flex items-center rounded-full justify-center border border-dashboard-card-border text-dashboard-heading hover:text-brand-color-default"
      >
        <icon name="vent:search-normal" size="1.3rem"></icon>
      </button>
      <!-- search end-->

      <UtilityBarProfileAction />
    </div>
  </aside>
</template>
