import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { EventType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // Only SUPERADMINs can access individual user card details
    if (!profile || profile.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden. Only superadministrators can view detailed card information.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Find the target user
    const targetUser = await prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role !== "USER") {
      return NextResponse.json(
        {
          error: "Cards can only be viewed for USER profiles",
        },
        { status: 400 }
      );
    }

    // Build where conditions for cards
    const whereConditions: any = {
      profileId: targetUser.id,
    };

    // Status filter
    if (status && status !== "all") {
      switch (status) {
        case "active":
          whereConditions.AND = [
            { isActive: true },
            { terminated: false },
            { frozen: false },
          ];
          break;
        case "frozen":
          whereConditions.frozen = true;
          break;
        case "terminated":
          whereConditions.terminated = true;
          break;
        case "inactive":
          whereConditions.AND = [{ isActive: false }, { terminated: false }];
          break;
      }
    }

    // Search filter (search in moonCardId)
    if (search) {
      whereConditions.moonCardId = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Get cards for this user
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where: whereConditions,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          moonCardId: true,
          balance: true,
          availableBalance: true,
          expiration: true,
          displayExpiration: true,
          cardProductId: true,
          terminated: true,
          frozen: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.card.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      user: {
        id: targetUser.id,
        userId: targetUser.userId,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        createdAt: targetUser.createdAt,
      },
      cards: cards.map((card) => ({
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
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
      return NextResponse.json(
        {
          error: "Forbidden. Only superadministrators can create cards.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount = 100 } = body;

    // Find the target user profile
    const targetProfile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        kycProfile: true,
      },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      targetProfile.kycProfile.kycStatus !== "approved"
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
        balance: Number(card.balance),
        availableBalance: Number(card.availableBalance),
        displayExpiration: card.displayExpiration,
        isActive: card.isActive,
        createdAt: card.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating card for user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
