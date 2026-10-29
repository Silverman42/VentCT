<script setup lang="ts">
import type { ColorsType } from "~/utils/types/misc/Colors";

const props = defineProps<{
  /** Module (`log_name`) that produced the activity log entry. */
  module: string;
}>();

const MODULE_COLORS: Record<string, ColorsType> = {
  events: "blue",
  campaigns: "green",
  promoters: "orange",
  audiences: "yellow",
  attendances: "green",
  deep_links: "blue",
  users: "red",
  roles: "red",
};

/** Pill color for the module, falling back to gray for unknown modules. */
const color = computed<ColorsType>(
  () => MODULE_COLORS[props.module] ?? "gray",
);

/** Human-readable module label, e.g. `deep_links` → `Deep links`. */
const label = computed(() => {
  const text = (props.module || "system").replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
});
</script>

<template>
  <AppPills :color="color">{{ label }}</AppPills>
</template>
