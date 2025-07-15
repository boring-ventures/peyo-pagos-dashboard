import { LayoutDashboard } from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "PEYO Pagos",
      logo: LayoutDashboard,
      plan: "",
    },
  ],
  navGroups: [
    {
      title: "Principal",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],
};
