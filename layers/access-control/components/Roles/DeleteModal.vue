<script setup lang="ts">
import { formatRoleName } from "~/utils/helpers/Permissions";
import type { IRole } from "../../composables/useAccessControlStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const selectedRole = ref<IRole | null>(null);
const { deleteRole, deletingRole } = useAccessControlStore();

/** Confirmation copy naming the selected role. */
const subheading = computed(() => {
  const name = selectedRole.value ? formatRoleName(selectedRole.value.name) : "this role";
  return `Are you sure you want to delete ${name}? Roles that are still assigned to users cannot be deleted.`;
});

/** Opens the confirmation dialog for one role. */
const open = (role: IRole): void => {
  selectedRole.value = role;
  modal.value?.showDialogBox();
};

/** Dismisses the dialog; the role is kept so the copy doesn't change mid-animation. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Deletes the role and closes the dialog when it succeeds. */
const confirm = async (): Promise<void> => {
  const role = selectedRole.value;
  if (!role || deletingRole.value) return;

  try {
    await deleteRole(role.id);
    close();
  } catch {
    // ApiErrorHandler in the store has already surfaced the failure.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="480px">
    <section class="py-3 text-center">
      <div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-400">
        <Icon name="vent:trash" size="1.35rem" />
      </div>
      <AppConfirmModal
        heading="Delete Role"
        :subheading="subheading"
        :is-loading="deletingRole"
        @cancel="close"
        @confirm="confirm"
      />
    </section>
  </AppModal>
</template>
