import type { Profile, UserRole, UserStatus } from "@prisma/client";

// Basic Profile type alias (for super admin users who don't need KYC)
export type BasicProfile = Profile;

// User Management Table Row
export interface UserTableRow {
  id: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// User Stats
export interface UserStats {
  totalUsers: number;
  totalSuperAdmins: number;
  totalAdmins: number;
  userStatusCounts: {
    active: number;
    disabled: number;
    deleted: number;
  };
  recentActivity: {
    newUsersToday: number;
    activeUsers: number;
    disabledUsers: number;
  };
}

// User Filters
export interface UserFilters {
  role: string;
  status: string;
  search: string;
}

// Pagination (reusable)
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API Response
export interface UserApiResponse {
  profiles: BasicProfile[];
  pagination: PaginationMeta;
}

// User Status Update
export interface UserStatusUpdate {
  profileId: string;
  status?: UserStatus;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

// User Role labels (for UI)
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuario",
  ADMIN: "Administrador",
  SUPERADMIN: "Super Administrador",
};

// User Status labels (for UI)
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  disabled: "Deshabilitado",
  deleted: "Eliminado",
};
