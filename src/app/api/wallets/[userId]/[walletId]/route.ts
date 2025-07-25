import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  BridgeTransactionHistoryResponse,
  BridgeTransaction,
  WalletTransactionApiResponse,
} from "@/types/wallet";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Helper function to transform Bridge transaction to internal format
function transformBridgeTransaction(
  bridgeTransaction: BridgeTransaction,
  walletId: string,
  bridgeTransactionId: string
): {
  bridgeTransactionId: string;
  walletId: string;
  amount: string;
  developerFee: string | null;
  customerId: string;
  sourcePaymentRail: string | null;
  sourceCurrency: string | null;
  destinationPaymentRail: string | null;
  destinationCurrency: string | null;
  bridgeCreatedAt: Date;
  bridgeUpdatedAt: Date;
  bridgeRawData: unknown;
} {
  return {
    bridgeTransactionId,
    walletId,
    amount: bridgeTransaction.amount,
    developerFee: bridgeTransaction.developer_fee || null,
    customerId: bridgeTransaction.customer_id,
    sourcePaymentRail: bridgeTransaction.source?.payment_rail || null,
    sourceCurrency: bridgeTransaction.source?.currency || null,
    destinationPaymentRail: bridgeTransaction.destination?.payment_rail || null,
    destinationCurrency: bridgeTransaction.destination?.currency || null,
    bridgeCreatedAt: new Date(bridgeTransaction.created_at),
    bridgeUpdatedAt: new Date(bridgeTransaction.updated_at),
    bridgeRawData: bridgeTransaction,
  };
}

// Helper function to fetch transaction history from Bridge API
async function fetchTransactionHistoryFromBridge(
  bridgeWalletId: string,
  limit: number = 100,
  updatedAfterMs?: number
): Promise<BridgeTransactionHistoryResponse> {
  if (!bridgeApiKey) {
    // Return mock data for development
    return {
      count: 0,
      data: [],
    };
  }

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (updatedAfterMs) {
      params.append("updated_after_ms", updatedAfterMs.toString());
    }

    const response = await fetch(
      `${bridgeApiUrl}/wallets/${bridgeWalletId}/history?${params}`,
      {
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Bridge API error: ${response.status} ${response.statusText}`
      );
    }

    const data: BridgeTransactionHistoryResponse = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Error fetching transaction history for wallet ${bridgeWalletId}:`,
      error
    );
    throw error;
  }
}

// Helper function to sync transactions
async function syncTransactions(walletId: string, bridgeWalletId: string) {
  const now = new Date();
  let newTransactionsCount = 0;
  let totalTransactionsCount = 0;

  try {
    // Get the last sync info
    const lastSync = await prisma.transactionSync.findFirst({
      where: { walletId },
      orderBy: { lastSyncAt: "desc" },
    });

    // Determine the timestamp to fetch from
    const updatedAfterMs = lastSync?.lastProcessedBridgeCreatedAt
      ? lastSync.lastProcessedBridgeCreatedAt.getTime()
      : undefined;

    // Fetch transactions from Bridge API
    const bridgeResponse = await fetchTransactionHistoryFromBridge(
      bridgeWalletId,
      100,
      updatedAfterMs
    );

    totalTransactionsCount = bridgeResponse.count;

    // Process each transaction
    for (const bridgeTransaction of bridgeResponse.data) {
      // Create a unique transaction ID (Bridge API doesn't provide one)
      const bridgeTransactionId = `${bridgeWalletId}_${bridgeTransaction.created_at}_${bridgeTransaction.amount}`;

      // Check if transaction already exists
      const existingTransaction = await prisma.transaction.findUnique({
        where: { bridgeTransactionId },
      });

      if (!existingTransaction) {
        // Create new transaction
        const transactionData = transformBridgeTransaction(
          bridgeTransaction,
          walletId,
          bridgeTransactionId
        );

        await prisma.transaction.create({
          data: transactionData as Prisma.TransactionUncheckedCreateInput,
        });

        newTransactionsCount++;
      }
    }

    // Update sync record
    await prisma.transactionSync.create({
      data: {
        walletId,
        lastSyncAt: now,
        lastSyncTransactionCount: totalTransactionsCount,
        newTransactionsFound: newTransactionsCount,
        syncStatus: "success",
        lastProcessedBridgeCreatedAt:
          bridgeResponse.data.length > 0
            ? new Date(
                Math.max(
                  ...bridgeResponse.data.map((t) =>
                    new Date(t.created_at).getTime()
                  )
                )
              )
            : lastSync?.lastProcessedBridgeCreatedAt || now,
      },
    });

    return {
      success: true,
      syncedCount: totalTransactionsCount,
      newTransactions: newTransactionsCount,
      totalTransactions: await prisma.transaction.count({
        where: { walletId },
      }),
      lastSyncAt: now,
      message: `Successfully synced ${newTransactionsCount} new transactions`,
    };
  } catch (error) {
    console.error("Transaction sync error:", error);

    // Record the error
    await prisma.transactionSync.create({
      data: {
        walletId,
        lastSyncAt: now,
        lastSyncTransactionCount: 0,
        newTransactionsFound: 0,
        syncStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}

// GET /api/wallets/[userId]/[walletId] - Get wallet transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; walletId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view transaction history (SUPERADMIN only)
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden - Transaction history access requires SUPERADMIN role",
        },
        { status: 403 }
      );
    }

    const { userId, walletId } = await params;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Filter parameters
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const currency = searchParams.get("currency");
    const paymentRail = searchParams.get("paymentRail");

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        profile: { userId },
      },
      include: {
        profile: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Build where clause for transaction filters
    const whereClause: Record<string, unknown> = {
      walletId,
    };

    if (dateFrom || dateTo) {
      whereClause.bridgeCreatedAt = {};
      if (dateFrom)
        (whereClause.bridgeCreatedAt as Record<string, unknown>).gte = new Date(
          dateFrom
        );
      if (dateTo)
        (whereClause.bridgeCreatedAt as Record<string, unknown>).lte = new Date(
          dateTo
        );
    }

    if (minAmount) {
      whereClause.amount = {
        ...((whereClause.amount as Record<string, unknown>) || {}),
        gte: minAmount,
      };
    }

    if (maxAmount) {
      whereClause.amount = {
        ...((whereClause.amount as Record<string, unknown>) || {}),
        lte: maxAmount,
      };
    }

    if (currency) {
      whereClause.OR = [
        { sourceCurrency: currency },
        { destinationCurrency: currency },
      ];
    }

    if (paymentRail) {
      whereClause.OR = [
        ...((whereClause.OR as unknown[]) || []),
        { sourcePaymentRail: paymentRail },
        { destinationPaymentRail: paymentRail },
      ];
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { bridgeCreatedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    // Get sync info
    const syncInfo = await prisma.transactionSync.findFirst({
      where: { walletId },
      orderBy: { lastSyncAt: "desc" },
    });

    // Build pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    const response: WalletTransactionApiResponse = {
      wallet: {
        ...wallet,
        transactionCount: totalCount,
        lastTransactionAt: transactions[0]?.bridgeCreatedAt || null,
      },
      transactions,
      pagination,
      syncInfo: syncInfo || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch wallet transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/wallets/[userId]/[walletId] - Sync wallet transactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; walletId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to sync transactions (SUPERADMIN only)
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden - Transaction sync access requires SUPERADMIN role",
        },
        { status: 403 }
      );
    }

    const { userId, walletId } = await params;

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        profile: { userId },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Sync transactions
    const syncResult = await syncTransactions(walletId, wallet.bridgeWalletId);

    return NextResponse.json(syncResult);
  } catch (error) {
    console.error("Error syncing wallet transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to sync wallet transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
