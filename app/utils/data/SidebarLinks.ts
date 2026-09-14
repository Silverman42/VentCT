export type SidebarLink =
  | {
      type: "heading";
      name: string;
    }
  | {
      type: "link";
      name: string;
      icon: string;
      route: string;
    };

export const sidebarLinks: SidebarLink[][] = [
  [
    {
      type: "heading",
      name: "Overview",
    },
    {
      type: "link",
      name: "Dashboard",
      icon: "vent:analytics",
      route: "/dashboard",
    },
    {
      type: "heading",
      name: "CAMPAIGN MANAGEMENT",
    },
    {
      type: "link",
      name: "Campaigns",
      icon: "vent:volume-high",
      route: "/campaigns",
    },
    {
      type: "link",
      name: "Promoters",
      icon: "vent:profile-add",
      route: "/promoters",
    },
    {
      type: "link",
      name: "Attendances",
      icon: "vent:folder-two",
      route: "/attendances",
    },
    {
      type: "link",
      name: "Audiences",
      icon: "vent:people",
      route: "/audiences",
    },
    {
      type: "heading",
      name: "Team",
    },
    {
      type: "link",
      name: "Admins",
      icon: "vent:people",
      route: "/admins",
    },
    {
      type: "heading",
      name: "TOOLS & MONITOR",
    },
    {
      type: "link",
      name: "Deep Links",
      icon: "vent:link-2",
      route: "/deep-links",
    },
    {
      type: "link",
      name: "Telescope",
      icon: "vent:video",
      route: "/",
    },
    {
      type: "link",
      name: "logs",
      icon: "vent:timer-2",
      route: "/",
    },
  ],
];
