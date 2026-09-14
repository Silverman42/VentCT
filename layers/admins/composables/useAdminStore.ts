import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";
import {
  type AdminRole,
  type IAdmin,
  type IAdminDetails,
  type IModulePermission,
  useAdminMockData,
} from "./useAdminMockData";

export interface ICreateAdminPayload {
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  permissions?: Array<{
    module: string;
    view: boolean;
    edit: boolean;
  }>;
}

export interface IUpdateAdminPayload {
  name?: string;
  email?: string;
  role?: AdminRole;
  avatar?: string;
  permissions?: IModulePermission[];
}

/** Provides feature state and API/mock store actions for admin management. */
export const useAdminStore = () => {
  const { adminList, getAdminDetails } = useAdminMockData();

  const endpoints = {
    ADMINS: "/admin/admins",
    ADMIN: (id: string) => `/admin/admins/${id}`,
  };

  const state = {
    fetchingAdmins: useState<boolean>(
      "useAdminStore.fetchingAdmins",
      () => false,
    ),
    fetchingAdminDetails: useState<boolean>(
      "useAdminStore.fetchingAdminDetails",
      () => false,
    ),
    creatingAdmin: useState<boolean>(
      "useAdminStore.creatingAdmin",
      () => false,
    ),
    updatingAdmin: useState<boolean>(
      "useAdminStore.updatingAdmin",
      () => false,
    ),
    deletingAdmin: useState<boolean>(
      "useAdminStore.deletingAdmin",
      () => false,
    ),
    admins: useState<IAdmin[]>(
      "useAdminStore.admins",
      () => adminList,
    ),
    selectedAdminDetails: useState<IAdminDetails | null>(
      "useAdminStore.selectedAdminDetails",
      () => null,
    ),
  };

  const actions = {
    /** Fetches the list of admin users and stores them in state. */
    async fetchAdmins() {
      state.fetchingAdmins.value = true;
      try {
        return state.admins.value;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Admin fetch failed");
        throw error;
      } finally {
        state.fetchingAdmins.value = false;
      }
    },

    /** Fetches detailed admin profile information including permissions and activity. */
    async fetchAdminDetails(adminId: string) {
      state.fetchingAdminDetails.value = true;
      try {
        const details = getAdminDetails(adminId);
        state.selectedAdminDetails.value = details;
        return details;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Admin detail fetch failed");
        throw error;
      } finally {
        state.fetchingAdminDetails.value = false;
      }
    },

    /** Creates a new admin user record and adds it to state. */
    async createAdmin(payload: ICreateAdminPayload) {
      state.creatingAdmin.value = true;
      try {
        const dateStr = new Date().toISOString().split("T")[0] ?? "2025-06-30";
        const newAdmin: IAdmin = {
          id: `admin-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          dateCreated: dateStr,
          dateUpdated: dateStr,
          avatar: payload.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          joinedDate: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          lastLogin: "Just now",
        };

        state.admins.value.unshift(newAdmin);

        useToastHandler().triggerToast(
          `Invite successfully sent to ${payload.email}`,
          "success",
          "Admin Created",
        );

        return newAdmin;
      } catch (error) {
        ApiErrorHandler(error, true, false, "Admin creation failed");
        throw error;
      } finally {
        state.creatingAdmin.value = false;
      }
    },

    /** Updates an existing admin user's details or permissions. */
    async updateAdmin(adminId: string, payload: IUpdateAdminPayload) {
      state.updatingAdmin.value = true;
      try {
        const index = state.admins.value.findIndex((a) => a.id === adminId);
        if (index !== -1) {
          const current = state.admins.value[index]!;
          const updated: IAdmin = {
            ...current,
            name: payload.name ?? current.name,
            email: payload.email ?? current.email,
            role: payload.role ?? current.role,
            avatar: payload.avatar ?? current.avatar,
            dateUpdated: new Date().toISOString().split("T")[0] ?? current.dateUpdated,
          };
          state.admins.value[index] = updated;

          if (state.selectedAdminDetails.value?.admin.id === adminId) {
            state.selectedAdminDetails.value.admin = updated;
            if (payload.permissions) {
              state.selectedAdminDetails.value.permissions = payload.permissions;
            }
          }
        }

        useToastHandler().triggerToast(
          "Admin profile updated successfully",
          "success",
          "Admin Updated",
        );
      } catch (error) {
        ApiErrorHandler(error, true, false, "Admin update failed");
        throw error;
      } finally {
        state.updatingAdmin.value = false;
      }
    },

    /** Deletes an admin record from state. */
    async deleteAdmin(adminId: string) {
      state.deletingAdmin.value = true;
      try {
        state.admins.value = state.admins.value.filter((a) => a.id !== adminId);
        useToastHandler().triggerToast(
          "Admin removed successfully",
          "success",
          "Admin Deleted",
        );
      } catch (error) {
        ApiErrorHandler(error, true, false, "Admin deletion failed");
        throw error;
      } finally {
        state.deletingAdmin.value = false;
      }
    },
  };

  return {
    ...state,
    ...actions,
  };
};
