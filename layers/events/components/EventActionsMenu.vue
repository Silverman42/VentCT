<script setup lang="ts">
const emit = defineEmits<{
  newAttendance: [];
  delete: [];
}>();

const dropdown = ref<{ closeDropdown: () => void } | null>(null);

/** Closes the menu and emits the chosen event action. */
const triggerAction = (action: "newAttendance" | "delete"): void => {
  dropdown.value?.closeDropdown();
  if (action === "newAttendance") emit("newAttendance");
  else emit("delete");
};
</script>

<template>
  <Dropdown ref="dropdown" position="right" :width-is-finite="false">
    <button
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashboard-card-border bg-dashboard-bg text-dashboard-heading transition hover:border-brand-color-default hover:text-brand-color-default"
      aria-label="Event actions"
      aria-haspopup="menu"
    >
      <Icon name="vent:more" size="1.1rem" />
    </button>
    <template #dropdown_body>
      <div class="min-w-44 space-y-1" role="menu">
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="triggerAction('newAttendance')"
        >
          <Icon name="vent:edit" size="1rem" />
          New Attendance
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-md border-t border-dashboard-card-divider px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-100/40"
          @click="triggerAction('delete')"
        >
          <Icon name="vent:trash" size="1rem" />
          Delete
        </button>
      </div>
    </template>
  </Dropdown>
</template>
