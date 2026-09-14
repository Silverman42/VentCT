<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { AdminRole, IAdmin, IModulePermission } from "../composables/useAdminMockData";

interface SideModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  admin: IAdmin;
  permissions?: IModulePermission[];
}>();

const modal = ref<SideModalController | null>(null);
const adminStore = useAdminStore();

const form = reactive({
  name: "",
  email: "",
  role: "Admin" as AdminRole,
  avatar: "",
});

const validations = computed(() => ({
  name: {
    required: helpers.withMessage("Full name is required", required),
  },
  email: {
    required: helpers.withMessage("Email is required", required),
    email: helpers.withMessage("Please enter a valid email address", email),
  },
  role: {
    required: helpers.withMessage("Role is required", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Populates form fields with existing admin properties. */
const syncForm = (): void => {
  form.name = props.admin.name;
  form.email = props.admin.email;
  form.role = props.admin.role;
  form.avatar = props.admin.avatar || "";
  v$.value.$reset();
};

/** Opens the edit modal with current admin values. */
const open = (): void => {
  syncForm();
  modal.value?.showDialogBox();
};

/** Closes the side modal. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Handles saving edited profile values. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  await adminStore.updateAdmin(props.admin.id, {
    name: form.name,
    email: form.email,
    role: form.role,
    avatar: form.avatar,
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
          Edit Admin Profile
        </h2>
        <p class="mt-1 text-xs md:text-sm text-dashboard-text">
          Update admin profile information
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppInputContainer
          label="Full Name"
          for="edit-admin-name"
          :error="v$.name.$error ? String(v$.name.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="edit-admin-name"
            v-model.trim="form.name"
            type="text"
            autocomplete="off"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Work Email"
          for="edit-admin-email"
          :error="v$.email.$error ? String(v$.email.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="edit-admin-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="off"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
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
            v-for="item in [
              { role: 'Super Admin', description: 'Full access to every module including managing other admins.' },
              { role: 'Admin', description: 'Full access except managing other admins.' },
              { role: 'Editor', description: 'Can view and edit most modules but no delete access' },
              { role: 'Viewer', description: 'Read only access across all module' },
            ] as const"
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
          class="rounded-lg bg-brand-color-default px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
          :disabled="adminStore.updatingAdmin.value"
        >
          Save changes
        </button>
      </div>
    </form>
  </AppSideModal>
</template>
