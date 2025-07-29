import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  Activity,
  Coins,
} from "lucide-react";
import type { SidebarData } from "../types";
import type { UserRole } from "@prisma/client";
import { canAccessModule } from "@/lib/auth/role-permissions";

export const getSidebarData = (userRole?: UserRole | null): SidebarData => {
  const adminItems = [];

  // Add user management if user has access
  if (canAccessModule(userRole, "users")) {
    adminItems.push({
      title: "Gestión de Usuarios",
      url: "/users",
      icon: Users,
    });
  }

  // Add KYC management if user has access
  if (canAccessModule(userRole, "kyc")) {
    adminItems.push({
      title: "Gestión KYC",
      url: "/kyc",
      icon: FileText,
    });
  }

  // Add wallet management if user has access
  if (canAccessModule(userRole, "wallets")) {
    adminItems.push({
      title: "Gestión de Wallets",
      url: "/wallets",
      icon: Wallet,
    });
  }

  // Add card management if user has access
  if (canAccessModule(userRole, "cards")) {
    adminItems.push({
      title: "Gestión de Tarjetas",
      url: "/cards",
      icon: CreditCard,
    });
  }

  // Add analytics if user has access (only SUPERADMIN)
  if (canAccessModule(userRole, "analytics")) {
    adminItems.push({
      title: "Analytics de Costos",
      url: "/analytics",
      icon: BarChart3,
    });
  }

  // Add system configuration if user has access (ADMIN and SUPERADMIN)
  if (canAccessModule(userRole, "system-config")) {
    const configItems = [
      {
        title: "Sistema",
        url: "/system-config",
        icon: Settings,
      },
    ];

    // Add crypto deposits only for SUPERADMIN
    if (userRole === "SUPERADMIN") {
      configItems.push({
        title: "Depósitos Crypto",
        url: "/crypto-deposits",
        icon: Coins,
      });
    }

    adminItems.push({
      title: "Configuración",
      icon: Settings,
      items: configItems,
    });
  }

  // Add transactions if user has access (ADMIN and SUPERADMIN)
  if (canAccessModule(userRole, "transactions")) {
    adminItems.push({
      title: "Transacciones",
      url: "/transactions",
      icon: Activity,
    });
  }

  return {
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
      ...(adminItems.length > 0
        ? [
            {
              title: "Administración",
              items: adminItems,
            },
          ]
        : [])
    ],
  };
};
