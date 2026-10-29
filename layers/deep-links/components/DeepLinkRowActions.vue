<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { IDeepLink } from "../composables/useDeepLinkStore";

const props = defineProps<{
  deepLink: IDeepLink;
}>();

const emit = defineEmits<{
  view: [deepLink: IDeepLink];
  edit: [deepLink: IDeepLink];
  toggle: [deepLink: IDeepLink];
  delete: [deepLink: IDeepLink];
}>();

const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

/** Closes the action menu before emitting the selected row operation. */
const triggerAction = (action: "view" | "edit" | "toggle" | "delete"): void => {
  dropdown.value?.closeDropdown();
  if (action === "view") emit("view", props.deepLink);
  else if (action === "edit") emit("edit", props.deepLink);
  else if (action === "toggle") emit("toggle", props.deepLink);
  else emit("delete", props.deepLink);
};
</script>

<template>
  <AppDropdown ref="dropdown" position="right" :width-is-finite="false">
    <template #default>
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-dashboard-text transition hover:bg-dashboard-bg-dark hover:text-brand-color-default"
        :aria-label="`Actions for ${props.deepLink.name}`"
      >
        <Icon name="vent:more" size="1.1rem" class="rotate-90" />
      </button>
    </template>

    <template #dropdown_body>
      <div class="min-w-36 space-y-1">
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('view')"
        >
          View
        </button>
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('edit')"
        >
          Edit
        </button>
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('toggle')"
        >
          {{ props.deepLink.status === "active" ? "Deactivate" : "Activate" }}
        </button>
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-100/40"
          @click="triggerAction('delete')"
        >
          Delete
        </button>
      </div>
    </template>
  </AppDropdown>
</template>
