<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number;
    perPage: number;
    totalItems: number;
  }>(),
  {
    page: 1,
    perPage: 10,
    totalItems: 0,
  },
);

const emit = defineEmits<{
  changePage: [page: number];
}>();

/** Derives the last available page while keeping zero-result tables stable. */
const lastPage = computed(() => Math.max(1, Math.ceil(props.totalItems / props.perPage)));

/** Clamps the supplied page so range labels and controls remain valid. */
const currentPage = computed(() => Math.min(Math.max(props.page, 1), lastPage.value));

/** Produces a compact numbered page list with optional gap markers. */
const pageItems = computed<Array<number | "ellipsis">>(() => {
  const last = lastPage.value;
  const current = currentPage.value;

  if (last <= 5) return Array.from({ length: last }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, "ellipsis", last];
  if (current >= last - 2) return [1, "ellipsis", last - 2, last - 1, last];
  return [1, "ellipsis", current, "ellipsis", last];
});

/** Calculates the inclusive record range shown in the table footer. */
const resultRange = computed(() => {
  if (props.totalItems === 0) return "Showing 0 results";

  const start = (currentPage.value - 1) * props.perPage + 1;
  const end = Math.min(currentPage.value * props.perPage, props.totalItems);
  return `Showing ${start}–${end} of ${props.totalItems} results`;
});

/** Emits a valid pagination update after a user selects a new page. */
const changePage = (page: number) => {
  if (page < 1 || page > lastPage.value || page === currentPage.value) return;
  emit("changePage", page);
};
</script>

<template>
  <div v-if="props.totalItems > props.perPage" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-xs text-dashboard-text">{{ resultRange }}</p>

    <nav class="flex items-center gap-1" aria-label="Table pagination">
      <button
        type="button"
        class="rounded-lg border border-dashboard-card-border px-3 py-1.5 text-sm text-dashboard-heading transition hover:border-brand-color-default disabled:cursor-not-allowed disabled:bg-dashboard-bg-dark disabled:text-dashboard-text"
        :disabled="currentPage <= 1"
        @click="changePage(currentPage - 1)"
      >
        Prev
      </button>
      <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
        <span v-if="item === 'ellipsis'" class="px-2 text-sm text-dashboard-text" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="min-w-8 rounded-lg px-2 py-1.5 text-sm transition"
          :class="item === currentPage ? 'bg-dashboard-bg-dark text-dashboard-heading' : 'text-dashboard-text hover:bg-dashboard-bg-dark'"
          :aria-current="item === currentPage ? 'page' : undefined"
          @click="changePage(item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        class="rounded-lg border border-dashboard-card-border px-3 py-1.5 text-sm text-dashboard-heading transition hover:border-brand-color-default disabled:cursor-not-allowed disabled:bg-dashboard-bg-dark disabled:text-dashboard-text"
        :disabled="currentPage >= lastPage"
        @click="changePage(currentPage + 1)"
      >
        Next
      </button>
    </nav>
  </div>
  <p v-else class="text-xs text-dashboard-text">{{ resultRange }}</p>
</template>
