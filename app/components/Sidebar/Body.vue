<script setup lang="ts">
import { sidebarLinks } from "~/utils/data/SidebarLinks";

const { minimizeSideBar, closeSidebar } = useSidebarHandler();

const tooltip = ref({
  visible: false,
  name: "",
  top: 0,
  left: 0,
});

const showTooltip = (event: MouseEvent, name: string) => {
  if (!minimizeSideBar.value) return;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltip.value = {
    visible: true,
    name,
    top: rect.top + rect.height / 2,
    left: rect.right + 12,
  };
};

const hideTooltip = () => {
  tooltip.value.visible = false;
};
</script>

<template>
  <div
    class="h-full flex-grow overflow-y-auto"
    :class="{ 'overflow-x-hidden': !minimizeSideBar }"
  >
    <div class="h-full overflow-y-auto p-8">
      <ul
        v-for="(linkGroup, groupIndex) in sidebarLinks"
        :key="groupIndex"
        class="mb-8 flex w-full flex-col text-dashboard-sidebar-text"
        :class="{
          'md:mb-0': minimizeSideBar,
          'md:mb-8': !minimizeSideBar,
        }"
      >
        <li
          v-for="link in linkGroup"
          :key="`${link.type}-${link.name}`"
          :class="{
            'first:mt-0 whitespace-nowrap text-[0.5rem] uppercase tracking-widest':
              link.type === 'heading',
            'mb-3 mt-6': link.type === 'heading' && !minimizeSideBar,
          }"
        >
          <template v-if="link.type === 'heading'">
            <span :class="{ 'md:hidden': minimizeSideBar }">
              {{ link.name }}
            </span>
          </template>

          <NuxtLink
            v-else
            :to="link.route"
            class="sidebar-link group"
            active-class="active"
            :class="{ minimized: minimizeSideBar }"
            @click="closeSidebar"
            @mouseenter="showTooltip($event, link.name)"
            @mouseleave="hideTooltip"
          >
            <span class="flex aspect-square w-5 items-center">
              <Icon :name="link.icon" size="1.2rem" />
            </span>
            <span
              class="whitespace-nowrap"
              :class="{ 'md:hidden': minimizeSideBar }"
            >
              {{ link.name }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="tooltip.visible && minimizeSideBar"
      class="pointer-events-none fixed z-[9999] rounded-lg bg-brand-color-001 px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-color-013 transition-opacity duration-200"
      :style="{
        top: `${tooltip.top}px`,
        left: `${tooltip.left}px`,
        transform: 'translateY(-50%)',
      }"
    >
      {{ tooltip.name }}
    </div>
  </Teleport>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.sidebar-link {
  @apply relative z-[2] flex w-full items-center gap-2 overflow-visible p-3.5 text-sm font-normal capitalize;
  @apply transition duration-500 ease-in-out;
}

.sidebar-link.minimized {
  @apply md:gap-0;
}

.sidebar-link::after {
  content: "";
  @apply absolute top-0 left-0 z-[-1] h-full w-0 rounded-full bg-brand-color-default/10;
  @apply transition-all duration-500 ease-in-out;
}

.sidebar-link:hover,
.sidebar-link.active {
  @apply text-brand-color-default;
}

.sidebar-link:hover::after,
.sidebar-link.active::after {
  @apply w-full;
}

.sidebar-link:focus-visible {
  @apply outline-none ring-2 ring-brand-color-default/30 ring-offset-2 ring-offset-dashboard-bg;
}
</style>
