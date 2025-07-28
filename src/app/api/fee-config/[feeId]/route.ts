import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { feeId: string } }
) {
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

    const { feeId } = params;

    // Get fee configuration with history
    const fee = await prisma.feeConfig.findUnique({
      where: { id: feeId },
      include: {
        feeHistory: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 changes
        },
        _count: {
          select: {
            feeHistory: true,
          },
        },
      },
    });

    if (!fee) {
      return NextResponse.json(
        { error: "Fee configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(fee);
  } catch (error) {
    console.error("Error fetching fee configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { feeId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only ADMIN and SUPERADMIN can update fee configs
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !user ||
      (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { feeId } = params;
    const body = await request.json();
    const {
      name,
      description,
      amount,
      currency,
      feeStructure,
      minAmount,
      maxAmount,
      isActive,
      appliesTo,
      excludedFrom,
      category,
      tags,
      changeReason,
    } = body;

    // Get current fee configuration
    const currentFee = await prisma.feeConfig.findUnique({
      where: { id: feeId },
    });

    if (!currentFee) {
      return NextResponse.json(
        { error: "Fee configuration not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      lastModifiedBy: user.id,
      lastModifiedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (currency !== undefined) updateData.currency = currency;
    if (feeStructure !== undefined) updateData.feeStructure = feeStructure;
    if (minAmount !== undefined) updateData.minAmount = minAmount;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
    if (excludedFrom !== undefined) updateData.excludedFrom = excludedFrom;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    // Create history record if amount or currency changed
    if (
      (amount !== undefined && amount !== currentFee.amount) ||
      (currency !== undefined && currency !== currentFee.currency)
    ) {
      await prisma.feeConfigHistory.create({
        data: {
          feeId,
          oldAmount: currentFee.amount,
          newAmount: amount !== undefined ? amount : currentFee.amount,
          oldCurrency: currentFee.currency,
          newCurrency: currency !== undefined ? currency : currentFee.currency,
          changeReason,
          modifiedBy: user.id,
        },
      });
    }

    // Update the fee configuration
    const updatedFee = await prisma.feeConfig.update({
      where: { id: feeId },
      data: updateData,
    });

    // Create event
    await prisma.event.create({
      data: {
        type: "SYSTEM_CONFIG_UPDATED",
        module: "SYSTEM_CONFIG",
        profileId: user.id,
        feeConfigId: feeId,
        description: `Updated fee configuration: ${updatedFee.name}`,
        metadata: {
          feeType: updatedFee.feeType,
          changes: Object.keys(updateData).filter(
            (key) => key !== "lastModifiedBy" && key !== "lastModifiedAt"
          ),
        },
      },
    });

    return NextResponse.json(updatedFee);
  } catch (error) {
    console.error("Error updating fee configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { feeId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization - only SUPERADMIN can delete fee configs
    const user = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!user || user.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { feeId } = params;

    // Get fee configuration before deletion
    const fee = await prisma.feeConfig.findUnique({
      where: { id: feeId },
    });

    if (!fee) {
      return NextResponse.json(
        { error: "Fee configuration not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.feeConfig.update({
      where: { id: feeId },
      data: {
        isActive: false,
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
        feeConfigId: feeId,
        description: `Deleted fee configuration: ${fee.name}`,
        metadata: {
          feeType: fee.feeType,
          amount: fee.amount,
          currency: fee.currency,
        },
      },
    });

    return NextResponse.json({
      message: "Fee configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting fee configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
