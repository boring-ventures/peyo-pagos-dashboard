import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  Activity,
  Receipt,
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
    adminItems.push({
      title: "Configuración del Sistema",
      url: "/system-config",
      icon: Settings,
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

  // Create billing items if user has analytics access
  const billingItems = [];
  if (canAccessModule(userRole, "analytics")) {
    billingItems.push({
      title: "Órdenes de Compra",
      url: "/purchase-orders",
      icon: Receipt,
      isPlaceholder: true, // Will be implemented when we have a profile list
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
        : []),
      ...(billingItems.length > 0
        ? [
            {
              title: "Facturación",
              items: billingItems,
            },
          ]
        : []),
    ],
  };
};
