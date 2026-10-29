<template>
  <section
    class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    aria-label="Loading dashboard summary metrics"
    role="status"
  >
    <article
      v-for="tile in 6"
      :key="tile"
      class="flex min-h-[124px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      aria-hidden="true"
    >
      <span class="h-3 w-24 rounded shimmer-bg" />
      <span class="mt-3 h-7 w-36 rounded shimmer-bg" />
      <span class="mt-auto h-2.5 w-40 rounded shimmer-bg" />
    </article>
  </section>
</template>
