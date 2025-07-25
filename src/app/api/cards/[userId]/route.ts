import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { UserCardsResponse, CardSummary } from "@/types/card";

// GET /api/cards/[userId] - Get cards for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // First, find the user profile to make sure it exists and is a USER
    const targetProfile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetProfile.role !== UserRole.USER) {
      return NextResponse.json(
        { error: "Cards can only be viewed for USER profiles" },
        { status: 400 }
      );
    }

    // Build where clause for cards
    const cardWhere: Record<string, unknown> = {
      profileId: targetProfile.id,
    };

    if (status) {
      switch (status) {
        case "active":
          cardWhere.isActive = true;
          cardWhere.terminated = false;
          cardWhere.frozen = false;
          break;
        case "terminated":
          cardWhere.terminated = true;
          break;
        case "frozen":
          cardWhere.frozen = true;
          break;
        case "inactive":
          cardWhere.isActive = false;
          break;
      }
    }

    if (search) {
      cardWhere.OR = [
        { moonCardId: { contains: search, mode: "insensitive" } },
        { cardProductId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get cards for this user
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where: cardWhere,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.card.count({ where: cardWhere }),
    ]);

    // Transform cards for response (excluding sensitive data)
    const transformedCards: CardSummary[] = cards.map((card) => ({
      id: card.id,
      moonCardId: card.moonCardId,
      balance: Number(card.balance),
      availableBalance: Number(card.availableBalance),
      displayExpiration: card.displayExpiration,
      terminated: card.terminated,
      frozen: card.frozen,
      isActive: card.isActive,
      createdAt: card.createdAt,
    }));

    const response: UserCardsResponse = {
      cards: transformedCards,
      total,
      page,
      limit,
      user: {
        id: targetProfile.id,
        firstName: targetProfile.firstName,
        lastName: targetProfile.lastName,
        email: targetProfile.email,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cards/[userId] - Create a new card for a specific user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create cards
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
    const { amount = 100 } = body;

    // Find the target profile
    const targetProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { kycProfile: true },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetProfile.role !== UserRole.USER) {
      return NextResponse.json(
        { error: "Cards can only be created for USER profiles" },
        { status: 400 }
      );
    }

    if (!targetProfile.kycProfile?.bridgeCustomerId) {
      return NextResponse.json(
        { error: "User must have approved KYC to create cards" },
        { status: 400 }
      );
    }

    // TODO: Call PayWithMoon API when available
    // For now, we simulate the response structure
    const moonResponse = {
      card: {
        id: `moon_card_${Date.now()}`,
        balance: amount,
        available_balance: amount,
        expiration: new Date(
          Date.now() + 4 * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        display_expiration: "12/28",
        terminated: false,
        card_product_id: "default_product_id",
        pan: "4242424242424242",
        cvv: "123",
        support_token: "support_token_123",
        frozen: false,
      },
    };

    // Store card in database
    const card = await prisma.card.create({
      data: {
        profileId: targetProfile.id,
        moonCardId: moonResponse.card.id,
        balance: moonResponse.card.balance,
        availableBalance: moonResponse.card.available_balance,
        expiration: new Date(moonResponse.card.expiration),
        displayExpiration: moonResponse.card.display_expiration,
        cardProductId: moonResponse.card.card_product_id,
        pan: moonResponse.card.pan, // In production, this should be encrypted
        cvv: moonResponse.card.cvv, // In production, this should be encrypted
        supportToken: moonResponse.card.support_token,
        terminated: moonResponse.card.terminated,
        frozen: moonResponse.card.frozen,
      },
    });

    // Create event for card creation
    await prisma.event.create({
      data: {
        type: "USER_CARD_CREATED",
        module: "PROFILE",
        description: "User card created via PayWithMoon",
        profileId: targetProfile.id,
        metadata: {
          cardId: card.id,
          moonCardId: card.moonCardId,
          amount: amount,
        },
      },
    });

    // Return card data (excluding sensitive information)
    const responseCard: CardSummary = {
      id: card.id,
      moonCardId: card.moonCardId,
      balance: Number(card.balance),
      availableBalance: Number(card.availableBalance),
      displayExpiration: card.displayExpiration,
      terminated: card.terminated,
      frozen: card.frozen,
      isActive: card.isActive,
      createdAt: card.createdAt,
    };

    return NextResponse.json({ card: responseCard }, { status: 201 });
  } catch (error) {
    console.error("Error creating card for user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
