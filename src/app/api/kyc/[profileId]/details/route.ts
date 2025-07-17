import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const profileId = (await params).profileId;

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch profile with complete KYC data
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        kycProfile: {
          include: {
            address: true,
            identifyingInfo: {
              orderBy: { createdAt: "desc" },
            },
            documents: {
              orderBy: { createdAt: "desc" },
            },
            rejectionReasons: {
              orderBy: { createdAt: "desc" },
            },
            endorsements: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile,
      kycProfile: profile.kycProfile,
    });
  } catch (error) {
    console.error("Error fetching KYC details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
