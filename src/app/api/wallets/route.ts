import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  WalletApiResponse,
  UserWithWallets,
  BridgeWalletResponse,
} from "@/types/wallet";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Helper function to fetch wallet count from Bridge API
async function fetchWalletCount(customerId: string): Promise<number> {
  if (!bridgeApiKey) {
    // Return simulated data if no API key
    return Math.floor(Math.random() * 5); // Random 0-4 wallets
  }

  try {
    const response = await fetch(
      `${bridgeApiUrl}/customers/${customerId}/wallets`,
      {
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `Bridge API error for customer ${customerId}: ${response.status}`
      );
      return 0;
    }

    const data: BridgeWalletResponse = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error(`Error fetching wallets for customer ${customerId}:`, error);
    return 0;
  }
}

// Helper function to fetch wallet counts for multiple users
async function fetchWalletCounts(
  userIds: string[]
): Promise<Record<string, number>> {
  const walletCounts: Record<string, number> = {};

  // Fetch wallet counts in parallel with rate limiting
  const batchSize = 5; // Process 5 at a time to avoid rate limits
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const promises = batch.map(async (userId) => {
      const count = await fetchWalletCount(userId);
      return { userId, count };
    });

    const results = await Promise.all(promises);
    results.forEach(({ userId, count }) => {
      walletCounts[userId] = count;
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return walletCounts;
}

// GET: Fetch all users with their wallet information (admin only)
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Wallets API - Starting request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Wallets API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("✅ Wallets API - Session found for user:", session.user.id);

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    console.log("👤 Wallets API - Current user profile:", currentUserProfile);

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Wallets API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const chain = searchParams.get("chain");
    const hasWallets = searchParams.get("hasWallets");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const includeCounts = searchParams.get("includeCounts") === "true";

    // Build the where clause for filtering profiles
    const whereClause: Prisma.ProfileWhereInput = {};

    // Only include USER role profiles (not SUPERADMIN)
    whereClause.role = "USER";

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build the orderBy clause with safety check
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "firstName",
      "lastName",
      "email",
    ];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const orderBy: Prisma.ProfileOrderByWithRelationInput = {
      [safeSortBy]: sortOrder as "asc" | "desc",
    };

    console.log("📊 Wallets API - Query parameters:", {
      page,
      limit,
      chain,
      hasWallets,
      search,
      sortBy,
      sortOrder,
      includeCounts,
    });

    // Fetch profiles from the database
    const [profiles, totalCount] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.profile.count({ where: whereClause }),
    ]);

    console.log("📋 Wallets API - Found profiles:", profiles.length);
    console.log("📊 Wallets API - Total count:", totalCount);

    // Convert profiles to UserWithWallets format
    let users: UserWithWallets[] = profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    // Optionally fetch wallet counts from Bridge API
    if (includeCounts) {
      console.log("🔄 Wallets API - Fetching wallet counts from Bridge API");
      const userIds = users.map((user) => user.userId);
      const walletCounts = await fetchWalletCounts(userIds);

      users = users.map((user) => ({
        ...user,
        walletsCount: walletCounts[user.userId] || 0,
      }));

      // Apply hasWallets filter after fetching counts
      if (hasWallets === "true") {
        users = users.filter((user) => (user.walletsCount || 0) > 0);
      } else if (hasWallets === "false") {
        users = users.filter((user) => (user.walletsCount || 0) === 0);
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response: WalletApiResponse = {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    };

    console.log("✅ Wallets API - Returning successful response");
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Wallets API - Detailed error:", error);
    console.error(
      "❌ Wallets API - Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
