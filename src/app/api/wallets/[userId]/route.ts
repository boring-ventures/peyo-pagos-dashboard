import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type {
  UserWalletApiResponse,
  UserWithWallets,
  Wallet,
} from "@/types/wallet";

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

    // Find the user profile with wallets and KYC info
    const userProfile = await prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        wallets: {
          where: { isActive: true },
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
      kycProfile: userProfile.kycProfile || undefined,
    };

    const response: UserWalletApiResponse = {
      user,
      wallets: userProfile.wallets as Wallet[],
    };

    console.log(
      `✅ User Wallets API - Returning ${userProfile.wallets.length} wallets for user ${userId}`
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
