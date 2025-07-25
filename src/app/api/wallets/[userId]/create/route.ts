import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Bridge API Wallet Creation Response
interface BridgeWalletCreationResponse {
  chain: string;
  id: string;
  address: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

// Wallet Creation Request Body
interface WalletCreationRequest {
  chain: "base" | "solana";
  walletTag: "general_use" | "p2p";
}

// Helper function to create wallet via Bridge API
async function createWalletInBridge(
  customerID: string,
  chain: "base" | "solana"
): Promise<BridgeWalletCreationResponse> {
  if (!bridgeApiKey) {
    // Return mock data for development
    // Generate a unique idempotency key for consistent mock behavior
    const idempotencyKey = randomUUID();

    const mockWallet: BridgeWalletCreationResponse = {
      chain,
      id: `mock_wallet_${idempotencyKey.substring(0, 8)}`,
      address:
        chain === "solana"
          ? `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
          : `0x${Math.random().toString(16).substring(2, 42)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
    };
    return mockWallet;
  }

  try {
    // Generate a unique idempotency key for this request
    const idempotencyKey = randomUUID();

    const response = await fetch(
      `${bridgeApiUrl}/customers/${customerID}/wallets`,
      {
        method: "POST",
        headers: {
          "Api-Key": bridgeApiKey,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          accept: "application/json",
        },
        body: JSON.stringify({ chain }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Bridge API error: ${response.status} ${response.statusText}. ${
          errorData.message || ""
        }`
      );
    }

    const walletData: BridgeWalletCreationResponse = await response.json();
    return walletData;
  } catch (error) {
    console.error(`Error creating wallet for customer ${customerID}:`, error);
    throw error;
  }
}

// POST /api/wallets/[userId]/create - Create a new wallet for user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is superadmin (only superadmin can create wallets)
    const currentUser = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions - Wallet creation requires SUPERADMIN role",
        },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body: WalletCreationRequest = await request.json();

    // Validate request body
    if (!body.chain || !["base", "solana"].includes(body.chain)) {
      return NextResponse.json(
        { error: "Invalid chain. Must be 'base' or 'solana'" },
        { status: 400 }
      );
    }

    if (!body.walletTag || !["general_use", "p2p"].includes(body.walletTag)) {
      return NextResponse.json(
        { error: "Invalid wallet tag. Must be 'general_use' or 'p2p'" },
        { status: 400 }
      );
    }

    // Get user profile and verify they exist
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        kycProfile: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a Bridge customer ID
    if (!userProfile.kycProfile?.bridgeCustomerId) {
      return NextResponse.json(
        {
          error:
            "User does not have a Bridge customer ID. KYC process must be completed first.",
        },
        { status: 400 }
      );
    }

    // Create wallet via Bridge API
    const bridgeWallet = await createWalletInBridge(
      userProfile.kycProfile.bridgeCustomerId,
      body.chain
    );

    // Store wallet in our database
    const newWallet = await prisma.wallet.create({
      data: {
        profileId: userProfile.id,
        bridgeWalletId: bridgeWallet.id,
        chain: body.chain, // Keep lowercase as required by Prisma enum
        address: bridgeWallet.address,
        bridgeTags: bridgeWallet.tags || [],
        bridgeCreatedAt: new Date(bridgeWallet.created_at),
        bridgeUpdatedAt: new Date(bridgeWallet.updated_at),
        walletTag: body.walletTag, // Use selected wallet tag
        isActive: true,
      },
      include: {
        profile: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log wallet creation event
    await prisma.event.create({
      data: {
        type: "USER_WALLET_CREATED",
        module: "WALLET",
        description: `Wallet created for ${body.chain} blockchain`,
        profileId: userProfile.id,
        metadata: {
          walletId: newWallet.id,
          bridgeWalletId: bridgeWallet.id,
          chain: body.chain,
          walletTag: body.walletTag,
          address: bridgeWallet.address,
          createdBy: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      wallet: newWallet,
      message: `Wallet created successfully for ${body.chain} blockchain`,
    });
  } catch (error) {
    console.error("Error creating wallet:", error);

    // Handle specific Bridge API errors
    if (error instanceof Error && error.message.includes("Bridge API error")) {
      return NextResponse.json(
        {
          error: "Failed to create wallet in Bridge API",
          details: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create wallet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
