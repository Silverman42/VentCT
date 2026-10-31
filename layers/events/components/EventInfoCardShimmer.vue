<script setup lang="ts">
/** Loading placeholder that mirrors the EventInfoCard layout. */
</script>

<template>
  <section
    class="grid grid-cols-1 gap-5 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 sm:grid-cols-2 lg:grid-cols-4"
    aria-hidden="true"
  >
    <div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
      <span class="h-3 w-20 rounded shimmer-bg" />
      <span class="h-4 w-full max-w-xl rounded-md shimmer-bg" />
      <span class="h-4 w-2/3 max-w-md rounded-md shimmer-bg" />
    </div>

    <div class="flex flex-col gap-2">
      <span class="h-3 w-16 rounded shimmer-bg" />
      <span class="h-4 w-40 max-w-full rounded-md shimmer-bg" />
    </div>

    <div class="flex flex-col gap-2">
      <span class="h-3 w-32 rounded shimmer-bg" />
      <span class="h-6 w-12 rounded-full shimmer-bg" />
    </div>

    <div class="flex flex-col gap-2 sm:col-span-2">
      <span class="h-3 w-28 rounded shimmer-bg" />
      <span class="h-4 w-full max-w-sm rounded-md shimmer-bg" />
    </div>
  </section>
</template>
