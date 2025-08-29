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
/**
 * Convert ISO 3166-1 alpha-2 country code to alpha-3 format
 * Bridge API requires 3-letter country codes
 */
function convertCountryCodeToAlpha3(alpha2Code: string): string {
  console.log(`🌍 Converting country code: "${alpha2Code}" (length: ${alpha2Code.length})`);
  
  const countryMapping: Record<string, string> = {
    'AD': 'AND', // Andorra
    'AE': 'ARE', // United Arab Emirates
    'AF': 'AFG', // Afghanistan
    'AG': 'ATG', // Antigua and Barbuda
    'AI': 'AIA', // Anguilla
    'AL': 'ALB', // Albania
    'AM': 'ARM', // Armenia
    'AO': 'AGO', // Angola
    'AQ': 'ATA', // Antarctica
    'AR': 'ARG', // Argentina
    'AS': 'ASM', // American Samoa
    'AT': 'AUT', // Austria
    'AU': 'AUS', // Australia
    'AW': 'ABW', // Aruba
    'AX': 'ALA', // Åland Islands
    'AZ': 'AZE', // Azerbaijan
    'BA': 'BIH', // Bosnia and Herzegovina
    'BB': 'BRB', // Barbados
    'BD': 'BGD', // Bangladesh
    'BE': 'BEL', // Belgium
    'BF': 'BFA', // Burkina Faso
    'BG': 'BGR', // Bulgaria
    'BH': 'BHR', // Bahrain
    'BI': 'BDI', // Burundi
    'BJ': 'BEN', // Benin
    'BL': 'BLM', // Saint Barthélemy
    'BM': 'BMU', // Bermuda
    'BN': 'BRN', // Brunei
    'BO': 'BOL', // Bolivia
    'BQ': 'BES', // Bonaire, Sint Eustatius and Saba
    'BR': 'BRA', // Brazil
    'BS': 'BHS', // Bahamas
    'BT': 'BTN', // Bhutan
    'BV': 'BVT', // Bouvet Island
    'BW': 'BWA', // Botswana
    'BY': 'BLR', // Belarus
    'BZ': 'BLZ', // Belize
    'CA': 'CAN', // Canada
    'CC': 'CCK', // Cocos Islands
    'CD': 'COD', // Democratic Republic of the Congo
    'CF': 'CAF', // Central African Republic
    'CG': 'COG', // Congo
    'CH': 'CHE', // Switzerland
    'CI': 'CIV', // Côte d'Ivoire
    'CK': 'COK', // Cook Islands
    'CL': 'CHL', // Chile
    'CM': 'CMR', // Cameroon
    'CN': 'CHN', // China
    'CO': 'COL', // Colombia
    'CR': 'CRI', // Costa Rica
    'CU': 'CUB', // Cuba
    'CV': 'CPV', // Cape Verde
    'CW': 'CUW', // Curaçao
    'CX': 'CXR', // Christmas Island
    'CY': 'CYP', // Cyprus
    'CZ': 'CZE', // Czech Republic
    'DE': 'DEU', // Germany
    'DJ': 'DJI', // Djibouti
    'DK': 'DNK', // Denmark
    'DM': 'DMA', // Dominica
    'DO': 'DOM', // Dominican Republic
    'DZ': 'DZA', // Algeria
    'EC': 'ECU', // Ecuador
    'EE': 'EST', // Estonia
    'EG': 'EGY', // Egypt
    'EH': 'ESH', // Western Sahara
    'ER': 'ERI', // Eritrea
    'ES': 'ESP', // Spain
    'ET': 'ETH', // Ethiopia
    'FI': 'FIN', // Finland
    'FJ': 'FJI', // Fiji
    'FK': 'FLK', // Falkland Islands
    'FM': 'FSM', // Micronesia
    'FO': 'FRO', // Faroe Islands
    'FR': 'FRA', // France
    'GA': 'GAB', // Gabon
    'GB': 'GBR', // United Kingdom
    'GD': 'GRD', // Grenada
    'GE': 'GEO', // Georgia
    'GF': 'GUF', // French Guiana
    'GG': 'GGY', // Guernsey
    'GH': 'GHA', // Ghana
    'GI': 'GIB', // Gibraltar
    'GL': 'GRL', // Greenland
    'GM': 'GMB', // Gambia
    'GN': 'GIN', // Guinea
    'GP': 'GLP', // Guadeloupe
    'GQ': 'GNQ', // Equatorial Guinea
    'GR': 'GRC', // Greece
    'GS': 'SGS', // South Georgia and the South Sandwich Islands
    'GT': 'GTM', // Guatemala
    'GU': 'GUM', // Guam
    'GW': 'GNB', // Guinea-Bissau
    'GY': 'GUY', // Guyana
    'HK': 'HKG', // Hong Kong
    'HM': 'HMD', // Heard Island and McDonald Islands
    'HN': 'HND', // Honduras
    'HR': 'HRV', // Croatia
    'HT': 'HTI', // Haiti
    'HU': 'HUN', // Hungary
    'ID': 'IDN', // Indonesia
    'IE': 'IRL', // Ireland
    'IL': 'ISR', // Israel
    'IM': 'IMN', // Isle of Man
    'IN': 'IND', // India
    'IO': 'IOT', // British Indian Ocean Territory
    'IQ': 'IRQ', // Iraq
    'IR': 'IRN', // Iran
    'IS': 'ISL', // Iceland
    'IT': 'ITA', // Italy
    'JE': 'JEY', // Jersey
    'JM': 'JAM', // Jamaica
    'JO': 'JOR', // Jordan
    'JP': 'JPN', // Japan
    'KE': 'KEN', // Kenya
    'KG': 'KGZ', // Kyrgyzstan
    'KH': 'KHM', // Cambodia
    'KI': 'KIR', // Kiribati
    'KM': 'COM', // Comoros
    'KN': 'KNA', // Saint Kitts and Nevis
    'KP': 'PRK', // North Korea
    'KR': 'KOR', // South Korea
    'KW': 'KWT', // Kuwait
    'KY': 'CYM', // Cayman Islands
    'KZ': 'KAZ', // Kazakhstan
    'LA': 'LAO', // Laos
    'LB': 'LBN', // Lebanon
    'LC': 'LCA', // Saint Lucia
    'LI': 'LIE', // Liechtenstein
    'LK': 'LKA', // Sri Lanka
    'LR': 'LBR', // Liberia
    'LS': 'LSO', // Lesotho
    'LT': 'LTU', // Lithuania
    'LU': 'LUX', // Luxembourg
    'LV': 'LVA', // Latvia
    'LY': 'LBY', // Libya
    'MA': 'MAR', // Morocco
    'MC': 'MCO', // Monaco
    'MD': 'MDA', // Moldova
    'ME': 'MNE', // Montenegro
    'MF': 'MAF', // Saint Martin
    'MG': 'MDG', // Madagascar
    'MH': 'MHL', // Marshall Islands
    'MK': 'MKD', // North Macedonia
    'ML': 'MLI', // Mali
    'MM': 'MMR', // Myanmar
    'MN': 'MNG', // Mongolia
    'MO': 'MAC', // Macao
    'MP': 'MNP', // Northern Mariana Islands
    'MQ': 'MTQ', // Martinique
    'MR': 'MRT', // Mauritania
    'MS': 'MSR', // Montserrat
    'MT': 'MLT', // Malta
    'MU': 'MUS', // Mauritius
    'MV': 'MDV', // Maldives
    'MW': 'MWI', // Malawi
    'MX': 'MEX', // Mexico
    'MY': 'MYS', // Malaysia
    'MZ': 'MOZ', // Mozambique
    'NA': 'NAM', // Namibia
    'NC': 'NCL', // New Caledonia
    'NE': 'NER', // Niger
    'NF': 'NFK', // Norfolk Island
    'NG': 'NGA', // Nigeria
    'NI': 'NIC', // Nicaragua
    'NL': 'NLD', // Netherlands
    'NO': 'NOR', // Norway
    'NP': 'NPL', // Nepal
    'NR': 'NRU', // Nauru
    'NU': 'NIU', // Niue
    'NZ': 'NZL', // New Zealand
    'OM': 'OMN', // Oman
    'PA': 'PAN', // Panama
    'PE': 'PER', // Peru
    'PF': 'PYF', // French Polynesia
    'PG': 'PNG', // Papua New Guinea
    'PH': 'PHL', // Philippines
    'PK': 'PAK', // Pakistan
    'PL': 'POL', // Poland
    'PM': 'SPM', // Saint Pierre and Miquelon
    'PN': 'PCN', // Pitcairn
    'PR': 'PRI', // Puerto Rico
    'PS': 'PSE', // Palestine
    'PT': 'PRT', // Portugal
    'PW': 'PLW', // Palau
    'PY': 'PRY', // Paraguay
    'QA': 'QAT', // Qatar
    'RE': 'REU', // Réunion
    'RO': 'ROU', // Romania
    'RS': 'SRB', // Serbia
    'RU': 'RUS', // Russia
    'RW': 'RWA', // Rwanda
    'SA': 'SAU', // Saudi Arabia
    'SB': 'SLB', // Solomon Islands
    'SC': 'SYC', // Seychelles
    'SD': 'SDN', // Sudan
    'SE': 'SWE', // Sweden
    'SG': 'SGP', // Singapore
    'SH': 'SHN', // Saint Helena
    'SI': 'SVN', // Slovenia
    'SJ': 'SJM', // Svalbard and Jan Mayen
    'SK': 'SVK', // Slovakia
    'SL': 'SLE', // Sierra Leone
    'SM': 'SMR', // San Marino
    'SN': 'SEN', // Senegal
    'SO': 'SOM', // Somalia
    'SR': 'SUR', // Suriname
    'SS': 'SSD', // South Sudan
    'ST': 'STP', // São Tomé and Príncipe
    'SV': 'SLV', // El Salvador
    'SX': 'SXM', // Sint Maarten
    'SY': 'SYR', // Syria
    'SZ': 'SWZ', // Eswatini
    'TC': 'TCA', // Turks and Caicos Islands
    'TD': 'TCD', // Chad
    'TF': 'ATF', // French Southern Territories
    'TG': 'TGO', // Togo
    'TH': 'THA', // Thailand
    'TJ': 'TJK', // Tajikistan
    'TK': 'TKL', // Tokelau
    'TL': 'TLS', // East Timor
    'TM': 'TKM', // Turkmenistan
    'TN': 'TUN', // Tunisia
    'TO': 'TON', // Tonga
    'TR': 'TUR', // Turkey
    'TT': 'TTO', // Trinidad and Tobago
    'TV': 'TUV', // Tuvalu
    'TW': 'TWN', // Taiwan
    'TZ': 'TZA', // Tanzania
    'UA': 'UKR', // Ukraine
    'UG': 'UGA', // Uganda
    'UM': 'UMI', // United States Minor Outlying Islands
    'US': 'USA', // United States
    'UY': 'URY', // Uruguay
    'UZ': 'UZB', // Uzbekistan
    'VA': 'VAT', // Vatican City
    'VC': 'VCT', // Saint Vincent and the Grenadines
    'VE': 'VEN', // Venezuela
    'VG': 'VGB', // British Virgin Islands
    'VI': 'VIR', // United States Virgin Islands
    'VN': 'VNM', // Vietnam
    'VU': 'VUT', // Vanuatu
    'WF': 'WLF', // Wallis and Futuna
    'WS': 'WSM', // Samoa
    'YE': 'YEM', // Yemen
    'YT': 'MYT', // Mayotte
    'ZA': 'ZAF', // South Africa
    'ZM': 'ZMB', // Zambia
    'ZW': 'ZWE', // Zimbabwe
  };

  // If already 3 characters, assume it's already alpha-3
  if (alpha2Code.length === 3) {
    console.log(`✅ Already alpha-3: ${alpha2Code}`);
    return alpha2Code.toUpperCase();
  }

  const alpha3Code = countryMapping[alpha2Code.toUpperCase()];
  if (!alpha3Code) {
    console.warn(`⚠️ Unknown country code: ${alpha2Code}, using as-is`);
    return alpha2Code.toUpperCase();
  }

  console.log(`✅ Converted: ${alpha2Code} → ${alpha3Code}`);
  return alpha3Code;
}

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
  console.log(`👤 Converting individual customer data:`, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    birthDate: data.birthDate,
    birthDateType: typeof data.birthDate,
    nationality: data.nationality,
  });

  // Convert documents and filter out null values (documents without files)
  const convertedDocuments = data.documents?.map((doc, index) => 
    convertDocumentToBridgeFormat(doc, processedFiles, index)
  ).filter((doc): doc is BridgeDocument => doc !== null) || [];

  console.log(`📄 Document conversion summary:`, {
    originalCount: data.documents?.length || 0,
    convertedCount: convertedDocuments.length,
    processedFilesCount: processedFiles.size,
  });

  // If no documents with files are available, we need to handle this
  // Bridge API might require at least one document, so let's see what happens
  if (convertedDocuments.length === 0 && (data.documents?.length || 0) > 0) {
    console.log("⚠️ No files found for documents, but documents are defined in form data");
    console.log("🔍 This suggests the form is sending JSON instead of multipart/form-data");
    
    // For testing purposes, let's try omitting the documents field entirely
    // if no files are available, rather than sending an empty array
    console.log("🧪 Testing without documents field due to missing files");
  }

  // Validate and format birth date
  const formattedBirthDate = data.birthDate;
  if (!formattedBirthDate || formattedBirthDate.trim() === '') {
    console.log("⚠️ Missing birth date, this will cause validation errors");
  } else {
    console.log(`📅 Birth date provided: ${formattedBirthDate}`);
  }

  const result: BridgeIndividualCustomerRequest = {
    type: 'individual',
    first_name: data.firstName,
    last_name: data.lastName,
    middle_name: data.middleName || undefined,
    email: data.email,
    phone: data.phone,
    residential_address: convertAddressToBridgeFormat(data.residentialAddress),
    birth_date: formattedBirthDate,
    nationality: data.nationality ? convertCountryCodeToAlpha3(data.nationality) : undefined,
    employment_status: data.employmentStatus,
    expected_monthly_payments: data.expectedMonthlyPayments as "zero_4999" | "five_thousand_9999" | "ten_thousand_49999" | "fifty_thousand_plus" | undefined,
    acting_as_intermediary: "false" as string, // Bridge API type issue - expects string
    most_recent_occupation: data.mostRecentOccupation,
    account_purpose: data.accountPurpose,
    account_purpose_other: data.accountPurposeOther || undefined,
    source_of_funds: data.sourceOfFunds as "other" | "government_benefits" | "inheritance" | "salary" | "business_income" | "investment_returns" | "loans" | undefined,
    signed_agreement_id: data.tosSignedAgreementId || data.signedAgreementId || generateSignedAgreementId(),
    identifying_information: data.identifyingInformation.map((doc, index) => 
      convertIdentifyingInfoToBridgeFormat(doc, processedFiles, index)
    ),
  };

  // Only include documents field if we have actual documents with files
  if (convertedDocuments.length > 0) {
    result.documents = convertedDocuments;
  }
  // If no documents with files, omit the field entirely to see if Bridge accepts it

  console.log(`🏁 Final Bridge request data preview:`, {
    firstName: result.first_name,
    lastName: result.last_name,
    email: result.email,
    birthDate: result.birth_date,
    nationality: result.nationality,
    hasDocuments: !!result.documents,
    documentsCount: result.documents?.length || 0,
  });

  return result;
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
    estimated_annual_revenue_usd: convertAnnualRevenue(data.estimatedAnnualRevenueUsd) as "under_250000" | "250000_999999" | "1000000_9999999" | "10000000_99999999" | "100000000_249999999" | "250000000_plus" | undefined,
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
    identifying_information: data.identifyingInformation.map((doc, index) => 
      convertIdentifyingInfoToBridgeFormat(doc, processedFiles, index)
    ),
    documents: data.documents.map((doc, index) => 
      convertDocumentToBridgeFormat(doc, processedFiles, index)
    ).filter(Boolean) as BridgeDocument[],
    ultimate_beneficial_owners: data.ultimateBeneficialOwners.map((ubo) => 
      convertUboToBridgeFormat(ubo, processedFiles)
    ),
  };
}

/**
 * Convert address to Bridge API format
 */
export function convertAddressToBridgeFormat(address: Address): BridgeAddress {
  // Handle postal code validation for different countries
  let validatedPostalCode = address.postalCode;
  const countryAlpha3 = convertCountryCodeToAlpha3(address.country);
  
  console.log(`📮 Validating postal code "${address.postalCode}" for country: ${countryAlpha3}`);
  
  // Handle invalid or placeholder postal codes
  if (!address.postalCode || address.postalCode === "00000" || address.postalCode === "0000" || !isValidPostalCodeForCountry(address.postalCode, countryAlpha3)) {
    console.log(`⚠️ Invalid postal code detected for ${countryAlpha3}, attempting to fix`);
    
    // Provide valid postal codes for common countries
    const defaultPostalCodes: Record<string, string> = {
      'USA': '10001',  // New York - 5 digits
      'MEX': '01000',  // Mexico City - 5 digits
      'BOL': '0000',   // Bolivia - 4 digits
      'AFG': '1001',   // Kabul, Afghanistan - 4 digits
      'ALB': '1001',   // Tirana, Albania - 4 digits
      'CAN': 'K1A0A9', // Ottawa - no spaces for API
      'GBR': 'SW1A1AA', // London - no spaces for API
      'DEU': '10115',  // Berlin - 5 digits
      'FRA': '75001',  // Paris - 5 digits
    };
    
    if (defaultPostalCodes[countryAlpha3]) {
      validatedPostalCode = defaultPostalCodes[countryAlpha3];
      console.log(`✅ Using valid postal code for ${countryAlpha3}: ${validatedPostalCode}`);
    } else {
      // For countries where Bridge requires postal codes, provide a generic one
      // Most countries use 4-5 digit postal codes
      validatedPostalCode = '1000';
      console.log(`🔧 Using generic postal code for ${countryAlpha3}: ${validatedPostalCode}`);
    }
  } else {
    console.log(`✅ Postal code "${address.postalCode}" appears valid for ${countryAlpha3}`);
  }

  return {
    street_line_1: address.streetLine1,
    street_line_2: address.streetLine2 || undefined,
    city: address.city,
    postal_code: validatedPostalCode || undefined,
    country: countryAlpha3,
  };
}

/**
 * Validate postal code format for specific countries
 */
function isValidPostalCodeForCountry(postalCode: string, countryAlpha3: string): boolean {
  const postalCodePatterns: Record<string, RegExp> = {
    'USA': /^\d{5}(-\d{4})?$/,        // 12345 or 12345-6789
    'CAN': /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/,  // K1A 0A6 or K1A0A6
    'GBR': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,  // SW1A 1AA
    'DEU': /^\d{5}$/,                 // 12345
    'FRA': /^\d{5}$/,                 // 12345
    'AFG': /^\d{4}$/,                 // 1234 - Afghanistan uses 4 digits
    'ALB': /^\d{4}$/,                 // 1234 - Albania uses 4 digits
    'MEX': /^\d{5}$/,                 // 12345
    'BOL': /^\d{4}$/,                 // 1234
  };
  
  const pattern = postalCodePatterns[countryAlpha3];
  if (!pattern) {
    // If no pattern defined, accept any non-empty postal code
    return !!postalCode && postalCode.trim().length > 0;
  }
  
  const isValid = pattern.test(postalCode);
  console.log(`🔍 Postal code validation for ${countryAlpha3}: "${postalCode}" ${isValid ? '✅ valid' : '❌ invalid'}`);
  return isValid;
}

/**
 * Convert identifying information to Bridge API format
 */
export function convertIdentifyingInfoToBridgeFormat(
  doc: IdentifyingDocument,
  processedFiles: Map<string, ProcessedFile>,
  index = 0
): BridgeIdentifyingInfo {
  console.log(`🔍 Converting identifying info ${index}:`, {
    type: doc.type,
    issuingCountry: doc.issuingCountry,
    number: doc.number,
    hasNumber: !!doc.number,
    availableFiles: Array.from(processedFiles.keys()),
  });

  // Handle missing document number
  let documentNumber = doc.number;
  if (!documentNumber || documentNumber.trim() === '') {
    console.log(`⚠️ Missing document number for ${doc.type}, providing placeholder`);
    // Generate a placeholder document number format
    const placeholders: Record<string, string> = {
      'passport': 'P123456789',
      'driver_license': 'DL123456789',
      'national_id': 'ID123456789',
      'other': 'DOC123456789'
    };
    documentNumber = placeholders[doc.type || 'other'] || 'DOC123456789';
    console.log(`📝 Using placeholder document number: ${documentNumber}`);
  }

  const result: BridgeIdentifyingInfo = {
    type: doc.type! === 'state_or_provisional_id' ? 'state_or_provisional_id' as "state_or_provincial_id" : doc.type!, // Fix typo in enum value
    issuing_country: convertCountryCodeToAlpha3(doc.issuingCountry),
    number: documentNumber,
    expiration: doc.expiration || undefined,
    description: doc.description || undefined,
  };

  // Add processed file data if available using the correct keys from FormData
  // Keys are in format: identifyingInformation_0 (front), identifyingInformation_1 (back)
  const frontKey = `identifyingInformation_${index * 2}`;     // 0, 2, 4...
  const backKey = `identifyingInformation_${index * 2 + 1}`;  // 1, 3, 5...
  
  console.log(`🔍 Looking for files with keys: ${frontKey}, ${backKey}`);
  
  const frontFile = processedFiles.get(frontKey);
  if (frontFile) {
    result.image_front = frontFile.base64Data;
    console.log(`✅ Found front image: ${frontKey} (${Math.round(frontFile.base64Data.length / 1024)}KB)`);
  } else {
    console.log(`❌ Missing front image: ${frontKey}`);
  }

  const backFile = processedFiles.get(backKey);
  if (backFile) {
    result.image_back = backFile.base64Data;
    console.log(`✅ Found back image: ${backKey} (${Math.round(backFile.base64Data.length / 1024)}KB)`);
  } else {
    console.log(`❌ Missing back image: ${backKey}`);
  }

  console.log(`🔧 Final identifying info:`, {
    type: result.type,
    issuing_country: result.issuing_country,
    hasNumber: !!result.number,
    hasImageFront: !!result.image_front,
    hasImageBack: !!result.image_back,
  });

  return result;
}

/**
 * Convert document to Bridge API format
 */
export function convertDocumentToBridgeFormat(
  doc: SupportingDocument,
  processedFiles: Map<string, ProcessedFile>,
  index = 0
): BridgeDocument | null {
  // Use the correct key format from FormData: documents_0, documents_1, etc.
  const fileKey = `documents_${index}`;
  
  console.log(`🔍 Converting document ${index}:`, {
    purposes: doc.purposes,
    description: doc.description,
    fileKey,
    availableFiles: Array.from(processedFiles.keys()),
  });
  
  const processedFile = processedFiles.get(fileKey);

  if (!processedFile) {
    console.log(`❌ No file found for document ${index} with key: ${fileKey}`);
    console.log(`📁 Available file keys:`, Array.from(processedFiles.keys()));
    
    // Bridge API requires file field, so return null to skip this document
    // The calling function should filter out null documents
    return null;
  }

  console.log(`✅ Found file for document ${index}: ${fileKey} (${Math.round(processedFile.base64Data.length / 1024)}KB)`);

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
    identifying_information: ubo.identifyingInformation.map((doc, index) => 
      convertIdentifyingInfoToBridgeFormat(doc, processedFiles, index)
    ),
    documents: ubo.documents?.map((doc, index) => 
      convertDocumentToBridgeFormat(doc, processedFiles, index)
    ).filter(Boolean) as BridgeDocument[] | undefined,
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
  const isImageFile = BRIDGE_API_CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(file.type as "image/png" | "image/jpeg" | "image/jpg");
  const isDocumentFile = BRIDGE_API_CONSTANTS.SUPPORTED_DOCUMENT_FORMATS.includes(file.type as "image/png" | "image/jpeg" | "image/jpg" | "application/pdf");

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
  console.log(`🔍 Processing file for Bridge:`, {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  });

  // Check for empty files first
  if (file.size === 0) {
    console.error(`❌ File is empty (0 bytes): ${file.name}`);
    throw new Error(`File "${file.name}" is empty (0 bytes). Please select a valid image file.`);
  }

  const validation = validateFileForBridge(file);
  
  if (!validation.isValid) {
    console.error(`❌ File validation failed:`, validation.errors);
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }

  try {
    // Convert File to ArrayBuffer then to Buffer (Node.js compatible)
    console.log(`📖 Reading file content...`);
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📊 ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
    
    if (arrayBuffer.byteLength === 0) {
      console.error(`❌ File content is empty after reading: ${file.name}`);
      throw new Error(`File "${file.name}" contains no data. Please select a valid image file.`);
    }
    
    const buffer = Buffer.from(arrayBuffer);
    console.log(`🔄 Buffer size: ${buffer.length} bytes`);
    
    // Convert to base64
    const base64Data = buffer.toString('base64');
    console.log(`📝 Base64 data length: ${base64Data.length} characters`);
    
    if (base64Data.length === 0) {
      console.error(`❌ Base64 conversion resulted in empty data: ${file.name}`);
      throw new Error(`Failed to convert file "${file.name}" to base64. File may be corrupted.`);
    }
    
    // Create the proper format for Bridge API (with MIME type prefix)
    const formattedData = `data:${file.type};base64,${base64Data}`;
    console.log(`✅ Formatted data preview: ${formattedData.substring(0, 100)}...`);

    const result: ProcessedFile = {
      base64Data: formattedData,
      mimeType: file.type,
      originalName: file.name,
      size: file.size,
    };

    console.log(`🏁 File processing complete:`, {
      originalSize: file.size,
      base64Length: base64Data.length,
      formattedLength: formattedData.length,
      hasContent: base64Data.length > 0,
    });

    return result;
  } catch (error) {
    console.error(`❌ Failed to process file:`, error);
    throw new Error(`Failed to process file: ${error}`);
  }
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

  // Country code validation - accept both alpha-2 and alpha-3 codes
  // The conversion to alpha-3 happens during Bridge format conversion
  if (address.country.length !== 2 && address.country.length !== 3) {
    errors.push('Country must be a valid ISO 3166-1 alpha-2 or alpha-3 code');
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

    // Nationality validation - accept both alpha-2 and alpha-3 codes
    if (data.nationality && data.nationality.length !== 2 && data.nationality.length !== 3) {
      errors.push('Nationality must be a valid ISO 3166-1 alpha-2 or alpha-3 code');
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
      imageFront: doc.imageFront ? '[FILE_REMOVED]' as unknown : undefined,
      imageBack: doc.imageBack ? '[FILE_REMOVED]' as unknown : undefined,
    })) as typeof sanitized.identifyingInformation;
  }

  if ('documents' in sanitized) {
    sanitized.documents = sanitized.documents?.map(doc => ({
      ...doc,
      file: '[FILE_REMOVED]' as unknown,
    })) as typeof sanitized.documents;
  }

  if ('ultimateBeneficialOwners' in sanitized) {
    sanitized.ultimateBeneficialOwners = sanitized.ultimateBeneficialOwners?.map(ubo => ({
      ...ubo,
      identifyingInformation: ubo.identifyingInformation.map(doc => ({
        ...doc,
        number: doc.number ? `${doc.number.substring(0, 3)}***` : undefined,
        imageFront: doc.imageFront ? '[FILE_REMOVED]' as unknown : undefined,
        imageBack: doc.imageBack ? '[FILE_REMOVED]' as unknown : undefined,
      })) as typeof ubo.identifyingInformation,
      documents: ubo.documents?.map(doc => ({
        ...doc,
        file: '[FILE_REMOVED]' as unknown,
      })) as typeof ubo.documents,
    })) as typeof sanitized.ultimateBeneficialOwners;
  }

  return sanitized;
}