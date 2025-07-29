import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { CostEntryDetail, CostEntry } from "@/types/analytics";
import { COSTS } from "@/types/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("🔍 Cost Entry Detail API - Starting request for ID:", id);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Cost Entry Detail API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Cost Entry Detail API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse the ID to determine type and actual ID
    const [type, actualId] = id.split("-");
    if (!type || !actualId || !["kyc", "wallet"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid cost entry ID format" },
        { status: 400 }
      );
    }

    let costEntryDetail: CostEntryDetail | null = null;
    let relatedEntries: CostEntry[] = [];

    if (type === "kyc") {
      // Fetch KYC profile details
      const kycProfile = await prisma.kYCProfile.findUnique({
        where: { id: actualId },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          address: true,
          identifyingInfo: true,
          documents: true,
          rejectionReasons: true,
          endorsements: true,
        },
      });

      if (!kycProfile || !kycProfile.kycSubmittedAt) {
        return NextResponse.json(
          { error: "KYC cost entry not found" },
          { status: 404 }
        );
      }

      costEntryDetail = {
        id: `kyc-${kycProfile.id}`,
        type: "kyc",
        userId: kycProfile.profile.userId,
        userEmail: kycProfile.profile.email || "",
        userName: `${kycProfile.profile.firstName || ""} ${
          kycProfile.profile.lastName || ""
        }`.trim(),
        profileId: kycProfile.profile.id,
        description: `KYC verification for ${kycProfile.profile.email}`,
        amount: COSTS.KYC_COST_USD,
        currency: "USD",
        createdAt: kycProfile.kycSubmittedAt.toISOString(),
        metadata: {
          kycStatus: kycProfile.kycStatus,
          bridgeCustomerId: kycProfile.bridgeCustomerId || undefined,
        },
      };

      // Fetch related wallet entries for this user
      const userWallets = await prisma.wallet.findMany({
        where: { profileId: kycProfile.profileId },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      relatedEntries = userWallets.map((wallet) => ({
        id: `wallet-${wallet.id}`,
        type: "wallet" as const,
        userId: wallet.profile.userId,
        userEmail: wallet.profile.email || "",
        userName: `${wallet.profile.firstName || ""} ${
          wallet.profile.lastName || ""
        }`.trim(),
        profileId: wallet.profile.id,
        description: `${wallet.chain} wallet creation for ${wallet.profile.email}`,
        amount: COSTS.WALLET_COST_USD,
        currency: "USD",
        createdAt: wallet.createdAt.toISOString(),
        metadata: {
          walletChain: wallet.chain,
          walletAddress: wallet.address,
          bridgeWalletId: wallet.bridgeWalletId,
        },
      }));
    } else if (type === "wallet") {
      // Fetch wallet details
      const wallet = await prisma.wallet.findUnique({
        where: { id: actualId },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          transactions: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet cost entry not found" },
          { status: 404 }
        );
      }

      costEntryDetail = {
        id: `wallet-${wallet.id}`,
        type: "wallet",
        userId: wallet.profile.userId,
        userEmail: wallet.profile.email || "",
        userName: `${wallet.profile.firstName || ""} ${
          wallet.profile.lastName || ""
        }`.trim(),
        profileId: wallet.profile.id,
        description: `${wallet.chain} wallet creation for ${wallet.profile.email}`,
        amount: COSTS.WALLET_COST_USD,
        currency: "USD",
        createdAt: wallet.createdAt.toISOString(),
        metadata: {
          walletChain: wallet.chain,
          walletAddress: wallet.address,
          bridgeWalletId: wallet.bridgeWalletId,
        },
      };

      // Fetch related KYC entry for this user
      const userKYC = await prisma.kYCProfile.findUnique({
        where: { profileId: wallet.profileId },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (userKYC && userKYC.kycSubmittedAt) {
        relatedEntries.push({
          id: `kyc-${userKYC.id}`,
          type: "kyc",
          userId: userKYC.profile.userId,
          userEmail: userKYC.profile.email || "",
          userName: `${userKYC.profile.firstName || ""} ${
            userKYC.profile.lastName || ""
          }`.trim(),
          profileId: userKYC.profile.id,
          description: `KYC verification for ${userKYC.profile.email}`,
          amount: COSTS.KYC_COST_USD,
          currency: "USD",
          createdAt: userKYC.kycSubmittedAt.toISOString(),
          metadata: {
            kycStatus: userKYC.kycStatus,
            bridgeCustomerId: userKYC.bridgeCustomerId || undefined,
          },
        });
      }

      // Fetch other wallets for this user
      const otherWallets = await prisma.wallet.findMany({
        where: {
          profileId: wallet.profileId,
          id: { not: wallet.id },
        },
        include: {
          profile: {
            select: {
              id: true,
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      otherWallets.forEach((otherWallet) => {
        relatedEntries.push({
          id: `wallet-${otherWallet.id}`,
          type: "wallet",
          userId: otherWallet.profile.userId,
          userEmail: otherWallet.profile.email || "",
          userName: `${otherWallet.profile.firstName || ""} ${
            otherWallet.profile.lastName || ""
          }`.trim(),
          profileId: otherWallet.profile.id,
          description: `${otherWallet.chain} wallet creation for ${otherWallet.profile.email}`,
          amount: COSTS.WALLET_COST_USD,
          currency: "USD",
          createdAt: otherWallet.createdAt.toISOString(),
          metadata: {
            walletChain: otherWallet.chain,
            walletAddress: otherWallet.address,
            bridgeWalletId: otherWallet.bridgeWalletId,
          },
        });
      });
    }

    if (!costEntryDetail) {
      return NextResponse.json(
        { error: "Cost entry not found" },
        { status: 404 }
      );
    }

    // Sort related entries by creation date
    relatedEntries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    costEntryDetail.relatedEntries = relatedEntries;

    console.log("✅ Cost Entry Detail API - Returning entry details");
    return NextResponse.json(costEntryDetail);
  } catch (error) {
    console.error("❌ Cost Entry Detail API - Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}