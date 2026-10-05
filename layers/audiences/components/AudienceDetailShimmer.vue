<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the audience profile and metric tabs. */
</script>

<template>
  <div
    class="flex w-full flex-col gap-8"
    aria-label="Loading audience details"
    role="status"
  >
    <!-- Profile card -->
    <section
      class="flex items-start gap-4 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <span class="h-14 w-14 shrink-0 rounded-full shimmer-bg" />
      <div class="flex min-w-0 flex-col gap-2.5">
        <div class="flex items-center gap-2">
          <span class="h-6 w-40 rounded-lg shimmer-bg" />
          <span class="h-5 w-14 rounded-full shimmer-bg" />
        </div>
        <span class="h-4 w-24 rounded-md shimmer-bg" />
        <span class="h-3.5 w-96 max-w-full rounded-md shimmer-bg" />
        <span class="h-4 w-72 max-w-full rounded-md shimmer-bg" />
      </div>
    </section>

    <!-- Tab bar and period selector -->
    <div class="flex flex-col gap-4">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex w-fit gap-1 rounded-xl bg-dashboard-bg-dark p-1">
          <span class="h-9 w-28 rounded-lg shimmer-bg" />
          <span class="h-9 w-24 rounded-lg shimmer-bg" />
          <span class="h-9 w-16 rounded-lg shimmer-bg" />
        </div>
        <span class="h-12 w-36 rounded-lg shimmer-bg" />
      </div>

      <div class="border-t border-dashboard-card-border pt-5">
        <AppMetricRowsShimmer :rows="[2, 4]" />
      </div>
    </div>
    <span class="sr-only">Loading audience details...</span>
  </div>
</template>
