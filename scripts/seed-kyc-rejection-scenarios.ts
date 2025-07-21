#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

// Cargar variables de entorno
config();

// Configuración básica
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseBucket =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "documents";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan variables de entorno necesarias:");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const prisma = new PrismaClient();

// Crear clientes de Supabase (anon key es service role)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseClient; // anon key es service role

// Mapeo de status Bridge API a nuestro enum KYCStatus
function mapBridgeStatusToKYCStatus(bridgeStatus: string): string {
  const statusMapping: Record<string, string> = {
    pending: "under_review",
    active: "active",
    approved: "active",
    rejected: "rejected",
    under_review: "under_review",
    incomplete: "incomplete",
    not_started: "not_started",
    awaiting_questionnaire: "awaiting_questionnaire",
    awaiting_ubo: "awaiting_ubo",
    offboarded: "offboarded",
    paused: "paused",
  };

  return statusMapping[bridgeStatus] || "not_started";
}

// Función para generar UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Función para crear imagen mock como Buffer
function generateMockImageBuffer(): Buffer {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFPklEQVR4nO2dS2wUZRjGn5md3e622623lhYKFkqhINRWY0CjxhtqjBdiolGJGhONxpNoYjReEhONJkZjPBgTDzYxJl4SEw9GE28YL6hRwYsKKFqgFWq33e5u2+3uzM+MO9/OzndZZmdmdqd/k5ds25n5v+f5vv+87+3vW0IIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIISQ8WJIkLZckqV2SpA5JkhplWW6QJKlOkqRaSZJqJEmqkSSpWpKkKkmSKiVJqrA+W24d02EdWyVJUrUsyxWyLI/JsjwsyzIvy/KwLMtDkiQNWceNyLI8LEvyiCzLI7IsD0uSNGT93xG7Hkxfsr6nwvp9ldbvrrJ+v8P6HQ7rGqy/xWH9XS2yLDfKstxq/Z2ttizLLbIst8qy3CLLcosta3yf9T3tltVhn7ftdXxnCF3wG9YtdGa/+/G//XE6Bs9f3bqgKNe6v9DvyqxzO+06d1ltoOKsNtRu/23t1t/bbv3t7bIs66bfO8sNi6ZpMklKJhNKoSBnGw2qJCVz/VyuK5VKDaVSqe4kJXsN59j/OzQ01JNMJnsxz9OnT3fHPaY6nU73JhKJHkwczJ6envZEItGTSCT6Mcdg5XI5rVKppLFyqVRKY+ahhDnOOjZjvwrOsc85z8fYx5g5tVpNJxKJJJZKJZNGbkMoiqJqRhxNV6tVVdM0H9YA5mg86zjmGLPdPqdd5074lbPONYD5jb9xD+b/N//3bXLLZVvPQMfhOJ8N1fmYuyGwJH1vOW0xhkwwwpIdFTBwJkOZzWa1EolEr20oKJNM0Y31/TJJ1/sT9vG4EQUNdBrm9+DGwH5YnI0uUCaTyRo1RqRsI0OOKBBEcP2w6KJkL1dM7Hee6y5YeU4hGz9iM0bfYh7+3mTSKdewOIetMFjBHo9uF6RSqaxtNL2I8qk0t80PN5Ct3x5EOjJllEql+nw24xAWWyCUfofGCX05+2cP4DiHgYW1vGC7AWm6ruKmf1AjHObOhJFJpVIGlgXyxMCNZddhTlR1aXECWcVEcpYkCyub+vUJ4+rT6bS1IJgxFd2MU6lUn7+SnDZdNIiA7WGYOdVoLp2rO2OEcOOJJ3/4i3fffe8bTwfYz5eHzUw4x3Ac8zicb37BpvY7WlmPfPXVV8xzfZuTz+e9xrTBBgpMo7Lc6qiCqAd8nzWZXo8gywDEGf5aOTywP40vv/zytPeT53kJIFYWYQ9lOC/POAEkNDZzwYUJYp5gIl9k2cyCwDwjdIW5mWRD6LPFcGGM48OMIFhQwqJA/jBkiWWEz6fzXJxjDbJA0OzBa97S7Oy0n58w5i8ZJWHGEdwwJGwowzfmVwfChZllzFIiWVh1CxgKZFw/jGHmIFGCMVZwn0Qj3DShY8tF3Hx/I4zZ2OJHgC/EUNhZM+Zg5sJtxqzsQcbUmDGxr53x6g8tnEGKO1PcYuyGK0YsHe5AtsNO6IjHe54EucaV5chaDWGIf4YE2ZD6YIgxZWaZY3Gm5vwOhgCWaUHhT1EM3zJzNhw44xjGHLNOl5OLnLpDWQgU7LYgOEWOCXaTJINXr/o8vDbVLCR4kA7Y3pjH4czYWnzUCrNZYYfXX/EE5z04U0ixuauwOy0qgYV6AHmNdWqtlZKAGXhDYFb9g7NYuMTHpbC6lz1PoOKJdY1jrCxD2cOaOGCxZx+gx42wjFAkKOyNJa3YpvMhfr3KiWRZaJB7lYYwmGOhiZWHqGDNRgkhhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQYlH/AwTsVsUdYSuqAAAAAElFTkSuQmCC";
  return Buffer.from(base64, "base64");
}

// Función para subir imagen a Supabase (retorna solo la ruta relativa)
async function uploadImageToSupabase(
  profileId: string,
  documentType: string,
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  const filePath = `kyc-rejection-scenarios/${profileId}/${documentType}-${Date.now()}.png`;

  try {
    if (supabaseAdmin) {
      const { error: uploadError } = await supabaseAdmin.storage
        .from(supabaseBucket)
        .upload(filePath, imageBuffer, {
          contentType: "image/png",
          cacheControl: "3600",
        });

      if (!uploadError) {
        console.log(`✅ Imagen subida exitosamente: ${filePath}`);
        return filePath; // ✅ Retornar solo la ruta relativa
      } else {
        console.warn(`⚠️  Error subiendo imagen: ${uploadError.message}`);
      }
    }

    // Fallback: retornar solo la ruta relativa aunque no se suba
    console.log(`📋 Ruta generada (archivo no subido): ${filePath}`);
    return filePath; // ✅ Retornar solo la ruta relativa
  } catch (error) {
    console.warn(`⚠️  Error en proceso de subida: ${error}`);
    return filePath; // ✅ Retornar solo la ruta relativa
  }
}

// Función para simular respuestas realistas de Bridge API con diferentes escenarios
function simulateBridgeApiResponse(userData: any): any {
  const scenario = userData.scenario;
  const baseCustomer = {
    id: `bridge_${generateUUID()}`,
    first_name: userData.firstName,
    last_name: userData.lastName,
    email: userData.email,
    type: "individual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  switch (scenario) {
    case "identity_verification_failed":
      return {
        ...baseCustomer,
        status: "rejected",
        rejection_reasons: [
          {
            reason: "Identity verification failed",
            developer_reason:
              "The provided identification documents could not be verified against authoritative sources.",
            created_at: new Date().toISOString(),
          },
          {
            reason: "Document quality issues",
            developer_reason:
              "Uploaded documents are blurry, partially obscured, or of insufficient quality for verification.",
            created_at: new Date().toISOString(),
          },
        ],
        requirements_due: ["identity_verification", "document_resubmission"],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "rejected",
          payout_crypto: "rejected",
          payin_fiat: "rejected",
          payout_fiat: "rejected",
        },
        has_accepted_terms_of_service: true,
      };

    case "high_risk_country":
      return {
        ...baseCustomer,
        status: "rejected",
        rejection_reasons: [
          {
            reason: "Geographic restrictions",
            developer_reason:
              "Customer is located in a jurisdiction where we cannot provide services due to regulatory restrictions.",
            created_at: new Date().toISOString(),
          },
        ],
        requirements_due: [],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "rejected",
          payout_crypto: "rejected",
          payin_fiat: "rejected",
          payout_fiat: "rejected",
        },
        has_accepted_terms_of_service: true,
      };

    case "sanctions_screening_failed":
      return {
        ...baseCustomer,
        status: "rejected",
        rejection_reasons: [
          {
            reason: "Sanctions screening failed",
            developer_reason:
              "Customer appears on sanctions lists or politically exposed persons (PEP) databases.",
            created_at: new Date().toISOString(),
          },
        ],
        requirements_due: [],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "rejected",
          payout_crypto: "rejected",
          payin_fiat: "rejected",
          payout_fiat: "rejected",
        },
        has_accepted_terms_of_service: true,
      };

    case "awaiting_additional_info":
      return {
        ...baseCustomer,
        status: "awaiting_questionnaire",
        rejection_reasons: [],
        requirements_due: [
          "proof_of_address",
          "source_of_funds_documentation",
          "enhanced_due_diligence_questionnaire",
        ],
        future_requirements_due: ["proof_of_income"],
        capabilities: {
          payin_crypto: "pending",
          payout_crypto: "pending",
          payin_fiat: "pending",
          payout_fiat: "pending",
        },
        has_accepted_terms_of_service: true,
      };

    case "incomplete_application":
      return {
        ...baseCustomer,
        status: "incomplete",
        rejection_reasons: [],
        requirements_due: [
          "identity_verification",
          "address_verification",
          "phone_verification",
        ],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "pending",
          payout_crypto: "pending",
          payin_fiat: "pending",
          payout_fiat: "pending",
        },
        has_accepted_terms_of_service: false,
      };

    case "under_review_enhanced":
      return {
        ...baseCustomer,
        status: "under_review",
        rejection_reasons: [],
        requirements_due: [],
        future_requirements_due: [
          "enhanced_due_diligence",
          "source_of_wealth_documentation",
        ],
        capabilities: {
          payin_crypto: "pending",
          payout_crypto: "pending",
          payin_fiat: "pending",
          payout_fiat: "pending",
        },
        has_accepted_terms_of_service: true,
      };

    case "paused_compliance":
      return {
        ...baseCustomer,
        status: "paused",
        rejection_reasons: [
          {
            reason: "Compliance review required",
            developer_reason:
              "Account temporarily paused pending compliance team review due to unusual transaction patterns.",
            created_at: new Date().toISOString(),
          },
        ],
        requirements_due: ["compliance_review"],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "inactive",
          payout_crypto: "inactive",
          payin_fiat: "inactive",
          payout_fiat: "inactive",
        },
        has_accepted_terms_of_service: true,
      };

    case "document_expiration":
      return {
        ...baseCustomer,
        status: "rejected",
        rejection_reasons: [
          {
            reason: "Expired identification documents",
            developer_reason:
              "The provided identification documents have expired and need to be renewed.",
            created_at: new Date().toISOString(),
          },
        ],
        requirements_due: ["valid_identification"],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "rejected",
          payout_crypto: "rejected",
          payin_fiat: "rejected",
          payout_fiat: "rejected",
        },
        has_accepted_terms_of_service: true,
      };

    case "active_approved":
    default:
      return {
        ...baseCustomer,
        status: "active",
        rejection_reasons: [],
        requirements_due: [],
        future_requirements_due: [],
        capabilities: {
          payin_crypto: "active",
          payout_crypto: "active",
          payin_fiat: "active",
          payout_fiat: "active",
        },
        has_accepted_terms_of_service: true,
        endorsements: [
          {
            name: "base",
            status: "approved",
            requirements: {
              complete: ["identity_verification", "address_verification"],
              pending: [],
              missing: null,
              issues: [],
            },
          },
        ],
      };
  }
}

// Mapear respuesta simulada a nuestros campos locales
function mapBridgeResponseToKYC(bridgeResponse: any, userData: any) {
  return {
    bridgeCustomerId: bridgeResponse.id,
    firstName: bridgeResponse.first_name,
    lastName: bridgeResponse.last_name,
    email: bridgeResponse.email,
    kycStatus: mapBridgeStatusToKYCStatus(bridgeResponse.status),
    kycSubmittedAt: new Date(bridgeResponse.created_at),
    kycApprovedAt:
      bridgeResponse.status === "active"
        ? new Date(bridgeResponse.updated_at)
        : null,
    kycRejectedAt:
      bridgeResponse.status === "rejected"
        ? new Date(bridgeResponse.updated_at)
        : null,
    payinCrypto: bridgeResponse.capabilities?.payin_crypto || "pending",
    payoutCrypto: bridgeResponse.capabilities?.payout_crypto || "pending",
    payinFiat: bridgeResponse.capabilities?.payin_fiat || "pending",
    payoutFiat: bridgeResponse.capabilities?.payout_fiat || "pending",
    futureRequirementsDue: bridgeResponse.future_requirements_due || [],
    requirementsDue: bridgeResponse.requirements_due || [],
    hasAcceptedTermsOfService:
      bridgeResponse.has_accepted_terms_of_service ?? true,
    kycRejectionReason: bridgeResponse.rejection_reasons?.[0]?.reason || null,
  };
}

// Función para crear eventos basados en el flujo del usuario y escenario
async function createUserEvents(profile: any, kycProfile: any, kycStatus: string, scenario: string) {
  const events = [];
  
  // 1. Always create USER_SIGNED_UP event
  events.push({
    profileId: profile.id,
    type: "USER_SIGNED_UP",
    module: "AUTH",
    description: "Usuario registrado en la plataforma",
    createdAt: new Date(profile.createdAt.getTime() + 1000), // 1 second after profile creation
  });

  // 2. If KYC profile exists, user submitted KYC
  if (kycProfile) {
    events.push({
      profileId: profile.id,
      type: "USER_SUBMITTED_KYC", 
      module: "KYC",
      description: "Usuario envió información para verificación KYC",
      createdAt: new Date(kycProfile.createdAt.getTime() + 1000), // 1 second after KYC profile creation
    });

    // 3. Add status-specific events based on scenario
    switch (kycStatus) {
      case "under_review":
        events.push({
          profileId: profile.id,
          type: "USER_KYC_UNDER_VERIFICATION",
          module: "KYC",
          description: "KYC del usuario en proceso de verificación",
          createdAt: new Date(kycProfile.kycSubmittedAt.getTime() + 60000), // 1 minute after submission
        });
        break;

      case "active":
        events.push({
          profileId: profile.id,
          type: "USER_KYC_UNDER_VERIFICATION",
          module: "KYC",
          description: "KYC del usuario en proceso de verificación",
          createdAt: new Date(kycProfile.kycSubmittedAt.getTime() + 60000), // 1 minute after submission
        });
        events.push({
          profileId: profile.id,
          type: "USER_KYC_APPROVED",
          module: "KYC",
          description: "KYC del usuario aprobado exitosamente",
          createdAt: kycProfile.kycApprovedAt || new Date(kycProfile.kycSubmittedAt.getTime() + 300000), // 5 minutes after submission
        });
        break;

      case "rejected":
        events.push({
          profileId: profile.id,
          type: "USER_KYC_UNDER_VERIFICATION",
          module: "KYC",
          description: "KYC del usuario en proceso de verificación",
          createdAt: new Date(kycProfile.kycSubmittedAt.getTime() + 60000), // 1 minute after submission
        });
        events.push({
          profileId: profile.id,
          type: "USER_KYC_REJECTED",
          module: "KYC",
          description: `KYC del usuario rechazado (${scenario}): ${kycProfile.kycRejectionReason || "Documentos no válidos"}`,
          createdAt: kycProfile.kycRejectedAt || new Date(kycProfile.kycSubmittedAt.getTime() + 300000), // 5 minutes after submission
        });
        break;

      case "awaiting_questionnaire":
      case "incomplete":
      case "paused":
        events.push({
          profileId: profile.id,
          type: "USER_KYC_UNDER_VERIFICATION",
          module: "KYC",
          description: `KYC del usuario en proceso de verificación (${scenario})`,
          createdAt: new Date(kycProfile.kycSubmittedAt.getTime() + 60000), // 1 minute after submission
        });
        break;
    }
  }

  // Create all events
  for (const eventData of events) {
    await (prisma as any).event.create({
      data: eventData,
    });
  }

  console.log(`✅ ${events.length} eventos creados para ${profile.firstName} (${scenario})`);
  return events;
}

// Generar timestamp para emails únicos
const timestamp = Date.now().toString().slice(-6);

// Datos de usuarios con diferentes escenarios de rechazo
const REJECTION_SCENARIOS = [
  {
    scenario: "identity_verification_failed",
    email: `identity.fail.${timestamp}@example.com`,
    firstName: "Roberto",
    lastName: "Vargas",
    middleName: "Carlos",
    phone: "+52155551001",
    nationality: "MEX",
    birthDate: new Date("1988-01-15"),
    employmentStatus: "employed",
    accountPurpose: "personal_or_living_expenses",
    expectedMonthlyPayments: "zero_4999",
    mostRecentOccupation: "Contador",
    address: {
      streetLine1: "Calle Falsa 123",
      city: "Tijuana",
      country: "MEX",
      subdivision: "MEX-BCN",
      postalCode: "22000",
    },
    description:
      "Documentos de identidad no verificables - calidad insuficiente",
  },
  {
    scenario: "high_risk_country",
    email: `geo.restricted.${timestamp}@example.com`,
    firstName: "Elena",
    lastName: "Petrov",
    middleName: "Dmitrovna",
    phone: "+7495555001",
    nationality: "RUS",
    birthDate: new Date("1985-03-22"),
    employmentStatus: "employed",
    accountPurpose: "operating_a_company",
    expectedMonthlyPayments: "fifty_thousand_plus",
    mostRecentOccupation: "Empresaria",
    address: {
      streetLine1: "Tverskaya Street 45",
      city: "Moscow",
      country: "RUS",
      subdivision: "RU-MOW",
      postalCode: "125009",
    },
    description: "Restricciones geográficas - país de alto riesgo",
  },
  {
    scenario: "sanctions_screening_failed",
    email: `sanctions.fail.${timestamp}@example.com`,
    firstName: "Ahmad",
    lastName: "Al-Rashid",
    middleName: "Mohammed",
    phone: "+96655551234",
    nationality: "SAU",
    birthDate: new Date("1975-07-08"),
    employmentStatus: "employed",
    accountPurpose: "operating_a_company",
    expectedMonthlyPayments: "fifty_thousand_plus",
    mostRecentOccupation: "Ejecutivo Financiero",
    address: {
      streetLine1: "King Fahd Road 789",
      city: "Riyadh",
      country: "SAU",
      subdivision: "SA-01",
      postalCode: "11564",
    },
    description: "Falla en verificación de sanciones - PEP detectado",
  },
  {
    scenario: "awaiting_additional_info",
    email: `awaiting.info.${timestamp}@example.com`,
    firstName: "Patricia",
    lastName: "Mendoza",
    middleName: "Alejandra",
    phone: "+52155552001",
    nationality: "MEX",
    birthDate: new Date("1990-11-30"),
    employmentStatus: "self_employed",
    accountPurpose: "ecommerce_retail_payments",
    expectedMonthlyPayments: "ten_thousand_49999",
    mostRecentOccupation: "Consultora Digital",
    address: {
      streetLine1: "Av. Insurgentes 567",
      streetLine2: "Col. Roma Norte",
      city: "Ciudad de México",
      country: "MEX",
      subdivision: "MEX-CMX",
      postalCode: "06700",
    },
    description: "Esperando información adicional - documentación de ingresos",
  },
  {
    scenario: "incomplete_application",
    email: `incomplete.app.${timestamp}@example.com`,
    firstName: "Miguel",
    lastName: "Torres",
    middleName: "Ángel",
    phone: "+52155553001",
    nationality: "MEX",
    birthDate: new Date("1995-05-18"),
    employmentStatus: "student",
    accountPurpose: "personal_or_living_expenses",
    expectedMonthlyPayments: "zero_4999",
    mostRecentOccupation: "Estudiante",
    address: {
      streetLine1: "Calle Universidad 234",
      city: "Puebla",
      country: "MEX",
      subdivision: "MEX-PUE",
      postalCode: "72000",
    },
    description: "Aplicación incompleta - falta verificación telefónica",
  },
  {
    scenario: "under_review_enhanced",
    email: `enhanced.review.${timestamp}@example.com`,
    firstName: "Valentina",
    lastName: "Herrera",
    middleName: "Beatriz",
    phone: "+52155554001",
    nationality: "MEX",
    birthDate: new Date("1982-09-12"),
    employmentStatus: "employed",
    accountPurpose: "investment_purposes",
    expectedMonthlyPayments: "fifty_thousand_plus",
    mostRecentOccupation: "Directora de Inversiones",
    address: {
      streetLine1: "Paseo de la Reforma 890",
      streetLine2: "Piso 25",
      city: "Ciudad de México",
      country: "MEX",
      subdivision: "MEX-CMX",
      postalCode: "11000",
    },
    description: "Revisión mejorada en curso - due diligence avanzado",
  },
  {
    scenario: "paused_compliance",
    email: `paused.compliance.${timestamp}@example.com`,
    firstName: "Sergio",
    lastName: "Ramírez",
    middleName: "Eduardo",
    phone: "+52155555001",
    nationality: "MEX",
    birthDate: new Date("1987-12-03"),
    employmentStatus: "employed",
    accountPurpose: "operating_a_company",
    expectedMonthlyPayments: "ten_thousand_49999",
    mostRecentOccupation: "Director de Operaciones",
    address: {
      streetLine1: "Blvd. Manuel Ávila Camacho 345",
      city: "Naucalpan",
      country: "MEX",
      subdivision: "MEX-MEX",
      postalCode: "53370",
    },
    description: "Cuenta pausada - revisión de cumplimiento pendiente",
  },
  {
    scenario: "document_expiration",
    email: `doc.expired.${timestamp}@example.com`,
    firstName: "Carmen",
    lastName: "Jiménez",
    middleName: "Rosa",
    phone: "+52155556001",
    nationality: "MEX",
    birthDate: new Date("1970-04-25"),
    employmentStatus: "employed",
    accountPurpose: "personal_or_living_expenses",
    expectedMonthlyPayments: "five_thousand_9999",
    mostRecentOccupation: "Administradora",
    address: {
      streetLine1: "Calle Morelos 678",
      city: "Querétaro",
      country: "MEX",
      subdivision: "MEX-QUE",
      postalCode: "76000",
    },
    description: "Documentos expirados - requiere renovación de identificación",
  },
  {
    scenario: "active_approved",
    email: `success.case.${timestamp}@example.com`,
    firstName: "Diego",
    lastName: "Castillo",
    middleName: "Fernando",
    phone: "+52155557001",
    nationality: "MEX",
    birthDate: new Date("1992-08-14"),
    employmentStatus: "employed",
    accountPurpose: "ecommerce_retail_payments",
    expectedMonthlyPayments: "five_thousand_9999",
    mostRecentOccupation: "Desarrollador de Software",
    address: {
      streetLine1: "Av. Tecnológico 999",
      streetLine2: "Fraccionamiento Las Torres",
      city: "Guadalajara",
      country: "MEX",
      subdivision: "MEX-JAL",
      postalCode: "44550",
    },
    description: "Caso exitoso - completamente aprobado y activo",
  },
];

// Función principal para crear usuario de prueba
async function createTestUser(userData: any) {
  try {
    console.log(`\n🎭 Escenario: ${userData.scenario}`);
    console.log(
      `👤 Creando perfil: ${userData.firstName} ${userData.lastName}`
    );
    console.log(`📝 ${userData.description}`);

    // 1. Simular respuesta de Bridge API según escenario
    const bridgeResponse = simulateBridgeApiResponse(userData);
    console.log(
      `✅ Respuesta Bridge simulada: status=${bridgeResponse.status}`
    );

    // 2. Mapear datos de Bridge API
    const mappedData = mapBridgeResponseToKYC(bridgeResponse, userData);

    // 3. Crear perfil base
    const profile = await (prisma as any).profile.create({
      data: {
        userId: generateUUID(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        status: "active",
        role: "USER",
      },
    });

    console.log(`✅ Perfil base creado: ${profile.id}`);

    // 4. Subir imágenes
    const mockImageBuffer = generateMockImageBuffer();
    const imageFrontUrl = await uploadImageToSupabase(
      profile.id,
      "identification-front",
      mockImageBuffer,
      "front.png"
    );
    const imageBackUrl = await uploadImageToSupabase(
      profile.id,
      "identification-back",
      mockImageBuffer,
      "back.png"
    );
    const proofOfAddressUrl = await uploadImageToSupabase(
      profile.id,
      "proof-of-address",
      mockImageBuffer,
      "address.png"
    );

    // 5. Crear perfil KYC
    const kycProfile = await (prisma as any).kYCProfile.create({
      data: {
        profileId: profile.id,
        bridgeCustomerId: mappedData.bridgeCustomerId,
        customerType: "individual",
        firstName: mappedData.firstName,
        middleName: userData.middleName,
        lastName: mappedData.lastName,
        email: mappedData.email,
        phone: userData.phone,
        birthDate: userData.birthDate,
        nationality: userData.nationality,
        kycStatus: mappedData.kycStatus,
        kycSubmittedAt: mappedData.kycSubmittedAt,
        kycApprovedAt: mappedData.kycApprovedAt,
        kycRejectedAt: mappedData.kycRejectedAt,
        kycRejectionReason: mappedData.kycRejectionReason,
        employmentStatus: userData.employmentStatus,
        accountPurpose: userData.accountPurpose,
        expectedMonthlyPaymentsUsd: userData.expectedMonthlyPayments,
        mostRecentOccupation: userData.mostRecentOccupation,
        hasAcceptedTermsOfService: mappedData.hasAcceptedTermsOfService,
        payinCrypto: mappedData.payinCrypto,
        payoutCrypto: mappedData.payoutCrypto,
        payinFiat: mappedData.payinFiat,
        payoutFiat: mappedData.payoutFiat,
        futureRequirementsDue: mappedData.futureRequirementsDue,
        requirementsDue: mappedData.requirementsDue,
      },
    });

    console.log(`✅ Perfil KYC creado: ${kycProfile.id}`);

    // 6. Crear dirección
    await (prisma as any).address.create({
      data: {
        kycProfileId: kycProfile.id,
        streetLine1: userData.address.streetLine1,
        streetLine2: userData.address.streetLine2,
        city: userData.address.city,
        country: userData.address.country,
        subdivision: userData.address.subdivision,
        postalCode: userData.address.postalCode,
      },
    });

    // 7. Crear información de identificación
    await (prisma as any).identifyingInformation.create({
      data: {
        kycProfileId: kycProfile.id,
        type: "passport",
        issuingCountry: userData.nationality,
        number: `DOC${Math.random().toString().slice(2, 12)}`,
        expiration:
          userData.scenario === "document_expiration"
            ? new Date("2020-01-01") // Documento expirado
            : new Date("2030-12-31"),
        imageFront: imageFrontUrl,
        imageBack: imageBackUrl,
      },
    });

    // 8. Crear documento de comprobante
    await (prisma as any).document.create({
      data: {
        kycProfileId: kycProfile.id,
        purposes: ["proof_of_address"],
        description: "Comprobante de domicilio",
        fileUrl: proofOfAddressUrl,
        fileSize: 1024,
      },
    });

    // 9. Crear razones de rechazo si aplica
    if (
      bridgeResponse.rejection_reasons &&
      bridgeResponse.rejection_reasons.length > 0
    ) {
      for (const rejectionReason of bridgeResponse.rejection_reasons) {
        await (prisma as any).rejectionReason.create({
          data: {
            kycProfileId: kycProfile.id,
            reason: rejectionReason.reason,
            developerReason: rejectionReason.developer_reason,
            bridgeCreatedAt: new Date(rejectionReason.created_at),
          },
        });
      }
      console.log(
        `✅ ${bridgeResponse.rejection_reasons.length} razón(es) de rechazo creadas`
      );
    }

    // 10. Crear eventos del flujo del usuario
    const events = await createUserEvents(profile, kycProfile, mappedData.kycStatus, userData.scenario);

    console.log(
      `🎉 ${userData.scenario}: ${userData.firstName} ${userData.lastName} creado exitosamente`
    );

    return { profile, kycProfile, bridgeResponse, mappedData, events };
  } catch (error: any) {
    console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Iniciando seeder de ESCENARIOS DE RECHAZO KYC...\n");
  console.log(
    "🎭 Este script simula diferentes casos de rechazo de Bridge Protocol\n"
  );

  try {
    let createdCount = 0;
    let totalEvents = 0;
    const scenarioStats: Record<string, number> = {};

    for (const userData of REJECTION_SCENARIOS) {
      const result = await createTestUser(userData);
      if (result) {
        createdCount++;
        scenarioStats[userData.scenario] =
          (scenarioStats[userData.scenario] || 0) + 1;
        if (result.events) {
          totalEvents += result.events.length;
        }
      }

      // Pausa entre creaciones
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n✨ Seeder de ESCENARIOS DE RECHAZO completado!`);
    console.log(`📊 Total de perfiles creados: ${createdCount}`);
    console.log(`🎯 Total de eventos creados: ${totalEvents}`);
    console.log(`\n📈 Estadísticas por escenario:`);

    Object.entries(scenarioStats).forEach(([scenario, count]) => {
      const userData = REJECTION_SCENARIOS.find((u) => u.scenario === scenario);
      console.log(`   🎭 ${scenario}: ${count} - ${userData?.description}`);
    });

    console.log(`\n🎯 ESCENARIOS CUBIERTOS:`);
    console.log(`   ❌ Verificación de identidad fallida`);
    console.log(`   🌍 Restricciones geográficas`);
    console.log(`   🚫 Falla en verificación de sanciones`);
    console.log(`   📋 Esperando información adicional`);
    console.log(`   📝 Aplicación incompleta`);
    console.log(`   🔍 Revisión mejorada en curso`);
    console.log(`   ⏸️  Cuenta pausada por cumplimiento`);
    console.log(`   📄 Documentos expirados`);
    console.log(`   ✅ Caso exitoso aprobado`);

    console.log(
      `\n💡 Estos datos permiten probar todos los flujos de rechazo del dashboard KYC.`
    );
    console.log(
      `📄 Todas las imágenes se almacenan como rutas relativas compatibles con el frontend.`
    );
    console.log(
      `🎯 Eventos de flujo del usuario registrados para tracking completo.`
    );
  } catch (error: any) {
    console.error("❌ Error general en el seeder:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
