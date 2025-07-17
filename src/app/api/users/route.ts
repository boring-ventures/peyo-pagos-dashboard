import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { UserRole, UserStatus, Prisma } from "@prisma/client";

// GET: Fetch all users for user management (admin only)
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Users API - Starting request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Users API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("✅ Users API - Session found for user:", session.user.id);

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    console.log("👤 Users API - Current user profile:", currentUserProfile);

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Users API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the where clause for filtering profiles
    const whereClause: Prisma.ProfileWhereInput = {};

    if (role && role !== "all") whereClause.role = role as UserRole;
    if (status && status !== "all") whereClause.status = status as UserStatus;
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build the orderBy clause with safety check
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "firstName",
      "lastName",
      "email",
      "role",
      "status",
    ];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const orderBy: Prisma.ProfileOrderByWithRelationInput = {
      [safeSortBy]: sortOrder as "asc" | "desc",
    };

    console.log("📊 Users API - Query parameters:", {
      page,
      limit,
      role,
      status,
      search,
      sortBy,
      sortOrder,
    });
    console.log("🔍 Users API - Where clause:", whereClause);
    console.log("📈 Users API - Order by:", orderBy);

    // Fetch profiles from the database (no KYC data needed for user management)
    const [profiles, totalCount] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.profile.count({ where: whereClause }),
    ]);

    console.log("📋 Users API - Found profiles:", profiles.length);
    console.log("📊 Users API - Total count:", totalCount);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      profiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    };

    console.log("✅ Users API - Returning successful response");
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Users API - Detailed error:", error);
    console.error(
      "❌ Users API - Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "❌ Users API - Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
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

// PUT: Update user profile (admin only)
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

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { profileId, status, role, firstName, lastName } = data;

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Find the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Prisma.ProfileUpdateInput = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: updateData,
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new user with Supabase auth (admin only)
export async function POST(req: NextRequest) {
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

    const data = await req.json();
    const { email, firstName, lastName, role = "USER", password } = data;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if we have service role key for creating auth users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Service role key not configured for user creation" },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

    // Create auth user in Supabase
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: "Failed to create auth user" },
        { status: 500 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: authUser.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists for this user" },
        { status: 409 }
      );
    }

    // Create new profile in database
    const newProfile = await prisma.profile.create({
      data: {
        userId: authUser.user.id,
        email,
        firstName,
        lastName,
        role: role as UserRole,
        status: "active",
      },
    });

    return NextResponse.json(
      {
        success: true,
        profile: newProfile,
        authUser: {
          id: authUser.user.id,
          email: authUser.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
