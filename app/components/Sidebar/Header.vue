<script setup lang="ts">
const { minimizeSideBar, toggleSideBar, closeSidebar } = useSidebarHandler();
</script>

<template>
  <div class="p-8 pb-0 border-b border-dashboard-card-border">
    <div
      class="flex items-center justify-between pb-6"
      :class="{ 'md:justify-center': minimizeSideBar }"
    >
      <img
        src="/img/logo_primary.svg"
        class="w-24"
        alt="Vent"
        :class="{ 'md:hidden': minimizeSideBar }"
      />

      <div class="relative">
        <button
          class="hidden w-[33px] cursor-pointer rounded-lg p-1.5 transition-all duration-300 ease-in-out md:block"
          :class="{
            'bg-brand-color-default md:mb-2': minimizeSideBar,
            'bg-dashboard-header-border': !minimizeSideBar,
          }"
          type="button"
          aria-label="Toggle compact navigation"
          @click="toggleSideBar"
        >
          <span
            class="block aspect-square w-[14px] rounded bg-dashboard-bg transition-all duration-300 ease-in-out"
            :class="{
              'translate-x-1/2': minimizeSideBar,
              'translate-x-0': !minimizeSideBar,
            }"
          />
        </button>

        <button
          class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-dashboard-card-border text-brand-color-default md:hidden"
          type="button"
          aria-label="Close navigation"
          @click="closeSidebar"
        >
          <Icon name="vent:close" size="1.3rem" />
        </button>
      </div>
    </div>
  </div>
</template>
