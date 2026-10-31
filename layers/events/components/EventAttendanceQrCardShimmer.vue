<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the event check-in QR card. */
</script>

<template>
  <div aria-label="Loading QR code" role="status">
    <section
      class="flex flex-col items-center rounded-2xl border border-dashboard-card-border bg-dashboard-bg px-5 pt-6 pb-8 sm:px-8"
    >
      <div class="mt-8 flex w-full flex-col items-center gap-2.5">
        <span class="h-4 w-36 rounded shimmer-bg" />
        <span class="h-7 w-64 max-w-full rounded-lg shimmer-bg" />
        <span class="h-4 w-40 rounded shimmer-bg" />
        <span class="h-4 w-56 max-w-full rounded shimmer-bg" />
      </div>

      <div class="mx-auto mt-8 w-fit rounded-2xl px-4 pt-4 pb-5">
        <span
          class="block h-[min(60vw,300px)] w-[min(60vw,300px)] rounded-3xl shimmer-bg"
        />
        <div class="mt-5 flex flex-col items-center gap-2">
          <span class="h-4 w-60 max-w-full rounded shimmer-bg" />
          <span class="h-4 w-40 rounded shimmer-bg" />
        </div>
      </div>
    </section>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <span class="h-11 w-full rounded-lg shimmer-bg sm:w-40" />
      <span class="h-11 w-full rounded-lg shimmer-bg sm:w-40" />
    </div>
    <span class="sr-only">Loading QR code...</span>
  </div>
</template>
