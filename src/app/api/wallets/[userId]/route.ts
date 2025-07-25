import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type {
  UserWalletApiResponse,
  UserWithWallets,
  Wallet,
  LiquidationAddress,
  BridgeLiquidationAddressesResponse,
  BridgeLiquidationAddress,
  LiquidationAddressSyncResponse,
} from "@/types/wallet";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Helper function to fetch liquidation addresses from Bridge API
async function fetchLiquidationAddressesFromBridge(
  bridgeCustomerId: string
): Promise<BridgeLiquidationAddressesResponse> {
  if (!bridgeApiKey) {
    // Return empty data for development
    console.log(
      "No Bridge API key found, skipping liquidation addresses fetch"
    );
    return {
      count: 0,
      data: [],
    };
  }

  try {
    const response = await fetch(
      `${bridgeApiUrl}/customers/${bridgeCustomerId}/liquidation_addresses`,
      {
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `Bridge API liquidation addresses error: ${response.status} ${response.statusText}`
      );
      return {
        count: 0,
        data: [],
      };
    }

    const data: BridgeLiquidationAddressesResponse = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Error fetching liquidation addresses for customer ${bridgeCustomerId}:`,
      error
    );
    return {
      count: 0,
      data: [],
    };
  }
}

// Helper function to transform Bridge liquidation address to internal format
function transformBridgeLiquidationAddress(
  bridgeAddress: BridgeLiquidationAddress,
  profileId: string
): {
  bridgeLiquidationId: string;
  profileId: string;
  customerId: string;
  chain: string;
  address: string;
  currency: string;
  destinationPaymentRail: string;
  destinationCurrency: string;
  destinationAddress: string;
  state: string;
  bridgeCreatedAt: Date;
  bridgeUpdatedAt: Date;
} {
  return {
    bridgeLiquidationId: bridgeAddress.id,
    profileId,
    customerId: bridgeAddress.customer_id,
    chain: bridgeAddress.chain,
    address: bridgeAddress.address,
    currency: bridgeAddress.currency,
    destinationPaymentRail: bridgeAddress.destination_payment_rail,
    destinationCurrency: bridgeAddress.destination_currency,
    destinationAddress: bridgeAddress.destination_address,
    state: bridgeAddress.state,
    bridgeCreatedAt: new Date(bridgeAddress.created_at),
    bridgeUpdatedAt: new Date(bridgeAddress.updated_at),
  };
}

// GET: Fetch detailed wallet information for a specific user from database
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

    if (
      !currentUserProfile ||
      (currentUserProfile.role !== "ADMIN" &&
        currentUserProfile.role !== "SUPERADMIN")
    ) {
      console.log(
        "❌ User Wallets API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Find the user profile with wallets, liquidation addresses, and KYC info
    const userProfile = await prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        wallets: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        liquidationAddresses: {
          orderBy: { createdAt: "desc" },
        },
        kycProfile: {
          select: {
            bridgeCustomerId: true,
          },
        },
      },
    });

    if (!userProfile) {
      console.log(`❌ User Wallets API - User not found: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`👤 User Wallets API - Found user profile:`, {
      id: userProfile.id,
      name: `${userProfile.firstName} ${userProfile.lastName}`,
      email: userProfile.email,
      walletsCount: userProfile.wallets.length,
      liquidationAddressesCount: userProfile.liquidationAddresses.length,
    });

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
      wallets: userProfile.wallets as Wallet[],
      walletsCount: userProfile.wallets.length,
      liquidationAddresses:
        userProfile.liquidationAddresses as LiquidationAddress[],
      liquidationAddressesCount: userProfile.liquidationAddresses.length,
      kycProfile: userProfile.kycProfile || undefined,
    };

    const response: UserWalletApiResponse = {
      user,
      wallets: userProfile.wallets as Wallet[],
    };

    console.log(
      `✅ User Wallets API - Returning ${userProfile.wallets.length} wallets and ${userProfile.liquidationAddresses.length} liquidation addresses for user ${userId}`
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

// POST: Sync liquidation addresses for a specific user from Bridge API
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;
    console.log(`🔄 Liquidation Sync API - Starting sync for user: ${userId}`);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Liquidation Sync API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !currentUserProfile ||
      (currentUserProfile.role !== "ADMIN" &&
        currentUserProfile.role !== "SUPERADMIN")
    ) {
      console.log(
        "❌ Liquidation Sync API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Find the user profile with KYC info
    const userProfile = await prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        kycProfile: {
          select: {
            bridgeCustomerId: true,
          },
        },
      },
    });

    if (!userProfile) {
      console.log(`❌ Liquidation Sync API - User not found: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userProfile.kycProfile?.bridgeCustomerId) {
      console.log(`❌ Liquidation Sync API - No Bridge customer ID found for user: ${userId}`);
      return NextResponse.json(
        { error: "No Bridge customer ID found for this user" },
        { status: 400 }
      );
    }

    const bridgeCustomerId = userProfile.kycProfile.bridgeCustomerId;
    console.log(`🔍 Liquidation Sync API - Fetching addresses for customer: ${bridgeCustomerId}`);

    // Fetch liquidation addresses from Bridge API
    const bridgeResponse = await fetchLiquidationAddressesFromBridge(bridgeCustomerId);
    console.log(`📝 Liquidation Sync API - Bridge returned ${bridgeResponse.count} addresses`);

    let newAddresses = 0;
    let updatedAddresses = 0;

    // Process each liquidation address
    for (const bridgeAddress of bridgeResponse.data) {
      const addressData = transformBridgeLiquidationAddress(
        bridgeAddress,
        userProfile.id
      );

      // Check if address already exists
      const existingAddress = await prisma.liquidationAddress.findUnique({
        where: { bridgeLiquidationId: bridgeAddress.id },
      });

      if (existingAddress) {
        // Update existing address
        await prisma.liquidationAddress.update({
          where: { bridgeLiquidationId: bridgeAddress.id },
          data: {
            state: addressData.state,
            bridgeUpdatedAt: addressData.bridgeUpdatedAt,
          },
        });
        updatedAddresses++;
      } else {
        // Create new address
        await prisma.liquidationAddress.create({
          data: addressData,
        });
        newAddresses++;
      }
    }

    // Get total count after sync
    const totalAddresses = await prisma.liquidationAddress.count({
      where: { profileId: userProfile.id },
    });

    const response: LiquidationAddressSyncResponse = {
      success: true,
      syncedCount: bridgeResponse.count,
      newAddresses,
      updatedAddresses,
      totalAddresses,
      lastSyncAt: new Date(),
      message: `Successfully synced ${newAddresses} new and ${updatedAddresses} updated liquidation addresses`,
    };

    console.log(`✅ Liquidation Sync API - Sync complete:`, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Liquidation Sync API - Detailed error:", error);
    console.error(
      "❌ Liquidation Sync API - Error message:",
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
