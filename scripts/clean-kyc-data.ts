#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

// Cargar variables de entorno
config();

// Configuración básica
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error("❌ Falta variable de entorno necesaria:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const prisma = new PrismaClient();

// Inicializar Supabase solo si tenemos service key para eliminar archivos
let supabase: any = null;
if (supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Email protegido que NO se debe eliminar
const PROTECTED_EMAIL = "apps@lednationllc.com";

// Función para eliminar archivos de un perfil en Supabase Storage
async function deleteProfileImages(profileId: string): Promise<void> {
  if (!supabase) {
    console.log(
      `⚠️  Supabase Service Key no disponible - saltando eliminación de imágenes`
    );
    return;
  }

  try {
    console.log(
      `🗄️  Eliminando imágenes de Supabase Storage para perfil: ${profileId}`
    );

    // Listar archivos del perfil en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from("avatars")
      .list(`kyc-documents/${profileId}`);

    if (listError) {
      console.warn(`⚠️  Error listando archivos: ${listError.message}`);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`📁 No se encontraron archivos para el perfil: ${profileId}`);
      return;
    }

    // Eliminar cada archivo
    const filePaths = files.map(
      (file) => `kyc-documents/${profileId}/${file.name}`
    );
    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove(filePaths);

    if (deleteError) {
      console.warn(`⚠️  Error eliminando archivos: ${deleteError.message}`);
    } else {
      console.log(
        `✅ Eliminados ${filePaths.length} archivos de Supabase Storage`
      );
    }
  } catch (error: any) {
    console.warn(`⚠️  Error en eliminación de imágenes: ${error.message}`);
  }
}

async function deleteProfile(profileId: string, email: string) {
  console.log(`🗑️  Eliminando perfil: ${email}`);

  try {
    // 1. Buscar el perfil con todos sus datos relacionados
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
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
      console.log(`⚠️  Perfil con ID ${profileId} no encontrado`);
      return false;
    }

    console.log(`🔍 Perfil encontrado: ${profile.id}`);

    // 2. Eliminar imágenes de Supabase Storage del perfil
    await deleteProfileImages(profile.id);

    // 3. Si tiene perfil KYC, eliminar todos los datos relacionados
    if (profile.kycProfile) {
      console.log(`🗑️  Eliminando datos KYC...`);

      const kycProfile = profile.kycProfile;

      // Contar elementos a eliminar
      const addressCount = kycProfile.address ? 1 : 0;
      const identifyingInfoCount = kycProfile.identifyingInfo?.length || 0;
      const documentsCount = kycProfile.documents?.length || 0;
      const rejectionReasonsCount = kycProfile.rejectionReasons?.length || 0;

      console.log(`   📍 Direcciones a eliminar: ${addressCount}`);
      console.log(
        `   🆔 Información de identificación a eliminar: ${identifyingInfoCount}`
      );
      console.log(`   📄 Documentos a eliminar: ${documentsCount}`);
      console.log(
        `   ❌ Razones de rechazo a eliminar: ${rejectionReasonsCount}`
      );

      // Eliminar en orden correcto (FK constraints)
      // 4. Eliminar razones de rechazo
      if (rejectionReasonsCount > 0) {
        await prisma.rejectionReason.deleteMany({
          where: { kycProfileId: kycProfile.id },
        });
      }

      // 5. Eliminar documentos
      if (documentsCount > 0) {
        await prisma.document.deleteMany({
          where: { kycProfileId: kycProfile.id },
        });
      }

      // 6. Eliminar información de identificación
      if (identifyingInfoCount > 0) {
        await prisma.identifyingInformation.deleteMany({
          where: { kycProfileId: kycProfile.id },
        });
      }

      // 7. Eliminar dirección
      if (addressCount > 0) {
        await prisma.address.deleteMany({
          where: { kycProfileId: kycProfile.id },
        });
      }

      // 8. Eliminar perfil KYC
      await prisma.kYCProfile.delete({
        where: { id: kycProfile.id },
      });
    }

    // 9. Eliminar perfil principal
    await prisma.profile.delete({
      where: { id: profile.id },
    });

    console.log(
      `✅ Perfil y datos relacionados eliminados de la base de datos`
    );
    console.log(`🎉 Perfil completamente eliminado: ${email}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error eliminando perfil ${email}:`, error);
    return false;
  }
}

async function cleanupOrphanedData() {
  console.log("🔍 Buscando datos huérfanos...");

  try {
    // Buscar perfiles KYC sin perfil padre (excepto el protegido)
    const orphanedKycProfiles = await prisma.kYCProfile.findMany({
      where: {
        profile: null,
      },
    });

    if (orphanedKycProfiles.length > 0) {
      console.log(
        `🧹 Eliminando ${orphanedKycProfiles.length} perfiles KYC huérfanos...`
      );
      for (const kycProfile of orphanedKycProfiles) {
        await prisma.kYCProfile.delete({
          where: { id: kycProfile.id },
        });
      }
    }

    // Buscar direcciones huérfanas
    const orphanedAddresses = await prisma.address.findMany({
      where: {
        kycProfile: null,
      },
    });

    if (orphanedAddresses.length > 0) {
      console.log(
        `🧹 Eliminando ${orphanedAddresses.length} direcciones huérfanas...`
      );
      await prisma.address.deleteMany({
        where: {
          id: { in: orphanedAddresses.map((a) => a.id) },
        },
      });
    }

    // Buscar información de identificación huérfana
    const orphanedIdentifyingInfo =
      await prisma.identifyingInformation.findMany({
        where: {
          kycProfile: null,
        },
      });

    if (orphanedIdentifyingInfo.length > 0) {
      console.log(
        `🧹 Eliminando ${orphanedIdentifyingInfo.length} información de identificación huérfana...`
      );
      await prisma.identifyingInformation.deleteMany({
        where: {
          id: { in: orphanedIdentifyingInfo.map((i) => i.id) },
        },
      });
    }

    // Buscar documentos huérfanos
    const orphanedDocuments = await prisma.document.findMany({
      where: {
        kycProfile: null,
      },
    });

    if (orphanedDocuments.length > 0) {
      console.log(
        `🧹 Eliminando ${orphanedDocuments.length} documentos huérfanos...`
      );
      await prisma.document.deleteMany({
        where: {
          id: { in: orphanedDocuments.map((d) => d.id) },
        },
      });
    }

    // Buscar razones de rechazo huérfanas
    const orphanedRejectionReasons = await prisma.rejectionReason.findMany({
      where: {
        kycProfile: null,
      },
    });

    if (orphanedRejectionReasons.length > 0) {
      console.log(
        `🧹 Eliminando ${orphanedRejectionReasons.length} razones de rechazo huérfanas...`
      );
      await prisma.rejectionReason.deleteMany({
        where: {
          id: { in: orphanedRejectionReasons.map((r) => r.id) },
        },
      });
    }

    if (
      orphanedKycProfiles.length === 0 &&
      orphanedAddresses.length === 0 &&
      orphanedIdentifyingInfo.length === 0 &&
      orphanedDocuments.length === 0 &&
      orphanedRejectionReasons.length === 0
    ) {
      console.log("✅ No se encontraron datos huérfanos");
    }
  } catch (error) {
    console.error("❌ Error durante la limpieza de datos huérfanos:", error);
  }
}

async function main() {
  console.log("🚀 Iniciando script de limpieza de perfiles\n");

  try {
    // 1. Obtener todos los perfiles excepto el protegido
    const profilesToDelete = await prisma.profile.findMany({
      where: {
        email: {
          not: PROTECTED_EMAIL,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (profilesToDelete.length === 0) {
      console.log(
        "✅ No hay perfiles para eliminar (solo existe el perfil protegido)"
      );
      return;
    }

    console.log(
      `⚠️  ADVERTENCIA: Este script eliminará ${profilesToDelete.length} perfiles:`
    );
    profilesToDelete.forEach((profile) => {
      const name =
        profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : "Sin nombre";
      console.log(`   - ${profile.email} (${name})`);
    });
    console.log(`\n🛡️  PERFIL PROTEGIDO (NO se eliminará): ${PROTECTED_EMAIL}`);
    console.log(
      "\n¿Estás seguro de que quieres continuar? (Ctrl+C para cancelar)"
    );
    console.log("Continuando en 5 segundos...");

    // Pausa de seguridad
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("\n🧹 Iniciando limpieza de perfiles...\n");

    let deletedCount = 0;
    const processedEmails: string[] = [];

    // 2. Eliminar cada perfil
    for (const profile of profilesToDelete) {
      const success = await deleteProfile(
        profile.id,
        profile.email || "Sin email"
      );
      if (success) {
        deletedCount++;
        processedEmails.push(profile.email || "Sin email");
      }
    }

    // 3. Limpiar datos huérfanos
    await cleanupOrphanedData();

    // 4. Estadísticas finales
    const [
      finalProfileCount,
      finalKycProfileCount,
      finalAddressCount,
      finalIdentifyingInfoCount,
      finalDocumentCount,
      finalRejectionReasonCount,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.kYCProfile.count(),
      prisma.address.count(),
      prisma.identifyingInformation.count(),
      prisma.document.count(),
      prisma.rejectionReason.count(),
    ]);

    console.log(`\n📊 Estadísticas después de la limpieza:`);
    console.log(`   👥 Perfiles restantes: ${finalProfileCount}`);
    console.log(`   📋 Perfiles KYC restantes: ${finalKycProfileCount}`);
    console.log(`   📍 Direcciones restantes: ${finalAddressCount}`);
    console.log(
      `   🆔 Info de identificación restante: ${finalIdentifyingInfoCount}`
    );
    console.log(`   📄 Documentos restantes: ${finalDocumentCount}`);
    console.log(
      `   ❌ Razones de rechazo restantes: ${finalRejectionReasonCount}`
    );

    console.log(`\n✨ Limpieza completada!`);
    console.log(`🗑️  Perfiles eliminados: ${deletedCount}`);
    console.log(`🛡️  Perfil protegido mantenido: ${PROTECTED_EMAIL}`);

    if (processedEmails.length > 0) {
      console.log(`📧 Emails eliminados:`);
      processedEmails.forEach((email) => {
        console.log(`   - ${email}`);
      });
    }

    console.log(
      `\n🎯 La base de datos ha sido limpiada (excepto el perfil protegido).`
    );
  } catch (error) {
    console.error("❌ Error general en el script de limpieza:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
