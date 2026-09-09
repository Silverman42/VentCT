<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    subCardCount?: number;
    removeBorder?: boolean;
  }>(),
  {
    subCardCount: 1,
    removeBorder: false,
  },
);

const subCardCount = computed(() => props.subCardCount);
</script>
<template>
  <div
    class="border border-dashboard-card-border rounded-xl md:rounded-[20px] p-4 md:p-8 grid grid-cols-1 gap-4"
  >
    <!-- header -->
    <div class="flex justify-between items-center">
      <slot name="header-left"></slot>

      <slot name="header-right"></slot>
    </div>
    <!-- header end -->

    <!-- body -->
    <div class="grid grid-cols-1 gap-6">
      <div
        v-for="(subCard, index) in subCardCount"
        :key="index"
        :class="{
          'border border-dashboard-card-border rounded-[16px] bg-dashboard-bg p-6':
            !props.removeBorder,
        }"
      >
        <slot name="body" :index="index"> </slot>
      </div>

      <div class="w-full">
        <slot name="footer"></slot>
      </div>
    </div>
    <!-- body end-->
  </div>
</template>
