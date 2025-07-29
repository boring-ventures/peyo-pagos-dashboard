import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Flat Cards API - Starting request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Flat Cards API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Flat Cards API - Session found for user:", session.user.id);

    // Get user profile and check permissions
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile || !["ADMIN", "SUPERADMIN"].includes(profile.role)) {
      console.log(
        "❌ Flat Cards API - Insufficient permissions, role:",
        profile?.role
      );
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Flat Cards API - User has required permissions");

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const cardStatus = searchParams.get("cardStatus") || "";
    const isActive = searchParams.get("isActive") || "";
    const terminated = searchParams.get("terminated") || "";
    const frozen = searchParams.get("frozen") || "";

    // Date range filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Amount range filters
    const minBalance = searchParams.get("minBalance");
    const maxBalance = searchParams.get("maxBalance");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log("📅 Flat Cards API - Filters:", {
      search,
      cardStatus,
      isActive,
      terminated,
      frozen,
      startDate,
      endDate,
      minBalance,
      maxBalance,
      sortBy,
      sortOrder,
    });

    // Build where clause
    const where: Prisma.CardWhereInput = {};

    // Search across multiple fields
    if (search) {
      where.OR = [
        { moonCardId: { contains: search, mode: "insensitive" } },
        { pan: { contains: search, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { userTag: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Status filters
    if (isActive === "true") {
      where.isActive = true;
    } else if (isActive === "false") {
      where.isActive = false;
    }

    if (terminated === "true") {
      where.terminated = true;
    } else if (terminated === "false") {
      where.terminated = false;
    }

    if (frozen === "true") {
      where.frozen = true;
    } else if (frozen === "false") {
      where.frozen = false;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Balance range filter
    if (minBalance || maxBalance) {
      where.balance = {};
      if (minBalance) {
        where.balance.gte = parseFloat(minBalance);
      }
      if (maxBalance) {
        where.balance.lte = parseFloat(maxBalance);
      }
    }

    // Build orderBy clause
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    console.log("🔍 Flat Cards API - About to query database...");

    // Fetch cards with related data
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              userTag: true,
              status: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    console.log(
      "✅ Flat Cards API - Found",
      cards.length,
      "cards out of",
      total
    );

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching flat cards:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
