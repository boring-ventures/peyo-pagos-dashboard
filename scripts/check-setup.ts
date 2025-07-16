#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Cargar variables de entorno
config();

async function main() {
  console.log("🔧 Verificando configuración para scripts KYC...\n");

  // 1. Verificar variables de entorno
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missingVars: string[] = [];

  requiredEnvVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`❌ ${varName}: No configurada`);
    } else {
      console.log(`✅ ${varName}: Configurada`);
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n❌ Faltan las siguientes variables de entorno:`);
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });

    process.exit(1);
  }

  console.log("\n🔗 Probando conexión a Supabase...");

  try {
    // 2. Probar conexión con anon key
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabaseClient.auth.getSession();
    if (error && error.message !== "No session") {
      console.log(`⚠️  Cliente anon: ${error.message}`);
    } else {
      console.log(`✅ Cliente anon: Conectado correctamente`);
    }
  } catch (error) {
    console.log(`❌ Error de conexión:`, error);
    process.exit(1);
  }

  console.log("\n🗄️  Verificando base de datos...");

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Verificar conexión a la base de datos
    const profileCount = await prisma.profile.count();
    const kycCount = await prisma.kYCProfile.count();

    console.log(`✅ Base de datos: Conectada`);
    console.log(`   Perfiles: ${profileCount}`);
    console.log(`   Perfiles KYC: ${kycCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.log(`❌ Error de base de datos:`, error);
    process.exit(1);
  }

  console.log("\n🎉 ¡Configuración completa y funcionando!");
  console.log("\n📚 Comandos disponibles:");
  console.log("   npm run seed:kyc   - Generar datos de prueba");
  console.log("   npm run clean:kyc  - Limpiar datos de prueba");
  console.log("\n🔍 Para ver este check nuevamente:");
  console.log("   npx tsx scripts/check-setup.ts");
}

// Ejecutar la función principal
main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
