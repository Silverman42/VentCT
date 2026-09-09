<script setup lang="ts">
import type { TabsData } from "~/utils/types/misc/Tabs";

const props = withDefaults(
  defineProps<{
    tabList: TabsData[];
    defaultTabId: string;
    showIcon?: boolean;
    showCount?: boolean;
    hasSidebar?: boolean;
    headerIsSticky?: boolean;
    tabBtnStyle?: "full-border" | "bottom-border";
  }>(),
  {
    tabList: () => [],
    defaultTabId: "",
    showCount: false,
    showIcon: true,
    hasSidebar: false,
    headerIsSticky: false,
    tabBtnStyle: "full-border",
  },
);

const activeTabId = ref(props.defaultTabId);

const activeTabIndex = ref(0);

const transitionName = ref<"slideInRight" | "slideInLeft">("slideInRight");

const selectTab = (tabId: string, tabIndex: number) => {
  activeTabId.value = tabId;
  activeTabIndex.value = tabIndex;
};

watch(activeTabIndex, (newValue, prevValue) => {
  transitionName.value = newValue >= prevValue ? "slideInLeft" : "slideInRight";
});
</script>
<template>
  <div class="max-w-[90vw] md:max-w-[1600px]">
    <!-- tab heading -->
    <ul
      class="inline-flex items-center w-full border-b min-w-0 border-dashboard-card-border overflow-x-auto snap-x top-1 bg-dashboard-bg z-10"
      :class="{
        sticky: props.headerIsSticky,
        'gap-5': props.tabBtnStyle === 'bottom-border',
        'gap-3': props.tabBtnStyle === 'full-border',
      }"
    >
      <template v-for="(tab, index) in props.tabList" :key="index">
        <li class="inline-block max-w-60 min-w-9 shrink-0">
          <button
            class="tab-btn"
            :class="{
              active: tab.id === activeTabId,
              'tab-btn-border': props.tabBtnStyle === 'full-border',
              'tab-btn': props.tabBtnStyle === 'bottom-border',
            }"
            @click="selectTab(tab.id, index)"
          >
            <i v-if="props.showIcon" class="icon">
              <Icon :name="tab?.icon ?? ''" size="1.2rem"></Icon>
            </i>
            <span class="text">
              {{ tab.name }}
            </span>

            <span
              v-if="props.showCount"
              class="border border-dashboard-card-divider rounded-lg p-2 py-1 text-xs inline-block mb-1"
            >
              {{ tab.counts }}
            </span>
          </button>
        </li>
        <li
          v-if="props.tabBtnStyle === 'bottom-border'"
          class="divider-vertical"
        ></li>
      </template>
    </ul>
    <!-- tab heading end-->

    <!-- tab body -->
    <div class="w-full mt-4 overflow-x-hidden flex flex-col md:flex-row gap-6">
      <div class="w-full" :class="{ 'md:w-[83%]': props.hasSidebar }">
        <Transition :name="transitionName" mode="out-in">
          <slot :name="activeTabId"></slot>
        </Transition>
      </div>

      <!-- sidebar -->
      <div
        v-if="props.hasSidebar"
        class="w-full md:w-[15%] shrink-0 bg-dashboard-bg relative z-[3]"
      >
        <slot name="sidebar"></slot>
      </div>
      <!-- sidebar end-->
    </div>
    <!-- tab body end -->
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.divider-horizontal {
  @apply bg-dashboard-card-border w-full h-0.5;
  border-radius: 100%;
}

.divider-vertical {
  @apply bg-dashboard-card-border h-4 mb-3 w-0.5;
  border-radius: 100%;
}

.divider-vertical:last-child {
  @apply hidden;
}

.tab-btn {
  @apply flex items-center gap-2 border-b-2 border-transparent pb-1 text-dashboard-text cursor-pointer;
  @apply transition-colors ease-in-out duration-300;
}

.tab-btn-border {
  @apply flex items-center gap-2 border rounded-full border-tab-btn-border bg-dashboard-bg py-2 px-4.5 text-dashboard-text cursor-pointer mb-5;
  @apply transition-colors ease-in-out duration-300;
}

.tab-btn .text {
  @apply inline-block pr-2 mb-1.5 text-sm whitespace-nowrap;
}

.tab-btn-border .text {
  @apply inline-block text-sm md:text-base whitespace-nowrap mb-0;
}

.tab-btn:hover,
.tab-btn.active {
  @apply border-b-2 border-brand-color-default;
}

.tab-btn-border:hover,
.tab-btn-border.active {
  @apply border border-brand-color-default bg-brand-color-default;
}

.tab-btn:hover .icon,
.tab-btn.active .icon,
.tab-btn-border:hover .icon,
.tab-btn-border:hover .text,
.tab-btn-border.active .icon,
.tab-btn-border.active .text {
  @apply !text-white;
}

.tab-btn-border .icon {
  @apply h-5;
}

.tab-btn:hover .text,
.tab-btn.active .text,
.tab-btn-border:hover .text,
.tab-btn-border.active .text {
  @apply text-dashboard-heading;
}

.slideInRight-enter-active,
.slideInRight-leave-active {
  transition: all 0.2s ease;
}

.slideInRight-enter-from {
  transform: translateX(-100%);
}

.slideInRight-leave-to {
  transform: translateX(100%);
}

.slideInLeft-enter-active,
.slideInLeft-leave-active {
  transition: all 0.2s ease;
}

.slideInLeft-enter-from {
  transform: translateX(100%);
}

.slideInLeft-leave-to {
  transform: translateX(-100%);
}
</style>
