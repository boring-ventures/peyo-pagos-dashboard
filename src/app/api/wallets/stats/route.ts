import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { WalletStatsApiResponse } from "@/types/wallet";

// GET: Fetch wallet statistics (admin only)
export async function GET(req: NextRequest) {
  try {
    console.log("📊 Wallet Stats API - Starting request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Wallet Stats API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Wallet Stats API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Wallet Stats API - Fetching statistics from database");

    // Get current date for "today" calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch statistics from database
    const [
      totalWallets,
      totalUsersWithWallets,
      walletsByChain,
      walletsByTag,
      newWalletsToday,
      usersWithMultipleWallets,
    ] = await Promise.all([
      // Total active wallets
      prisma.wallet.count({
        where: { isActive: true },
      }),

      // Total users with at least one wallet
      prisma.profile.count({
        where: {
          role: "USER",
          wallets: {
            some: { isActive: true },
          },
        },
      }),

      // Wallets grouped by chain
      prisma.wallet.groupBy({
        by: ["chain"],
        where: { isActive: true },
        _count: { chain: true },
      }),

      // Wallets grouped by tag
      prisma.wallet.groupBy({
        by: ["walletTag"],
        where: { isActive: true },
        _count: { walletTag: true },
      }),

      // New wallets created today
      prisma.wallet.count({
        where: {
          isActive: true,
          createdAt: {
            gte: today,
          },
        },
      }),

      // Users with multiple wallets
      prisma.profile.count({
        where: {
          role: "USER",
          wallets: {
            some: { isActive: true },
          },
        },
      }),
    ]);

    // Transform chain data
    const walletsByChainMap: { [chain: string]: number } = {};
    walletsByChain.forEach((item) => {
      walletsByChainMap[item.chain] = item._count.chain;
    });

    // Transform tag data
    const walletsByTagMap = {
      general_use: 0,
      p2p: 0,
    };
    walletsByTag.forEach((item) => {
      walletsByTagMap[item.walletTag] = item._count.walletTag;
    });

    // Count active chains
    const activeChains = walletsByChain.length;

    // Get users with multiple wallets count
    const usersWithMultipleWalletsResult = await prisma.profile.findMany({
      where: {
        role: "USER",
      },
      include: {
        _count: {
          select: {
            wallets: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    const actualUsersWithMultipleWallets =
      usersWithMultipleWalletsResult.filter(
        (user) => user._count.wallets > 1
      ).length;

    const stats: WalletStatsApiResponse = {
      totalUsersWithWallets,
      totalWallets,
      walletsByChain: walletsByChainMap,
      walletsByTag: walletsByTagMap,
      recentActivity: {
        newWalletsToday,
        activeChains,
        usersWithMultipleWallets: actualUsersWithMultipleWallets,
      },
    };

    console.log("✅ Wallet Stats API - Statistics generated:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Wallet Stats API - Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
