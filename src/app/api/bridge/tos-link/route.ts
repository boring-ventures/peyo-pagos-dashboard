import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Bridge ToS Link API endpoint
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const supabase = createRouteHandlerClient({ 
      cookies 
    });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the request body to check if redirect_uri is provided
    const body = await request.json();
    const redirectUri = body.redirect_uri || `${request.nextUrl.origin}/sign-up/tos-callback`;

    console.log("📍 ToS Link Request Details:");
    console.log("  User ID:", session.user.id);
    console.log("  Redirect URI:", redirectUri);
    console.log("  Request origin:", request.nextUrl.origin);

    // Generate a unique idempotency key
    const idempotencyKey = `tos_${session.user.id}_${Date.now()}`;

    // Call Bridge API to generate ToS link
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    console.log("BRIDGE_API_KEY exists:", !!bridgeApiKey);
    console.log("BRIDGE_API_KEY length:", bridgeApiKey?.length || 0);
    
    if (!bridgeApiKey) {
      console.error("BRIDGE_API_KEY not configured");
      return NextResponse.json(
        { error: "Bridge API not configured" },
        { status: 500 }
      );
    }

    const bridgeResponse = await fetch("https://api.bridge.xyz/v0/customers/tos_links", {
      method: "POST",
      headers: {
        "Api-Key": bridgeApiKey,
        "Idempotency-Key": idempotencyKey,
        "Content-Type": "application/json",
      },
    });

    if (!bridgeResponse.ok) {
      const error = await bridgeResponse.text();
      console.error("Bridge API error:", error);
      console.error("Bridge API status:", bridgeResponse.status);
      console.error("Bridge API headers:", Object.fromEntries(bridgeResponse.headers.entries()));
      return NextResponse.json(
        { error: "Failed to generate ToS link", details: error },
        { status: bridgeResponse.status }
      );
    }

    const bridgeData = await bridgeResponse.json();
    console.log("🔗 Bridge API Response:", bridgeData);

    // Add redirect_uri parameter to the URL
    const tosUrl = new URL(bridgeData.url);
    tosUrl.searchParams.set("redirect_uri", redirectUri);

    console.log("✅ Final ToS URL:", tosUrl.toString());

    return NextResponse.json({
      url: tosUrl.toString(),
      idempotencyKey,
      debug: {
        originalUrl: bridgeData.url,
        finalUrl: tosUrl.toString(),
        redirectUri: redirectUri
      }
    });

  } catch (error) {
    console.error("Error generating ToS link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}