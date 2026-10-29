<script setup lang="ts">
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import { formatRoleName } from "~/utils/helpers/Permissions";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { IRole } from "../../composables/useAccessControlStore";

interface DeleteModalController {
  open: (role: IRole) => void;
}

/** Template-ready table row derived from a role. */
interface RoleRow extends IRole {
  displayName: string;
  isSystem: boolean;
  permissionCount: number;
  createdLabel: string;
  updatedLabel: string;
}

const emit = defineEmits<{
  edit: [role: IRole];
  create: [];
}>();

const {
  roles,
  fetchingRoles,
  rolesPage,
  rolesPerPage,
  rolesTotal,
  fetchRoles,
  isSystemRole,
} = useAccessControlStore();
const { can } = useAuthStore();

const deleteModal = ref<DeleteModalController | null>(null);
// Show cached rows straight away when the tab is re-opened.
const hasLoaded = ref(roles.value.length > 0);
const loadFailed = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Role", width: "16rem" },
  { id: "permissions", name: "Permissions", width: "9rem" },
  { id: "created_at", name: "Created", width: "9rem", isHiddenOnMobile: true },
  { id: "updated_at", name: "Last Updated", width: "9rem", isHiddenOnMobile: true },
  { id: "actions", name: "", justify: "right", width: "4rem" },
];

/** Formats an optional ISO date, falling back to a dash. */
const formatDate = (value?: string): string =>
  value ? DateFormatter.formatDate(value) : "—";

/** Maps API roles to table rows with display labels. */
const rows = computed<RoleRow[]>(() =>
  roles.value.map((role) => ({
    ...role,
    displayName: formatRoleName(role.name ?? ""),
    isSystem: isSystemRole(role),
    permissionCount: role.permissions?.length ?? 0,
    createdLabel: formatDate(role.created_at),
    updatedLabel: formatDate(role.updated_at),
  })),
);

/** Loads the current page of roles and records failure for the error state. */
const loadRoles = async (): Promise<void> => {
  loadFailed.value = false;
  try {
    await fetchRoles();
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Loads the requested page of roles. */
const changePage = (page: number): void => {
  void fetchRoles(page).catch(() => undefined);
};

/** Opens the delete confirmation for one role. */
const openDelete = (role: IRole): void => {
  deleteModal.value?.open(role);
};

onMounted(() => {
  void loadRoles();
});
</script>

<template>
  <RolesListShimmer v-if="!hasLoaded" />

  <section
    v-else-if="loadFailed"
    class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
  >
    <h2 class="text-lg font-medium text-dashboard-heading">We couldn't load roles</h2>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      Something went wrong while fetching roles, or you don't have permission to view them.
    </p>
    <AppButton type="button" size="md" class="mt-5" @click="loadRoles">Retry</AppButton>
  </section>

  <div v-else>
    <TableComponent
      :headings="tableHeadings"
      :body="rows"
      :is-loading="fetchingRoles"
      empty-heading="No roles yet"
      empty-subtitle="Create a role to group the permissions your team members need."
    >
      <template #table-heading>
        <TableComponentHeader table-name="Roles" hide-search>
          <template #actions>
            <button
              v-if="can('roles.modify')"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
              @click="emit('create')"
            >
              New Role
            </button>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_name="{ rowData }">
        <div class="flex items-center gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dashboard-bg-dark text-dashboard-heading"
          >
            <Icon name="vent:mask" size="1.1rem" />
          </span>
          <div class="min-w-0">
            <span class="flex items-center gap-2">
              <span class="truncate font-medium text-dashboard-heading">
                {{ rowData.displayName }}
              </span>
              <AppPills v-if="rowData.isSystem" color="blue">System</AppPills>
            </span>
            <span class="block truncate text-xs text-dashboard-text">{{ rowData.name }}</span>
          </div>
        </div>
      </template>

      <template #col_permissions="{ rowData }">
        <AppPills :color="rowData.permissionCount ? 'green' : 'gray'">
          {{ rowData.permissionCount }}
          {{ rowData.permissionCount === 1 ? "permission" : "permissions" }}
        </AppPills>
      </template>

      <template #col_created_at="{ rowData }">
        {{ rowData.createdLabel }}
      </template>

      <template #col_updated_at="{ rowData }">
        {{ rowData.updatedLabel }}
      </template>

      <template #col_actions="{ rowData }">
        <RolesRowActions
          :role="rowData as IRole"
          :is-system="rowData.isSystem"
          @edit="emit('edit', $event)"
          @delete="openDelete"
        />
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="rolesPage"
          :per-page="rolesPerPage"
          :total-items="rolesTotal"
          @change-page="changePage"
        />
      </template>
    </TableComponent>

    <RolesDeleteModal ref="deleteModal" />
  </div>
</template>
