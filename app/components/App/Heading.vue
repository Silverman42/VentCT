<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
  }>(),
  {
    title: "",
    subtitle: "",
  },
);
</script>

<template>
  <div class="space-y-0.5">
    <h1
      class="text-xl md:text-2xl font-medium tracking-tight text-dashboard-heading"
    >
      {{ title }}
    </h1>
    <p v-if="subtitle" class="text-dashboard-text text-sm">{{ subtitle }}</p>
  </div>
</template>
