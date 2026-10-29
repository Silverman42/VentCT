<script setup lang="ts">
import { formatRoleName } from "~/utils/helpers/Permissions";
import type { IRole } from "../../composables/useAccessControlStore";
import {
  createEmptyRoleForm,
  createRoleFormFrom,
  toRolePayload,
  useRoleFormValidation,
  type RoleForm,
} from "../../composables/useRoleForm";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const editingRole = ref<IRole | null>(null);
const form = ref<RoleForm>(createEmptyRoleForm());
const permissionsFailed = ref(false);

const {
  permissionGroups,
  fetchingPermissions,
  creatingRole,
  updatingRole,
  fetchPermissionGroups,
  createRole,
  updateRole,
  isSystemRole,
} = useAccessControlStore();
const { v$, nameError } = useRoleFormValidation(form);

/** True when the form edits an existing role rather than creating one. */
const isEditing = computed(() => editingRole.value !== null);

/** The super-admin role keeps its name; only its permissions can change. */
const nameIsLocked = computed(() => isSystemRole(editingRole.value));

/** True while the save request is in flight. */
const isSaving = computed(() =>
  isEditing.value ? updatingRole.value : creatingRole.value,
);

/** Heading copy for the current mode. */
const heading = computed(() =>
  isEditing.value
    ? `Edit ${formatRoleName(editingRole.value?.name ?? "role")}`
    : "New Role",
);

/** Loads the permission catalogue and records failure for the error state. */
const loadPermissions = async (): Promise<void> => {
  permissionsFailed.value = false;
  try {
    await fetchPermissionGroups();
  } catch {
    permissionsFailed.value = true;
  }
};

/** Opens the editor; pass a role to edit it, or nothing to create a new one. */
const open = (role?: IRole): void => {
  editingRole.value = role ?? null;
  form.value = role ? createRoleFormFrom(role) : createEmptyRoleForm();
  v$.value.$reset();
  modal.value?.showDialogBox();
  void loadPermissions();
};

/** Dismisses the editor. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Validates the form and saves the role; the store reports API errors. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const payload = toRolePayload(form.value);
  try {
    if (editingRole.value) await updateRole(editingRole.value.id, payload);
    else await createRole(payload);
    close();
  } catch {
    // ApiErrorHandler in the store has already surfaced the failure.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppSideModal ref="modal">
    <form class="flex flex-col gap-6 pb-4" novalidate @submit.prevent="submit">
      <header>
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">{{ heading }}</h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Name the role and choose the permissions everyone with this role will have
        </p>
      </header>

      <AppInputContainer label="Role name" for="role-name" :error="nameError">
        <input
          id="role-name"
          v-model.trim="form.name"
          type="text"
          autocomplete="off"
          placeholder="e.g. regional-manager"
          :readonly="nameIsLocked"
          :aria-invalid="Boolean(nameError)"
          @input="v$.name.$touch()"
          @blur="v$.name.$touch()"
        />
      </AppInputContainer>
      <p v-if="nameIsLocked" class="-mt-4 text-xs text-dashboard-text">
        This is a system role, so its name can't be changed.
      </p>

      <section class="flex flex-col gap-3">
        <h3 class="text-base font-medium text-dashboard-heading">Permissions</h3>

        <PermissionsGroupPickerShimmer
          v-if="fetchingPermissions && permissionGroups.length === 0"
        />

        <div
          v-else-if="permissionsFailed && permissionGroups.length === 0"
          class="flex flex-col items-center rounded-xl border border-dashboard-card-border bg-dashboard-bg px-4 py-8 text-center"
        >
          <p class="text-sm text-dashboard-text">We couldn't load the permission list.</p>
          <AppButton type="button" size="sm" class="mt-3" :block="false" @click="loadPermissions">
            Retry
          </AppButton>
        </div>

        <PermissionsGroupPicker
          v-else
          v-model="form.permissions"
          :groups="permissionGroups"
          id-prefix="role-form"
        />
      </section>

      <div class="flex flex-col-reverse gap-3 sm:flex-row">
        <AppButton type="button" size="md" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton type="submit" size="md" :block="false" color="primary" :loading="isSaving">
          {{ isEditing ? "Save Changes" : "Create Role" }}
        </AppButton>
      </div>
    </form>
  </AppSideModal>
</template>
