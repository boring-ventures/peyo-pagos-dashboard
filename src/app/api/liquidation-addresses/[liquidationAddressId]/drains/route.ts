import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { DrainHistoryResponse } from "@/types/wallet";

// Bridge API endpoint to get drain history
async function fetchDrainHistory(
  customerId: string,
  liquidationAddressId: string
): Promise<DrainHistoryResponse> {
  const bridgeApiKey = process.env.BRIDGE_API_KEY;
  const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz";

  console.log("🔧 Bridge API config:", {
    apiKeyExists: !!bridgeApiKey,
    apiUrl: bridgeApiUrl,
  });

  if (!bridgeApiKey) {
    console.error("❌ BRIDGE_API_KEY is not configured");
    throw new Error("BRIDGE_API_KEY is not configured");
  }

  // Ensure the base URL doesn't end with /v0 to avoid duplication
  const baseUrl = bridgeApiUrl.endsWith("/v0")
    ? bridgeApiUrl
    : `${bridgeApiUrl}/v0`;
  const url = `${baseUrl}/customers/${customerId}/liquidation_addresses/${liquidationAddressId}/drains`;
  console.log("🌐 Bridge API URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Api-Key": bridgeApiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("📡 Bridge API Response:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.log("ℹ️ No drain history found (404), returning empty result");
      return { count: 0, data: [] };
    }

    // Try to get error details from Bridge API
    let errorDetails = "";
    try {
      const errorBody = await response.text();
      errorDetails = errorBody;
      console.error("❌ Bridge API Error Body:", errorBody);
    } catch (e) {
      console.error("❌ Could not read Bridge API error body");
    }

    throw new Error(
      `Bridge API error: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ""}`
    );
  }

  return response.json();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ liquidationAddressId: string }> }
) {
  try {
    const { liquidationAddressId } = await params;
    console.log("🔍 API called for liquidation address:", liquidationAddressId);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("❌ Auth error:", sessionError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.id);

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!profile || profile.status !== "active") {
      console.error("❌ Profile not found or inactive:", profile);
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 }
      );
    }

    console.log("✅ Profile found:", {
      id: profile.id,
      role: profile.role,
      status: profile.status,
    });

    // Get liquidation address from database
    const liquidationAddress = await prisma.liquidationAddress.findUnique({
      where: {
        bridgeLiquidationId: liquidationAddressId,
      },
      select: {
        id: true,
        bridgeLiquidationId: true,
        customerId: true,
        profileId: true,
        chain: true,
        address: true,
        currency: true,
        destinationPaymentRail: true,
        destinationCurrency: true,
        destinationAddress: true,
        state: true,
      },
    });

    if (!liquidationAddress) {
      console.error(
        "❌ Liquidation address not found in database:",
        liquidationAddressId
      );
      return NextResponse.json(
        { error: "Liquidation address not found" },
        { status: 404 }
      );
    }

    console.log("✅ Liquidation address found:", {
      id: liquidationAddress.id,
      customerId: liquidationAddress.customerId,
      chain: liquidationAddress.chain,
    });

    // Check permissions: SUPERADMIN can view all, USER can only view their own
    if (
      profile.role === "USER" &&
      liquidationAddress.profileId !== profile.id
    ) {
      console.error(
        "❌ Access denied: User role is USER but trying to access another user's liquidation address"
      );
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("✅ Permission check passed");

    // Fetch drain history from Bridge API
    console.log("🌉 Calling Bridge API for drain history...");
    const drainHistory = await fetchDrainHistory(
      liquidationAddress.customerId,
      liquidationAddress.bridgeLiquidationId
    );

    console.log("✅ Bridge API response:", {
      count: drainHistory.count,
      dataLength: drainHistory.data.length,
    });

    return NextResponse.json({
      liquidationAddress: {
        id: liquidationAddress.id,
        bridgeLiquidationId: liquidationAddress.bridgeLiquidationId,
        chain: liquidationAddress.chain,
        address: liquidationAddress.address,
        currency: liquidationAddress.currency,
        destinationPaymentRail: liquidationAddress.destinationPaymentRail,
        destinationCurrency: liquidationAddress.destinationCurrency,
        destinationAddress: liquidationAddress.destinationAddress,
        state: liquidationAddress.state,
      },
      drainHistory,
    });
  } catch (error) {
    console.error("Error fetching drain history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch drain history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
