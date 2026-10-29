<template>
  <section
    class="flex min-h-[590px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6"
    aria-label="Loading transaction volume chart"
    role="status"
  >
    <header
      class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      aria-hidden="true"
    >
      <div>
        <span class="block h-4 w-52 rounded shimmer-bg" />
        <span class="mt-2 block h-3 w-64 rounded shimmer-bg" />
      </div>
      <span class="h-7 w-40 rounded-full shimmer-bg" />
    </header>

    <div class="mt-8 flex min-h-[410px] flex-1 items-end gap-3" aria-hidden="true">
      <div class="flex h-full flex-col justify-between self-stretch py-1">
        <span v-for="tick in 5" :key="tick" class="h-2.5 w-8 rounded shimmer-bg" />
      </div>
      <div class="flex h-full flex-1 items-end justify-around gap-2 self-stretch">
        <div
          v-for="(height, index) in [70, 45, 35, 55, 50, 60, 40]"
          :key="index"
          class="flex h-full flex-1 items-end justify-center gap-1"
        >
          <span class="w-1/3 rounded shimmer-bg" :style="{ height: `${height}%` }" />
          <span class="w-1/3 rounded shimmer-bg" :style="{ height: `${height / 3}%` }" />
        </div>
      </div>
      <div class="flex h-full flex-col justify-between self-stretch py-1">
        <span v-for="tick in 5" :key="tick" class="h-2.5 w-6 rounded shimmer-bg" />
      </div>
    </div>

    <div class="mt-4 flex justify-center gap-6" aria-hidden="true">
      <span class="h-3 w-28 rounded shimmer-bg" />
      <span class="h-3 w-16 rounded shimmer-bg" />
    </div>
  </section>
</template>
