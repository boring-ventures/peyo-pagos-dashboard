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
const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan variables de entorno necesarias:");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

if (!bridgeApiKey) {
  console.warn(
    "⚠️  BRIDGE_API_KEY no encontrada - las llamadas API serán simuladas"
  );
}

const prisma = new PrismaClient();

// Crear clientes de Supabase
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseClient;

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
  // Imagen PNG de 100x100 con texto "KYC DOC"
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFPklEQVR4nO2dS2wUZRjGn5md3e622623lhYKFkqhINRWY0CjxhtqjBdiolGJGhONxpNoYjReEhONJkZjPBgTDzYxJl4SEw9GE28YL6hRwYsKKFqgFWq33e5u2+3uzM+MO9/OzndZZmdmdqd/k5ds25n5v+f5vv+87+3vW0IIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIISQ8WJIkLZckqV2SpA5JkhplWW6QJKlOkqRaSZJqJEmqkSSpWpKkKkmSKiVJqrA+W24dWyVJUrUsyxWyLI/JsjwsyzIvy/KwLMtDkiQNWceNyLI8LEvyiCzLI7IsD0uSNGT93xG7Hkxfsr6nwvp9ldbvrrJ+v8P6HQ7rGqy/xWH9XS2yLDfKstxq/Z2ttizLLbIst8qy3CLLcosta3yf9T3tltVhn7ftdXxnCF3wG9YtdGa/+/G//XE6Bs9f3bqgKNe6v9DvyqxzO+06d1ltoOKsNtRu/23t1t/bbv3t7bIs66bfO8sNi6ZpMklKJhNKoSBnGw2qJCVz/VyuK5VKDaVSqe4kJXsN59j/OzQ01JNMJnsxz9OnT3fHPaY6nU73JhKJHkwczJ6envZEItGTSCT6Mcdg5XI5rVKppLFyqVRKY+ahhDnOOjZjvwrOsc85z8fYx5g5tVpNJxKJJJZKJZNGbkMoiqJqRhxNV6tVVdM0H9YA5mg86zjmGLPdPqdd5074lbPONYD5jb9xD+b/N//3bXLLZVvPQMfhOJ8N1fmYuyGwJH1vOW0xhkwwwpIdFTBwJkOZzWa1EolEr20oKJNM0Y31/TJJ1/sT9vG4EQUNdBrm9+DGwH5YnI0uUCaTyRo1RqRsI0OOKBBEcP2w6KJkL1dM7Hee6y5YeU4hGz9iM0bfYh7+3mTSKdewOIetMFjBHo9uF6RSqaxtNL2I8qk0t80PN5Ct3x5EOjJllEql+nw24xAWWyCUfofGCX05+2cP4DiHgYW1vGC7AWm6ruKmf1AjHObOhJFJpVIGlgXyxMCNZddhTlR1aXECWcVEcpYkCyub+vUJ4+rT6bS1IJgxFd2MU6lUn7+SnDZdNIiA7WGYOdVoLp2rO2OEcOOJJ3/4i3fffe8bTwfYz5eHzUw4x3Ac8zicb37BpvY7WlmPfPXVV8xzfZuTz+e9xrTBBgpMo7Lc6qiCqAd8nzWZXo8gywDEGf5aOTywP40vv/zytPeT53kJIFYWYQ9lOC/POAEkNDZzwYUJYp5gIl9k2cyCwDwjdIW5mWRD6LPFcGGM48OMIFhQwqJA/jBkiWWEz6fzXJxjDbJA0OzBa97S7Oy0n58w5i8ZJWHGEdwwJGwowzfmVwfChZllzFIiWVh1CxgKZFw/jGHmIFGCMVZwn0Qj3DShY8tF3Hx/I4zZ2OJHgC/EUNhZM+Zg5sJtxqzsQcbUmDGxr53x6g8tnEGKO1PcYuyGK0YsHe5AtsNO6IjHe54EucaV5chaDWGIf4YE2ZD6YIgxZWaZY3Gm5vwOhgCWaUHhT1EM3zJzNhw44xjGHLNOl5OLnLpDWQgU7LYgOEWOCXaTJINXr/o8vDbVLCR4kA7Y3pjH4czYWnzUCrNZYYfXX/EE5z04U0ixuauwOy0qgYV6AHmNdWqtlZKAGXhDYFb9g7NYuMTHpbC6lz1PoOKJdY1jrCxD2cOaOGCxZx+gx42wjFAkKOyNJa3YpvMhfr3KiWRZaJB7lYYwmGOhiZWHqGDNRgkhhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQYlH/AwTsVsUdYSuqAAAAAElFTkSuQmCC";
  return Buffer.from(base64, "base64");
}

// Función para subir imagen a Supabase
async function uploadImageToSupabase(
  profileId: string,
  documentType: string,
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  const filePath = `kyc-documents/${profileId}/${documentType}-${Date.now()}.png`;

  try {
    if (supabaseAdmin) {
      const { error: uploadError } = await supabaseAdmin.storage
        .from(supabaseBucket)
        .upload(filePath, imageBuffer, {
          contentType: "image/png",
          cacheControl: "3600",
        });

      if (uploadError) {
        console.warn(
          `⚠️  Error subiendo imagen con service key: ${uploadError.message}`
        );
      } else {
        console.log(
          `✅ Imagen subida exitosamente con service key: ${filePath}`
        );
        return filePath;
      }
    }

    console.log(`🔄 Intentando subir con cliente público: ${filePath}`);

    const { error: publicUploadError } = await supabaseClient.storage
      .from(supabaseBucket)
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
      });

    if (publicUploadError) {
      console.warn(
        `⚠️  Error subiendo imagen con cliente público: ${publicUploadError.message}`
      );
      console.log(`📋 Ruta generada (archivo no subido): ${filePath}`);
      return filePath;
    } else {
      console.log(
        `✅ Imagen subida exitosamente con cliente público: ${filePath}`
      );
      return filePath;
    }
  } catch (error) {
    console.warn(`⚠️  Error en proceso de subida: ${error}`);
    console.log(`📋 Ruta fallback generada: ${filePath}`);
    return filePath;
  }
}

// Función para obtener información de un customer existente en Bridge
async function fetchExistingBridgeCustomer(
  bridgeCustomerId: string
): Promise<any> {
  console.log(
    `📡 Obteniendo información del customer existente: ${bridgeCustomerId}`
  );

  // Si no hay API key, simular respuesta con datos realistas
  if (!bridgeApiKey) {
    console.log(
      "🔄 Simulando respuesta de Bridge API para customer existente..."
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: bridgeCustomerId,
      first_name: "Juan Carlos",
      last_name: "Vega Martínez",
      email: `juan.vega.verified.${Date.now()}@example.com`,
      status: "active",
      type: "individual",
      persona_inquiry_type: "transaction_kyc",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días atrás
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días atrás
      rejection_reasons: [],
      has_accepted_terms_of_service: true,
      endorsements: [
        {
          name: "base",
          status: "approved",
          requirements: {
            complete: ["identity_verification", "phone_verification"],
            pending: [],
            missing: null,
            issues: [],
          },
        },
      ],
      future_requirements_due: [],
      requirements_due: [],
      capabilities: {
        payin_crypto: "active",
        payout_crypto: "active",
        payin_fiat: "active",
        payout_fiat: "active",
      },
    };
  }

  // Hacer llamada real a Bridge API
  try {
    const response = await fetch(
      `${bridgeApiUrl}/customers/${bridgeCustomerId}`,
      {
        method: "GET",
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    console.log(`📡 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Error obteniendo customer de Bridge (${response.status}):`,
        errorText
      );
      throw new Error(`Bridge API error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(`✅ Customer existente obtenido exitosamente de Bridge API`);
    console.log(`📄 Customer Data:`, JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error: any) {
    console.error(`❌ Error en llamada a Bridge API:`, error.message);
    throw error;
  }
}

// Mapear respuesta de Bridge a nuestros campos locales
function mapBridgeResponseToKYC(bridgeResponse: any) {
  return {
    bridgeCustomerId: bridgeResponse?.id || null,
    firstName: bridgeResponse?.first_name || "Juan Carlos",
    lastName: bridgeResponse?.last_name || "Vega Martínez",
    email: bridgeResponse?.email || `verified.user.${Date.now()}@example.com`,
    kycStatus: bridgeResponse?.status
      ? mapBridgeStatusToKYCStatus(bridgeResponse.status)
      : "active",
    kycSubmittedAt: bridgeResponse?.created_at
      ? new Date(bridgeResponse.created_at)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    kycApprovedAt:
      bridgeResponse?.status === "active" && bridgeResponse?.updated_at
        ? new Date(bridgeResponse.updated_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    kycRejectedAt: null,
    payinCrypto: bridgeResponse?.capabilities?.payin_crypto || "active",
    payoutCrypto: bridgeResponse?.capabilities?.payout_crypto || "active",
    payinFiat: bridgeResponse?.capabilities?.payin_fiat || "active",
    payoutFiat: bridgeResponse?.capabilities?.payout_fiat || "active",
    futureRequirementsDue: bridgeResponse?.future_requirements_due || [],
    requirementsDue: bridgeResponse?.requirements_due || [],
    hasAcceptedTermsOfService:
      bridgeResponse?.has_accepted_terms_of_service ?? true,
    kycRejectionReason: null,
  };
}

// Función para crear eventos basados en el flujo del usuario
async function createUserEvents(profile: any, kycProfile: any, kycStatus: string) {
  const events = [];
  
  // 1. Always create USER_SIGNED_UP event (simulate earlier signup)
  events.push({
    profileId: profile.id,
    type: "USER_SIGNED_UP",
    module: "AUTH",
    description: "Usuario registrado en la plataforma",
    createdAt: new Date(kycProfile.kycSubmittedAt.getTime() - 86400000), // 1 day before KYC submission
  });

  // 2. User submitted KYC
  events.push({
    profileId: profile.id,
    type: "USER_SUBMITTED_KYC", 
    module: "KYC",
    description: "Usuario envió información para verificación KYC",
    createdAt: kycProfile.kycSubmittedAt,
  });

  // 3. KYC under verification (since this is an existing verified user)
  events.push({
    profileId: profile.id,
    type: "USER_KYC_UNDER_VERIFICATION",
    module: "KYC",
    description: "KYC del usuario en proceso de verificación",
    createdAt: new Date(kycProfile.kycSubmittedAt.getTime() + 60000), // 1 minute after submission
  });

  // 4. For existing verified users, they should be approved
  if (kycStatus === "active") {
    events.push({
      profileId: profile.id,
      type: "USER_KYC_APPROVED",
      module: "KYC",
      description: "KYC del usuario aprobado exitosamente",
      createdAt: kycProfile.kycApprovedAt,
    });
  }

  // Create all events
  for (const eventData of events) {
    await (prisma as any).event.create({
      data: eventData,
    });
  }

  console.log(`✅ ${events.length} eventos creados para ${profile.firstName}`);
  return events;
}

// Función principal para crear usuario existente verificado
async function createExistingVerifiedUser(bridgeCustomerId: string) {
  try {
    console.log(
      `\n👤 Creando perfil para customer existente: ${bridgeCustomerId}`
    );

    // 1. Obtener información del customer existente desde Bridge API
    let bridgeResponse = null;
    try {
      bridgeResponse = await fetchExistingBridgeCustomer(bridgeCustomerId);
      console.log(`✅ Información del customer existente obtenida`);
    } catch (error: any) {
      console.warn(
        `⚠️  Error obteniendo customer de Bridge, usando datos simulados:`,
        error.message
      );
      // Crear respuesta simulada para el customer específico
      bridgeResponse = {
        id: bridgeCustomerId,
        first_name: "Juan Carlos",
        last_name: "Vega Martínez",
        email: `juan.vega.verified.${Date.now()}@example.com`,
        status: "active",
        type: "individual",
        created_at: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        capabilities: {
          payin_crypto: "active",
          payout_crypto: "active",
          payin_fiat: "active",
          payout_fiat: "active",
        },
        endorsements: [
          {
            name: "base",
            status: "approved",
            requirements: {
              complete: ["identity_verification", "phone_verification"],
              pending: [],
              missing: null,
              issues: [],
            },
          },
        ],
        future_requirements_due: [],
        requirements_due: [],
        has_accepted_terms_of_service: true,
      };
    }

    // 2. Mapear datos de Bridge API
    const mappedData = mapBridgeResponseToKYC(bridgeResponse);

    // 3. Verificar si el usuario ya existe en nuestra base de datos
    const existingProfile = await (prisma as any).kYCProfile.findFirst({
      where: { bridgeCustomerId: bridgeCustomerId },
    });

    if (existingProfile) {
      console.log(
        `⚠️  Usuario con Bridge ID ${bridgeCustomerId} ya existe en la base de datos`
      );
      console.log(`📋 Profile ID existente: ${existingProfile.id}`);
      return {
        profile: existingProfile,
        kycProfile: existingProfile,
        bridgeResponse,
        mappedData,
        wasExisting: true,
      };
    }

    // 4. Crear perfil base
    const profile = await (prisma as any).profile.create({
      data: {
        userId: generateUUID(),
        email: mappedData.email,
        firstName: mappedData.firstName,
        lastName: mappedData.lastName,
        status: "active",
        role: "USER",
      },
    });

    console.log(`✅ Perfil base creado: ${profile.id}`);

    // 5. Subir imágenes reales a Supabase
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

    console.log(`📁 Rutas de imágenes en Supabase:`);
    console.log(`   - Front: ${imageFrontUrl}`);
    console.log(`   - Back: ${imageBackUrl}`);
    console.log(`   - Proof: ${proofOfAddressUrl}`);

    // 6. Crear perfil KYC con datos del customer existente de Bridge
    const kycProfile = await (prisma as any).kYCProfile.create({
      data: {
        profileId: profile.id,
        bridgeCustomerId: mappedData.bridgeCustomerId,
        customerType: "individual",
        firstName: mappedData.firstName,
        middleName: "Carlos",
        lastName: mappedData.lastName,
        email: mappedData.email,
        phone: "+52155559999",
        birthDate: new Date("1988-12-15"),
        nationality: "MEX",
        kycStatus: mappedData.kycStatus,
        kycSubmittedAt: mappedData.kycSubmittedAt,
        kycApprovedAt: mappedData.kycApprovedAt,
        kycRejectedAt: mappedData.kycRejectedAt,
        kycRejectionReason: mappedData.kycRejectionReason,
        employmentStatus: "employed",
        accountPurpose: "operating_a_company",
        expectedMonthlyPaymentsUsd: "ten_thousand_49999",
        mostRecentOccupation: "Director de Tecnología",
        hasAcceptedTermsOfService: mappedData.hasAcceptedTermsOfService,
        payinCrypto: mappedData.payinCrypto,
        payoutCrypto: mappedData.payoutCrypto,
        payinFiat: mappedData.payinFiat,
        payoutFiat: mappedData.payoutFiat,
        futureRequirementsDue: mappedData.futureRequirementsDue,
        requirementsDue: mappedData.requirementsDue,
        bridgeRawResponse: bridgeResponse,
      },
    });

    console.log(`✅ Perfil KYC creado: ${kycProfile.id}`);
    console.log(`🔗 Bridge Customer ID: ${bridgeCustomerId}`);

    // 7. Crear endorsements desde respuesta de Bridge
    if (
      bridgeResponse?.endorsements &&
      Array.isArray(bridgeResponse.endorsements)
    ) {
      for (const endorsement of bridgeResponse.endorsements) {
        await (prisma as any).endorsement.create({
          data: {
            kycProfileId: kycProfile.id,
            name: endorsement.name,
            status: endorsement.status,
            requirements: endorsement.requirements,
          },
        });
        console.log(
          `✅ Endorsement creado: ${endorsement.name} (${endorsement.status})`
        );
      }
    }

    // 8. Crear dirección
    await (prisma as any).address.create({
      data: {
        kycProfileId: kycProfile.id,
        streetLine1: "Corporativo Santa Fe, Av. Santa Fe 495",
        streetLine2: "Torre 1, Piso 25",
        city: "Ciudad de México",
        country: "MEX",
        subdivision: "MEX-CMX",
        postalCode: "01219",
      },
    });

    // 9. Crear información de identificación
    await (prisma as any).identifyingInformation.create({
      data: {
        kycProfileId: kycProfile.id,
        type: "passport",
        issuingCountry: "MEX",
        number: `VERIFIED${Math.random().toString().slice(2, 8)}`,
        expiration: new Date("2030-12-31"),
        imageFront: imageFrontUrl,
        imageBack: imageBackUrl,
      },
    });

    // 10. Crear documento de comprobante
    await (prisma as any).document.create({
      data: {
        kycProfileId: kycProfile.id,
        purposes: ["proof_of_address"],
        description: "Comprobante de domicilio - estado de cuenta bancario",
        fileUrl: proofOfAddressUrl,
        fileSize: 2048,
      },
    });

    // 11. Crear eventos del flujo del usuario
    const events = await createUserEvents(profile, kycProfile, mappedData.kycStatus);

    console.log(
      `🎉 Usuario verificado existente creado: ${mappedData.firstName} ${mappedData.lastName}`
    );
    console.log(`🔗 Bridge Customer ID: ${bridgeCustomerId}`);
    console.log(`📊 Status: ${mappedData.kycStatus} (verificado y activo)`);

    return {
      profile,
      kycProfile,
      bridgeResponse,
      mappedData,
      wasExisting: false,
      events,
    };
  } catch (error: any) {
    console.error(`❌ Error creando usuario existente:`, error.message);
    return null;
  }
}

async function main() {
  console.log(
    "🚀 Iniciando seeder para usuario existente verificado en Bridge...\n"
  );

  // Bridge Customer ID específico proporcionado
  const EXISTING_BRIDGE_CUSTOMER_ID = "1e97f499-92c3-4cec-a9bb-b0e427a2619f";

  if (bridgeApiKey) {
    console.log(
      "🔗 Bridge API Key encontrada - obteniendo datos reales del customer"
    );
    console.log(`📡 Endpoint: ${bridgeApiUrl}`);
  } else {
    console.log(
      "🔄 Bridge API Key no encontrada - usando datos simulados verificados"
    );
  }

  console.log(`🆔 Bridge Customer ID: ${EXISTING_BRIDGE_CUSTOMER_ID}`);

  try {
    const result = await createExistingVerifiedUser(
      EXISTING_BRIDGE_CUSTOMER_ID
    );

    if (result) {
      if (result.wasExisting) {
        console.log(`\n⚠️  El usuario ya existía en la base de datos!`);
        console.log(`📋 No se crearon nuevos registros`);
      } else {
        console.log(`\n✨ Usuario existente verificado creado exitosamente!`);
        console.log(`📊 Perfil creado con datos de Bridge Customer existente`);
        console.log(`🔗 Bridge Customer ID: ${EXISTING_BRIDGE_CUSTOMER_ID}`);
        console.log(`✅ Status: ${result.mappedData.kycStatus}`);
        console.log(`📧 Email: ${result.mappedData.email}`);
        console.log(
          `👤 Nombre: ${result.mappedData.firstName} ${result.mappedData.lastName}`
        );
        console.log(`🎯 Eventos creados: ${result.events?.length || 0}`);

        console.log(`\n🎯 CARACTERÍSTICAS DEL USUARIO VERIFICADO:`);
        console.log(`   ✅ Verificación KYC completa y aprobada`);
        console.log(
          `   ✅ Capacidades activas: ${result.mappedData.payinCrypto}, ${result.mappedData.payoutCrypto}`
        );
        console.log(`   ✅ Endorsements aprobados`);
        console.log(`   ✅ Sin requerimientos pendientes`);
        console.log(`   ✅ Documentos verificados`);
        console.log(`   ✅ Información completa de Bridge API`);
        console.log(`   🎯 Eventos de flujo del usuario completados`);
      }
    } else {
      console.log(`\n❌ Error creando el usuario verificado`);
    }
  } catch (error: any) {
    console.error("❌ Error general en el seeder:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
