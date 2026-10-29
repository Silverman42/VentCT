<script setup lang="ts">
import type { AppDropdown } from "#components";
import { formatRoleName } from "~/utils/helpers/Permissions";
import {
  INVITATION_EMAIL_DOMAIN,
  createEmptyInvitationForm,
  toInvitationPayload,
  useInvitationFormValidation,
  type InvitationForm,
} from "../../composables/useInvitationForm";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const roleDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const form = ref<InvitationForm>(createEmptyInvitationForm());
const showPermissions = ref(false);
const permissionsFailed = ref(false);

const {
  roleOptions,
  fetchingRoleOptions,
  permissionGroups,
  fetchingPermissions,
  fetchRoleOptions,
  fetchPermissionGroups,
} = useAccessControlStore();
const { sendInvitation, sendingInvitation } = useInvitationStore();
const { v$, formErrors, touchField } = useInvitationFormValidation(form);

/** Visible label of the selected role, or a placeholder. */
const roleLabel = computed(() =>
  form.value.role ? formatRoleName(form.value.role) : "Select a role",
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

/** Selects a role and closes the role menu. */
const selectRole = (role: string): void => {
  form.value.role = role;
  touchField("role");
  roleDropdown.value?.closeDropdown();
};

/** Shows the optional permission picker and loads the catalogue on first use. */
const revealPermissions = (): void => {
  showPermissions.value = true;
  void loadPermissions();
};

/** Restores empty form values and clears validation feedback. */
const resetForm = (): void => {
  form.value = createEmptyInvitationForm();
  showPermissions.value = false;
  v$.value.$reset();
};

/** Opens the dialog with a clean form, loading roles if they aren't cached. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
  if (roleOptions.value.length === 0) void fetchRoleOptions().catch(() => undefined);
};

/** Dismisses the dialog and clears its form state. */
const close = (): void => {
  modal.value?.hideDialogBox();
  resetForm();
};

/** Validates the form and sends the invitation; the store reports API errors. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await sendInvitation(toInvitationPayload(form.value));
    close();
  } catch {
    // ApiErrorHandler in the store has already surfaced the failure.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="640px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <header class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">Send Invite</h2>
        <p class="mt-1 text-xs text-dashboard-text">
          The invite link expires after 48 hours. Sending a new invite to the same email replaces the old one.
        </p>
      </header>

      <div class="grid grid-cols-1 gap-4">
        <AppInputContainer label="Email address" for="invite-email" :error="formErrors.email">
          <input
            id="invite-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="off"
            :placeholder="`name${INVITATION_EMAIL_DOMAIN}`"
            :aria-invalid="Boolean(formErrors.email)"
            @blur="touchField('email')"
          />
        </AppInputContainer>

        <AppInputContainer label="Role" for="invite-role" :error="formErrors.role">
          <AppDropdown
            ref="roleDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <template #default>
              <button
                id="invite-role"
                type="button"
                class="flex w-full items-center justify-between gap-3 text-left text-base font-medium outline-none"
                :class="form.role ? 'text-input-text' : 'text-dashboard-text-light'"
                aria-haspopup="listbox"
              >
                {{ roleLabel }}
                <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
              </button>
            </template>
            <template #dropdown_body>
              <div role="listbox" aria-label="Role" class="max-h-64 min-w-56 space-y-1 overflow-y-auto">
                <p v-if="fetchingRoleOptions && roleOptions.length === 0" class="px-3 py-2 text-sm text-dashboard-text">
                  Loading roles...
                </p>
                <p v-else-if="roleOptions.length === 0" class="px-3 py-2 text-sm text-dashboard-text">
                  No roles available.
                </p>
                <button
                  v-for="role in roleOptions"
                  :key="role.id"
                  type="button"
                  role="option"
                  :aria-selected="form.role === role.name"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.role === role.name }"
                  @click="selectRole(role.name)"
                >
                  {{ formatRoleName(role.name) }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <section class="flex flex-col gap-3">
          <button
            v-if="!showPermissions"
            type="button"
            class="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-color-default hover:underline"
            @click="revealPermissions"
          >
            <Icon name="vent:add" size="1rem" />
            Add extra permissions (optional)
          </button>

          <template v-else>
            <h3 class="text-sm font-medium text-dashboard-heading">
              Extra permissions
              <span class="font-normal text-dashboard-text">— on top of the role's permissions</span>
            </h3>

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
              id-prefix="invite-form"
            />
          </template>
        </section>
      </div>

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <AppButton type="button" size="md" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton type="submit" size="md" :block="false" color="primary" :loading="sendingInvitation">
          Send Invite
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
