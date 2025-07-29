import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Transaction Stats API - Starting request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log(
        "❌ Transaction Stats API - Authentication failed:",
        sessionError
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "✅ Transaction Stats API - Session found for user:",
      session.user.id
    );

    // Get user profile and check permissions
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile || !["ADMIN", "SUPERADMIN"].includes(profile.role)) {
      console.log(
        "❌ Transaction Stats API - Insufficient permissions, role:",
        profile?.role
      );
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Transaction Stats API - User has required permissions");

    const { searchParams } = new URL(request.url);

    // Date range filters for stats
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("📅 Transaction Stats API - Date filters:", {
      startDate,
      endDate,
    });

    // Build date filter
    const dateFilter: Record<string, Record<string, Date>> = {};
    if (startDate || endDate) {
      dateFilter.bridgeCreatedAt = {};
      if (startDate) {
        dateFilter.bridgeCreatedAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.bridgeCreatedAt.lte = new Date(endDate);
      }
    }

    console.log("🔍 Transaction Stats API - About to query database...");

    // First, just get basic counts to test database connectivity
    const totalTransactions = await prisma.transaction.count({
      where: dateFilter,
    });
    console.log("✅ Total transactions found:", totalTransactions);

    if (totalTransactions === 0) {
      console.log("⚠️ No transactions found in database");
      return NextResponse.json({
        totalTransactions: 0,
        recentTransactions: 0,
        totalVolume: "0.00",
        uniqueCustomers: 0,
        uniqueWallets: 0,
        currencyBreakdown: [],
        paymentRailBreakdown: [],
        volumeBreakdown: [],
        dailyStats: [],
      });
    }

    // Get basic transaction counts and stats
    console.log("🔍 Running parallel queries...");
    const [recentTransactions, currencyBreakdown, paymentRailBreakdown] =
      await Promise.all([
        // Recent transactions (last 24 hours)
        prisma.transaction.count({
          where: {
            ...dateFilter,
            bridgeCreatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Source currency breakdown
        prisma.transaction.groupBy({
          by: ["sourceCurrency"],
          where: dateFilter,
          _count: {
            sourceCurrency: true,
          },
          orderBy: {
            _count: {
              sourceCurrency: "desc",
            },
          },
          take: 10,
        }),

        // Payment rail breakdown
        prisma.transaction.groupBy({
          by: ["sourcePaymentRail"],
          where: dateFilter,
          _count: {
            sourcePaymentRail: true,
          },
          orderBy: {
            _count: {
              sourcePaymentRail: "desc",
            },
          },
          take: 10,
        }),
      ]);

    console.log("✅ Parallel queries completed:", {
      recentTransactions,
      currencyBreakdown: currencyBreakdown.length,
      paymentRailBreakdown: paymentRailBreakdown.length,
    });

    // Calculate total volume (simplified)
    console.log("🔍 Calculating volume breakdown...");
    const allTransactions = await prisma.transaction.findMany({
      where: dateFilter,
      select: {
        amount: true,
        sourceCurrency: true,
      },
    });

    console.log(
      "✅ Retrieved",
      allTransactions.length,
      "transactions for volume calculation"
    );

    // Calculate volume by currency
    const volumeBreakdown = allTransactions.reduce(
      (acc, transaction) => {
        const currency = transaction.sourceCurrency || "UNKNOWN";
        const amount = parseFloat(transaction.amount) || 0;

        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate total volume
    const totalVolume = Object.values(volumeBreakdown).reduce(
      (sum, vol) => sum + vol,
      0
    );

    console.log("✅ Volume calculation completed, total:", totalVolume);

    // Get unique customers and wallets count
    console.log("🔍 Getting unique counts...");
    const [uniqueCustomers, uniqueWallets] = await Promise.all([
      prisma.transaction.findMany({
        where: dateFilter,
        select: { customerId: true },
        distinct: ["customerId"],
      }),
      prisma.transaction.findMany({
        where: dateFilter,
        select: { walletId: true },
        distinct: ["walletId"],
      }),
    ]);

    console.log("✅ Unique counts completed:", {
      uniqueCustomers: uniqueCustomers.length,
      uniqueWallets: uniqueWallets.length,
    });

    const stats = {
      totalTransactions,
      recentTransactions,
      totalVolume: totalVolume.toFixed(2),
      uniqueCustomers: uniqueCustomers.length,
      uniqueWallets: uniqueWallets.length,

      // Breakdowns
      currencyBreakdown: currencyBreakdown.map((item) => ({
        currency: item.sourceCurrency || "UNKNOWN",
        count: item._count.sourceCurrency,
        volume:
          volumeBreakdown[item.sourceCurrency || "UNKNOWN"]?.toFixed(2) || "0",
      })),

      paymentRailBreakdown: paymentRailBreakdown.map((item) => ({
        paymentRail: item.sourcePaymentRail || "UNKNOWN",
        count: item._count.sourcePaymentRail,
      })),

      volumeBreakdown: Object.entries(volumeBreakdown).map(
        ([currency, volume]) => ({
          currency,
          volume: volume.toFixed(2),
        })
      ),

      // Daily stats for charts (placeholder for now)
      dailyStats: [],
    };

    console.log("✅ Transaction Stats API - Successfully returning stats");
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error fetching transaction stats:", error);
    console.error("Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
