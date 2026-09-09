<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    subCardCount?: number;
  }>(),
  {
    subCardCount: 1,
  }
);

const isOpen = ref(false);

const subCardCount = computed(() => props.subCardCount);

const toggleCollapsable = () => {
  isOpen.value = !isOpen.value;
};
</script>
<template>
  <div
    class="border border-dashboard-card-border p-2 w-full bg-dashboard-bg-darker rounded-2xl collapsable"
    :class="{ 'gap-1 show': isOpen, 'gap-0': !isOpen }"
  >
    <!-- header -->
    <div class="flex justify-between items-center">
      <slot name="header-left"></slot>

      <div class="flex items-center gap-2">
        <slot name="header-right" :isOpen="isOpen"></slot>

        <button
          @click="toggleCollapsable"
          class="shrink-0 text-dashboard-heading border cursor-pointer bg-dashboard-bg rounded-xl w-10 h-10 flex items-center justify-center py-2 px-2 hover:shadow-2xl hover:shadow-brand-color-010 hover:border-brand-color-default transition-all duration-300 ease-in-out"
          :class="{
            ' border-brand-color-default shadow-2xl shadow-brand-color-010':
              isOpen,
            'border-dashboard-card-border': !isOpen,
          }"
        >
          <i class="block w-6 h-6" v-if="isOpen">
            <icon name="vent:eye-closed" size="1.5rem"></icon>
          </i>

          <i class="block w-6 h-6" v-else>
            <icon name="vent:eye-opened" size="1.5rem"></icon>
          </i>
        </button>

        <slot name="header-right-post-btn" :isOpen="isOpen"></slot>
      </div>
    </div>
    <!-- header end -->

    <!-- body -->
    <div class="grid grid-cols-1 gap-2 collapsable-content">
      <div
        v-for="(subCard, index) in subCardCount"
        :key="index"
        class="border border-dashboard-card-border rounded-[12px] bg-dashboard-bg p-6 md:p-11"
      >
        <slot name="body" :index="index"> </slot>
      </div>
    </div>
    <!-- body end-->
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.collapsable {
  display: grid;
  grid-template-rows: auto 0fr;
  grid-template-columns: 1fr;
  transition: grid-template-rows 0.3s ease;
  overflow: hidden;
}

.collapsable.show {
  grid-template-rows: auto 1fr !important;
  gap: 16px;
}

.collapsable-content {
  overflow: hidden;
}
</style>
