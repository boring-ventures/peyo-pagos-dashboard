import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and check permissions
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile || !["ADMIN", "SUPERADMIN"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const walletId = searchParams.get("walletId") || "";
    const customerId = searchParams.get("customerId") || "";
    const sourceCurrency = searchParams.get("sourceCurrency") || "";
    const destinationCurrency = searchParams.get("destinationCurrency") || "";
    const sourcePaymentRail = searchParams.get("sourcePaymentRail") || "";
    const destinationPaymentRail =
      searchParams.get("destinationPaymentRail") || "";

    // Date range filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Amount range filters
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "bridgeCreatedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    // Search across multiple fields
    if (search) {
      where.OR = [
        { bridgeTransactionId: { contains: search, mode: "insensitive" } },
        { customerId: { contains: search, mode: "insensitive" } },
        { wallet: { address: { contains: search, mode: "insensitive" } } },
        {
          wallet: {
            profile: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    // Filter by wallet
    if (walletId) {
      where.walletId = walletId;
    }

    // Filter by customer ID
    if (customerId) {
      where.customerId = { contains: customerId, mode: "insensitive" };
    }

    // Currency filters
    if (sourceCurrency) {
      where.sourceCurrency = { contains: sourceCurrency, mode: "insensitive" };
    }
    if (destinationCurrency) {
      where.destinationCurrency = {
        contains: destinationCurrency,
        mode: "insensitive",
      };
    }

    // Payment rail filters
    if (sourcePaymentRail) {
      where.sourcePaymentRail = {
        contains: sourcePaymentRail,
        mode: "insensitive",
      };
    }
    if (destinationPaymentRail) {
      where.destinationPaymentRail = {
        contains: destinationPaymentRail,
        mode: "insensitive",
      };
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      where.bridgeCreatedAt = dateFilter;
    }

    // Amount range filter (convert to number for comparison)
    if (minAmount || maxAmount) {
      // Since amount is stored as string, we need to handle this carefully
      // For now, we'll do a simple string comparison, but this might need refinement
      const amountFilter: Prisma.StringFilter = {};
      if (minAmount) {
        amountFilter.gte = minAmount;
      }
      if (maxAmount) {
        amountFilter.lte = maxAmount;
      }
      where.amount = amountFilter;
    }

    // Build orderBy clause
    const orderBy: Record<string, string> = {};
    if (sortBy === "amount") {
      // For amount sorting, we need to convert string to number
      orderBy.amount = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Fetch transactions with related data
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          wallet: {
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
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      transactions,
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
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
