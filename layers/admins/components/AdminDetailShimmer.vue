<script setup lang="ts">
/** Renders a layout-matched loading shimmer for single admin profile views. */
</script>

<template>
  <div class="flex w-full flex-col gap-6" aria-label="Loading admin profile" role="status">
    <!-- Header Shimmer -->
    <div class="flex flex-col gap-2">
      <span class="h-7 w-40 rounded-lg shimmer-bg" />
      <span class="h-4 w-56 rounded-md shimmer-bg" />
    </div>

    <!-- Admin Profile Card Shimmer -->
    <div class="flex flex-col gap-4 border-b border-dashboard-card-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <span class="h-20 w-20 rounded-full shimmer-bg shrink-0" />
        <div class="space-y-2">
          <span class="h-6 w-48 rounded shimmer-bg" />
          <span class="h-4 w-36 rounded shimmer-bg" />
          <span class="h-3 w-64 rounded shimmer-bg" />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-10 w-24 rounded-lg shimmer-bg" />
        <span class="h-10 w-10 rounded-lg shimmer-bg" />
      </div>
    </div>

    <!-- Tabs Shimmer -->
    <div class="h-10 w-64 rounded-xl shimmer-bg" />

    <!-- Tab Content Container Shimmer -->
    <div class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5">
      <div class="space-y-3">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div v-for="row in 6" :key="row" class="h-12 w-full rounded-md shimmer-bg" />
      </div>
    </div>
    <span class="sr-only">Loading admin details...</span>
  </div>
</template>
