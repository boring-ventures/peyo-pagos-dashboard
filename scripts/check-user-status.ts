import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    console.log("🔍 Verificando estado de usuarios...");

    // Buscar el usuario específico que está causando problemas
    const userId = "1662f5d6-3256-47b3-809b-6f5faa6598eb";

    const user = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!user) {
      console.log("❌ Usuario no encontrado");
      return;
    }

    console.log("📊 Estado actual del usuario:");
    console.log(`   ID: ${user.id}`);
    console.log(`   User ID: ${user.userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}`);

    // Si el usuario está inactivo, activarlo
    if (user.status === "disabled") {
      console.log("🔄 Activando usuario inactivo...");

      await prisma.profile.update({
        where: { userId },
        data: { status: "active" },
      });

      console.log("✅ Usuario activado correctamente");
    } else {
      console.log("✅ Usuario ya está activo");
    }

    // Mostrar todos los usuarios para referencia
    console.log("\n📋 Todos los usuarios:");
    const allUsers = await prisma.profile.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    allUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.email} (${user.status}) - ${user.role}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
checkUserStatus();
