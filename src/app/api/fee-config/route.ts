import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFeeConfigStats } from "@/lib/system-config";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only ADMIN and SUPERADMIN can access fee config
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
    const feeType = searchParams.get("feeType");
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (feeType) where.feeType = feeType;
    if (isActive !== null) where.isActive = isActive === "true";

    // Get fee configurations
    const fees = await prisma.feeConfig.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            feeHistory: true,
          },
        },
      },
    });

    // Get stats if requested
    let stats = null;
    if (includeStats) {
      stats = await getFeeConfigStats();
    }

    return NextResponse.json({
      fees,
      stats,
      total: fees.length,
    });
  } catch (error) {
    console.error("Error fetching fee configurations:", error);
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

    // Check authorization - only ADMIN and SUPERADMIN can create fee configs
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !user ||
      (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      feeType,
      name,
      description,
      amount,
      currency = "USD",
      feeStructure = "percentage",
      minAmount,
      maxAmount,
      appliesTo = [],
      excludedFrom = [],
      category,
      tags = [],
    } = body;

    // Validate required fields
    if (!feeType || !name || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: feeType, name, amount" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 0) {
      return NextResponse.json(
        { error: "Amount must be non-negative" },
        { status: 400 }
      );
    }

    // Check if fee type already exists
    const existing = await prisma.feeConfig.findFirst({
      where: { feeType },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Fee configuration for this type already exists" },
        { status: 409 }
      );
    }

    // Create the fee configuration
    const fee = await prisma.feeConfig.create({
      data: {
        feeType,
        name,
        description,
        amount,
        currency,
        feeStructure,
        minAmount,
        maxAmount,
        appliesTo,
        excludedFrom,
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
        feeConfigId: fee.id,
        description: `Created fee configuration: ${name}`,
        metadata: {
          feeType,
          amount,
          currency,
          feeStructure,
        },
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error("Error creating fee configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
