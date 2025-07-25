import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { UserRole, UserStatus, Prisma } from "@prisma/client";

// GET: Fetch all profiles with optional filtering
export async function GET(req: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const kycApproved = searchParams.get("kycApproved");

    // Build the where clause for filtering
    const whereClause: Prisma.ProfileWhereInput = {};

    if (role) whereClause.role = role as UserRole;
    if (status) whereClause.status = status as UserStatus;

    // Filter by KYC approval status if requested
    if (kycApproved === "true") {
      whereClause.kycProfile = {
        kycStatus: "active",
        bridgeCustomerId: {
          not: null,
        },
      };
    }

    // Build include clause to get KYC profile information when needed
    const includeClause: Prisma.ProfileInclude = {};
    if (kycApproved === "true" || role === "USER") {
      includeClause.kycProfile = {
        select: {
          bridgeCustomerId: true,
          kycStatus: true,
        },
      };
    }

    // Fetch profiles from the database
    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
