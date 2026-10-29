<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { IRole } from "../../composables/useAccessControlStore";

const props = defineProps<{
  role: IRole;
  /** System roles can be edited (permissions only) but never deleted. */
  isSystem: boolean;
}>();

const emit = defineEmits<{
  edit: [role: IRole];
  delete: [role: IRole];
}>();

const { can } = useAuthStore();
const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

/** Closes the action menu before emitting the selected row operation. */
const triggerAction = (action: "edit" | "delete"): void => {
  dropdown.value?.closeDropdown();
  if (action === "edit") emit("edit", props.role);
  else emit("delete", props.role);
};
</script>

<template>
  <AppDropdown
    v-if="can('roles.modify')"
    ref="dropdown"
    position="right"
    :width-is-finite="false"
  >
    <template #default>
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-dashboard-text transition hover:bg-dashboard-bg-dark hover:text-brand-color-default"
        :aria-label="`Actions for ${props.role.name}`"
      >
        <Icon name="vent:more" size="1.1rem" class="rotate-90" />
      </button>
    </template>

    <template #dropdown_body>
      <div class="min-w-40 space-y-1">
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('edit')"
        >
          Edit Role
        </button>
        <button
          type="button"
          :disabled="props.isSystem"
          :title="props.isSystem ? 'System roles cannot be deleted' : undefined"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-100/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          @click="triggerAction('delete')"
        >
          Delete Role
        </button>
      </div>
    </template>
  </AppDropdown>
</template>
