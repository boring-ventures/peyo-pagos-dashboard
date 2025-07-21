import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  WalletApiResponse,
  UserWithWallets,
  BridgeWalletResponse,
  Wallet,
  WalletSyncResponse,
} from "@/types/wallet";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Helper function to fetch wallet count from Bridge API (legacy support)
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

// Helper function to fetch wallet counts for multiple users (legacy support)
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

// Helper function to determine wallet tag based on Bridge tags
function determineWalletTag(bridgeTags: string[]): "general_use" | "p2p" {
  const p2pKeywords = ["p2p", "peer", "trading", "exchange"];
  const hasP2pTag = bridgeTags.some((tag) =>
    p2pKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
  );

  return hasP2pTag ? "p2p" : "general_use";
}

// Helper function to sync wallets from Bridge API for a user
async function syncWalletsForUser(profile: any): Promise<Wallet[]> {
  const kycProfile = profile.kycProfile;
  if (!kycProfile?.bridgeCustomerId || !bridgeApiKey) {
    return [];
  }

  try {
    console.log(
      `🔄 Auto-syncing wallets for ${profile.firstName} (${kycProfile.bridgeCustomerId})`
    );

    const response = await fetch(
      `${bridgeApiUrl}/customers/${kycProfile.bridgeCustomerId}/wallets`,
      {
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `Bridge API error for customer ${kycProfile.bridgeCustomerId}: ${response.status}`
      );
      return [];
    }

    const bridgeData: BridgeWalletResponse = await response.json();
    console.log(
      `📊 Found ${bridgeData.count} wallets in Bridge for ${profile.firstName}`
    );

    // Filter for supported chains only
    const supportedWallets = bridgeData.data.filter(
      (wallet) => wallet.chain === "solana" || wallet.chain === "base"
    );

    const createdWallets: Wallet[] = [];

    // Sync each wallet to our database
    for (const bridgeWallet of supportedWallets) {
      const walletTag = determineWalletTag(bridgeWallet.tags);

      const walletData = {
        profileId: profile.id,
        walletTag,
        bridgeWalletId: bridgeWallet.id,
        chain: bridgeWallet.chain as "solana" | "base",
        address: bridgeWallet.address,
        bridgeTags: bridgeWallet.tags,
        bridgeCreatedAt: new Date(bridgeWallet.created_at),
        bridgeUpdatedAt: new Date(bridgeWallet.updated_at),
        isActive: true,
      };

      // Check if wallet already exists
      const existingWallet = await prisma.wallet.findUnique({
        where: { bridgeWalletId: bridgeWallet.id },
      });

      if (!existingWallet) {
        const wallet = await prisma.wallet.create({
          data: walletData,
        });
        createdWallets.push(wallet as Wallet);
        console.log(
          `✨ Created wallet: ${bridgeWallet.id} (${bridgeWallet.chain})`
        );
      }
    }

    console.log(
      `✅ Auto-sync completed for ${profile.firstName}: ${createdWallets.length} new wallets`
    );
    return createdWallets;
  } catch (error) {
    console.error(
      `❌ Error auto-syncing wallets for ${profile.firstName}:`,
      error
    );
    return [];
  }
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
    const walletTag = searchParams.get("walletTag");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const includeCounts = searchParams.get("includeCounts") === "true";
    const includeWallets = searchParams.get("includeWallets") === "true";

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

    // Filter by wallet existence
    if (hasWallets === "true") {
      whereClause.wallets = {
        some: {
          isActive: true,
        },
      };
    } else if (hasWallets === "false") {
      whereClause.wallets = {
        none: {},
      };
    }

    // Filter by chain
    if (chain && chain !== "all") {
      whereClause.wallets = {
        some: {
          chain: chain as "solana" | "base",
          isActive: true,
        },
      };
    }

    // Filter by wallet tag
    if (walletTag && walletTag !== "all") {
      whereClause.wallets = {
        some: {
          walletTag: walletTag as "general_use" | "p2p",
          isActive: true,
        },
      };
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
      walletTag,
      search,
      sortBy,
      sortOrder,
      includeCounts,
      includeWallets,
    });

    // Prepare include clause
    const includeClause: Prisma.ProfileInclude = {};

    if (includeWallets) {
      includeClause.wallets = {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      };
      // Also include KYC profile for Bridge sync
      includeClause.kycProfile = {
        select: {
          bridgeCustomerId: true,
        },
      };
    }

    // Fetch profiles from the database
    const [profiles, totalCount] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        include: includeClause,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.profile.count({ where: whereClause }),
    ]);

    console.log("📋 Wallets API - Found profiles:", profiles.length);
    console.log("📊 Wallets API - Total count:", totalCount);

    // Auto-sync wallets from Bridge API for users that have no wallets but have Bridge customer ID
    if (includeWallets && bridgeApiKey) {
      console.log("🔄 Checking for users needing wallet sync...");
      
      const usersNeedingSync = profiles.filter(profile => 
        (!profile.wallets || profile.wallets.length === 0) && 
        profile.kycProfile?.bridgeCustomerId
      );

      if (usersNeedingSync.length > 0) {
        console.log(`🔄 Auto-syncing wallets for ${usersNeedingSync.length} users...`);
        
        // Sync wallets for each user that needs it
        for (const profile of usersNeedingSync) {
          await syncWalletsForUser(profile);
        }

        // Re-fetch profiles with wallets after sync
        console.log("🔄 Re-fetching profiles with newly synced wallets...");
        const [updatedProfiles] = await Promise.all([
          prisma.profile.findMany({
            where: whereClause,
            include: includeClause,
            orderBy,
            skip,
            take: limit,
          }),
        ]);
        
        // Update the profiles array with newly synced data
        profiles.splice(0, profiles.length, ...updatedProfiles);
        console.log("✅ Profiles updated with synced wallet data");
      }
    }

    // Debug: Log the first profile to see if wallets are included
    if (profiles.length > 0) {
      console.log("🐛 Debug - First profile after sync:", {
        id: profiles[0].id,
        firstName: profiles[0].firstName,
        hasWalletsProperty: "wallets" in profiles[0],
        walletsCount: profiles[0].wallets?.length || 0,
        hasKycProfile: !!profiles[0].kycProfile,
        bridgeCustomerId: profiles[0].kycProfile?.bridgeCustomerId,
      });
    }

    // Convert profiles to UserWithWallets format
    let users: UserWithWallets[] = profiles.map((profile) => {
      const user: UserWithWallets = {
        id: profile.id,
        userId: profile.userId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        status: profile.status,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      // Add wallets if included
      if (includeWallets && "wallets" in profile) {
        user.wallets = profile.wallets as Wallet[];
        user.walletsCount = profile.wallets?.length || 0;
        console.log(
          `🐛 Debug - User ${profile.firstName} has ${user.walletsCount} wallets`
        );
      } else if (includeWallets) {
        console.log(
          `🐛 Debug - User ${profile.firstName} - wallets property missing or includeWallets false`
        );
        console.log(
          `🐛 Debug - includeWallets: ${includeWallets}, hasWalletsProperty: ${"wallets" in profile}`
        );
      }

      return user;
    });

    // Optionally fetch wallet counts from Bridge API (for legacy support)
    if (includeCounts && !includeWallets) {
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
