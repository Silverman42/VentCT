<template>
  <div class="space-y-7" aria-busy="true" aria-label="Loading deep-link details">
    <div class="space-y-3 border-b border-dashboard-card-border pb-6">
      <div class="shimmer-bg h-4 w-28 rounded" />
      <div class="flex items-center gap-3">
        <div class="shimmer-bg h-8 w-52 rounded" />
        <div class="shimmer-bg h-6 w-16 rounded-full" />
      </div>
      <div class="shimmer-bg h-4 w-64 rounded" />
      <div class="shimmer-bg h-4 w-56 rounded" />
    </div>
    <div class="space-y-6">
      <div v-for="index in 3" :key="index" class="space-y-2">
        <div class="shimmer-bg h-3 w-24 rounded" />
        <div class="shimmer-bg h-5 w-full rounded" />
      </div>
    </div>
    <div class="space-y-5 border-t border-dashboard-card-border pt-6">
      <div class="shimmer-bg h-6 w-32 rounded" />
      <div v-for="index in 2" :key="index" class="space-y-2">
        <div class="shimmer-bg h-3 w-28 rounded" />
        <div class="shimmer-bg h-5 w-full rounded" />
      </div>
      <div class="shimmer-bg h-44 w-full rounded-xl" />
    </div>
  </div>
</template>
