import type {
  CustomerRegistrationData,
  IndividualRegistrationData,
  BusinessRegistrationData,
  Address,
  IdentifyingDocument,
  SupportingDocument,
  UltimateBeneficialOwner,
} from '@/types/customer';

import type {
  BridgeCustomerRequest,
  BridgeIndividualCustomerRequest,
  BridgeBusinessCustomerRequest,
  BridgeAddress,
  BridgeIdentifyingInfo,
  BridgeDocument,
  BridgeUBO,
  ProcessedFile,
  DocumentValidationResult,
} from '@/types/bridge';

import { BRIDGE_API_CONSTANTS } from '@/types/bridge';

/**
 * Convert internal customer data to Bridge API format
 */
export function convertCustomerToBridgeFormat(
  customerData: CustomerRegistrationData,
  processedFiles: Map<string, ProcessedFile>
): BridgeCustomerRequest {
  if (customerData.customerType === 'individual') {
    return convertIndividualToBridgeFormat(customerData, processedFiles);
  } else {
    throw new Error('Business customer registration is currently disabled');
  }
}

/**
 * Convert individual customer data to Bridge API format
 */
export function convertIndividualToBridgeFormat(
  data: IndividualRegistrationData,
  processedFiles: Map<string, ProcessedFile>
): BridgeIndividualCustomerRequest {
  return {
    type: 'individual',
    first_name: data.firstName,
    last_name: data.lastName,
    middle_name: data.middleName || undefined,
    email: data.email,
    phone: data.phone,
    residential_address: convertAddressToBridgeFormat(data.residentialAddress),
    birth_date: data.birthDate,
    nationality: data.nationality,
    employment_status: data.employmentStatus,
    expected_monthly_payments: data.expectedMonthlyPayments,
    acting_as_intermediary: 'no',
    most_recent_occupation: data.mostRecentOccupation,
    account_purpose: data.accountPurpose,
    account_purpose_other: data.accountPurposeOther || undefined,
    source_of_funds: data.sourceOfFunds,
    signed_agreement_id: data.signedAgreementId || generateSignedAgreementId(),
    identifying_information: data.identifyingInformation.map((doc) => 
      convertIdentifyingInfoToBridgeFormat(doc, processedFiles)
    ),
    documents: data.documents?.map((doc) => 
      convertDocumentToBridgeFormat(doc, processedFiles)
    ) || [],
  };
}

/**
 * Convert business customer data to Bridge API format
 */
export function convertBusinessToBridgeFormat(
  data: BusinessRegistrationData,
  processedFiles: Map<string, ProcessedFile>
): BridgeBusinessCustomerRequest {
  return {
    type: 'business',
    business_legal_name: data.businessLegalName,
    email: data.email,
    registered_address: convertAddressToBridgeFormat(data.registeredAddress),
    business_type: data.businessType,
    business_industry: data.businessIndustry,
    business_description: data.businessDescription,
    primary_website: data.primaryWebsite,
    compliance_screening_explanation: data.complianceScreeningExplanation,
    is_dao: data.isDao,
    is_high_risk: data.isHighRisk,
    has_material_intermediary_ownership: data.hasMaterialIntermediaryOwnership,
    service_usage_description: data.serviceUsageDescription,
    estimated_annual_revenue_usd: convertAnnualRevenue(data.estimatedAnnualRevenueUsd),
    expected_monthly_payments_usd: data.expectedMonthlyPaymentsUsd,
    operates_in_prohibited_countries: data.operatesInProhibitedCountries,
    account_purpose: data.accountPurpose,
    account_purpose_other: data.accountPurposeOther,
    high_risk_activities: data.highRiskActivities,
    source_of_funds: data.sourceOfFunds,
    source_of_funds_description: data.sourceOfFundsDescription,
    conducts_money_services: data.conductsMoneyServices,
    conducts_money_services_using_bridge: data.conductsMoneyServicesUsingBridge,
    signed_agreement_id: data.signedAgreementId || generateSignedAgreementId(),
    identifying_information: data.identifyingInformation.map((doc) => 
      convertIdentifyingInfoToBridgeFormat(doc, processedFiles)
    ),
    documents: data.documents.map((doc) => 
      convertDocumentToBridgeFormat(doc, processedFiles)
    ),
    ultimate_beneficial_owners: data.ultimateBeneficialOwners.map((ubo) => 
      convertUboToBridgeFormat(ubo, processedFiles)
    ),
  };
}

/**
 * Convert address to Bridge API format
 */
export function convertAddressToBridgeFormat(address: Address): BridgeAddress {
  return {
    street_line_1: address.streetLine1,
    street_line_2: address.streetLine2 || undefined,
    city: address.city,
    postal_code: address.postalCode || undefined,
    country: address.country,
  };
}

/**
 * Convert identifying information to Bridge API format
 */
export function convertIdentifyingInfoToBridgeFormat(
  doc: IdentifyingDocument,
  processedFiles: Map<string, ProcessedFile>
): BridgeIdentifyingInfo {
  const result: BridgeIdentifyingInfo = {
    type: doc.type,
    issuing_country: doc.issuingCountry,
    number: doc.number,
    expiration: doc.expiration || undefined,
    description: doc.description || undefined,
  };

  // Add processed file data if available
  if (doc.imageFront) {
    const frontKey = `${doc.type}_${doc.number}_front`;
    const frontFile = processedFiles.get(frontKey);
    if (frontFile) {
      result.image_front = frontFile.base64Data;
    }
  }

  if (doc.imageBack) {
    const backKey = `${doc.type}_${doc.number}_back`;
    const backFile = processedFiles.get(backKey);
    if (backFile) {
      result.image_back = backFile.base64Data;
    }
  }

  return result;
}

/**
 * Convert document to Bridge API format
 */
export function convertDocumentToBridgeFormat(
  doc: SupportingDocument,
  processedFiles: Map<string, ProcessedFile>
): BridgeDocument {
  const fileKey = `${doc.purposes.join('_')}_${Date.now()}`;
  const processedFile = processedFiles.get(fileKey);

  if (!processedFile) {
    throw new Error(`Processed file not found for document with purposes: ${doc.purposes.join(', ')}`);
  }

  return {
    purposes: doc.purposes,
    file: processedFile.base64Data,
    description: doc.description,
  };
}

/**
 * Convert UBO to Bridge API format
 */
export function convertUboToBridgeFormat(
  ubo: UltimateBeneficialOwner,
  processedFiles: Map<string, ProcessedFile>
): BridgeUBO {
  return {
    first_name: ubo.firstName,
    last_name: ubo.lastName,
    middle_name: ubo.middleName,
    birth_date: ubo.birthDate,
    email: ubo.email,
    phone: ubo.phone,
    address: convertAddressToBridgeFormat(ubo.address),
    has_ownership: ubo.hasOwnership,
    ownership_percentage: ubo.ownershipPercentage,
    is_director: ubo.isDirector,
    has_control: ubo.hasControl,
    is_signer: ubo.isSigner,
    title: ubo.title,
    relationship_established_at: ubo.relationshipEstablishedAt,
    identifying_information: ubo.identifyingInformation.map((doc) => 
      convertIdentifyingInfoToBridgeFormat(doc, processedFiles)
    ),
    documents: ubo.documents?.map((doc) => 
      convertDocumentToBridgeFormat(doc, processedFiles)
    ),
  };
}

/**
 * Convert annual revenue enum to Bridge format
 */
function convertAnnualRevenue(revenue?: string): string | undefined {
  const revenueMapping: Record<string, string> = {
    'under_250k': 'under_250000',
    '250k_1m': '250000_999999',
    '1m_10m': '1000000_9999999',
    '10m_100m': '10000000_99999999',
    '100m_250m': '100000000_249999999',
    '250m_plus': '250000000_plus',
  };

  return revenue ? revenueMapping[revenue] : undefined;
}

/**
 * Generate a signed agreement ID (Terms of Service acceptance)
 * In a real implementation, this would be generated when user accepts ToS
 */
function generateSignedAgreementId(): string {
  return `tos_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Validate file for Bridge API upload
 */
export function validateFileForBridge(file: File): DocumentValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > BRIDGE_API_CONSTANTS.MAX_FILE_SIZE) {
    errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of ${BRIDGE_API_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Check file type
  const isImageFile = BRIDGE_API_CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(file.type as any);
  const isDocumentFile = BRIDGE_API_CONSTANTS.SUPPORTED_DOCUMENT_FORMATS.includes(file.type as any);

  if (!isImageFile && !isDocumentFile) {
    errors.push(`File type '${file.type}' is not supported. Supported formats: ${BRIDGE_API_CONSTANTS.SUPPORTED_DOCUMENT_FORMATS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Process file to base64 for Bridge API
 */
export async function processFileForBridge(file: File): Promise<ProcessedFile> {
  const validation = validateFileForBridge(file);
  
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result as string;
        
        // Extract base64 data (remove data:mime;base64, prefix if present)
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        
        // Create the proper format for Bridge API (with MIME type prefix)
        const formattedData = `data:${file.type};base64,${base64Data}`;

        resolve({
          base64Data: formattedData,
          mimeType: file.type,
          originalName: file.name,
          size: file.size,
        });
      } catch (error) {
        reject(new Error(`Failed to process file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple files for Bridge API submission
 */
export async function processFilesForBridge(
  files: File[],
  progressCallback?: (progress: number, fileName: string) => void
): Promise<Map<string, ProcessedFile>> {
  const processedFiles = new Map<string, ProcessedFile>();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      progressCallback?.(Math.round((i / total) * 100), file.name);
      
      const processed = await processFileForBridge(file);
      const key = `${file.name}_${i}`;
      processedFiles.set(key, processed);
      
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      throw new Error(`Failed to process file ${file.name}: ${error}`);
    }
  }

  progressCallback?.(100, 'All files processed');
  return processedFiles;
}

/**
 * Validate customer data before Bridge API submission
 */
export function validateCustomerDataForBridge(data: CustomerRegistrationData): string[] {
  const errors: string[] = [];

  // Common validations
  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email address is required');
  }

  if (!data.hasAcceptedTerms) {
    errors.push('Terms of service acceptance is required');
  }

  if (!data.identifyingInformation || data.identifyingInformation.length === 0) {
    errors.push('At least one form of identification is required');
  }

  // Address validation
  const address = data.customerType === 'individual' 
    ? data.residentialAddress 
    : data.registeredAddress;
    
  if (!address.streetLine1 || !address.city || !address.country) {
    errors.push('Complete address information is required');
  }

  if (address.country.length !== 3) {
    errors.push('Country must be a valid ISO 3166-1 alpha-3 code');
  }

  // Individual-specific validations
  if (data.customerType === 'individual') {
    if (!data.firstName || data.firstName.length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!data.lastName || data.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters');
    }

    if (!data.birthDate) {
      errors.push('Birth date is required for individual customers');
    }
  }

  // Business customers are currently disabled
  if (data.customerType === 'business') {
    errors.push('Business customer registration is currently disabled');
  }

  return errors;
}

/**
 * Sanitize customer data for logging (remove sensitive information)
 */
export function sanitizeCustomerDataForLogging(data: CustomerRegistrationData) {
  const sanitized = { ...data };

  // Remove sensitive fields
  if ('identifyingInformation' in sanitized) {
    sanitized.identifyingInformation = sanitized.identifyingInformation.map(doc => ({
      ...doc,
      number: doc.number ? `${doc.number.substring(0, 3)}***` : undefined,
      imageFront: doc.imageFront ? '[FILE_REMOVED]' : undefined,
      imageBack: doc.imageBack ? '[FILE_REMOVED]' : undefined,
    }));
  }

  if ('documents' in sanitized) {
    sanitized.documents = sanitized.documents?.map(doc => ({
      ...doc,
      file: '[FILE_REMOVED]',
    }));
  }

  if ('ultimateBeneficialOwners' in sanitized) {
    sanitized.ultimateBeneficialOwners = sanitized.ultimateBeneficialOwners?.map(ubo => ({
      ...ubo,
      identifyingInformation: ubo.identifyingInformation.map(doc => ({
        ...doc,
        number: doc.number ? `${doc.number.substring(0, 3)}***` : undefined,
        imageFront: doc.imageFront ? '[FILE_REMOVED]' : undefined,
        imageBack: doc.imageBack ? '[FILE_REMOVED]' : undefined,
      })),
      documents: ubo.documents?.map(doc => ({
        ...doc,
        file: '[FILE_REMOVED]',
      })),
    }));
  }

  return sanitized;
}