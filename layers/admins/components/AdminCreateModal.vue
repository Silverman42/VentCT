<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { AdminRole } from "../composables/useAdminMockData";
import { DEFAULT_MODULE_PERMISSIONS } from "../composables/useAdminMockData";

interface SideModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface ModulePermissionFormItem {
  module: string;
  view: boolean;
  edit: boolean;
}

const modal = ref<SideModalController | null>(null);
const fullNameInput = ref<HTMLInputElement | null>(null);
const adminStore = useAdminStore();

const form = reactive<{
  fullName: string;
  workEmail: string;
  role: AdminRole;
  avatar: string;
  permissions: ModulePermissionFormItem[];
}>({
  fullName: "",
  workEmail: "",
  role: "Admin" as AdminRole,
  avatar: "",
  permissions: DEFAULT_MODULE_PERMISSIONS.map((p) => ({
    module: p.module,
    view: p.view,
    edit: p.edit,
  })),
});

/** Vuelidate validation rules for admin creation. */
const validations = computed(() => ({
  fullName: {
    required: helpers.withMessage("Full name is required", required),
  },
  workEmail: {
    required: helpers.withMessage("Work email is required", required),
    email: helpers.withMessage("Please enter a valid email address", email),
  },
  role: {
    required: helpers.withMessage("Role is required", required),
  },
}));

const v$ = useVuelidate(validations, form);

const roleOptions: Array<{ role: AdminRole; description: string }> = [
  {
    role: "Super Admin",
    description: "Full access to every module including managing other admins.",
  },
  {
    role: "Admin",
    description: "Full access except managing other admins.",
  },
  {
    role: "Editor",
    description: "Can view and edit most modules but no delete access",
  },
  {
    role: "Viewer",
    description: "Read only access across all module",
  },
];

/** Resets the form fields and clears Vuelidate error state. */
const resetForm = (): void => {
  form.fullName = "";
  form.workEmail = "";
  form.role = "Admin";
  form.permissions = DEFAULT_MODULE_PERMISSIONS.map((p) => ({
    module: p.module,
    view: p.view,
    edit: p.edit,
  }));
  v$.value.$reset();
};

/** Opens the side modal dialog and focuses the full name field. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  await nextTick();
  fullNameInput.value?.focus();
};

/** Closes the side modal dialog. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Handles view switch change for a permission row. */
const onViewChange = (index: number): void => {
  const current = form.permissions[index];
  if (current && !current.view) {
    current.edit = false;
  }
};

/** Handles edit switch change for a permission row. */
const onEditChange = (index: number): void => {
  const current = form.permissions[index];
  if (current && current.edit) {
    current.view = true;
  }
};

/** Handles file selection from the dropzone area. */
const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      form.avatar = String(e.target?.result ?? "");
    };
    reader.readAsDataURL(file);
  }
};

/** Validates and submits the new admin invite form. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  await adminStore.createAdmin({
    name: form.fullName,
    email: form.workEmail,
    role: form.role,
    avatar: form.avatar,
    permissions: form.permissions,
  });

  close();
};

defineExpose({ open, close });
</script>

<template>
  <AppSideModal ref="modal">
    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <div class="border-b border-dashboard-card-border pb-4">
        <h2 class="text-xl md:text-2xl font-medium tracking-tight text-dashboard-heading">
          New Admin
        </h2>
        <p class="mt-1 text-xs md:text-sm text-dashboard-text">
          Invite a teammate as admin
        </p>
      </div>

      <!-- Basic Information -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppInputContainer
          label="Full Name"
          for="admin-full-name"
          :error="v$.fullName.$error ? String(v$.fullName.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="admin-full-name"
            ref="fullNameInput"
            v-model.trim="form.fullName"
            type="text"
            placeholder="e.g. Clement Ikhide"
            autocomplete="off"
            :aria-invalid="v$.fullName.$error"
            @blur="v$.fullName.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Work Email"
          for="admin-work-email"
          :error="v$.workEmail.$error ? String(v$.workEmail.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="admin-work-email"
            v-model.trim="form.workEmail"
            type="email"
            placeholder="name@vent.africa"
            autocomplete="off"
            :aria-invalid="v$.workEmail.$error"
            @blur="v$.workEmail.$touch()"
          />
        </AppInputContainer>
      </div>

      <!-- Role Selection -->
      <div class="space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-dashboard-text">
          ROLE
        </label>

        <div class="flex flex-col gap-3">
          <div
            v-for="item in roleOptions"
            :key="item.role"
            class="relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-200"
            :class="
              form.role === item.role
                ? 'border-brand-color-default bg-brand-color-default/5 shadow-xs'
                : 'border-dashboard-card-border bg-dashboard-bg hover:border-brand-color-default/50'
            "
            @click="form.role = item.role"
          >
            <div class="space-y-1">
              <span class="text-sm font-medium text-dashboard-heading">
                {{ item.role }}
              </span>
              <p class="text-xs text-dashboard-text leading-snug">
                {{ item.description }}
              </p>
            </div>
            <div class="shrink-0 ml-4">
              <Icon
                v-if="form.role === item.role"
                name="vent:checked"
                size="1.25rem"
                class="text-brand-color-default"
              />
              <div
                v-else
                class="h-5 w-5 rounded-full border border-dashboard-card-border bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Image -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wider text-dashboard-text">
          UPLOAD IMAGE <span class="normal-case font-normal text-dashboard-text/70">(optional)</span>
        </label>

        <label
          class="flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-dashboard-card-border bg-dashboard-bg p-6 text-center transition cursor-pointer hover:border-brand-color-default hover:bg-dashboard-bg-dark"
        >
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            class="hidden"
            @change="handleFileUpload"
          />
          <div v-if="!form.avatar" class="flex flex-col items-center gap-1.5">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-color-default/10 text-brand-color-default">
              <Icon name="vent:export" size="1.25rem" />
            </div>
            <p class="text-xs font-medium text-dashboard-heading">
              Drop your image here
            </p>
            <p class="text-[0.7rem] text-dashboard-text">
              or <span class="text-brand-color-default underline">click to browse</span>
            </p>
            <p class="text-[0.65rem] text-dashboard-text/60">
              PNG, JPG, WEBP - Max 5MB
            </p>
          </div>
          <div v-else class="flex items-center gap-3">
            <img
              :src="form.avatar"
              alt="Uploaded avatar preview"
              class="h-14 w-14 rounded-full object-cover border border-dashboard-card-border"
            />
            <div class="text-left">
              <p class="text-xs font-medium text-dashboard-heading">Image uploaded</p>
              <p class="text-[0.7rem] text-brand-color-default">Click to replace</p>
            </div>
          </div>
        </label>
      </div>

      <!-- Module Permissions Table -->
      <div class="space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-dashboard-text">
          PERMISSION
        </label>

        <div class="overflow-hidden rounded-xl border border-dashboard-card-border bg-dashboard-bg">
          <div class="px-4 py-3 border-b border-dashboard-card-border bg-dashboard-bg-dark font-medium text-sm text-dashboard-heading">
            Module Permission
          </div>

          <div class="divide-y divide-dashboard-card-border">
            <div class="grid grid-cols-12 px-4 py-2.5 text-xs text-dashboard-text font-medium bg-dashboard-bg-dark/50">
              <div class="col-span-6">Module</div>
              <div class="col-span-3 text-center">View</div>
              <div class="col-span-3 text-center">Edit</div>
            </div>

            <div
              v-for="(item, index) in form.permissions"
              :key="item.module"
              class="grid grid-cols-12 items-center px-4 py-3 text-xs md:text-sm hover:bg-dashboard-bg-dark/30 transition"
            >
              <div class="col-span-6 font-medium text-dashboard-heading">
                {{ item.module }}
              </div>
              <div class="col-span-3 flex justify-center">
                <AppSwitch
                  v-model:is-selected="item.view"
                  :id="`perm-view-${index}`"
                  @change="onViewChange(index)"
                />
              </div>
              <div class="col-span-3 flex justify-center">
                <AppSwitch
                  v-model:is-selected="item.edit"
                  :id="`perm-edit-${index}`"
                  @change="onEditChange(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-dashboard-card-border">
        <button
          type="button"
          class="rounded-lg border border-dashboard-card-border px-5 py-2.5 text-sm font-medium text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-lg bg-brand-color-default px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005 disabled:opacity-50"
          :disabled="adminStore.creatingAdmin.value"
        >
          <span v-if="adminStore.creatingAdmin.value">Sending invite...</span>
          <span v-else>Send invite</span>
        </button>
      </div>
    </form>
  </AppSideModal>
</template>
