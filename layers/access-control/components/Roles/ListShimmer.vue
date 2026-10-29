<template>
  <section
    class="overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg"
    aria-busy="true"
    aria-label="Loading roles"
  >
    <div class="flex items-center justify-between border-b border-dashboard-card-border p-5">
      <div class="shimmer-bg h-5 w-20 rounded" />
      <div class="shimmer-bg h-10 w-28 rounded-lg" />
    </div>
    <div class="hidden border-b border-dashboard-card-border px-5 py-4 md:grid md:grid-cols-5 md:gap-4">
      <div v-for="column in 4" :key="column" class="shimmer-bg h-3 w-16 rounded" />
    </div>
    <div class="space-y-px bg-dashboard-card-border">
      <div
        v-for="row in 5"
        :key="row"
        class="grid grid-cols-2 items-center gap-4 bg-dashboard-bg px-5 py-5 md:grid-cols-5"
      >
        <div class="flex items-center gap-3">
          <div class="shimmer-bg h-9 w-9 shrink-0 rounded-full" />
          <div class="space-y-2">
            <div class="shimmer-bg h-4 w-28 rounded" />
            <div class="shimmer-bg h-3 w-16 rounded" />
          </div>
        </div>
        <div class="shimmer-bg h-6 w-28 rounded-full" />
        <div class="shimmer-bg hidden h-4 w-24 rounded md:block" />
        <div class="shimmer-bg hidden h-4 w-24 rounded md:block" />
        <div class="shimmer-bg hidden h-6 w-6 justify-self-end rounded md:block" />
      </div>
    </div>
    <div class="flex items-center justify-between p-5">
      <div class="shimmer-bg h-4 w-40 rounded" />
      <div class="shimmer-bg h-9 w-64 rounded-lg" />
    </div>
  </section>
</template>
