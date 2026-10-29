<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { TabsData } from "~/utils/types/misc/Tabs";
import type { IRole } from "../composables/useAccessControlStore";

interface RoleFormController {
  open: (role?: IRole) => void;
}

interface SendInvitationController {
  open: () => void;
}

const { rolesTotal, matrix, fetchRoleOptions, fetchMatrix } =
  useAccessControlStore();
const { invitationsTotal, fetchInvitations } = useInvitationStore();
const { can } = useAuthStore();

const createDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const roleFormModal = ref<RoleFormController | null>(null);
const sendInvitationModal = ref<SendInvitationController | null>(null);
const activeTab = ref("roles");

/** Number of permissions listed in the matrix, shown on the Permissions tab. */
const permissionCount = computed(() =>
  (matrix.value?.groups ?? []).reduce(
    (total, group) => total + (group.permissions?.length ?? 0),
    0,
  ),
);

/** Tabs with their live counts. */
const tabs = computed<TabsData[]>(() => [
  { id: "roles", name: "Roles", icon: "vent:mask", counts: rolesTotal.value },
  {
    id: "permissions",
    name: "Permissions",
    icon: "vent:shield-security",
    counts: permissionCount.value,
  },
  {
    id: "invitations",
    name: "Invitations",
    icon: "vent:send-2",
    counts: invitationsTotal.value,
  },
]);

/** True when the user can use at least one item in the create menu. */
const canCreateAnything = computed(
  () => can("roles.modify") || can("users.create"),
);

/** Opens the role editor in create mode. */
const openNewRole = (): void => {
  createDropdown.value?.closeDropdown();
  roleFormModal.value?.open();
};

/** Opens the role editor for an existing role. */
const openEditRole = (role: IRole): void => {
  roleFormModal.value?.open(role);
};

/** Opens the send-invitation dialog. */
const openSendInvitation = (): void => {
  createDropdown.value?.closeDropdown();
  sendInvitationModal.value?.open();
};

onMounted(() => {
  // Preload data behind the tab counts and the role pickers. Failures are
  // reported by the store and shown again by each tab's error state.
  void fetchRoleOptions().catch(() => undefined);
  void fetchMatrix().catch(() => undefined);
  void fetchInvitations(1).catch(() => undefined);
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <div class="flex items-start justify-between gap-4">
      <AppHeading
        title="Access Control"
        subtitle="Define what each team member can access by managing roles, permissions and invitations"
      />

      <AppDropdown
        v-if="canCreateAnything"
        ref="createDropdown"
        position="right"
        :width-is-finite="false"
      >
        <template #default>
          <button
            type="button"
            aria-label="Create"
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-color-default text-white transition hover:bg-brand-color-005"
          >
            <Icon name="vent:add" size="1.4rem" />
          </button>
        </template>

        <template #dropdown_body>
          <div class="flex w-60 flex-col gap-2">
            <button
              v-if="can('roles.modify')"
              type="button"
              class="flex w-full items-center gap-2 rounded-md border border-dashboard-card-border px-4 py-3 text-left text-sm text-dashboard-heading transition hover:border-brand-color-default hover:text-brand-color-default"
              @click="openNewRole"
            >
              <Icon name="vent:mask" size="1.2rem" />
              New Role
            </button>
            <button
              v-if="can('users.create')"
              type="button"
              class="flex w-full items-center gap-2 rounded-md border border-dashboard-card-border px-4 py-3 text-left text-sm text-dashboard-heading transition hover:border-brand-color-default hover:text-brand-color-default"
              @click="openSendInvitation"
            >
              <Icon name="vent:send-2" size="1.2rem" />
              Send Invite
            </button>
          </div>
        </template>
      </AppDropdown>
    </div>

    <AppTab
      v-model:active-tab="activeTab"
      :tab-list="tabs"
      default-tab-id="roles"
      show-count
    >
      <template #roles>
        <div>
          <RolesList @edit="openEditRole" @create="openNewRole" />
        </div>
      </template>

      <template #permissions>
        <div>
          <PermissionsMatrix />
        </div>
      </template>

      <template #invitations>
        <div>
          <InvitationsList @create="openSendInvitation" />
        </div>
      </template>
    </AppTab>

    <RolesFormModal ref="roleFormModal" />
    <InvitationsSendModal ref="sendInvitationModal" />
  </div>
</template>
