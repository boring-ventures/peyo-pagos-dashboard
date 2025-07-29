import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { CostEntry } from "@/types/analytics";
import { COSTS } from "@/types/analytics";

// GET: Fetch individual cost entries for the table
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Cost Entries API - Starting request");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type"); // 'kyc' | 'wallet'
    const userId = searchParams.get("userId");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Cost Entries API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Cost Entries API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Build date filter
    const dateFilter: Record<string, { gte?: Date; lte?: Date }> = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDateObj;
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch cost entries based on type
    const costEntries: CostEntry[] = [];

    // Fetch KYC costs if type is 'kyc' or not specified
    if (!type || type === "kyc") {
      const kycProfiles = await prisma.kYCProfile.findMany({
        where: {
          kycSubmittedAt: { not: null },
          ...dateFilter,
          ...(userId && {
            profile: { userId },
          }),
        },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { kycSubmittedAt: "desc" },
        skip: type === "kyc" ? skip : 0,
        take: type === "kyc" ? limit : undefined,
      });

      kycProfiles.forEach((kycProfile) => {
        if (kycProfile.kycSubmittedAt) {
          costEntries.push({
            id: `kyc-${kycProfile.id}`,
            type: "kyc",
            userId: kycProfile.profile.userId,
            userEmail: kycProfile.profile.email || "",
            userName: `${kycProfile.profile.firstName || ""} ${
              kycProfile.profile.lastName || ""
            }`.trim(),
            profileId: kycProfile.profile.id,
            description: `KYC verification for ${kycProfile.profile.email}`,
            amount: COSTS.KYC_COST_USD,
            currency: "USD",
            createdAt: kycProfile.kycSubmittedAt.toISOString(),
            metadata: {
              kycStatus: kycProfile.kycStatus,
              bridgeCustomerId: kycProfile.bridgeCustomerId || undefined,
            },
          });
        }
      });
    }

    // Fetch Wallet costs if type is 'wallet' or not specified
    if (!type || type === "wallet") {
      const wallets = await prisma.wallet.findMany({
        where: {
          ...dateFilter,
          ...(userId && {
            profile: { userId },
          }),
        },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: type === "wallet" ? skip : 0,
        take: type === "wallet" ? limit : undefined,
      });

      wallets.forEach((wallet) => {
        costEntries.push({
          id: `wallet-${wallet.id}`,
          type: "wallet",
          userId: wallet.profile.userId,
          userEmail: wallet.profile.email || "",
          userName: `${wallet.profile.firstName || ""} ${
            wallet.profile.lastName || ""
          }`.trim(),
          profileId: wallet.profile.id,
          description: `${wallet.chain} wallet creation for ${wallet.profile.email}`,
          amount: COSTS.WALLET_COST_USD,
          currency: "USD",
          createdAt: wallet.createdAt.toISOString(),
          metadata: {
            walletChain: wallet.chain,
            walletAddress: wallet.address,
            bridgeWalletId: wallet.bridgeWalletId,
          },
        });
      });
    }

    // Sort by creation date (newest first) and apply pagination if mixed type
    costEntries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!type) {
      costEntries.splice(0, skip);
      costEntries.splice(limit);
    }

    // Get total count for pagination
    let totalCount = 0;
    if (!type) {
      const [kycCount, walletCount] = await Promise.all([
        prisma.kYCProfile.count({
          where: {
            kycSubmittedAt: { not: null },
            ...dateFilter,
            ...(userId && { profile: { userId } }),
          },
        }),
        prisma.wallet.count({
          where: {
            ...dateFilter,
            ...(userId && { profile: { userId } }),
          },
        }),
      ]);
      totalCount = kycCount + walletCount;
    } else if (type === "kyc") {
      totalCount = await prisma.kYCProfile.count({
        where: {
          kycSubmittedAt: { not: null },
          ...dateFilter,
          ...(userId && { profile: { userId } }),
        },
      });
    } else if (type === "wallet") {
      totalCount = await prisma.wallet.count({
        where: {
          ...dateFilter,
          ...(userId && { profile: { userId } }),
        },
      });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      costEntries,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    };

    console.log(
      `✅ Cost Entries API - Returning ${costEntries.length} entries`
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Cost Entries API - Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}