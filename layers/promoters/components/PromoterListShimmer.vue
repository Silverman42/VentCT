<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the promoter summary cards and table. */
</script>

<template>
  <div
    class="flex w-full flex-col gap-6"
    aria-label="Loading promoters"
    role="status"
  >
    <div class="flex flex-col gap-2">
      <span class="h-7 w-36 rounded-lg shimmer-bg" />
      <span class="h-4 w-64 rounded-md shimmer-bg" />
    </div>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <article
        v-for="card in 5"
        :key="card"
        class="flex min-h-[116px] flex-col gap-3 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <span class="h-3 w-1/2 rounded shimmer-bg" />
        <span class="h-8 w-20 rounded-lg shimmer-bg" />
        <span class="mt-auto h-3 w-3/4 rounded shimmer-bg" />
      </article>
    </section>

    <div
      class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <div
        class="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
      >
        <span class="h-6 w-28 rounded shimmer-bg" />
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span class="h-10 w-full rounded-lg shimmer-bg sm:w-72" />
          <span class="h-10 w-32 rounded-lg shimmer-bg" />
          <span class="h-10 w-24 rounded-lg shimmer-bg" />
          <span class="h-10 w-32 rounded-lg shimmer-bg" />
        </div>
      </div>
      <div class="space-y-4">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div
          v-for="row in 8"
          :key="row"
          class="h-12 w-full rounded-md shimmer-bg"
        />
      </div>
      <div class="mt-5 flex items-center justify-between">
        <span class="h-4 w-40 rounded shimmer-bg" />
        <span class="h-9 w-64 rounded-lg shimmer-bg" />
      </div>
    </div>
    <span class="sr-only">Loading promoters...</span>
  </div>
</template>
