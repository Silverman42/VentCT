import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import { SUPER_ADMIN_ROLE } from "~/utils/helpers/Permissions";
import type { IResponse } from "~/utils/types/misc/ResponseBody";
import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** One system permission (PermissionResource). */
export interface IPermission {
  id: string;
  name: string;
  label: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}

/** Permissions grouped by module, as returned by `GET /admin/permissions`. */
export interface IPermissionGroup {
  id: string;
  name: string;
  label: string;
  permissions: IPermission[];
}

/** One role (RoleResource). */
export interface IRole extends ITableBodyData {
  id: string;
  name: string;
  guard_name?: string;
  permissions?: IPermission[];
  created_at?: string;
  updated_at?: string;
}

/** Payload for creating or updating a role. */
export interface IRolePayload {
  name: string;
  permissions?: string[];
}

/** One permission row in the role-permission matrix, with a flag per role name. */
export interface IMatrixPermission {
  id: string;
  name: string;
  label: string;
  roles: Record<string, boolean>;
}

/** One permission group in the role-permission matrix. */
export interface IMatrixGroup {
  id: string;
  name: string;
  label: string;
  permissions: IMatrixPermission[];
}

/** Response data of `GET /admin/roles/matrix`. */
export interface IRoleMatrix {
  roles: string[];
  groups: IMatrixGroup[];
}

/** Minimal user reference returned by the user delegation endpoints. */
export interface IRbacUser {
  id: string;
  name: string;
  email: string;
}

/** Response data of the user permission endpoints (§12.8–12.11). */
export interface IUserPermissions {
  user: IRbacUser;
  direct_permissions: string[];
  all_permissions: string[];
}

/** Payload for assigning, revoking or syncing a user's direct permissions. */
export interface IUserPermissionsPayload {
  permissions: string[];
}

/** Payload for assigning a user's primary role. */
export interface IAssignUserRolePayload {
  role: string;
}

/** Response data of `POST /admin/users/{user}/role`. */
export interface IUserRoleResponse {
  user: IRbacUser;
  roles: string[];
}

/** Pagination meta returned with role lists. */
export interface IRolePaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page?: number;
}

/** Number of roles requested when loading every role for pickers. */
const ROLE_OPTIONS_PER_PAGE = 100;

/**
 * Reports an API failure through ApiErrorHandler. The toast is skipped for
 * 401s because the dashboard layout already redirects to the login page.
 */
const handleApiError = (error: unknown, heading: string): void => {
  const isUnauthenticated =
    (error as { statusCode?: number })?.statusCode === 401;
  ApiErrorHandler(error, !isUnauthenticated, false, heading);
};

/** Shows the API's success message, falling back to the given text. */
const toastSuccess = (
  message: string | undefined,
  fallback: string,
  heading: string,
): void => {
  useToastHandler().triggerToast(message || fallback, "success", heading, "large");
};

/** Provides roles, permissions, matrix and user delegation API state and actions (§12). */
export const useAccessControlStore = () => {
  const endpoints = {
    ROLES: "/admin/roles",
    ROLE: (id: string) => `/admin/roles/${id}`,
    ROLE_MATRIX: "/admin/roles/matrix",
    PERMISSIONS: "/admin/permissions",
    USER_PERMISSIONS: (userId: string) => `/admin/users/${userId}/permissions`,
    USER_PERMISSIONS_ASSIGN: (userId: string) =>
      `/admin/users/${userId}/permissions/assign`,
    USER_PERMISSIONS_REVOKE: (userId: string) =>
      `/admin/users/${userId}/permissions/revoke`,
    USER_PERMISSIONS_SYNC: (userId: string) =>
      `/admin/users/${userId}/permissions/sync`,
    USER_ROLE: (userId: string) => `/admin/users/${userId}/role`,
  };

  const state = {
    fetchingRoles: useState<boolean>(
      "useAccessControlStore.fetchingRoles",
      () => false,
    ),
    fetchingRoleOptions: useState<boolean>(
      "useAccessControlStore.fetchingRoleOptions",
      () => false,
    ),
    fetchingRole: useState<boolean>(
      "useAccessControlStore.fetchingRole",
      () => false,
    ),
    creatingRole: useState<boolean>(
      "useAccessControlStore.creatingRole",
      () => false,
    ),
    updatingRole: useState<boolean>(
      "useAccessControlStore.updatingRole",
      () => false,
    ),
    deletingRole: useState<boolean>(
      "useAccessControlStore.deletingRole",
      () => false,
    ),
    fetchingPermissions: useState<boolean>(
      "useAccessControlStore.fetchingPermissions",
      () => false,
    ),
    fetchingMatrix: useState<boolean>(
      "useAccessControlStore.fetchingMatrix",
      () => false,
    ),
    fetchingUserPermissions: useState<boolean>(
      "useAccessControlStore.fetchingUserPermissions",
      () => false,
    ),
    assigningPermissions: useState<boolean>(
      "useAccessControlStore.assigningPermissions",
      () => false,
    ),
    revokingPermissions: useState<boolean>(
      "useAccessControlStore.revokingPermissions",
      () => false,
    ),
    syncingPermissions: useState<boolean>(
      "useAccessControlStore.syncingPermissions",
      () => false,
    ),
    assigningRole: useState<boolean>(
      "useAccessControlStore.assigningRole",
      () => false,
    ),
    roles: useState<IRole[]>("useAccessControlStore.roles", () => []),
    rolesPage: useState<number>("useAccessControlStore.rolesPage", () => 1),
    rolesPerPage: useState<number>(
      "useAccessControlStore.rolesPerPage",
      () => 15,
    ),
    rolesLastPage: useState<number>(
      "useAccessControlStore.rolesLastPage",
      () => 1,
    ),
    rolesTotal: useState<number>("useAccessControlStore.rolesTotal", () => 0),
    roleOptions: useState<IRole[]>(
      "useAccessControlStore.roleOptions",
      () => [],
    ),
    permissionGroups: useState<IPermissionGroup[]>(
      "useAccessControlStore.permissionGroups",
      () => [],
    ),
    matrix: useState<IRoleMatrix | null>(
      "useAccessControlStore.matrix",
      () => null,
    ),
    userPermissions: useState<IUserPermissions | null>(
      "useAccessControlStore.userPermissions",
      () => null,
    ),
  };

  const getters = {
    /** True for the immutable `super-admin` role, which cannot be renamed or deleted. */
    isSystemRole: (role: Pick<IRole, "name"> | null | undefined): boolean =>
      role?.name === SUPER_ADMIN_ROLE,
  };

  /** Derives the last page from list meta, falling back to total / per_page. */
  const resolveLastPage = (meta: IRolePaginationMeta | undefined): number => {
    if (!meta) return 1;
    if (meta.last_page) return Math.max(1, meta.last_page);
    return Math.max(1, Math.ceil((meta.total ?? 0) / (meta.per_page || 1)));
  };

  /**
   * Refreshes data that depends on the role list after a role mutation.
   * Failures are already reported by the individual fetches.
   */
  const refreshAfterRoleChange = (): void => {
    void actions.fetchRoles().catch(() => undefined);
    void actions.fetchRoleOptions().catch(() => undefined);
    void actions.fetchMatrix().catch(() => undefined);
  };

  const actions = {
    /**
     * Fetches one page of roles. When a page beyond the first comes back
     * empty or fails, the page state rolls back to the last valid page.
     */
    async fetchRoles(page: number = state.rolesPage.value) {
      const previousPage = state.rolesPage.value;
      state.rolesPage.value = page;
      state.fetchingRoles.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IRole[], any, IRolePaginationMeta>>(
          endpoints.ROLES,
          {
            method: "GET",
            query: { page, per_page: state.rolesPerPage.value },
          },
        )
        .then((response) => {
          const roles = response.data ?? [];
          if (page > 1 && roles.length === 0) {
            state.rolesPage.value = previousPage;
            return state.roles.value;
          }

          state.roles.value = roles;
          state.rolesTotal.value = response.meta?.total ?? roles.length;
          state.rolesLastPage.value = resolveLastPage(response.meta);
          state.rolesPage.value = response.meta?.current_page ?? page;
          return roles;
        })
        .catch((error) => {
          state.rolesPage.value = previousPage;
          handleApiError(error, "Roles fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingRoles.value = false;
        });
    },

    /** Changes the page size, resets to page 1 and refetches roles. */
    async setRolesPerPage(perPage: number) {
      state.rolesPerPage.value = perPage;
      return actions.fetchRoles(1);
    },

    /** Loads every role (up to 100) for role pickers and filters. */
    async fetchRoleOptions() {
      state.fetchingRoleOptions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IRole[]>>(endpoints.ROLES, {
          method: "GET",
          query: { per_page: ROLE_OPTIONS_PER_PAGE },
        })
        .then((response) => {
          state.roleOptions.value = response.data ?? [];
          return state.roleOptions.value;
        })
        .catch((error) => {
          handleApiError(error, "Roles fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingRoleOptions.value = false;
        });
    },

    /** Fetches one role with its permissions. */
    async fetchRole(id: string) {
      state.fetchingRole.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IRole>>(endpoints.ROLE(id), { method: "GET" })
        .then((response) => response.data)
        .catch((error) => {
          handleApiError(error, "Role fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingRole.value = false;
        });
    },

    /** Creates a custom role, then refreshes the role list, options and matrix. */
    async createRole(payload: IRolePayload) {
      state.creatingRole.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IRole>>(endpoints.ROLES, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          toastSuccess(response.message, "Role created successfully", "Role created");
          refreshAfterRoleChange();
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Role creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingRole.value = false;
        });
    },

    /** Updates a role's name and permissions, then refreshes dependent data. */
    async updateRole(id: string, payload: IRolePayload) {
      state.updatingRole.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IRole>>(endpoints.ROLE(id), {
          method: "PUT",
          body: payload,
        })
        .then((response) => {
          if (response.data) {
            state.roles.value = state.roles.value.map((role) =>
              role.id === id ? response.data : role,
            );
          }
          toastSuccess(response.message, "Role updated successfully", "Role updated");
          refreshAfterRoleChange();
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Role update failed");
          throw error;
        })
        .finally(() => {
          state.updatingRole.value = false;
        });
    },

    /**
     * Deletes a role. If it was the only row on a later page, steps back one
     * page before refreshing so the list doesn't land on an empty page.
     */
    async deleteRole(id: string) {
      state.deletingRole.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<null>>(endpoints.ROLE(id), { method: "DELETE" })
        .then((response) => {
          if (state.roles.value.length === 1 && state.rolesPage.value > 1) {
            state.rolesPage.value -= 1;
          }
          toastSuccess(response.message, "Role deleted successfully", "Role deleted");
          refreshAfterRoleChange();
          return true;
        })
        .catch((error) => {
          handleApiError(error, "Role deletion failed");
          throw error;
        })
        .finally(() => {
          state.deletingRole.value = false;
        });
    },

    /** Loads the grouped permission catalogue. Uses the cached copy unless forced. */
    async fetchPermissionGroups(force = false) {
      if (!force && state.permissionGroups.value.length > 0) {
        return state.permissionGroups.value;
      }
      state.fetchingPermissions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IPermissionGroup[]>>(endpoints.PERMISSIONS, {
          method: "GET",
        })
        .then((response) => {
          state.permissionGroups.value = response.data ?? [];
          return state.permissionGroups.value;
        })
        .catch((error) => {
          handleApiError(error, "Permissions fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingPermissions.value = false;
        });
    },

    /** Loads the role × permission matrix. */
    async fetchMatrix() {
      state.fetchingMatrix.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IRoleMatrix>>(endpoints.ROLE_MATRIX, {
          method: "GET",
        })
        .then((response) => {
          state.matrix.value = response.data ?? null;
          return state.matrix.value;
        })
        .catch((error) => {
          handleApiError(error, "Permission matrix fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingMatrix.value = false;
        });
    },

    /** Loads a user's direct and effective permissions into `userPermissions`. */
    async fetchUserPermissions(userId: string) {
      state.fetchingUserPermissions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IUserPermissions>>(
          endpoints.USER_PERMISSIONS(userId),
          { method: "GET" },
        )
        .then((response) => {
          state.userPermissions.value = response.data ?? null;
          return state.userPermissions.value;
        })
        .catch((error) => {
          handleApiError(error, "User permissions fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingUserPermissions.value = false;
        });
    },

    /** Grants direct permissions to a user. */
    async assignUserPermissions(userId: string, payload: IUserPermissionsPayload) {
      state.assigningPermissions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IUserPermissions>>(
          endpoints.USER_PERMISSIONS_ASSIGN(userId),
          { method: "POST", body: payload },
        )
        .then((response) => {
          state.userPermissions.value = response.data ?? state.userPermissions.value;
          toastSuccess(
            response.message,
            "Permissions assigned successfully",
            "Permissions assigned",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Permission assignment failed");
          throw error;
        })
        .finally(() => {
          state.assigningPermissions.value = false;
        });
    },

    /** Removes direct permissions from a user. The API also revokes the user's tokens. */
    async revokeUserPermissions(userId: string, payload: IUserPermissionsPayload) {
      state.revokingPermissions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IUserPermissions>>(
          endpoints.USER_PERMISSIONS_REVOKE(userId),
          { method: "POST", body: payload },
        )
        .then((response) => {
          state.userPermissions.value = response.data ?? state.userPermissions.value;
          toastSuccess(
            response.message,
            "Permissions revoked successfully",
            "Permissions revoked",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Permission revocation failed");
          throw error;
        })
        .finally(() => {
          state.revokingPermissions.value = false;
        });
    },

    /** Replaces a user's direct permissions; an empty list clears them all. */
    async syncUserPermissions(userId: string, payload: IUserPermissionsPayload) {
      state.syncingPermissions.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IUserPermissions>>(
          endpoints.USER_PERMISSIONS_SYNC(userId),
          { method: "PUT", body: payload },
        )
        .then((response) => {
          state.userPermissions.value = response.data ?? state.userPermissions.value;
          toastSuccess(
            response.message,
            "Permissions synced successfully",
            "Permissions updated",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Permission sync failed");
          throw error;
        })
        .finally(() => {
          state.syncingPermissions.value = false;
        });
    },

    /** Sets a user's primary role. */
    async assignUserRole(userId: string, payload: IAssignUserRolePayload) {
      state.assigningRole.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IUserRoleResponse>>(endpoints.USER_ROLE(userId), {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          toastSuccess(
            response.message,
            "User role has been updated successfully",
            "Role assigned",
          );
          return response.data;
        })
        .catch((error) => {
          handleApiError(error, "Role assignment failed");
          throw error;
        })
        .finally(() => {
          state.assigningRole.value = false;
        });
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
};
