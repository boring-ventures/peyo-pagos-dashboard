import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole, ConfigStatus, Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only ADMIN and SUPERADMIN can access system config
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !user ||
      (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { configId } = await params;

    // Get configuration with history
    const config = await prisma.systemConfig.findUnique({
      where: { id: configId },
      include: {
        configHistory: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 changes
        },
        _count: {
          select: {
            configHistory: true,
          },
        },
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching system configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only ADMIN and SUPERADMIN can update system configs
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !user ||
      (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { configId } = await params;
    const body = await request.json();
    const { name, description, value, status, category, tags, changeReason } =
      body;

    // Get current configuration
    const currentConfig = await prisma.systemConfig.findUnique({
      where: { id: configId },
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      lastModifiedBy: user.id,
      lastModifiedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = value;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    // Create history record if value changed
    if (value !== undefined && value !== currentConfig.value) {
      await prisma.systemConfigHistory.create({
        data: {
          configId,
          oldValue: currentConfig.value as Prisma.InputJsonValue,
          newValue: value as Prisma.InputJsonValue,
          changeReason,
          modifiedBy: user.id,
        },
      });
    }

    // Update the configuration
    const updatedConfig = await prisma.systemConfig.update({
      where: { id: configId },
      data: updateData,
    });

    // Create event
    await prisma.event.create({
      data: {
        type: "SYSTEM_CONFIG_UPDATED",
        module: "SYSTEM_CONFIG",
        profileId: user.id,
        systemConfigId: configId,
        description: `Updated system configuration: ${updatedConfig.name}`,
        metadata: {
          key: updatedConfig.key,
          changes: Object.keys(updateData).filter(
            (key) => key !== "lastModifiedBy" && key !== "lastModifiedAt"
          ),
        },
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("Error updating system configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only SUPERADMIN can delete system configs
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!user || user.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { configId } = await params;

    // Get configuration before deletion
    const config = await prisma.systemConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting status to deprecated
    await prisma.systemConfig.update({
      where: { id: configId },
      data: {
        status: ConfigStatus.deprecated,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      },
    });

    // Create event
    await prisma.event.create({
      data: {
        type: "SYSTEM_CONFIG_DELETED",
        module: "SYSTEM_CONFIG",
        profileId: user.id,
        systemConfigId: configId,
        description: `Deleted system configuration: ${config.name}`,
        metadata: {
          key: config.key,
          type: config.type,
        },
      },
    });

    return NextResponse.json({ message: "Configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting system configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
