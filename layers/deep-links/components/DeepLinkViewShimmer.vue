<template>
  <div class="space-y-6" aria-busy="true" aria-label="Loading deep-link details">
    <div class="space-y-3 border-b border-dashboard-card-border pb-6">
      <div class="shimmer-bg h-4 w-28 rounded" />
      <div class="shimmer-bg h-8 w-52 rounded" />
      <div class="shimmer-bg h-4 w-40 rounded" />
    </div>
    <div class="space-y-5">
      <div v-for="index in 4" :key="index" class="space-y-2">
        <div class="shimmer-bg h-3 w-24 rounded" />
        <div class="shimmer-bg h-5 w-full rounded" />
      </div>
    </div>
  </div>
</template>
