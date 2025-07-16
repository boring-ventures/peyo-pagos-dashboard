import type {
  Profile,
  KYCProfile,
  Address,
  Document,
  IdentifyingInformation,
  RejectionReason,
  UserRole,
  UserStatus,
  KYCStatus,
} from "@prisma/client";

// Extended Profile with KYC data
export interface ProfileWithKYC extends Profile {
  kycProfile?: KYCProfileWithRelations | null;
}

// Extended KYC Profile with all relations
export interface KYCProfileWithRelations extends KYCProfile {
  profile: Profile;
  address?: Address | null;
  identifyingInfo: IdentifyingInformation[];
  documents: Document[];
  rejectionReasons: RejectionReason[];
}

// KYC Data Table Row
export interface KYCTableRow {
  id: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  kycProfile?: {
    id: string;
    kycStatus: KYCStatus;
    bridgeVerificationStatus: string | null;
    bridgeCustomerId: string | null;
    kycSubmittedAt: Date | null;
    kycApprovedAt: Date | null;
    kycRejectedAt: Date | null;
    kycRejectionReason: string | null;
    hasDocuments: boolean;
    hasAddress: boolean;
    hasIdentifyingInfo: boolean;
    lastRejectionReason?: string | null;
  } | null;
}

// KYC Stats
export interface KYCStats {
  totalUsers: number;
  totalKYCProfiles: number;
  kycStatusCounts: {
    not_started: number;
    incomplete: number;
    awaiting_questionnaire: number;
    awaiting_ubo: number;
    under_review: number;
    active: number;
    rejected: number;
    paused: number;
    offboarded: number;
  };
  bridgeVerificationCounts: {
    not_started: number;
    pending: number;
    approved: number;
    rejected: number;
    under_review: number;
  };
  recentActivity: {
    newKYCsToday: number;
    approvedToday: number;
    rejectedToday: number;
    pendingReview: number;
  };
}

// Filter types
export interface KYCFilters {
  role: string;
  status: string;
  kycStatus: string;
  bridgeVerificationStatus: string;
  search: string;
}

// Pagination
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API Response
export interface KYCApiResponse {
  profiles: ProfileWithKYC[];
  pagination: PaginationMeta;
}

// KYC Status Update
export interface KYCStatusUpdate {
  profileId: string;
  kycStatus?: KYCStatus;
  bridgeVerificationStatus?: string;
  rejectionReason?: string;
}

// Bridge Protocol status options
export const BRIDGE_VERIFICATION_STATUS = {
  NOT_STARTED: "not_started",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  UNDER_REVIEW: "under_review",
} as const;

export type BridgeVerificationStatus =
  (typeof BRIDGE_VERIFICATION_STATUS)[keyof typeof BRIDGE_VERIFICATION_STATUS];

// KYC Status labels
export const KYC_STATUS_LABELS: Record<KYCStatus, string> = {
  not_started: "No Iniciado",
  incomplete: "Incompleto",
  awaiting_questionnaire: "Esperando Cuestionario",
  awaiting_ubo: "Esperando UBO",
  under_review: "En Revisión",
  active: "Activo",
  rejected: "Rechazado",
  paused: "Pausado",
  offboarded: "Desvinculado",
};

// Bridge Verification Status labels
export const BRIDGE_STATUS_LABELS: Record<string, string> = {
  not_started: "No Iniciado",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  under_review: "En Revisión",
};

// User Role labels
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuario",
  SUPERADMIN: "Administrador",
};

// User Status labels
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  disabled: "Deshabilitado",
  deleted: "Eliminado",
};
