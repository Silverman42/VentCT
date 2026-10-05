<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the event info and attendee summary. */
</script>

<template>
  <div class="flex w-full flex-col gap-8" aria-label="Loading event details" role="status">
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-2.5">
        <span class="h-7 w-64 rounded-lg shimmer-bg" />
        <span class="h-4 w-80 max-w-full rounded-md shimmer-bg" />
        <div class="flex items-center gap-2">
          <span class="h-4 w-24 rounded-md shimmer-bg" />
          <span class="h-5 w-20 rounded-full shimmer-bg" />
        </div>
      </div>
      <span class="h-9 w-9 shrink-0 rounded-lg shimmer-bg" />
    </div>

    <article
      class="flex min-h-[104px] w-full flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 lg:w-1/2"
    >
      <span class="h-3 w-28 rounded shimmer-bg" />
      <span class="h-8 w-20 rounded-lg shimmer-bg" />
    </article>
    <span class="sr-only">Loading event details...</span>
  </div>
</template>
