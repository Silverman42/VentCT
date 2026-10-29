<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the campaign detail page. */
</script>

<template>
  <div
    class="flex w-full flex-col gap-6"
    aria-label="Loading campaign"
    role="status"
  >
    <section class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-2">
        <span class="h-7 w-64 max-w-full rounded-lg shimmer-bg" />
        <span class="h-3 w-80 max-w-full rounded shimmer-bg" />
        <span class="h-6 w-20 rounded-full shimmer-bg" />
      </div>
      <span class="h-9 w-9 rounded-lg shimmer-bg" />
    </section>

    <AppMetricRowsShimmer :rows="[3, 2]" />

    <section
      class="flex flex-wrap items-center justify-end gap-2 border-b border-dashboard-card-border pb-5"
    >
      <span class="h-11 w-40 rounded-lg shimmer-bg" />
      <span class="h-11 w-36 rounded-lg shimmer-bg" />
    </section>

    <AppMetricRowsShimmer :rows="[4, 4]" />

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div
        v-for="(span, index) in ['xl:col-span-7', 'xl:col-span-5']"
        :key="index"
        class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        :class="span"
      >
        <span class="mb-5 block h-6 w-28 rounded shimmer-bg" />
        <div class="space-y-4">
          <div class="h-10 w-full rounded-md shimmer-bg" />
          <div
            v-for="row in 5"
            :key="row"
            class="h-12 w-full rounded-md shimmer-bg"
          />
        </div>
      </div>
    </section>

    <div
      class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <div class="mb-5 flex flex-col justify-between gap-4 lg:flex-row">
        <span class="h-6 w-24 rounded shimmer-bg" />
        <span class="h-10 w-full rounded-lg shimmer-bg sm:w-72" />
      </div>
      <div class="space-y-4">
        <div class="h-10 w-full rounded-md shimmer-bg" />
        <div
          v-for="row in 6"
          :key="row"
          class="h-12 w-full rounded-md shimmer-bg"
        />
      </div>
    </div>

    <div
      class="h-80 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
    >
      <span class="block h-full w-full rounded-lg shimmer-bg" />
    </div>
    <span class="sr-only">Loading campaign...</span>
  </div>
</template>
