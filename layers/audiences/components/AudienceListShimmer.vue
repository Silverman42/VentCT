<script setup lang="ts">
/** Renders a layout-matched loading shimmer for audience cards and table rows. */
</script>

<template>
  <div class="flex w-full flex-col gap-6" aria-label="Loading audience details" role="status">
    <!-- Shimmer for top heading -->
    <div class="flex flex-col gap-2">
      <span class="h-7 w-48 rounded-lg shimmer-bg" />
      <span class="h-4 w-96 rounded-md shimmer-bg" />
    </div>

    <!-- Shimmer for summary metric cards (2 rows x 4 cols) -->
    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading metrics">
      <article
        v-for="card in 8"
        :key="card"
        class="flex min-h-[116px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <span class="h-3 w-2/3 rounded shimmer-bg" />
        <span class="h-8 w-1/3 rounded-lg shimmer-bg" />
        <span class="h-3 w-5/6 rounded shimmer-bg" />
      </article>
    </section>

    <!-- Table container shimmer -->
    <div class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5">
      <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <span class="h-6 w-32 rounded shimmer-bg" />
        <div class="flex items-center gap-3">
          <span class="h-10 w-48 rounded-lg shimmer-bg" />
          <span class="h-10 w-32 rounded-lg shimmer-bg" />
          <span class="h-10 w-36 rounded-lg shimmer-bg" />
        </div>
      </div>
      <div class="space-y-4">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div v-for="row in 6" :key="row" class="h-12 w-full rounded-md shimmer-bg" />
      </div>
    </div>
    <span class="sr-only">Loading audience records...</span>
  </div>
</template>
