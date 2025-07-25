import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { UserStatus, KYCStatus, Prisma } from "@prisma/client";

// GET: Fetch all users with KYC data (admin only)
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

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || (currentUserProfile.role !== "ADMIN" && currentUserProfile.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const kycStatus = searchParams.get("kycStatus");

    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the where clause for filtering profiles
    // Only show USER role users in KYC module (exclude SUPERADMIN)
    const whereClause: Prisma.ProfileWhereInput = {
      role: "USER",
    };
    if (status && status !== "all") whereClause.status = status as UserStatus;
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build KYC where clause
    const kycWhereClause: Prisma.KYCProfileWhereInput = {};
    if (kycStatus && kycStatus !== "all")
      kycWhereClause.kycStatus = kycStatus as KYCStatus;

    // If there are KYC filters, we need to filter profiles that have KYC data matching
    if (Object.keys(kycWhereClause).length > 0) {
      whereClause.kycProfile = {
        ...kycWhereClause,
      };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build the orderBy clause
    const orderBy: Prisma.ProfileOrderByWithRelationInput = {};
    if (sortBy === "kycStatus") {
      orderBy.kycProfile = { kycStatus: sortOrder as "asc" | "desc" };
    } else {
      orderBy[sortBy as keyof Prisma.ProfileOrderByWithRelationInput] =
        sortOrder as "asc" | "desc";
    }

    // Fetch profiles with KYC data from the database
    const [profiles, totalCount] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        include: {
          kycProfile: {
            include: {
              address: true,
              identifyingInfo: true,
              documents: true,
              rejectionReasons: {
                orderBy: { createdAt: "desc" },
                take: 1, // Latest rejection reason
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.profile.count({ where: whereClause }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      profiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Error fetching KYC data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update KYC status (admin only)
export async function PUT(req: NextRequest) {
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

    if (!currentUserProfile || (currentUserProfile.role !== "ADMIN" && currentUserProfile.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { profileId, kycStatus, rejectionReason } = data;

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Find the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { kycProfile: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update KYC profile if it exists, create if it doesn't
    let kycProfile;
    if (profile.kycProfile) {
      const updateData: Prisma.KYCProfileUpdateInput = {};
      if (kycStatus) {
        updateData.kycStatus = kycStatus;
        if (kycStatus === "approved") {
          updateData.kycApprovedAt = new Date();
        } else if (kycStatus === "rejected") {
          updateData.kycRejectedAt = new Date();
          updateData.kycRejectionReason = rejectionReason;
        }
      }

      kycProfile = await prisma.kYCProfile.update({
        where: { id: profile.kycProfile.id },
        data: updateData,
      });

      // Add rejection reason if provided
      if (rejectionReason && kycStatus === "rejected") {
        await prisma.rejectionReason.create({
          data: {
            kycProfileId: profile.kycProfile.id,
            reason: rejectionReason,
            developerReason: `Admin rejection: ${rejectionReason}`,
            bridgeCreatedAt: new Date(),
          },
        });
      }
    } else if (kycStatus) {
      // Create KYC profile if it doesn't exist
      const createData: Prisma.KYCProfileCreateInput = {
        profile: { connect: { id: profile.id } },
      };
      if (kycStatus) {
        createData.kycStatus = kycStatus;
        if (kycStatus === "approved") {
          createData.kycApprovedAt = new Date();
        } else if (kycStatus === "rejected") {
          createData.kycRejectedAt = new Date();
          createData.kycRejectionReason = rejectionReason;
        }
      }

      kycProfile = await prisma.kYCProfile.create({
        data: createData,
      });

      // Add rejection reason if provided
      if (rejectionReason && kycStatus === "rejected") {
        await prisma.rejectionReason.create({
          data: {
            kycProfileId: kycProfile.id,
            reason: rejectionReason,
            developerReason: `Admin rejection: ${rejectionReason}`,
            bridgeCreatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, kycProfile });
  } catch (error) {
    console.error("Error updating KYC status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
