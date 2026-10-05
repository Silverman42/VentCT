<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the events summary cards and table. */
</script>

<template>
  <div
    class="flex w-full flex-col gap-6"
    aria-label="Loading events"
    role="status"
  >
    <div class="flex flex-col gap-2">
      <span class="h-7 w-32 rounded-lg shimmer-bg" />
      <span class="h-4 w-64 rounded-md shimmer-bg" />
    </div>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article
        v-for="card in 3"
        :key="card"
        class="flex min-h-[104px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <span class="h-3 w-1/3 rounded shimmer-bg" />
        <span class="h-8 w-16 rounded-lg shimmer-bg" />
      </article>
    </section>

    <div
      class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <div
        class="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
      >
        <span class="h-6 w-24 rounded shimmer-bg" />
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span class="h-10 w-full rounded-lg shimmer-bg sm:w-72" />
          <span class="h-10 w-28 rounded-lg shimmer-bg" />
          <span class="h-10 w-28 rounded-lg shimmer-bg" />
          <span class="h-10 w-28 rounded-lg shimmer-bg" />
        </div>
      </div>
      <div class="space-y-4">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div v-for="row in 7" :key="row" class="h-12 w-full rounded-md shimmer-bg" />
      </div>
      <div class="mt-5 flex items-center justify-between">
        <span class="h-4 w-40 rounded shimmer-bg" />
        <span class="h-9 w-64 rounded-lg shimmer-bg" />
      </div>
    </div>
    <span class="sr-only">Loading events...</span>
  </div>
</template>
