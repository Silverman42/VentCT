<script setup lang="ts">
import type { ColorsType } from "~/utils/types/misc/Colors";

const props = defineProps<{
  color: ColorsType;
}>();
</script>
<template>
  <span :class="props.color" class="inline-flex gap-2 items-stretch">
    <slot></slot>
  </span>
</template>
<style scoped>
@reference "~/assets/css/main.css";

.wedge {
  @apply w-[2px] rounded-full block;
}

.green {
  @apply text-[#00CC2F];
}

.green .wedge {
  @apply bg-[#00CC2F];
}

.blue {
  @apply text-brand-color-default;
}

.blue .wedge {
  @apply bg-brand-color-default;
}

.red {
  @apply text-red-400;
}

.red .wedge {
  @apply bg-red-400;
}

.yellow {
  @apply text-[#FF9E05];
}

.yellow .wedge {
  @apply bg-[#FF9E05];
}

.orange {
  @apply text-orange-default;
}

.orange .wedge {
  @apply bg-orange-default;
}

.gray {
  @apply text-dashboard-heading;
}

.gray .wedge {
  @apply bg-dashboard-heading;
}
</style>
