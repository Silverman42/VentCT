<template>
  <div class="flex flex-col gap-3" aria-busy="true" aria-label="Loading permissions">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="shimmer-bg h-4 w-36 rounded" />
      <div class="shimmer-bg h-10 w-full rounded-lg sm:w-64" />
    </div>
    <div
      v-for="group in 5"
      :key="group"
      class="flex items-center justify-between rounded-2xl border border-dashboard-card-border bg-dashboard-bg-darker p-2"
    >
      <div class="flex items-center gap-3 pl-2">
        <div class="shimmer-bg h-5.5 w-5.5 rounded-lg" />
        <div class="space-y-2">
          <div class="shimmer-bg h-4 w-32 rounded" />
          <div class="shimmer-bg h-3 w-20 rounded" />
        </div>
      </div>
      <div class="shimmer-bg h-10 w-10 rounded-xl" />
    </div>
  </div>
</template>
