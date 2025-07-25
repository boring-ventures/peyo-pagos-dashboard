import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { canAccessModule } from "@/lib/auth/role-permissions";

/**
 * Middleware to protect routes based on user permissions
 */
export async function protectRoute(
  request: NextRequest,
  requiredModule:
    | "dashboard"
    | "analytics"
    | "users"
    | "kyc"
    | "wallets"
    | "settings"
) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    // Check if user has access to the required module
    if (!canAccessModule(profile.role, requiredModule)) {
      return NextResponse.json(
        { error: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    return null; // Allow access
  } catch (error) {
    console.error("Route protection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check if user is authenticated and has a profile
 */
export async function requireAuth() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    return { session, profile };
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
