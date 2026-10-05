<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the event attendance table. */
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    aria-label="Loading attendance"
    role="status"
  >
    <div class="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <span class="h-6 w-28 rounded shimmer-bg" />
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span class="h-10 w-full rounded-lg shimmer-bg sm:w-72" />
        <span class="h-10 w-28 rounded-lg shimmer-bg" />
        <span class="h-10 w-36 rounded-lg shimmer-bg" />
      </div>
    </div>
    <div class="space-y-4">
      <div class="h-10 w-full rounded-md shimmer-bg" />
      <div v-for="row in 9" :key="row" class="h-12 w-full rounded-md shimmer-bg" />
    </div>
    <div class="mt-5 flex items-center justify-between">
      <span class="h-4 w-40 rounded shimmer-bg" />
      <span class="h-9 w-64 rounded-lg shimmer-bg" />
    </div>
    <span class="sr-only">Loading attendance...</span>
  </div>
</template>
