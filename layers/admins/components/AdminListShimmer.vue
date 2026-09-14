<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the admin table page. */
</script>

<template>
  <div class="flex w-full flex-col gap-6" aria-label="Loading admins" role="status">
    <!-- Header Shimmer -->
    <div class="flex flex-col gap-2">
      <span class="h-7 w-32 rounded-lg shimmer-bg" />
      <span class="h-4 w-64 rounded-md shimmer-bg" />
    </div>

    <!-- Table Container Shimmer -->
    <div class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5">
      <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <span class="h-6 w-24 rounded shimmer-bg" />
        <div class="flex items-center gap-3">
          <span class="h-10 w-64 rounded-lg shimmer-bg" />
          <span class="h-10 w-32 rounded-lg shimmer-bg" />
        </div>
      </div>
      <div class="space-y-3">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div v-for="row in 5" :key="row" class="h-14 w-full rounded-md shimmer-bg" />
      </div>
    </div>
    <span class="sr-only">Loading admin users...</span>
  </div>
</template>
