import type {
  Profile,
  KYCProfile,
  Address,
  Document,
  IdentifyingInformation,
  RejectionReason,
  Endorsement,
  UserRole,
  UserStatus,
  KYCStatus,
  EndorsementType,
  EndorsementStatus,
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
  endorsements: Endorsement[];
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

  recentActivity: {
    newKYCsToday: number;
    approvedToday: number;
    rejectedToday: number;
    pendingReview: number;
  };
}

// Filter types
export interface KYCFilters {
  status: string;
  kycStatus: string;
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
  rejectionReason?: string;
}

export interface Event {
  id: string;
  type:
    | "USER_SIGNED_UP"
    | "USER_SUBMITTED_KYC"
    | "USER_KYC_UNDER_VERIFICATION"
    | "USER_KYC_APPROVED"
    | "USER_KYC_REJECTED";
  module: "AUTH" | "KYC" | "PROFILE";
  description: string | null;
  profileId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const EVENT_TYPE_LABELS: Record<Event["type"], string> = {
  USER_SIGNED_UP: "Usuario Registrado",
  USER_SUBMITTED_KYC: "KYC Enviado",
  USER_KYC_UNDER_VERIFICATION: "KYC en Verificación",
  USER_KYC_APPROVED: "KYC Aprobado",
  USER_KYC_REJECTED: "KYC Rechazado",
};

export const EVENT_MODULE_LABELS: Record<Event["module"], string> = {
  AUTH: "Autenticación",
  KYC: "Verificación KYC",
  PROFILE: "Perfil",
};

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

// User Role labels
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuario",
  ADMIN: "Administrador",
  SUPERADMIN: "Super Administrador",
};

// User Status labels
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  disabled: "Deshabilitado",
  deleted: "Eliminado",
};

// Endorsement Type labels
export const ENDORSEMENT_TYPE_LABELS: Record<EndorsementType, string> = {
  base: "Base",
  sepa: "SEPA",
  spei: "SPEI",
};

// Endorsement Status labels
export const ENDORSEMENT_STATUS_LABELS: Record<EndorsementStatus, string> = {
  incomplete: "Incompleto",
  approved: "Aprobado",
  revoked: "Revocado",
};
