<script setup lang="ts">
/** Renders a layout-matched loading shimmer for the campaign top promoters card. */
</script>

<template>
  <section
    class="flex flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 md:p-6"
    aria-label="Loading top promoters"
    role="status"
  >
    <header aria-hidden="true">
      <span class="block h-4 w-44 rounded shimmer-bg" />
      <span class="mt-2 block h-3 w-52 rounded shimmer-bg" />
    </header>

    <div class="mx-auto mt-6 flex w-full flex-col items-center" aria-hidden="true">
      <span class="block h-7 w-40 rounded shimmer-bg" />
      <span class="mt-2 block h-3 w-32 rounded shimmer-bg" />
    </div>

    <ul class="mt-6 space-y-5" aria-hidden="true">
      <li v-for="row in 7" :key="row">
        <div class="flex items-center gap-3">
          <span class="h-3.5 flex-1 rounded shimmer-bg" />
          <span class="h-3.5 w-20 rounded shimmer-bg" />
          <span class="h-3.5 w-12 rounded shimmer-bg" />
        </div>
        <span class="mt-2 block h-2 w-full rounded-full shimmer-bg" />
      </li>
    </ul>

    <span class="mx-auto mt-9 block h-3.5 w-3/4 rounded shimmer-bg" aria-hidden="true" />
  </section>
</template>
