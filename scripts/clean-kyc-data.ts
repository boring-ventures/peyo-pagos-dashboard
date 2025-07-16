#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Cargar variables de entorno
config();
import { PrismaClient } from "@prisma/client";

// Configuración básica
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

if (!supabaseUrl) {
  console.error("❌ Falta variable de entorno necesaria:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const prisma = new PrismaClient();

// Emails de los usuarios de prueba (deben coincidir con el seeder)
const TEST_EMAILS = [
  "maria.gonzalez.test@example.com",
  "carlos.rodriguez.test@example.com",
  "ana.martinez.test@example.com",
  "luis.fernandez.test@example.com",
  "sofia.lopez.test@example.com",
  "diego.morales.test@example.com",
  "patricia.herrera.test@example.com",
];

async function deleteTestUser(email: string) {
  console.log(`🗑️  Eliminando datos de prueba: ${email}`);

  try {
    // 1. Buscar el perfil en la base de datos local
    const profile = await prisma.profile.findUnique({
      where: { email },
      include: {
        kycProfile: {
          include: {
            address: true,
            identifyingInfo: true,
            documents: true,
            rejectionReasons: true,
          },
        },
      },
    });

    if (!profile) {
      console.log(
        `⚠️  Perfil con email ${email} no encontrado en la base de datos`
      );
      return;
    }

    console.log(`🔍 Perfil encontrado: ${profile.id}`);

    // 2. Eliminar todos los datos relacionados en cascada (Prisma se encarga con onDelete: Cascade)
    if (profile.kycProfile) {
      console.log(`🗑️  Eliminando datos KYC...`);

      // Los datos se eliminan automáticamente por la relación en cascada
      // pero podemos mostrar qué se va a eliminar
      const deletionCounts = {
        addresses: profile.kycProfile.address ? 1 : 0,
        identifyingInfo: profile.kycProfile.identifyingInfo.length,
        documents: profile.kycProfile.documents.length,
        rejectionReasons: profile.kycProfile.rejectionReasons.length,
      };

      console.log(`   📍 Direcciones a eliminar: ${deletionCounts.addresses}`);
      console.log(
        `   🆔 Información de identificación a eliminar: ${deletionCounts.identifyingInfo}`
      );
      console.log(`   📄 Documentos a eliminar: ${deletionCounts.documents}`);
      console.log(
        `   ❌ Razones de rechazo a eliminar: ${deletionCounts.rejectionReasons}`
      );
    }

    // 3. Eliminar el perfil (esto eliminará todo en cascada)
    await prisma.profile.delete({
      where: { id: profile.id },
    });

    console.log(
      `✅ Perfil y datos relacionados eliminados de la base de datos`
    );

    console.log(`🎉 Datos de prueba completamente eliminados: ${email}\n`);
  } catch (error) {
    console.error(`❌ Error eliminando usuario ${email}:`, error);
  }
}

async function deleteAllTestUsers() {
  console.log("🧹 Iniciando limpieza de datos de prueba KYC...\n");

  let deletedCount = 0;

  for (const email of TEST_EMAILS) {
    await deleteTestUser(email);
    deletedCount++;

    // Pequeña pausa entre eliminaciones
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return deletedCount;
}

async function cleanupOrphanedData() {
  console.log("🔍 Buscando datos huérfanos de prueba...\n");

  try {
    // Buscar perfiles con emails de prueba que puedan haber quedado
    const orphanedProfiles = await prisma.profile.findMany({
      where: {
        email: {
          endsWith: ".test@example.com",
        },
      },
      include: {
        kycProfile: true,
      },
    });

    if (orphanedProfiles.length > 0) {
      console.log(
        `🔍 Encontrados ${orphanedProfiles.length} perfiles de prueba adicionales:`
      );

      for (const profile of orphanedProfiles) {
        console.log(`   - ${profile.email} (ID: ${profile.id})`);

        try {
          // Eliminar perfil (cascada eliminará KYC datos)
          await prisma.profile.delete({
            where: { id: profile.id },
          });

          console.log(`✅ Perfil huérfano eliminado: ${profile.email}`);
        } catch (error) {
          console.error(
            `❌ Error eliminando perfil huérfano ${profile.email}:`,
            error
          );
        }
      }
    } else {
      console.log("✅ No se encontraron datos huérfanos");
    }
  } catch (error) {
    console.error("❌ Error durante la limpieza de datos huérfanos:", error);
  }
}

async function showStats() {
  console.log("\n📊 Estadísticas después de la limpieza:");

  try {
    const stats = await Promise.all([
      prisma.profile.count(),
      prisma.kYCProfile.count(),
      prisma.address.count(),
      prisma.identifyingInformation.count(),
      prisma.document.count(),
      prisma.rejectionReason.count(),
    ]);

    console.log(`   👥 Perfiles restantes: ${stats[0]}`);
    console.log(`   📋 Perfiles KYC restantes: ${stats[1]}`);
    console.log(`   📍 Direcciones restantes: ${stats[2]}`);
    console.log(`   🆔 Info de identificación restante: ${stats[3]}`);
    console.log(`   📄 Documentos restantes: ${stats[4]}`);
    console.log(`   ❌ Razones de rechazo restantes: ${stats[5]}`);
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
  }
}

async function main() {
  try {
    console.log("🚀 Iniciando script de limpieza de datos de prueba KYC\n");

    // Mostrar advertencia
    console.log(
      "⚠️  ADVERTENCIA: Este script eliminará los siguientes usuarios de prueba:"
    );
    TEST_EMAILS.forEach((email) => console.log(`   - ${email}`));

    console.log(
      "\n¿Estás seguro de que quieres continuar? (Ctrl+C para cancelar)"
    );
    console.log("Continuando en 5 segundos...\n");

    // Pausa de 5 segundos para permitir cancelación
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Eliminar usuarios específicos de prueba
    const deletedCount = await deleteAllTestUsers();

    // Buscar y limpiar datos huérfanos
    await cleanupOrphanedData();

    // Mostrar estadísticas finales
    await showStats();

    console.log(`\n✨ Limpieza completada!`);
    console.log(`🗑️  Usuarios de prueba procesados: ${deletedCount}`);
    console.log(`📧 Emails procesados:`);
    TEST_EMAILS.forEach((email) => console.log(`   - ${email}`));

    console.log(`\n🎯 La base de datos ha sido limpiada de datos de prueba.`);
  } catch (error) {
    console.error("❌ Error general durante la limpieza:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script de limpieza
main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
