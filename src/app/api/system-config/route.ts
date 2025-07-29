import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSystemConfigStats } from "@/lib/system-config";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (status) where.status = status;

    // Get configurations
    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            configHistory: true,
          },
        },
      },
    });

    // Get stats if requested
    let stats = null;
    if (includeStats) {
      stats = await getSystemConfigStats();
    }

    return NextResponse.json({
      configs,
      stats,
      total: configs.length,
    });
  } catch (error) {
    console.error("Error fetching system configurations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only SUPERADMIN can create system configs
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!user || user.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      key,
      name,
      description,
      type,
      value,
      defaultValue,
      minValue,
      maxValue,
      allowedValues,
      validationRule,
      category,
      tags = [],
    } = body;

    // Validate required fields
    if (!key || !name || !type || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: key, name, type, value" },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Configuration with this key already exists" },
        { status: 409 }
      );
    }

    // Create the configuration
    const config = await prisma.systemConfig.create({
      data: {
        key,
        name,
        description,
        type,
        value,
        defaultValue,
        minValue,
        maxValue,
        allowedValues,
        validationRule,
        category,
        tags,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      },
    });

    // Create event
    await prisma.event.create({
      data: {
        type: "SYSTEM_CONFIG_CREATED",
        module: "SYSTEM_CONFIG",
        profileId: user.id,
        systemConfigId: config.id,
        description: `Created system configuration: ${name}`,
        metadata: {
          key,
          type,
          value,
        },
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Error creating system configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
