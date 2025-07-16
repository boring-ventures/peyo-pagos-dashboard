import { LayoutDashboard, FileText, Settings } from "lucide-react";
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
    {
      title: "Administración",
      items: [
        {
          title: "Gestión KYC",
          url: "/kyc",
          icon: FileText,
        },
        {
          title: "Configuración",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
};
