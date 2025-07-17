import { LayoutDashboard, FileText, Users } from "lucide-react";
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
          title: "Gestión de Usuarios",
          url: "/users",
          icon: Users,
        },
        {
          title: "Gestión KYC",
          url: "/kyc",
          icon: FileText,
        },
      ],
    },
  ],
};
