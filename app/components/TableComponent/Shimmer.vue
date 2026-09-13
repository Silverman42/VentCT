<script setup lang="ts">
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";

const props = defineProps<{
  headings: ITableHeaderData[];
}>();
</script>

<template>
  <div class="p-4 md:p-5" aria-label="Loading table" role="status">
    <div class="hidden overflow-hidden rounded-lg border border-dashboard-card-border md:block">
      <div class="grid grid-flow-col auto-cols-fr gap-5 bg-table-heading-bg px-5 py-4">
        <span v-for="heading in props.headings" :key="heading.id" class="h-3 rounded shimmer-bg" />
      </div>
      <div v-for="row in 6" :key="row" class="grid grid-flow-col auto-cols-fr gap-5 border-t border-dashboard-card-border px-5 py-5">
        <span v-for="heading in props.headings" :key="heading.id" class="h-4 rounded shimmer-bg" />
      </div>
    </div>
    <div class="divide-y divide-dashboard-card-border rounded-lg border border-dashboard-card-border md:hidden">
      <div v-for="row in 4" :key="row" class="grid gap-3 p-4">
        <div v-for="heading in props.headings.slice(0, 3)" :key="heading.id" class="grid grid-cols-2 gap-4">
          <span class="h-3 rounded shimmer-bg" />
          <span class="h-4 rounded shimmer-bg" />
        </div>
      </div>
    </div>
    <span class="sr-only">Loading records</span>
  </div>
</template>
