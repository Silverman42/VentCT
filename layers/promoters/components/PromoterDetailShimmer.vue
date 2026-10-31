<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the promoter profile dashboard. */
</script>

<template>
  <div
    class="flex w-full min-w-0 flex-col gap-6"
    aria-label="Loading promoter profile"
    role="status"
  >
    <div class="flex flex-col gap-2">
      <span class="h-7 w-48 rounded-lg shimmer-bg" />
      <span class="h-4 w-64 rounded-md shimmer-bg" />
    </div>

    <section
      class="flex flex-col gap-4 border-b border-dashboard-card-border pb-6 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex min-w-0 items-center gap-4">
        <span class="h-22 w-22 shrink-0 rounded-full shimmer-bg" />
        <div class="flex min-w-0 flex-col gap-2">
          <span class="h-6 w-44 rounded-md shimmer-bg" />
          <span class="h-4 w-36 rounded shimmer-bg" />
          <div class="mt-1 flex flex-wrap gap-3">
            <span class="h-4 w-32 rounded shimmer-bg" />
            <span class="h-4 w-28 rounded shimmer-bg" />
            <span class="h-4 w-28 rounded shimmer-bg" />
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <span class="h-10 w-24 rounded-lg shimmer-bg" />
        <span class="h-10 w-32 rounded-lg shimmer-bg" />
      </div>
    </section>

    <section
      class="grid grid-cols-1 gap-5 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)]"
    >
      <div v-for="block in 3" :key="block" class="flex flex-col gap-2">
        <span class="h-4 w-28 rounded shimmer-bg" />
        <span class="h-5 w-4/5 rounded shimmer-bg" />
      </div>
    </section>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-2">
        <span
          v-for="tab in 4"
          :key="tab"
          class="h-10 w-24 rounded-full shimmer-bg"
        />
      </div>
      <span class="h-12 w-40 rounded-lg shimmer-bg" />
    </div>

    <div class="flex flex-col gap-6 border-t border-dashboard-card-border pt-5">
      <AppMetricRowsShimmer :rows="[4]" />

      <div
        class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <div
          class="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
        >
          <span class="h-6 w-40 rounded shimmer-bg" />
          <div class="flex flex-col gap-2 sm:flex-row">
            <span class="h-10 w-full rounded-lg shimmer-bg sm:w-72" />
            <span class="h-10 w-32 rounded-lg shimmer-bg" />
          </div>
        </div>
        <div class="space-y-4">
          <div class="h-10 w-full rounded-md shimmer-bg" />
          <div
            v-for="row in 5"
            :key="row"
            class="h-12 w-full rounded-md shimmer-bg"
          />
        </div>
      </div>
    </div>
    <span class="sr-only">Loading promoter profile...</span>
  </div>
</template>
