<template>
  <section
    class="flex flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6"
    aria-label="Loading conversion funnel"
    role="status"
  >
    <header aria-hidden="true">
      <span class="block h-4 w-36 rounded shimmer-bg" />
      <span class="mt-2 block h-3 w-56 rounded shimmer-bg" />
    </header>

    <ul class="mt-6 space-y-5" aria-hidden="true">
      <li v-for="row in 3" :key="row">
        <div class="flex items-center gap-3">
          <span class="h-3.5 flex-1 rounded shimmer-bg" />
          <span class="h-3.5 w-14 rounded shimmer-bg" />
          <span class="h-3.5 w-12 rounded shimmer-bg" />
        </div>
        <span class="mt-2 block h-2 w-full rounded-full shimmer-bg" />
      </li>
    </ul>

    <div class="mt-auto grid grid-cols-1 gap-3 pt-8 sm:grid-cols-3" aria-hidden="true">
      <div
        v-for="tile in 3"
        :key="tile"
        class="rounded-xl border border-dashboard-card-border p-4"
      >
        <span class="block h-2.5 w-20 rounded shimmer-bg" />
        <span class="mt-2 block h-5 w-14 rounded shimmer-bg" />
      </div>
    </div>
  </section>
</template>
