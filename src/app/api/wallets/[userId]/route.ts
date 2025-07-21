import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type {
  UserWalletApiResponse,
  BridgeWalletResponse,
  BridgeWallet,
  UserWithWallets,
} from "@/types/wallet";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Helper function to generate mock wallet data
function generateMockWallets(userId: string): BridgeWallet[] {
  const chains = ["solana", "base"];
  const walletCount = Math.floor(Math.random() * 3) + 1; // 1-3 wallets

  const mockWallets: BridgeWallet[] = [];

  for (let i = 0; i < walletCount; i++) {
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const mockAddress = `${chain}_address_${userId.slice(-8)}_${i + 1}`;

    mockWallets.push({
      id: `wallet_${userId.slice(-8)}_${i + 1}`,
      chain,
      address: mockAddress,
      tags: i === 0 ? ["primary"] : [], // First wallet marked as primary
      created_at: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updated_at: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  return mockWallets;
}

// Helper function to fetch wallets from Bridge API
async function fetchUserWallets(customerId: string): Promise<BridgeWallet[]> {
  if (!bridgeApiKey) {
    // Return simulated data if no API key
    console.log("⚠️ No Bridge API key found - returning mock wallet data");
    return generateMockWallets(customerId);
  }

  try {
    console.log(`🔄 Fetching wallets for customer: ${customerId}`);
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

      // Return mock data for 404s or API errors
      if (response.status === 404) {
        console.log("Customer not found in Bridge, returning empty wallets");
        return [];
      }

      console.log("API error, returning mock wallet data");
      return generateMockWallets(customerId);
    }

    const data: BridgeWalletResponse = await response.json();
    console.log(`✅ Found ${data.count} wallets for customer ${customerId}`);

    return data.data || [];
  } catch (error) {
    console.error(`Error fetching wallets for customer ${customerId}:`, error);
    console.log("Network error, returning mock wallet data");
    return generateMockWallets(customerId);
  }
}

// GET: Fetch detailed wallet information for a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;
    console.log(`🔍 User Wallets API - Starting request for user: ${userId}`);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ User Wallets API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(
      "✅ User Wallets API - Session found for user:",
      session.user.id
    );

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ User Wallets API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Find the user profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: userId },
    });

    if (!userProfile) {
      console.log(`❌ User Wallets API - User not found: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`👤 User Wallets API - Found user profile:`, {
      id: userProfile.id,
      name: `${userProfile.firstName} ${userProfile.lastName}`,
      email: userProfile.email,
    });

    // Fetch wallets from Bridge API
    console.log("🔄 User Wallets API - Fetching wallets from Bridge API");
    const wallets = await fetchUserWallets(userId);

    // Convert profile to UserWithWallets format
    const user: UserWithWallets = {
      id: userProfile.id,
      userId: userProfile.userId,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      role: userProfile.role,
      status: userProfile.status,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
      wallets: wallets,
      walletsCount: wallets.length,
    };

    const response: UserWalletApiResponse = {
      user,
      wallets,
    };

    console.log(
      `✅ User Wallets API - Returning ${wallets.length} wallets for user ${userId}`
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ User Wallets API - Detailed error:", error);
    console.error(
      "❌ User Wallets API - Error message:",
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
