<script setup lang="ts">
defineProps<{
  label: string;
  for: string;
  error?: string;
}>();
</script>

<template>
  <div>
    <label :for="for" class="mb-2 block text-base font-medium text-dashboard-heading">
      {{ label }}
    </label>
    <div
      class="promoter-field-control"
      :class="{ 'border-red-500': error }"
    >
      <slot />
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-500" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.promoter-field-control {
  @apply flex min-h-12 w-full items-center rounded-lg border border-input-border bg-dashboard-bg px-3 transition;
  @apply hover:border-brand-color-default focus-within:border-brand-color-default focus-within:ring-4 focus-within:ring-brand-color-011/20;
}

.promoter-field-control :deep(input) {
  @apply h-11 w-full bg-transparent text-base font-medium text-input-text outline-none placeholder:text-input-placeholder disabled:cursor-not-allowed disabled:text-dashboard-text;
}

.promoter-field-control :deep(button) {
  @apply min-h-11;
}
</style>
