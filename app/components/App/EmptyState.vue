<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    heading?: string;
    emptyTableSubtitle: string;
    height?: string;
    hideImage?: boolean;
  }>(),
  {
    heading: "Nothing to show here!",
    emptyTableSubtitle: "",
    height: "50vh",
    hideImage: false,
  },
);
</script>
<template>
  <div
    class="flex items-center justify-center flex-col py-10 px-4"
    :style="{ minHeight: props.height }"
  >
    <div v-if="!props.hideImage" class="max-w-[286px] w-full mb-3">
      <SvgsEmptyState />
    </div>
    <h1
      class="font-medium tracking-tight text-base text-dashboard-heading mt-1"
    >
      {{ props.heading }}
    </h1>
    <p
      class="font-regular text-sm text-[#B3B3B3] mt-1 text-center max-w-md w-full"
    >
      {{ props.emptyTableSubtitle }}
    </p>
    <div class="pt-4">
      <slot></slot>
    </div>
  </div>
</template>
