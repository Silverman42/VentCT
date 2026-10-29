<script setup lang="ts">
import type { IPermissionGroup } from "../../composables/useAccessControlStore";

const props = withDefaults(
  defineProps<{
    groups: IPermissionGroup[];
    /** Keeps checkbox ids unique when more than one picker is on the page. */
    idPrefix: string;
  }>(),
  {
    groups: () => [],
  },
);

/** Selected permission names. */
const selected = defineModel<string[]>({ default: () => [] });

const search = ref("");

/** Group with only the permissions that should be shown, plus selection counts. */
interface VisibleGroup extends IPermissionGroup {
  selectedCount: number;
  isFullySelected: boolean;
}

/**
 * Groups filtered by the search term. A group whose label matches keeps every
 * permission; otherwise only the matching permissions are shown.
 */
const visibleGroups = computed<VisibleGroup[]>(() => {
  const term = search.value.trim().toLowerCase();
  const chosen = new Set(selected.value);

  return props.groups
    .map((group) => {
      const groupMatches =
        !term ||
        group.label?.toLowerCase().includes(term) ||
        group.name?.toLowerCase().includes(term);
      const permissions = groupMatches
        ? group.permissions ?? []
        : (group.permissions ?? []).filter(
            (permission) =>
              permission.label?.toLowerCase().includes(term) ||
              permission.name?.toLowerCase().includes(term),
          );
      const selectedCount = permissions.filter((permission) =>
        chosen.has(permission.name),
      ).length;

      return {
        ...group,
        permissions,
        selectedCount,
        isFullySelected:
          permissions.length > 0 && selectedCount === permissions.length,
      };
    })
    .filter((group) => group.permissions.length > 0);
});

/** Selects or clears every visible permission in one group. */
const toggleGroup = (group: VisibleGroup, value: boolean | string[]): void => {
  const names = group.permissions.map((permission) => permission.name);
  if (value === true) {
    selected.value = [...new Set([...selected.value, ...names])];
  } else {
    const drop = new Set(names);
    selected.value = selected.value.filter((name) => !drop.has(name));
  }
};

/** Builds a unique DOM id for a checkbox. */
const checkboxId = (groupId: string, permissionId = "all"): string =>
  `${props.idPrefix}-${groupId}-${permissionId}`;
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-dashboard-text">
        {{ selected.length }} {{ selected.length === 1 ? "permission" : "permissions" }} selected
      </p>
      <label class="relative block sm:w-64">
        <span class="sr-only">Search permissions</span>
        <Icon
          name="vent:search-normal"
          size="1rem"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Search permissions..."
          class="w-full rounded-lg border border-dashboard-input-border bg-dashboard-bg py-2.5 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-dashboard-text-light focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
        />
      </label>
    </div>

    <p
      v-if="visibleGroups.length === 0"
      class="rounded-xl border border-dashboard-card-border bg-dashboard-bg px-4 py-8 text-center text-sm text-dashboard-text"
    >
      {{ search ? "No permissions match your search." : "No permissions are available." }}
    </p>

    <AppCollapsableCard v-for="group in visibleGroups" :key="group.id">
      <template #header-left>
        <div class="flex min-w-0 items-center gap-3 pl-2">
          <AppCheckbox
            :id="checkboxId(group.id)"
            :is-selected="group.isFullySelected"
            @update:is-selected="toggleGroup(group, $event)"
          />
          <label :for="checkboxId(group.id)" class="min-w-0 cursor-pointer">
            <span class="block truncate text-sm font-medium text-dashboard-heading">
              {{ group.label || group.name }}
            </span>
            <span class="block text-xs text-dashboard-text">
              {{ group.selectedCount }} of {{ group.permissions.length }} selected
            </span>
          </label>
        </div>
      </template>

      <template #body>
        <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li
            v-for="permission in group.permissions"
            :key="permission.id"
            class="flex items-start gap-3"
          >
            <AppCheckbox
              :id="checkboxId(group.id, permission.id)"
              v-model:is-selected="selected"
              :value="permission.name"
              class="shrink-0"
            />
            <label :for="checkboxId(group.id, permission.id)" class="min-w-0 cursor-pointer">
              <span class="block text-sm text-dashboard-heading">{{ permission.label }}</span>
              <span class="block truncate text-xs text-dashboard-text">{{ permission.name }}</span>
            </label>
          </li>
        </ul>
      </template>
    </AppCollapsableCard>
  </div>
</template>
