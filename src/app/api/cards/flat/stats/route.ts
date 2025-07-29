import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Flat Cards Stats API - Starting request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log(
        "❌ Flat Cards Stats API - Authentication failed:",
        sessionError
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "✅ Flat Cards Stats API - Session found for user:",
      session.user.id
    );

    // Get user profile and check permissions
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile || !["ADMIN", "SUPERADMIN"].includes(profile.role)) {
      console.log(
        "❌ Flat Cards Stats API - Insufficient permissions, role:",
        profile?.role
      );
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Flat Cards Stats API - User has required permissions");

    const { searchParams } = new URL(request.url);

    // Date range filters for stats
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("📅 Flat Cards Stats API - Date filters:", {
      startDate,
      endDate,
    });

    // Build date filter
    const dateFilter: Record<string, Record<string, Date>> = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    console.log("🔍 Flat Cards Stats API - About to query database...");

    // Get basic card counts and stats
    const [totalCards, activeCards, terminatedCards, frozenCards, recentCards] =
      await Promise.all([
        // Total card count
        prisma.card.count({ where: dateFilter }),

        // Active cards
        prisma.card.count({
          where: {
            ...dateFilter,
            isActive: true,
            terminated: false,
          },
        }),

        // Terminated cards
        prisma.card.count({
          where: {
            ...dateFilter,
            terminated: true,
          },
        }),

        // Frozen cards
        prisma.card.count({
          where: {
            ...dateFilter,
            frozen: true,
          },
        }),

        // Recent cards (last 24 hours)
        prisma.card.count({
          where: {
            ...dateFilter,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    console.log("✅ Flat Cards Stats API - Basic counts completed:", {
      totalCards,
      activeCards,
      terminatedCards,
      frozenCards,
      recentCards,
    });

    if (totalCards === 0) {
      console.log("⚠️ No cards found in database");
      return NextResponse.json({
        totalCards: 0,
        activeCards: 0,
        terminatedCards: 0,
        frozenCards: 0,
        recentCards: 0,
        totalBalance: "0.00",
        totalAvailableBalance: "0.00",
        uniqueUsers: 0,
        balanceBreakdown: [],
      });
    }

    // Calculate balance information
    console.log("🔍 Calculating balance information...");
    const balanceData = await prisma.card.aggregate({
      where: dateFilter,
      _sum: {
        balance: true,
        availableBalance: true,
      },
    });

    // Get unique users count
    const uniqueUsers = await prisma.card.findMany({
      where: dateFilter,
      select: { profileId: true },
      distinct: ["profileId"],
    });

    console.log("✅ Balance and user calculations completed");

    const stats = {
      totalCards,
      activeCards,
      terminatedCards,
      frozenCards,
      recentCards,
      totalBalance: balanceData._sum.balance?.toFixed(2) || "0.00",
      totalAvailableBalance:
        balanceData._sum.availableBalance?.toFixed(2) || "0.00",
      uniqueUsers: uniqueUsers.length,

      // Balance breakdown (simplified for now)
      balanceBreakdown: [
        {
          status: "Active",
          count: activeCards,
          percentage:
            totalCards > 0
              ? ((activeCards / totalCards) * 100).toFixed(1)
              : "0",
        },
        {
          status: "Terminated",
          count: terminatedCards,
          percentage:
            totalCards > 0
              ? ((terminatedCards / totalCards) * 100).toFixed(1)
              : "0",
        },
        {
          status: "Frozen",
          count: frozenCards,
          percentage:
            totalCards > 0
              ? ((frozenCards / totalCards) * 100).toFixed(1)
              : "0",
        },
      ],
    };

    console.log("✅ Flat Cards Stats API - Successfully returning stats");
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error fetching flat cards stats:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
