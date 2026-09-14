<template>
  <div class="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading deep links">
    <div class="space-y-2">
      <div class="shimmer-bg h-7 w-40 rounded" />
      <div class="shimmer-bg h-4 w-96 max-w-full rounded" />
    </div>

    <section class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div
        v-for="index in 3"
        :key="index"
        class="min-h-[116px] rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <div class="shimmer-bg h-4 w-24 rounded" />
        <div class="shimmer-bg mt-4 h-8 w-12 rounded" />
      </div>
    </section>

    <section class="overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg">
      <div class="flex items-center justify-between gap-4 border-b border-dashboard-card-border p-5">
        <div class="shimmer-bg h-5 w-28 rounded" />
        <div class="shimmer-bg h-10 w-72 rounded" />
      </div>
      <div class="space-y-px bg-dashboard-card-border">
        <div v-for="index in 4" :key="index" class="grid grid-cols-8 gap-4 bg-dashboard-bg px-5 py-5">
          <div v-for="column in 8" :key="column" class="shimmer-bg h-4 rounded" />
        </div>
      </div>
    </section>
  </div>
</template>
