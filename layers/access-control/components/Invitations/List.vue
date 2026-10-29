<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import { formatRoleName } from "~/utils/helpers/Permissions";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { IInvitation } from "../../composables/useInvitationStore";

interface RevokeModalController {
  open: (invitation: IInvitation) => void;
}

/** Template-ready table row derived from an invitation. */
interface InvitationRow extends IInvitation {
  roleLabel: string;
  permissionCount: number;
  invitedByName: string;
  invitedByEmail: string;
  expiresLabel: string;
  isExpired: boolean;
  sentLabel: string;
}

const emit = defineEmits<{
  create: [];
}>();

const {
  invitations,
  fetchingInvitations,
  invitationsPage,
  invitationsPerPage,
  invitationsTotal,
  invitationsSearch,
  invitationsRole,
  fetchInvitations,
  setInvitationsSearch,
  setInvitationsRole,
} = useInvitationStore();
const { roleOptions } = useAccessControlStore();
const { can } = useAuthStore();

const revokeModal = ref<RevokeModalController | null>(null);
const roleDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref(invitationsSearch.value);
// Show cached rows straight away when the tab is re-opened.
const hasLoaded = ref(invitations.value.length > 0);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "email", name: "Email", width: "16rem" },
  { id: "role", name: "Role", width: "9rem" },
  { id: "permissions", name: "Extra Permissions", width: "9rem", isHiddenOnMobile: true },
  { id: "invited_by", name: "Invited By", width: "12rem", isHiddenOnMobile: true },
  { id: "expires_at", name: "Expires", width: "10rem" },
  { id: "actions", name: "", justify: "right", width: "4rem" },
];

/** Role filter options, with "All roles" first. */
const roleFilterOptions = computed(() => [
  { value: "", label: "All roles" },
  ...roleOptions.value.map((role) => ({
    value: role.name,
    label: formatRoleName(role.name),
  })),
]);

/** Visible label of the active role filter. */
const roleFilterLabel = computed(
  () =>
    roleFilterOptions.value.find((option) => option.value === invitationsRole.value)
      ?.label ?? formatRoleName(invitationsRole.value),
);

/** Maps API invitations to table rows with display labels and expiry state. */
const rows = computed<InvitationRow[]>(() => {
  const now = Date.now();
  return invitations.value.map((invitation) => {
    const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : null;
    return {
      ...invitation,
      roleLabel: invitation.role ? formatRoleName(invitation.role) : "—",
      permissionCount: invitation.permissions?.length ?? 0,
      invitedByName: invitation.invited_by?.name ?? "—",
      invitedByEmail: invitation.invited_by?.email ?? "",
      expiresLabel: expiresAt
        ? `${DateFormatter.formatDate(invitation.expires_at!)} · ${DateFormatter.formatTime(invitation.expires_at!)}`
        : "—",
      isExpired: expiresAt ? expiresAt.getTime() < now : false,
      sentLabel: invitation.created_at ? DateFormatter.formatDate(invitation.created_at) : "",
    };
  });
});

/** Runs a list request and records whether it failed for the error state. */
const runListRequest = async (request: () => Promise<unknown>): Promise<void> => {
  loadFailed.value = false;
  try {
    await request();
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Loads the current page of invitations. */
const loadInvitations = (): Promise<void> =>
  runListRequest(() => fetchInvitations());

/** Sends the debounced search term to the API. */
const applySearch = useDebounceFn((term: string) => {
  void runListRequest(() => setInvitationsSearch(term));
}, 300);

/** Applies a role filter, closes its menu and reloads page 1. */
const selectRole = (role: string): void => {
  roleDropdown.value?.closeDropdown();
  if (role === invitationsRole.value) return;
  void runListRequest(() => setInvitationsRole(role));
};

/** Loads the requested page of invitations. */
const changePage = (page: number): void => {
  void fetchInvitations(page).catch(() => undefined);
};

/** Opens the revoke confirmation for one invitation. */
const openRevoke = (invitation: IInvitation): void => {
  revokeModal.value?.open(invitation);
};

watch(searchInput, (term) => {
  if (term.trim() !== invitationsSearch.value) void applySearch(term);
});

onMounted(() => {
  void loadInvitations();
});
</script>

<template>
  <InvitationsListShimmer v-if="!hasLoaded" />

  <section
    v-else-if="loadFailed"
    class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
  >
    <h2 class="text-lg font-medium text-dashboard-heading">We couldn't load invitations</h2>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      Something went wrong while fetching invitations, or you don't have permission to view them.
    </p>
    <AppButton type="button" size="md" class="mt-5" @click="loadInvitations">Retry</AppButton>
  </section>

  <div v-else>
    <TableComponent
      :headings="tableHeadings"
      :body="rows"
      :is-loading="fetchingInvitations"
      empty-heading="No invitations found"
      empty-subtitle="Try changing the search or role filter, or invite a new team member."
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Invitations"
          search-placeholder="Search by email..."
        >
          <template #filters>
            <AppDropdown ref="roleDropdown" position="right" :width-is-finite="false">
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                >
                  {{ roleFilterLabel }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="max-h-72 min-w-44 space-y-1 overflow-y-auto">
                  <button
                    v-for="option in roleFilterOptions"
                    :key="option.value || 'all'"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{ 'bg-dashboard-bg-dark': invitationsRole === option.value }"
                    @click="selectRole(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>

          <template #actions>
            <button
              v-if="can('users.create')"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
              @click="emit('create')"
            >
              Send Invite
            </button>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_email="{ rowData }">
        <span class="block truncate font-medium text-dashboard-heading" :title="rowData.email">
          {{ rowData.email }}
        </span>
        <span v-if="rowData.sentLabel" class="block text-xs text-dashboard-text">
          Sent {{ rowData.sentLabel }}
        </span>
      </template>

      <template #col_role="{ rowData }">
        <AppPills color="blue">{{ rowData.roleLabel }}</AppPills>
      </template>

      <template #col_permissions="{ rowData }">
        {{ rowData.permissionCount || "—" }}
      </template>

      <template #col_invited_by="{ rowData }">
        <span class="block truncate text-dashboard-heading">{{ rowData.invitedByName }}</span>
        <span v-if="rowData.invitedByEmail" class="block truncate text-xs text-dashboard-text">
          {{ rowData.invitedByEmail }}
        </span>
      </template>

      <template #col_expires_at="{ rowData }">
        <AppPills v-if="rowData.isExpired" color="red">Expired</AppPills>
        <span v-else class="whitespace-nowrap">{{ rowData.expiresLabel }}</span>
      </template>

      <template #col_actions="{ rowData }">
        <InvitationsRowActions :invitation="rowData as IInvitation" @revoke="openRevoke" />
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="invitationsPage"
          :per-page="invitationsPerPage"
          :total-items="invitationsTotal"
          @change-page="changePage"
        />
      </template>
    </TableComponent>

    <InvitationsRevokeModal ref="revokeModal" />
  </div>
</template>
