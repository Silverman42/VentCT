<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tableName: string;
    searchPlaceholder?: string;
    hideSearch?: boolean;
  }>(),
  {
    searchPlaceholder: "Search...",
    hideSearch: false,
  },
);

const search = defineModel<string>("search", { default: "" });
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <h2 class="text-base font-medium tracking-tight text-dashboard-heading">
      {{ props.tableName }}
    </h2>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <label v-if="!props.hideSearch" class="relative block min-w-0 sm:w-72">
        <span class="sr-only">{{ props.searchPlaceholder }}</span>
        <Icon
          name="vent:search-normal"
          size="1rem"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text"
        />
        <input
          v-model="search"
          type="search"
          :placeholder="props.searchPlaceholder"
          class="w-full rounded-lg border border-dashboard-input-border bg-dashboard-bg py-2.5 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-dashboard-text-light focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
        />
      </label>
      <slot name="filters" />
      <slot name="actions" />
    </div>
  </div>
</template>
