import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  BarChart3,
} from "lucide-react";
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
        {
          title: "Gestión de Wallets",
          url: "/wallets",
          icon: Wallet,
        },
        {
          title: "Analytics de Costos",
          url: "/analytics",
          icon: BarChart3,
        },
      ],
    },
  ],
};
