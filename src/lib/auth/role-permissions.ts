import type { UserRole } from "@prisma/client";

/**
 * Role-based permissions configuration
 */
export const ROLE_PERMISSIONS = {
  USER: {
    canAccessDashboard: false, // Regular users cannot access the dashboard
    canAccessAnalytics: false,
    canManageUsers: false,
    canManageKYC: false,
    canManageWallets: false,
    canManageCards: false, // Regular users cannot manage cards
    canAccessSettings: false, // Regular users also cannot access settings in the dashboard
    requiresKYC: true,
  },
  ADMIN: {
    canAccessDashboard: true,
    canAccessAnalytics: false, // Admin cannot access analytics
    canManageUsers: true,
    canManageKYC: true,
    canManageWallets: true,
    canManageCards: true, // Admin can manage cards
    canAccessSettings: true,
    requiresKYC: false,
  },
  SUPERADMIN: {
    canAccessDashboard: true,
    canAccessAnalytics: true, // Only SuperAdmin can access analytics
    canManageUsers: true,
    canManageKYC: true,
    canManageWallets: true,
    canManageCards: true, // SuperAdmin can manage cards
    canAccessSettings: true,
    requiresKYC: false,
  },
} as const;

/**
 * Check if a user has permission for a specific action
 */
export function hasPermission(
  userRole: UserRole | null | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.USER
): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false;
}

/**
 * Check if a user can access a specific module
 */
export function canAccessModule(
  userRole: UserRole | null | undefined,
  module:
    | "dashboard"
    | "analytics"
    | "users"
    | "kyc"
    | "wallets"
    | "cards"
    | "settings"
): boolean {
  if (!userRole) return false;

  switch (module) {
    case "dashboard":
      return hasPermission(userRole, "canAccessDashboard");
    case "analytics":
      return hasPermission(userRole, "canAccessAnalytics");
    case "users":
      return hasPermission(userRole, "canManageUsers");
    case "kyc":
      return hasPermission(userRole, "canManageKYC");
    case "wallets":
      return hasPermission(userRole, "canManageWallets");
    case "cards":
      return hasPermission(userRole, "canManageCards");
    case "settings":
      return hasPermission(userRole, "canAccessSettings");
    default:
      return false;
  }
}

/**
 * Get all roles that can access a specific module
 */
export function getRolesForModule(
  module:
    | "dashboard"
    | "analytics"
    | "users"
    | "kyc"
    | "wallets"
    | "cards"
    | "settings"
): UserRole[] {
  const roles: UserRole[] = ["USER", "ADMIN", "SUPERADMIN"];
  return roles.filter((role) => canAccessModule(role, module));
}

/**
 * Check if user requires KYC verification
 */
export function requiresKYC(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, "requiresKYC");
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    USER: "Usuario",
    ADMIN: "Administrador",
    SUPERADMIN: "Super Administrador",
  };
  return roleNames[role] || role;
}
