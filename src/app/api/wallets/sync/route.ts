import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { BridgeWalletResponse, WalletSyncResponse } from "@/types/wallet";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Helper function to determine wallet tag based on Bridge tags or default logic
function determineWalletTag(bridgeTags: string[]): "general_use" | "p2p" {
  // If Bridge tags contain p2p-related keywords, assign p2p tag
  const p2pKeywords = ["p2p", "peer", "trading", "exchange"];
  const hasP2pTag = bridgeTags.some((tag) =>
    p2pKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
  );

  return hasP2pTag ? "p2p" : "general_use";
}

// POST: Sync wallets from Bridge API to database
export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Wallet Sync API - Starting sync request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Wallet Sync API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(
      "✅ Wallet Sync API - Session found for user:",
      session.user.id
    );

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Wallet Sync API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { profileId, bridgeCustomerId } = body;

    if (!profileId || !bridgeCustomerId) {
      return NextResponse.json(
        { error: "profileId and bridgeCustomerId are required" },
        { status: 400 }
      );
    }

    // Verify profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { kycProfile: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify Bridge customer ID matches
    if (profile.kycProfile?.bridgeCustomerId !== bridgeCustomerId) {
      return NextResponse.json(
        { error: "Bridge customer ID mismatch" },
        { status: 400 }
      );
    }

    console.log("📋 Wallet Sync API - Syncing wallets for profile:", profileId);

    // Fetch wallets from Bridge API
    if (!bridgeApiKey) {
      return NextResponse.json(
        { error: "Bridge API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${bridgeCustomerId}/wallets`,
      {
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Bridge API error: ${response.status}`);
      return NextResponse.json(
        { error: "Failed to fetch wallets from Bridge API" },
        { status: response.status }
      );
    }

    const bridgeData: BridgeWalletResponse = await response.json();
    console.log(
      "📊 Wallet Sync API - Fetched from Bridge:",
      bridgeData.count,
      "wallets"
    );

    // Filter for supported chains only
    const supportedWallets = bridgeData.data.filter(
      (wallet) => wallet.chain === "solana" || wallet.chain === "base"
    );

    console.log(
      "✅ Wallet Sync API - Supported wallets:",
      supportedWallets.length
    );

    let newWallets = 0;
    let updatedWallets = 0;

    // Sync each wallet to our database
    for (const bridgeWallet of supportedWallets) {
      const walletTag = determineWalletTag(bridgeWallet.tags);

      const walletData = {
        profileId,
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

      if (existingWallet) {
        // Update existing wallet
        await prisma.wallet.update({
          where: { bridgeWalletId: bridgeWallet.id },
          data: {
            ...walletData,
            updatedAt: new Date(),
          },
        });
        updatedWallets++;
        console.log("🔄 Updated wallet:", bridgeWallet.id);
      } else {
        // Create new wallet
        await prisma.wallet.create({
          data: walletData,
        });
        newWallets++;
        console.log("✨ Created new wallet:", bridgeWallet.id);
      }
    }

    const syncResponse: WalletSyncResponse = {
      success: true,
      syncedCount: supportedWallets.length,
      newWallets,
      updatedWallets,
      message: `Successfully synced ${supportedWallets.length} wallets (${newWallets} new, ${updatedWallets} updated)`,
    };

    console.log("✅ Wallet Sync API - Sync completed:", syncResponse);
    return NextResponse.json(syncResponse);
  } catch (error) {
    console.error("❌ Wallet Sync API - Error:", error);

    const errorResponse: WalletSyncResponse = {
      success: false,
      syncedCount: 0,
      newWallets: 0,
      updatedWallets: 0,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
