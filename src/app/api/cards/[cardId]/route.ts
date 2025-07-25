import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET /api/cards/[cardId] - Get a specific card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view cards
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (
      !userProfile ||
      (userProfile.role !== UserRole.ADMIN &&
        userProfile.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Only return cards for USER profiles
    if (card.profile.role !== UserRole.USER) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Return card data (excluding sensitive information like PAN and CVV)
    const safeCard = {
      id: card.id,
      moonCardId: card.moonCardId,
      balance: Number(card.balance),
      availableBalance: Number(card.availableBalance),
      expiration: card.expiration,
      displayExpiration: card.displayExpiration,
      cardProductId: card.cardProductId,
      terminated: card.terminated,
      frozen: card.frozen,
      isActive: card.isActive,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      profile: {
        id: card.profile.id,
        firstName: card.profile.firstName,
        lastName: card.profile.lastName,
        email: card.profile.email,
      },
    };

    return NextResponse.json({ card: safeCard });
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/cards/[cardId] - Update a card (freeze/unfreeze, activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update cards
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (
      !userProfile ||
      (userProfile.role !== UserRole.ADMIN &&
        userProfile.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { frozen, isActive } = body;

    // Check if card exists and belongs to a USER profile
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        profile: {
          select: { role: true },
        },
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (existingCard.profile.role !== UserRole.USER) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Update card
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(typeof frozen === "boolean" && { frozen }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create event for card update
    await prisma.event.create({
      data: {
        type: "USER_CARD_CREATED", // We could create a new event type for updates
        module: "PROFILE",
        description: "Card status updated",
        profileId: updatedCard.profileId,
        metadata: {
          cardId: updatedCard.id,
          changes: { frozen, isActive },
        },
      },
    });

    // Return updated card data (excluding sensitive information)
    const safeCard = {
      id: updatedCard.id,
      moonCardId: updatedCard.moonCardId,
      balance: Number(updatedCard.balance),
      availableBalance: Number(updatedCard.availableBalance),
      displayExpiration: updatedCard.displayExpiration,
      terminated: updatedCard.terminated,
      frozen: updatedCard.frozen,
      isActive: updatedCard.isActive,
      createdAt: updatedCard.createdAt,
      updatedAt: updatedCard.updatedAt,
      profile: updatedCard.profile,
    };

    return NextResponse.json({ card: safeCard });
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/[cardId] - Soft delete a card (set isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to delete cards
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (
      !userProfile ||
      (userProfile.role !== UserRole.ADMIN &&
        userProfile.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if card exists and belongs to a USER profile
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        profile: {
          select: { role: true },
        },
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (existingCard.profile.role !== UserRole.USER) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.card.update({
      where: { id: cardId },
      data: { isActive: false },
    });

    // Note: In a real implementation, you might also need to call PayWithMoon API
    // to terminate the card on their end

    return NextResponse.json({ message: "Card deactivated successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
