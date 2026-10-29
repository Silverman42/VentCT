<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the activity log table. */
</script>

<template>
  <div
    class="flex w-full flex-col gap-6"
    aria-label="Loading activity logs"
    role="status"
  >
    <div class="flex flex-col gap-2">
      <span class="h-7 w-40 rounded-lg shimmer-bg" />
      <span class="h-4 w-72 rounded-md shimmer-bg" />
    </div>

    <div
      class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <div
        class="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
      >
        <span class="h-6 w-32 rounded shimmer-bg" />
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span class="h-10 w-full rounded-lg shimmer-bg sm:w-36" />
          <span class="h-10 w-full rounded-lg shimmer-bg sm:w-48" />
          <span class="h-10 w-full rounded-lg shimmer-bg sm:w-28" />
        </div>
      </div>
      <div class="space-y-4">
        <div class="hidden h-10 w-full rounded-md shimmer-bg md:block" />
        <div
          v-for="row in 8"
          :key="row"
          class="h-24 w-full rounded-md shimmer-bg md:h-12"
        />
      </div>
      <div class="mt-5 flex items-center justify-between">
        <span class="h-4 w-40 rounded shimmer-bg" />
        <span class="h-9 w-64 rounded-lg shimmer-bg" />
      </div>
    </div>
    <span class="sr-only">Loading activity logs...</span>
  </div>
</template>
