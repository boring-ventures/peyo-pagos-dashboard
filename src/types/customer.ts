import { z } from "zod";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CustomerType, DocumentType, AccountPurpose, EmploymentStatus, ExpectedMonthlyPaymentsUSD, SourceOfFunds, KYCStatus } from "@prisma/client";

// Base address schema
export const addressSchema = z.object({
  streetLine1: z.string().min(1, "Street address is required"),
  streetLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  subdivision: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type Address = z.infer<typeof addressSchema>;

// Document types for identification
export const identifyingDocumentSchema = z.object({
  type: z.enum([
    "drivers_license",
    "matriculate_id", 
    "military_id",
    "national_id",
    "passport",
    "permanent_residency_id",
    "state_or_provisional_id",
    "visa",
    "ssn",
    "ein"
  ]).optional(),
  issuingCountry: z.string().min(2, "Issuing country is required"),
  number: z.string().optional(),
  imageFront: z.instanceof(File).optional(),
  imageBack: z.instanceof(File).optional(),
  expiration: z.string().optional(), // ISO date string
  description: z.string().optional(),
});

export type IdentifyingDocument = z.infer<typeof identifyingDocumentSchema>;

// Supporting documents
export const supportingDocumentSchema = z.object({
  purposes: z.array(z.enum([
    "proof_of_account_purpose",
    "proof_of_address",
    "proof_of_individual_name_change",
    "proof_of_relationship",
    "proof_of_source_of_funds",
    "proof_of_source_of_wealth",
    "proof_of_tax_identification",
    "statement_of_funds",
    "flow_of_funds",
    "ownership_document",
    "formation_document",
    "other"
  ])),
  file: z.instanceof(File).optional(),
  description: z.string().optional(),
});

export type SupportingDocument = z.infer<typeof supportingDocumentSchema>;

// Ultimate Beneficial Owner for business customers
export const ultimateBeneficialOwnerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, "Birth date is required"), // ISO date string
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: addressSchema,
  hasOwnership: z.boolean().default(false),
  ownershipPercentage: z.string().optional(),
  isDirector: z.boolean().default(false),
  hasControl: z.boolean().default(false),
  isSigner: z.boolean().default(false),
  title: z.string().optional(),
  relationshipEstablishedAt: z.string().optional(), // ISO date string
  identifyingInformation: z.array(identifyingDocumentSchema),
  documents: z.array(supportingDocumentSchema).optional(),
});

export type UltimateBeneficialOwner = z.infer<typeof ultimateBeneficialOwnerSchema>;

// Individual customer registration schema
export const individualRegistrationSchema = z.object({
  customerType: z.literal("individual"),
  
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  middleName: z.string().max(50).optional(),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  nationality: z.string().optional(),
  
  // Address
  residentialAddress: addressSchema,
  
  // Employment and Financial Information
  employmentStatus: z.enum([
    "employed",
    "homemaker", 
    "retired",
    "self_employed",
    "student",
    "unemployed"
  ]).optional(),
  expectedMonthlyPayments: z.enum([
    "0_4999",
    "5000_9999", 
    "10000_49999",
    "50000_plus"
  ]).optional(),
  mostRecentOccupation: z.string().optional(),
  accountPurpose: z.enum([
    "charitable_donations",
    "ecommerce_retail_payments",
    "investment_purposes",
    "operating_a_company",
    "other",
    "payments_to_friends_or_family_abroad",
    "personal_or_living_expenses",
    "protect_wealth",
    "purchase_goods_and_services",
    "receive_payment_for_freelancing",
    "receive_salary"
  ]).optional(),
  accountPurposeOther: z.string().optional(),
  sourceOfFunds: z.enum([
    "company_funds",
    "ecommerce_reseller",
    "gambling_proceeds",
    "gifts",
    "government_benefits",
    "inheritance",
    "investments_loans",
    "pension_retirement",
    "salary",
    "sale_of_assets_real_estate",
    "savings",
    "someone_elses_funds"
  ]).optional(),
  
  // Documents
  identifyingInformation: z.array(identifyingDocumentSchema).min(1, "At least one form of identification is required"),
  documents: z.array(supportingDocumentSchema).optional(),
  
  // Terms and Agreements
  hasAcceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service"
  }),
  tosAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the Bridge Terms of Service"
  }),
  tosSignedAgreementId: z.string().min(1, "TOS agreement ID is required"),
  signedAgreementId: z.string().optional(),
});

export type IndividualRegistrationData = z.infer<typeof individualRegistrationSchema>;

// Business customer registration schema
export const businessRegistrationSchema = z.object({
  customerType: z.literal("business"),
  
  // Business Information
  businessLegalName: z.string().min(1, "Business legal name is required"),
  email: z.string().email("Valid email address is required"),
  businessType: z.enum([
    "corporation",
    "llc",
    "partnership",
    "sole_proprietorship",
    "non_profit",
    "other"
  ]),
  businessIndustry: z.string().optional(),
  businessDescription: z.string().min(10, "Business description is required"),
  primaryWebsite: z.string().url("Valid website URL is required").optional(),
  
  // Business Address
  registeredAddress: addressSchema,
  
  // Compliance Information  
  complianceScreeningExplanation: z.string().optional(),
  isDao: z.boolean().default(false),
  isHighRisk: z.boolean().default(false),
  hasMaterialIntermediaryOwnership: z.boolean().default(false),
  serviceUsageDescription: z.string().min(10, "Service usage description is required"),
  estimatedAnnualRevenueUsd: z.enum([
    "under_250k",
    "250k_1m",
    "1m_10m", 
    "10m_100m",
    "100m_250m",
    "250m_plus"
  ]).optional(),
  expectedMonthlyPaymentsUsd: z.number().optional(),
  operatesInProhibitedCountries: z.enum(["yes", "no"]).default("no"),
  accountPurpose: z.enum([
    "receive_payments_for_goods_and_services",
    "operating_a_company",
    "investment_purposes",
    "other"
  ]),
  accountPurposeOther: z.string().optional(),
  highRiskActivities: z.array(z.string()).default(["none_of_the_above"]),
  sourceOfFunds: z.enum([
    "business_loans",
    "business_income",
    "investment_returns",
    "other"
  ]),
  sourceOfFundsDescription: z.string().optional(),
  conductsMoneyServices: z.boolean().default(false),
  conductsMoneyServicesUsingBridge: z.boolean().default(false),
  
  // Documents and Identification
  identifyingInformation: z.array(identifyingDocumentSchema).min(1, "Business identification is required"),
  documents: z.array(supportingDocumentSchema).min(1, "Business documents are required"),
  
  // Ultimate Beneficial Owners
  ultimateBeneficialOwners: z.array(ultimateBeneficialOwnerSchema).min(1, "At least one beneficial owner is required"),
  
  // Terms and Agreements
  hasAcceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service"
  }),
  signedAgreementId: z.string().optional(),
});

export type BusinessRegistrationData = z.infer<typeof businessRegistrationSchema>;

// Combined customer registration data
export const customerRegistrationSchema = z.discriminatedUnion("customerType", [
  individualRegistrationSchema,
  businessRegistrationSchema,
]);

export type CustomerRegistrationData = z.infer<typeof customerRegistrationSchema>;

// Multi-step form data for UI state management
export interface RegistrationFormState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  hasErrors: boolean;
  completedSteps: Set<number>;
}

// File upload state
export interface FileUploadState {
  file?: File;
  preview?: string;
  isUploading: boolean;
  error?: string;
  progress: number;
}

// Registration response from API
export interface RegistrationResponse {
  success: boolean;
  customerId?: string;
  profileId?: string;
  kycStatus?: KYCStatus;
  error?: string;
  details?: string;
  bridgeResponse?: unknown; // Raw Bridge API response for detailed error display
}

// Validation error types
export interface FormValidationError {
  field: string;
  message: string;
  step?: number;
}

// Constants for form configuration
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_DOCUMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'] as const;

// Country codes for address validation
export const SUPPORTED_COUNTRIES = [
  { code: 'USA', name: 'United States' },
  { code: 'CAN', name: 'Canada' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'MEX', name: 'Mexico' },
  // Add more as needed
] as const;

export type SupportedCountryCode = typeof SUPPORTED_COUNTRIES[number]['code'];