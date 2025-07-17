import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { UserStats } from "@/types/user";

// GET: Fetch user statistics (admin only)
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

    // Get total counts
    const [totalUsers, totalSuperAdmins] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({
        where: { role: "SUPERADMIN" },
      }),
    ]);

    // Get user status counts
    const userStatusCounts = await prisma.profile.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get today's activity
    const [newUsersToday, activeUsers, disabledUsers] = await Promise.all([
      prisma.profile.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.profile.count({
        where: { status: "active" },
      }),
      prisma.profile.count({
        where: { status: "disabled" },
      }),
    ]);

    // Process user status counts
    const processedStatusCounts = {
      active: 0,
      disabled: 0,
      deleted: 0,
    };

    userStatusCounts.forEach((item) => {
      if (item.status && processedStatusCounts.hasOwnProperty(item.status)) {
        processedStatusCounts[
          item.status as keyof typeof processedStatusCounts
        ] = item._count;
      }
    });

    const stats: UserStats = {
      totalUsers,
      totalSuperAdmins,
      userStatusCounts: processedStatusCounts,
      recentActivity: {
        newUsersToday,
        activeUsers,
        disabledUsers,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
