<script setup lang="ts">
import type { BreadcrumbData } from "~/utils/types/misc/BreadcrumbData";

const props = defineProps<{
  list: BreadcrumbData[];
}>();

const getProps = computed(() => props);
</script>
<template>
  <ul class="flex items-center gap-2 text-sm">
    <template v-for="(item, index) in getProps.list" :key="index">
      <template v-if="index !== getProps.list.length - 1">
        <li>
          <NuxtLink
            class="text-dashboard-heading hover:text-brand-color-default font-medium text-sm capitalize"
            :to="item.route"
          >
            {{ item.name }}
          </NuxtLink>
        </li>
        <li>/</li>
      </template>

      <li v-else>
        <span class="text-dashboard-text font-medium text-sm capitalize">
          {{ item.name }}
        </span>
      </li>
    </template>
  </ul>
</template>
