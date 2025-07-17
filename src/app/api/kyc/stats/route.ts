import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { KYCStats } from "@/types/kyc";

// GET: Fetch KYC statistics (admin only)
export async function GET() {
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total counts (only USER role users for KYC module)
    const [totalUsers, totalKYCProfiles] = await Promise.all([
      prisma.profile.count({
        where: { role: "USER" },
      }),
      prisma.kYCProfile.count(),
    ]);

    // Get KYC status counts (only for USER role users)
    const kycStatusCounts = await prisma.kYCProfile.groupBy({
      by: ["kycStatus"],
      _count: true,
      where: {
        profile: {
          role: "USER",
        },
      },
    });

    // Get today's activity (only for USER role users)
    const [newKYCsToday, approvedToday, rejectedToday] = await Promise.all([
      prisma.kYCProfile.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          profile: {
            role: "USER",
          },
        },
      }),
      prisma.kYCProfile.count({
        where: {
          kycApprovedAt: {
            gte: today,
            lt: tomorrow,
          },
          profile: {
            role: "USER",
          },
        },
      }),
      prisma.kYCProfile.count({
        where: {
          kycRejectedAt: {
            gte: today,
            lt: tomorrow,
          },
          profile: {
            role: "USER",
          },
        },
      }),
    ]);

    // Get pending review count (only for USER role users)
    const pendingReview = await prisma.kYCProfile.count({
      where: {
        kycStatus: {
          in: ["under_review", "awaiting_questionnaire", "awaiting_ubo"],
        },
        profile: {
          role: "USER",
        },
      },
    });

    // Process KYC status counts
    const processedKYCCounts = {
      not_started: 0,
      incomplete: 0,
      awaiting_questionnaire: 0,
      awaiting_ubo: 0,
      under_review: 0,
      active: 0,
      rejected: 0,
      paused: 0,
      offboarded: 0,
    };

    kycStatusCounts.forEach((item) => {
      if (item.kycStatus && processedKYCCounts.hasOwnProperty(item.kycStatus)) {
        processedKYCCounts[item.kycStatus as keyof typeof processedKYCCounts] =
          item._count;
      }
    });

    const stats: KYCStats = {
      totalUsers,
      totalKYCProfiles,
      kycStatusCounts: processedKYCCounts,
      recentActivity: {
        newKYCsToday,
        approvedToday,
        rejectedToday,
        pendingReview,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching KYC stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
