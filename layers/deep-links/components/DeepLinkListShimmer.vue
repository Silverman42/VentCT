<template>
  <div class="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading deep links">
    <div class="space-y-2">
      <div class="shimmer-bg h-7 w-40 rounded" />
      <div class="shimmer-bg h-4 w-96 max-w-full rounded" />
    </div>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article
        v-for="card in 4"
        :key="card"
        class="flex min-h-[104px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <span class="shimmer-bg h-3 w-1/3 rounded" />
        <span class="shimmer-bg h-8 w-16 rounded-lg" />
      </article>
    </section>

    <section class="overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg">
      <div class="flex flex-col gap-4 border-b border-dashboard-card-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="shimmer-bg h-5 w-28 rounded" />
        <div class="flex flex-col gap-3 sm:flex-row">
          <div class="shimmer-bg h-10 w-full rounded-lg sm:w-72" />
          <div class="shimmer-bg h-10 w-28 rounded-lg" />
          <div class="shimmer-bg h-10 w-28 rounded-lg" />
          <div class="shimmer-bg h-10 w-36 rounded-lg" />
        </div>
      </div>
      <div class="hidden border-b border-dashboard-card-border px-5 py-4 md:grid md:grid-cols-8 md:gap-4">
        <div v-for="column in 8" :key="column" class="shimmer-bg h-3 w-14 rounded" />
      </div>
      <div class="space-y-px bg-dashboard-card-border">
        <div
          v-for="index in 6"
          :key="index"
          class="grid grid-cols-2 gap-4 bg-dashboard-bg px-5 py-5 md:grid-cols-8"
        >
          <div class="space-y-2">
            <div class="shimmer-bg h-4 w-28 rounded" />
            <div class="shimmer-bg h-3 w-16 rounded" />
          </div>
          <div class="shimmer-bg h-4 w-16 rounded" />
          <div class="shimmer-bg hidden h-4 w-full rounded md:block" />
          <div class="shimmer-bg hidden h-4 w-full rounded md:block" />
          <div class="shimmer-bg hidden h-4 w-10 justify-self-end rounded md:block" />
          <div class="shimmer-bg hidden h-6 w-16 rounded-full md:block" />
          <div class="shimmer-bg hidden h-4 w-20 rounded md:block" />
          <div class="shimmer-bg hidden h-6 w-6 justify-self-end rounded md:block" />
        </div>
      </div>
      <div class="flex items-center justify-between p-5">
        <div class="shimmer-bg h-4 w-40 rounded" />
        <div class="shimmer-bg h-9 w-64 rounded-lg" />
      </div>
    </section>
  </div>
</template>
