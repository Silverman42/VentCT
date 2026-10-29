<template>
  <div class="flex flex-col gap-4" aria-busy="true" aria-label="Loading permission matrix">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="shimmer-bg h-4 w-72 max-w-full rounded" />
      <div class="shimmer-bg h-10 w-full rounded-lg sm:w-72" />
    </div>
    <div
      v-for="group in 6"
      :key="group"
      class="flex items-center justify-between rounded-2xl border border-dashboard-card-border bg-dashboard-bg-darker p-2"
    >
      <div class="space-y-2 pl-2">
        <div class="shimmer-bg h-4 w-32 rounded" />
        <div class="shimmer-bg h-3 w-20 rounded" />
      </div>
      <div class="shimmer-bg h-10 w-10 rounded-xl" />
    </div>
  </div>
</template>
