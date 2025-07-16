#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Cargar variables de entorno
config();
import {
  PrismaClient,
  KYCStatus,
  EmploymentStatus,
  AccountPurpose,
  CustomerType,
  ExpectedMonthlyPaymentsUSD,
  DocumentType,
  DocumentPurpose,
} from "@prisma/client";

// Configuración básica
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

if (!supabaseUrl) {
  console.error("❌ Falta variable de entorno necesaria:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const prisma = new PrismaClient();

// Función para generar UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Datos de ejemplo para generar perfiles realistas
const SAMPLE_USERS = [
  {
    email: "maria.gonzalez.test@example.com",
    password: "TestPassword123!",
    firstName: "María",
    lastName: "González",
    middleName: "Elena",
    phone: "+52155551234",
    nationality: "MEX",
    birthDate: new Date("1990-05-15"),
    kycStatus: KYCStatus.under_review,
    bridgeVerificationStatus: "pending",
    employmentStatus: EmploymentStatus.employed,
    accountPurpose: AccountPurpose.personal_or_living_expenses,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.zero_4999,
    mostRecentOccupation: "Ingeniera de Software",
    address: {
      streetLine1: "Av. Reforma 123",
      streetLine2: "Piso 4, Depto 401",
      city: "Ciudad de México",
      country: "MEX",
      subdivision: "MEX-CMX",
      postalCode: "06600",
    },
  },
  {
    email: "carlos.rodriguez.test@example.com",
    password: "TestPassword123!",
    firstName: "Carlos",
    lastName: "Rodríguez",
    middleName: "Antonio",
    phone: "+52155555678",
    nationality: "MEX",
    birthDate: new Date("1985-11-22"),
    kycStatus: KYCStatus.awaiting_questionnaire,
    bridgeVerificationStatus: "not_started",
    employmentStatus: EmploymentStatus.self_employed,
    accountPurpose: AccountPurpose.operating_a_company,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.five_thousand_9999,
    mostRecentOccupation: "Consultor Independiente",
    address: {
      streetLine1: "Calle Madero 456",
      city: "Guadalajara",
      country: "MEX",
      subdivision: "MEX-JAL",
      postalCode: "44100",
    },
  },
  {
    email: "ana.martinez.test@example.com",
    password: "TestPassword123!",
    firstName: "Ana",
    lastName: "Martínez",
    middleName: "Beatriz",
    phone: "+52155557890",
    nationality: "MEX",
    birthDate: new Date("1988-07-08"),
    kycStatus: KYCStatus.rejected,
    bridgeVerificationStatus: "rejected",
    employmentStatus: EmploymentStatus.employed,
    accountPurpose: AccountPurpose.receive_salary,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.ten_thousand_49999,
    mostRecentOccupation: "Gerente de Marketing",
    address: {
      streetLine1: "Insurgentes Sur 789",
      streetLine2: "Col. Roma Norte",
      city: "Ciudad de México",
      country: "MEX",
      subdivision: "MEX-CMX",
      postalCode: "06700",
    },
  },
  {
    email: "luis.fernandez.test@example.com",
    password: "TestPassword123!",
    firstName: "Luis",
    lastName: "Fernández",
    middleName: "Miguel",
    phone: "+52155551111",
    nationality: "MEX",
    birthDate: new Date("1992-03-12"),
    kycStatus: KYCStatus.incomplete,
    bridgeVerificationStatus: "under_review",
    employmentStatus: EmploymentStatus.student,
    accountPurpose: AccountPurpose.personal_or_living_expenses,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.zero_4999,
    mostRecentOccupation: "Estudiante de Posgrado",
    address: {
      streetLine1: "Av. Universidad 321",
      city: "Monterrey",
      country: "MEX",
      subdivision: "MEX-NLE",
      postalCode: "64000",
    },
  },
  {
    email: "sofia.lopez.test@example.com",
    password: "TestPassword123!",
    firstName: "Sofía",
    lastName: "López",
    middleName: "Carmen",
    phone: "+52155552222",
    nationality: "MEX",
    birthDate: new Date("1987-09-30"),
    kycStatus: KYCStatus.active,
    bridgeVerificationStatus: "approved",
    employmentStatus: EmploymentStatus.employed,
    accountPurpose: AccountPurpose.ecommerce_retail_payments,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.fifty_thousand_plus,
    mostRecentOccupation: "Directora de Ventas",
    address: {
      streetLine1: "Periférico Sur 654",
      streetLine2: "Torre B, Oficina 1205",
      city: "Ciudad de México",
      country: "MEX",
      subdivision: "MEX-CMX",
      postalCode: "01900",
    },
  },
  {
    email: "diego.morales.test@example.com",
    password: "TestPassword123!",
    firstName: "Diego",
    lastName: "Morales",
    middleName: "Alejandro",
    phone: "+52155553333",
    nationality: "MEX",
    birthDate: new Date("1991-12-05"),
    kycStatus: KYCStatus.awaiting_ubo,
    bridgeVerificationStatus: "pending",
    employmentStatus: EmploymentStatus.unemployed,
    accountPurpose: AccountPurpose.receive_payment_for_freelancing,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.five_thousand_9999,
    mostRecentOccupation: "Diseñador Freelance",
    address: {
      streetLine1: "Av. Juárez 987",
      city: "Puebla",
      country: "MEX",
      subdivision: "MEX-PUE",
      postalCode: "72000",
    },
  },
  {
    email: "patricia.herrera.test@example.com",
    password: "TestPassword123!",
    firstName: "Patricia",
    lastName: "Herrera",
    middleName: "Isabel",
    phone: "+52155554444",
    nationality: "MEX",
    birthDate: new Date("1983-04-18"),
    kycStatus: KYCStatus.paused,
    bridgeVerificationStatus: "under_review",
    employmentStatus: EmploymentStatus.retired,
    accountPurpose: AccountPurpose.investment_purposes,
    expectedMonthlyPayments: ExpectedMonthlyPaymentsUSD.ten_thousand_49999,
    mostRecentOccupation: "Ex-Directora Financiera",
    address: {
      streetLine1: "Paseo de la Reforma 147",
      streetLine2: "Piso 20",
      city: "Ciudad de México",
      country: "MEX",
      subdivision: "MEX-CMX",
      postalCode: "11000",
    },
  },
];

async function createTestUser(userData: (typeof SAMPLE_USERS)[0]) {
  console.log(`📝 Creando datos de prueba para: ${userData.email}`);

  try {
    // 1. Verificar si ya existe un perfil con este email
    const existingProfile = await prisma.profile.findUnique({
      where: { email: userData.email },
    });

    if (existingProfile) {
      console.log(
        `⚠️  Perfil con email ${userData.email} ya existe, omitiendo...`
      );
      return null;
    }

    // 2. Generar UUID ficticio para userId (simula usuario de Supabase)
    const fakeUserId = generateUUID();
    console.log(`🆔 ID de usuario generado: ${fakeUserId}`);

    // 3. Crear perfil en la base de datos
    const profile = await prisma.profile.create({
      data: {
        userId: fakeUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        status: "active",
        role: "USER",
      },
    });

    console.log(`✅ Perfil creado: ${profile.id}`);

    // 3. Crear perfil KYC con datos completos
    const kycProfile = await prisma.kYCProfile.create({
      data: {
        profileId: profile.id,
        customerType: CustomerType.individual,
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        birthDate: userData.birthDate,
        nationality: userData.nationality,
        kycStatus: userData.kycStatus,
        bridgeVerificationStatus: userData.bridgeVerificationStatus,
        kycSubmittedAt:
          userData.kycStatus !== KYCStatus.not_started ? new Date() : null,
        kycApprovedAt:
          userData.kycStatus === KYCStatus.active ? new Date() : null,
        kycRejectedAt:
          userData.kycStatus === KYCStatus.rejected ? new Date() : null,
        kycRejectionReason:
          userData.kycStatus === KYCStatus.rejected
            ? "Documentos no válidos - datos de prueba"
            : null,
        employmentStatus: userData.employmentStatus,
        accountPurpose: userData.accountPurpose,
        expectedMonthlyPaymentsUsd: userData.expectedMonthlyPayments,
        mostRecentOccupation: userData.mostRecentOccupation,
        hasAcceptedTermsOfService: true,
      },
    });

    console.log(`✅ Perfil KYC creado: ${kycProfile.id}`);

    // 4. Crear dirección
    await prisma.address.create({
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

    console.log(`✅ Dirección creada`);

    // 5. Crear información de identificación (documento de identidad)
    await prisma.identifyingInformation.create({
      data: {
        kycProfileId: kycProfile.id,
        type: DocumentType.national_id,
        issuingCountry: "MEX",
        number: `ID${Math.random().toString().slice(2, 12)}`,
        expiration: new Date("2030-12-31"),
      },
    });

    console.log(`✅ Información de identificación creada`);

    // 6. Crear documento de comprobante de domicilio
    await prisma.document.create({
      data: {
        kycProfileId: kycProfile.id,
        purposes: [DocumentPurpose.proof_of_address],
        description: "Comprobante de domicilio - recibo de servicios",
      },
    });

    console.log(`✅ Documento creado`);

    // 7. Si está rechazado, crear razón de rechazo
    if (userData.kycStatus === KYCStatus.rejected) {
      await prisma.rejectionReason.create({
        data: {
          kycProfileId: kycProfile.id,
          reason: "Documentos no válidos",
          developerReason:
            "Test rejection reason - los documentos proporcionados no cumplen con los estándares requeridos",
          bridgeCreatedAt: new Date(),
        },
      });

      console.log(`✅ Razón de rechazo creada`);
    }

    console.log(
      `🎉 Datos de prueba completos: ${userData.firstName} ${userData.lastName}\n`
    );
    return { profile, kycProfile };
  } catch (error) {
    console.error(`❌ Error creando usuario ${userData.email}:`, error);
    return null;
  }
}

async function main() {
  console.log("🚀 Iniciando seeder de datos KYC...\n");

  try {
    let createdCount = 0;

    for (const userData of SAMPLE_USERS) {
      const result = await createTestUser(userData);
      if (result) {
        createdCount++;
      }

      // Pequeña pausa entre creaciones
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n✨ Seeder completado!`);
    console.log(`📊 Perfiles de prueba creados: ${createdCount}`);
    console.log(`📧 Emails de prueba:`);
    SAMPLE_USERS.forEach((user) => {
      console.log(
        `   - ${user.email} (${user.firstName} ${user.lastName}) - Estado: ${user.kycStatus}`
      );
    });

    console.log(`\n📝 NOTA: Estos son datos de prueba locales (no usuarios reales en Supabase Auth)`);
    console.log(
      `\n🎯 Ahora puedes acceder al dashboard KYC como super admin para revisar estos perfiles.`
    );
  } catch (error) {
    console.error("❌ Error general en el seeder:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seeder
main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
