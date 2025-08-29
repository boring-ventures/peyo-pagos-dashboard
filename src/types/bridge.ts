// Bridge.xyz API type definitions based on official API documentation
// https://apidocs.bridge.xyz/api-reference/customers/create-a-customer

// Address format expected by Bridge API
export interface BridgeAddress {
  street_line_1: string;
  street_line_2?: string;
  city: string;
  subdivision?: string; // ISO 3166-2 subdivision code without country prefix
  postal_code?: string;
  country: string; // ISO 3166-1 alpha-3 Country code
}

// Identifying information for Bridge API
export interface BridgeIdentifyingInfo {
  type: 
    | 'drivers_license'
    | 'matriculate_id'
    | 'military_id'
    | 'national_id'
    | 'passport'
    | 'permanent_residency_id'
    | 'state_or_provincial_id'
    | 'visa'
    | 'ssn'
    | 'ein';
  issuing_country: string; // ISO 3166-1 alpha-3 Country code
  number: string;
  image_front?: string; // Base64 encoded image
  image_back?: string; // Base64 encoded image
  expiration?: string; // ISO date string
  description?: string;
}

// Document for Bridge API
export interface BridgeDocument {
  purposes: string[];
  file: string; // Base64 encoded file
  description?: string;
}

// Ultimate Beneficial Owner for Bridge API
export interface BridgeUBO {
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date: string; // YYYY-MM-DD format
  email: string;
  phone?: string;
  address: BridgeAddress;
  has_ownership: boolean;
  ownership_percentage?: string;
  is_director: boolean;
  has_control: boolean;
  is_signer: boolean;
  title?: string;
  relationship_established_at?: string; // YYYY-MM-DD format
  identifying_information: BridgeIdentifyingInfo[];
  documents?: BridgeDocument[];
}

// Individual customer request to Bridge API
export interface BridgeIndividualCustomerRequest {
  type: 'individual';
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  residential_address: BridgeAddress;
  birth_date: string; // YYYY-MM-DD format
  nationality?: string;
  employment_status?: 
    | 'employed'
    | 'homemaker'
    | 'retired'
    | 'self_employed'
    | 'student'
    | 'unemployed';
  expected_monthly_payments?: 
    | 'zero_4999'
    | 'five_thousand_9999'
    | 'ten_thousand_49999'
    | 'fifty_thousand_plus';
  acting_as_intermediary?: string;
  most_recent_occupation?: string;
  account_purpose?: 
    | 'charitable_donations'
    | 'ecommerce_retail_payments'
    | 'investment_purposes'
    | 'operating_a_company'
    | 'other'
    | 'payments_to_friends_or_family_abroad'
    | 'personal_or_living_expenses'
    | 'protect_wealth'
    | 'purchase_goods_and_services'
    | 'receive_payment_for_freelancing'
    | 'receive_salary';
  account_purpose_other?: string;
  source_of_funds?: 
    | 'salary'
    | 'business_income'
    | 'investment_returns'
    | 'inheritance'
    | 'government_benefits'
    | 'loans'
    | 'other';
  signed_agreement_id: string;
  identifying_information: BridgeIdentifyingInfo[];
  documents?: BridgeDocument[];
}

// Business customer request to Bridge API
export interface BridgeBusinessCustomerRequest {
  type: 'business';
  business_legal_name: string;
  email: string;
  registered_address: BridgeAddress;
  business_type: 
    | 'corporation'
    | 'llc'
    | 'partnership'
    | 'sole_proprietorship'
    | 'non_profit'
    | 'other';
  business_industry?: string;
  business_description: string;
  primary_website?: string;
  compliance_screening_explanation?: string;
  is_dao: boolean;
  is_high_risk: boolean;
  has_material_intermediary_ownership: boolean;
  service_usage_description: string;
  estimated_annual_revenue_usd?: 
    | 'under_250000'
    | '250000_999999'
    | '1000000_9999999'
    | '10000000_99999999'
    | '100000000_249999999'
    | '250000000_plus';
  expected_monthly_payments_usd?: number;
  operates_in_prohibited_countries: 'yes' | 'no';
  account_purpose: 
    | 'receive_payments_for_goods_and_services'
    | 'operating_a_company'
    | 'investment_purposes'
    | 'other';
  account_purpose_other?: string;
  high_risk_activities: string[];
  source_of_funds: 
    | 'business_loans'
    | 'business_income'
    | 'investment_returns'
    | 'other';
  source_of_funds_description?: string;
  conducts_money_services: boolean;
  conducts_money_services_using_bridge: boolean;
  signed_agreement_id: string;
  identifying_information: BridgeIdentifyingInfo[];
  documents: BridgeDocument[];
  ultimate_beneficial_owners: BridgeUBO[];
}

// Union type for Bridge customer requests
export type BridgeCustomerRequest = BridgeIndividualCustomerRequest | BridgeBusinessCustomerRequest;

// Bridge API customer response
export interface BridgeCustomerResponse {
  id: string; // Bridge customer ID
  first_name?: string;
  last_name?: string;
  business_legal_name?: string;
  email: string;
  type: 'individual' | 'business';
  status: string; // KYC status from Bridge
  requirements_due: string[];
  future_requirements_due: string[];
  capabilities?: {
    payin_crypto?: string;
    payout_crypto?: string;
    payin_fiat?: string;
    payout_fiat?: string;
  };
  rejection_reasons?: BridgeRejectionReason[];
  endorsements?: BridgeEndorsement[];
  created_at: string;
  updated_at: string;
  has_accepted_terms_of_service?: boolean;
}

// Bridge rejection reason
export interface BridgeRejectionReason {
  developer_reason: string;
  reason: string; // Customer-facing reason
  created_at: string;
}

// Bridge endorsement
export interface BridgeEndorsement {
  name: 'base' | 'sepa' | 'spei' | string;
  status: 'incomplete' | 'approved' | 'revoked';
  requirements?: {
    complete?: string[];
    pending?: string[];
    missing?: string | string[] | object | null;
    issues?: string[];
  };
}

// Bridge API error response
export interface BridgeErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  code?: string;
  status_code: number;
}

// Bridge KYC Link request
export interface BridgeKycLinkRequest {
  full_name: string;
  email: string;
  type: 'individual' | 'business';
  endorsements?: string[];
  redirect_uri?: string;
}

// Bridge KYC Link response
export interface BridgeKycLinkResponse {
  id: string;
  email: string;
  type: 'individual' | 'business';
  kyc_link: string;
  tos_link: string;
  kyc_status: 'not_started' | 'under_review' | 'incomplete' | 'approved' | 'rejected';
  tos_status: 'pending' | 'approved';
  created_at: string;
  customer_id?: string;
  persona_inquiry_type?: string;
  rejection_reasons?: BridgeRejectionReason[];
}

// Status mappings from Bridge to our internal enums
export const BRIDGE_STATUS_TO_KYC_STATUS = {
  'pending': 'under_review',
  'active': 'active', 
  'approved': 'active',
  'rejected': 'rejected',
  'under_review': 'under_review',
  'incomplete': 'incomplete',
  'not_started': 'not_started',
  'awaiting_questionnaire': 'awaiting_questionnaire',
  'awaiting_ubo': 'awaiting_ubo', 
  'paused': 'paused',
  'offboarded': 'offboarded',
} as const;

export type BridgeStatus = keyof typeof BRIDGE_STATUS_TO_KYC_STATUS;
export type KycStatus = typeof BRIDGE_STATUS_TO_KYC_STATUS[BridgeStatus];

// Bridge API client configuration
export interface BridgeClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

// Bridge API request options
export interface BridgeRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: unknown;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}

// Bridge API response wrapper
export interface BridgeApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: BridgeErrorResponse;
  status: number;
  headers: Record<string, string>;
}

// File processing types for Bridge API
export interface ProcessedFile {
  base64Data: string;
  mimeType: string;
  originalName: string;
  size: number;
}

// Document validation result
export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  processedFile?: ProcessedFile;
}

// Bridge webhook event types (for future use)
export interface BridgeWebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: {
    customer_id: string;
    status: string;
    previous_status?: string;
    rejection_reasons?: BridgeRejectionReason[];
    endorsements?: BridgeEndorsement[];
  };
}

// Constants for Bridge API
export const BRIDGE_API_CONSTANTS = {
  BASE_URL_SANDBOX: 'https://api.sandbox.bridge.xyz/v0',
  BASE_URL_PRODUCTION: 'https://api.bridge.xyz/v0',
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/jpg', 'image/png'],
  SUPPORTED_DOCUMENT_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Utility type helpers
export type BridgeCustomerType<T extends BridgeCustomerRequest> = T extends BridgeIndividualCustomerRequest 
  ? 'individual' 
  : T extends BridgeBusinessCustomerRequest 
  ? 'business' 
  : never;