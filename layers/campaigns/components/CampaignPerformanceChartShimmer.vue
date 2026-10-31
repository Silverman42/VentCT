<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the campaign verification vs trade chart. */
</script>

<template>
  <section
    class="flex min-h-[455px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 md:p-6"
    aria-label="Loading verification vs trade chart"
    role="status"
  >
    <header
      class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      aria-hidden="true"
    >
      <div>
        <span class="block h-4 w-56 rounded shimmer-bg" />
        <span class="mt-2 block h-3 w-48 rounded shimmer-bg" />
      </div>
      <span class="h-7 w-40 rounded-full shimmer-bg" />
    </header>

    <div class="mt-8 flex min-h-[275px] flex-1 gap-3" aria-hidden="true">
      <div class="flex flex-col justify-between py-1">
        <span v-for="tick in 5" :key="tick" class="h-2.5 w-7 rounded shimmer-bg" />
      </div>
      <div class="flex flex-1 flex-col justify-between">
        <span
          v-for="line in 5"
          :key="line"
          class="block h-px w-full bg-dashboard-card-border"
        />
        <div class="flex justify-between pt-2">
          <span v-for="tick in 7" :key="tick" class="h-2.5 w-8 rounded shimmer-bg" />
        </div>
      </div>
    </div>

    <div class="mt-4 flex justify-center gap-6" aria-hidden="true">
      <span class="h-3 w-24 rounded shimmer-bg" />
      <span class="h-3 w-28 rounded shimmer-bg" />
    </div>
  </section>
</template>
