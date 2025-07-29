import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { EventType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with role
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !profile ||
      (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const hasCards = searchParams.get("hasCards") || "all";
    const cardStatus = searchParams.get("cardStatus");

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      role: "USER", // Only get USER profiles
    };

    // Search filter
    if (search) {
      whereConditions.OR = [
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Cards filter
    if (hasCards === "with-cards") {
      whereConditions.cards = {
        some: {},
      };
    } else if (hasCards === "without-cards") {
      whereConditions.cards = {
        none: {},
      };
    }

    // Card status filter (only for SUPERADMINs)
    if (profile.role === "SUPERADMIN" && cardStatus && cardStatus !== "all") {
      const statusConditions: Record<string, unknown> = {};

      switch (cardStatus) {
        case "active":
          statusConditions.AND = [
            { isActive: true },
            { terminated: false },
            { frozen: false },
          ];
          break;
        case "frozen":
          statusConditions.frozen = true;
          break;
        case "terminated":
          statusConditions.terminated = true;
          break;
        case "inactive":
          statusConditions.AND = [{ isActive: false }, { terminated: false }];
          break;
      }

      if (Object.keys(statusConditions).length > 0) {
        whereConditions.cards = {
          some: statusConditions,
        };
      }
    }

    // Get users with different data based on role
    const users = await prisma.profile.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        cards:
          profile.role === "SUPERADMIN"
            ? {
                select: {
                  id: true,
                  balance: true,
                  availableBalance: true,
                  isActive: true,
                  terminated: true,
                  frozen: true,
                  createdAt: true,
                },
              }
            : {
                select: {
                  id: true,
                  isActive: true,
                  terminated: true,
                  frozen: true,
                  createdAt: true,
                  // Exclude sensitive financial data for ADMINs
                },
              },
      },
    });

    // Get total count
    const total = await prisma.profile.count({
      where: whereConditions,
    });

    // Transform data based on role
    const transformedUsers = users.map((user) => ({
      id: user.id,
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      cards:
        profile.role === "SUPERADMIN"
          ? user.cards.map((card) => ({
              id: card.id,
              balance: 'balance' in card ? card.balance : 0,
              availableBalance: 'availableBalance' in card ? card.availableBalance : 0,
              isActive: card.isActive,
              terminated: card.terminated,
              frozen: card.frozen,
              createdAt: card.createdAt,
            }))
          : user.cards.map((card) => ({
              id: card.id,
              balance: 0, // Hidden for ADMINs
              availableBalance: 0, // Hidden for ADMINs
              isActive: card.isActive,
              terminated: card.terminated,
              frozen: card.frozen,
              createdAt: card.createdAt,
            })),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching users with cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with role
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    // Only SUPERADMINs can create cards
    if (!profile || profile.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { profileId, amount = 100 } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Verify the profile exists and is a USER
    const targetProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        kycProfile: true,
      },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (targetProfile.role !== "USER") {
      return NextResponse.json(
        { error: "Cards can only be created for USER profiles" },
        { status: 400 }
      );
    }

    // Check KYC status
    if (
      !targetProfile.kycProfile ||
      targetProfile.kycProfile.kycStatus !== "active"
    ) {
      return NextResponse.json(
        { error: "User must have approved KYC to create cards" },
        { status: 400 }
      );
    }

    // Simulate PayWithMoon API call
    const mockMoonResponse = {
      cardId: `moon_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      balance: amount,
      availableBalance: amount,
      expiration: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years from now
      displayExpiration: new Date(
        Date.now() + 3 * 365 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" }),
      cardProductId: "moon_virtual_card_v1",
      pan: "4111111111111111", // Mock PAN (should be encrypted)
      cvv: "123", // Mock CVV (should be encrypted)
      supportToken: `support_${Date.now()}`,
    };

    // Create card in database
    const card = await prisma.card.create({
      data: {
        profileId: targetProfile.id,
        moonCardId: mockMoonResponse.cardId,
        balance: mockMoonResponse.balance,
        availableBalance: mockMoonResponse.availableBalance,
        expiration: mockMoonResponse.expiration,
        displayExpiration: mockMoonResponse.displayExpiration,
        cardProductId: mockMoonResponse.cardProductId,
        pan: mockMoonResponse.pan, // In production, encrypt this
        cvv: mockMoonResponse.cvv, // In production, encrypt this
        supportToken: mockMoonResponse.supportToken,
      },
    });

    // Create event
    await prisma.event.create({
      data: {
        profileId: targetProfile.id,
        type: EventType.USER_CARD_CREATED,
        module: "PROFILE",
        description: `Card created with PayWithMoon ID: ${mockMoonResponse.cardId}`,
        metadata: {
          cardId: card.id,
          moonCardId: mockMoonResponse.cardId,
          initialBalance: amount,
        },
      },
    });

    return NextResponse.json({
      message: "Card created successfully",
      card: {
        id: card.id,
        moonCardId: card.moonCardId,
        balance: card.balance,
        availableBalance: card.availableBalance,
        displayExpiration: card.displayExpiration,
        isActive: card.isActive,
        createdAt: card.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
