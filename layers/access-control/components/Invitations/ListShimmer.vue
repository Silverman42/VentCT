<template>
  <section
    class="overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg"
    aria-busy="true"
    aria-label="Loading invitations"
  >
    <div class="flex flex-col gap-4 border-b border-dashboard-card-border p-5 lg:flex-row lg:items-center lg:justify-between">
      <div class="shimmer-bg h-5 w-24 rounded" />
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="shimmer-bg h-10 w-full rounded-lg sm:w-72" />
        <div class="shimmer-bg h-10 w-28 rounded-lg" />
        <div class="shimmer-bg h-10 w-28 rounded-lg" />
      </div>
    </div>
    <div class="hidden border-b border-dashboard-card-border px-5 py-4 md:grid md:grid-cols-6 md:gap-4">
      <div v-for="column in 5" :key="column" class="shimmer-bg h-3 w-16 rounded" />
    </div>
    <div class="space-y-px bg-dashboard-card-border">
      <div
        v-for="row in 5"
        :key="row"
        class="grid grid-cols-2 items-center gap-4 bg-dashboard-bg px-5 py-5 md:grid-cols-6"
      >
        <div class="space-y-2">
          <div class="shimmer-bg h-4 w-40 rounded" />
          <div class="shimmer-bg h-3 w-20 rounded" />
        </div>
        <div class="shimmer-bg h-6 w-20 rounded-full" />
        <div class="shimmer-bg hidden h-4 w-6 rounded md:block" />
        <div class="hidden space-y-2 md:block">
          <div class="shimmer-bg h-4 w-24 rounded" />
          <div class="shimmer-bg h-3 w-32 rounded" />
        </div>
        <div class="shimmer-bg hidden h-4 w-28 rounded md:block" />
        <div class="shimmer-bg hidden h-6 w-6 justify-self-end rounded md:block" />
      </div>
    </div>
    <div class="flex items-center justify-between p-5">
      <div class="shimmer-bg h-4 w-40 rounded" />
      <div class="shimmer-bg h-9 w-64 rounded-lg" />
    </div>
  </section>
</template>
