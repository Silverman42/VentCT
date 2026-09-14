<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { DeepLink } from "../composables/useDeepLinkStore";

const props = defineProps<{
  deepLink: DeepLink;
}>();

const emit = defineEmits<{
  view: [deepLink: DeepLink];
  edit: [deepLink: DeepLink];
  regenerate: [deepLink: DeepLink];
  delete: [deepLink: DeepLink];
}>();

const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

/** Closes the action menu before emitting a selected row operation. */
const triggerAction = (
  action: "view" | "edit" | "regenerate" | "delete",
): void => {
  dropdown.value?.closeDropdown();
  if (action === "view") {
    emit("view", props.deepLink);
    return;
  }
  if (action === "edit") {
    emit("edit", props.deepLink);
    return;
  }
  if (action === "regenerate") {
    emit("regenerate", props.deepLink);
    return;
  }
  emit("delete", props.deepLink);
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
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('view')"
        >
          <Icon name="vent:eye" size="1rem" />
          View
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('edit')"
        >
          <Icon name="vent:edit" size="1rem" />
          Edit
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('regenerate')"
        >
          <Icon name="vent:rotate-left" size="1rem" />
          Regenerate
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-100/40"
          @click="triggerAction('delete')"
        >
          <Icon name="vent:trash" size="1rem" />
          Delete
        </button>
      </div>
    </template>
  </AppDropdown>
</template>
