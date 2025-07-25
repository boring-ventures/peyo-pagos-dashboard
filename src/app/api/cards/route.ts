import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { CardsResponse, PayWithMoonCardResponse } from "@/types/card";
import { UserRole } from "@prisma/client";

// GET /api/cards - List all cards with pagination and filtering
export async function GET(request: NextRequest) {
  try {
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

    // Build where clause
    const where: Record<string, unknown> = {
      profile: {
        role: UserRole.USER, // Only show cards for USER profiles
      },
    };

    if (status) {
      switch (status) {
        case "active":
          where.isActive = true;
          where.terminated = false;
          where.frozen = false;
          break;
        case "terminated":
          where.terminated = true;
          break;
        case "frozen":
          where.frozen = true;
          break;
        case "inactive":
          where.isActive = false;
          break;
      }
    }

    if (search) {
      where.OR = [
        { moonCardId: { contains: search, mode: "insensitive" } },
        { cardProductId: { contains: search, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Get cards with profile information
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    // Transform cards for frontend (excluding sensitive data)
    const transformedCards = cards.map((card) => ({
      id: card.id,
      moonCardId: card.moonCardId,
      balance: Number(card.balance),
      availableBalance: Number(card.availableBalance),
      displayExpiration: card.displayExpiration,
      terminated: card.terminated,
      frozen: card.frozen,
      isActive: card.isActive,
      createdAt: card.createdAt,
      profile: card.profile,
    }));

    const response: CardsResponse = {
      cards: transformedCards,
      total,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cards - Create a new card via PayWithMoon
export async function POST(request: NextRequest) {
  try {
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
    const { profileId, amount = 100 } = body;

    // Validate that the profile exists and is a USER
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { kycProfile: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.role !== UserRole.USER) {
      return NextResponse.json(
        { error: "Cards can only be created for USER profiles" },
        { status: 400 }
      );
    }

    if (!profile.kycProfile?.bridgeCustomerId) {
      return NextResponse.json(
        { error: "Profile must have approved KYC to create cards" },
        { status: 400 }
      );
    }

    // TODO: Call PayWithMoon API when available
    // For now, we simulate the response structure
    const moonResponse: PayWithMoonCardResponse = {
      card: {
        id: `moon_card_${Date.now()}`, // This would come from PayWithMoon
        balance: amount,
        available_balance: amount,
        expiration: new Date(
          Date.now() + 4 * 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 4 years from now
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
        profileId: profile.id,
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

    // Create event for card creation
    await prisma.event.create({
      data: {
        type: "USER_CARD_CREATED",
        module: "PROFILE",
        description: "User card created via PayWithMoon",
        profileId: profile.id,
        metadata: {
          cardId: card.id,
          moonCardId: card.moonCardId,
          amount: amount,
        },
      },
    });

    // Return card data (excluding sensitive information)
    const responseCard = {
      id: card.id,
      moonCardId: card.moonCardId,
      balance: Number(card.balance),
      availableBalance: Number(card.availableBalance),
      displayExpiration: card.displayExpiration,
      terminated: card.terminated,
      frozen: card.frozen,
      isActive: card.isActive,
      createdAt: card.createdAt,
      profile: card.profile,
    };

    return NextResponse.json({ card: responseCard }, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
