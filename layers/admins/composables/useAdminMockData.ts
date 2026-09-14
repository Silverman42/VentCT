import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

export type AdminRole = "Super Admin" | "Admin" | "Editor" | "Viewer";

export interface IAdmin extends ITableBodyData {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  dateCreated: string;
  dateUpdated: string;
  avatar?: string;
  joinedDate?: string;
  lastLogin?: string;
}

export interface IModulePermission extends ITableBodyData {
  id: string;
  module: string;
  view: boolean;
  edit: boolean;
}

export interface IAdminActivity {
  id: string;
  title: string;
  timestamp: string;
}

export interface IAdminDetails {
  admin: IAdmin;
  permissions: IModulePermission[];
  recentActivities: IAdminActivity[];
}

/** Standard default module permissions template for new admins. */
export const DEFAULT_MODULE_PERMISSIONS: Array<Omit<IModulePermission, "id">> = [
  { module: "Dashboard", view: true, edit: true },
  { module: "Attendance", view: true, edit: true },
  { module: "Admins", view: true, edit: false },
  { module: "Campaigns", view: true, edit: true },
  { module: "Promoters", view: true, edit: true },
  { module: "Audiences", view: true, edit: true },
  { module: "Deep Links", view: true, edit: true },
  { module: "Promoter Stats", view: true, edit: true },
  { module: "Trade and Travel", view: true, edit: true },
  { module: "Telescopes", view: true, edit: true },
  { module: "Logs", view: true, edit: true },
];

/** Mock admin user fixtures. */
export const INITIAL_ADMINS: IAdmin[] = [
  {
    id: "admin-1",
    name: "Victoria",
    email: "Victoria.oladele@vent.africa",
    role: "Admin",
    dateCreated: "2025-06-30",
    dateUpdated: "2025-06-30",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Jun 30, 2025",
    lastLogin: "Today, 10:00 AM",
  },
  {
    id: "admin-2",
    name: "Kolade Stephen",
    email: "Kolade.stephen@vent.africa",
    role: "Admin",
    dateCreated: "2025-06-30",
    dateUpdated: "2025-06-30",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Jun 5, 2025",
    lastLogin: "Today, 9:15 AM",
  },
  {
    id: "admin-3",
    name: "Jeremy Owolabi",
    email: "ajremy.owolabi@vent.africa",
    role: "Editor",
    dateCreated: "2025-06-30",
    dateUpdated: "2025-06-30",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Jun 12, 2025",
    lastLogin: "Yesterday, 4:30 PM",
  },
  {
    id: "admin-4",
    name: "Donald Blessing",
    email: "donaldblessing9@gmail.com",
    role: "Viewer",
    dateCreated: "2025-06-30",
    dateUpdated: "2025-06-30",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Jun 15, 2025",
    lastLogin: "2 days ago",
  },
  {
    id: "admin-5",
    name: "Super Admin",
    email: "admin@vent.africa",
    role: "Super Admin",
    dateCreated: "2025-06-30",
    dateUpdated: "2025-06-30",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Jan 1, 2025",
    lastLogin: "Today, 8:00 AM",
  },
];

/** Mock recent activities for single admin view. */
export const INITIAL_ADMIN_ACTIVITIES: IAdminActivity[] = [
  {
    id: "act-1",
    title: "Added new campaign",
    timestamp: "Today - 09:30 AM",
  },
  {
    id: "act-2",
    title: "Marked attendance for Audu Voctory",
    timestamp: "Yesterday - 09:30 AM",
  },
  {
    id: "act-3",
    title: "Added new promoter",
    timestamp: "Yesterday - 09:30 AM",
  },
];

/** Composable for loading initial admin mock data and details. */
export const useAdminMockData = () => {
  /** Resolves detailed profile, permissions, and recent activity for a given admin ID. */
  const getAdminDetails = (adminId: string): IAdminDetails | null => {
    const admin = INITIAL_ADMINS.find(
      (a) => a.id === adminId || a.name.toLowerCase().includes(adminId.toLowerCase())
    ) ?? INITIAL_ADMINS[1]; // default to Kolade Stephen fixture if matching exact id

    if (!admin) return null;

    const permissions: IModulePermission[] = DEFAULT_MODULE_PERMISSIONS.map(
      (p, index) => ({
        id: `perm-${index + 1}`,
        module: p.module,
        view: p.view,
        edit: p.edit,
      })
    );

    return {
      admin,
      permissions,
      recentActivities: INITIAL_ADMIN_ACTIVITIES,
    };
  };

  return {
    adminList: INITIAL_ADMINS,
    getAdminDetails,
  };
};
