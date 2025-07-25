import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { CardsStatsResponse } from "@/types/card";
import { UserRole } from "@prisma/client";

// GET /api/cards/stats - Get card statistics
export async function GET() {
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

    // Check if user has permission to view card stats
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

    // Get card and user statistics
    const [
      totalCards,
      activeCards,
      terminatedCards,
      frozenCards,
      balanceStats,
      totalUsers,
      usersWithCards,
    ] = await Promise.all([
      // Total cards for USER profiles
      prisma.card.count({
        where: {
          profile: { role: UserRole.USER },
        },
      }),
      // Active cards (not terminated, not frozen, and isActive = true)
      prisma.card.count({
        where: {
          profile: { role: UserRole.USER },
          isActive: true,
          terminated: false,
          frozen: false,
        },
      }),
      // Terminated cards
      prisma.card.count({
        where: {
          profile: { role: UserRole.USER },
          terminated: true,
        },
      }),
      // Frozen cards
      prisma.card.count({
        where: {
          profile: { role: UserRole.USER },
          frozen: true,
        },
      }),
      // Balance statistics
      prisma.card.aggregate({
        where: {
          profile: { role: UserRole.USER },
          isActive: true,
        },
        _sum: {
          balance: true,
          availableBalance: true,
        },
      }),
      // Total USER profiles
      prisma.profile.count({
        where: { role: UserRole.USER },
      }),
      // Users with at least one card
      prisma.profile.count({
        where: {
          role: UserRole.USER,
          cards: {
            some: {},
          },
        },
      }),
    ]);

    const response: CardsStatsResponse = {
      totalCards,
      activeCards,
      terminatedCards,
      frozenCards,
      totalBalance: Number(balanceStats._sum.balance || 0),
      totalAvailableBalance: Number(balanceStats._sum.availableBalance || 0),
      totalUsers,
      usersWithCards,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching card stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
