import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type {
  CryptoDepositConfig,
} from "@/types/crypto-deposits";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Interface for supported token structure
interface SupportedToken {
  symbol: string;
  name: string;
  contractAddress?: string;
  decimals: number;
  isEnabled: boolean;
  minimumDeposit?: number;
  maximumDeposit?: number;
  depositInstructions?: string;
  iconUrl?: string;
}

// Interface for update data
interface UpdateData {
  chainName?: string;
  displayName?: string;
  isEnabled?: boolean;
  supportedTokens?: Prisma.InputJsonValue;
  depositInstructions?: string;
  minimumAmount?: number;
  maximumAmount?: number;
  networkFee?: number;
  processingTime?: string;
  riskLevel?: "low" | "medium" | "high";
  iconUrl?: string;
  explorerUrl?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

// Validation schema for updating crypto deposit config
const updateConfigSchema = z.object({
  chainName: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
  supportedTokens: z.array(z.object({
    id: z.string().optional(),
    symbol: z.string().min(1),
    name: z.string().min(1),
    contractAddress: z.string().optional(),
    decimals: z.number().int().min(0),
    isEnabled: z.boolean(),
    minimumDeposit: z.number().optional(),
    maximumDeposit: z.number().optional(),
    depositInstructions: z.string().optional(),
    iconUrl: z.string().optional(),
  })).optional(),
  depositInstructions: z.string().min(1).optional(),
  minimumAmount: z.number().optional(),
  maximumAmount: z.number().optional(),
  networkFee: z.number().optional(),
  processingTime: z.string().min(1).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  iconUrl: z.string().optional(),
  explorerUrl: z.string().optional(),
});

// GET: Fetch specific crypto deposit configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("🔍 Crypto Deposit Config API - Starting GET request for ID:", id);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Crypto Deposit Config API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is superadmin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Crypto Deposit Config API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Superadmin access required" },
        { status: 403 }
      );
    }

    // Fetch the configuration
    const config = await prisma.cryptoDepositConfig.findUnique({
      where: { id: id },
      include: {
        depositHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedConfig: CryptoDepositConfig = {
      id: config.id,
      chainId: config.chainId,
      chainName: config.chainName,
      displayName: config.displayName,
      isEnabled: config.isEnabled,
      supportedTokens: Array.isArray(config.supportedTokens) 
        ? (config.supportedTokens as unknown as SupportedToken[]).map((token, index) => ({
            id: `${config.chainId}-${token.symbol}-${index}`,
            ...token,
          }))
        : [],
      depositInstructions: config.depositInstructions,
      minimumAmount: config.minimumAmount ? parseFloat(config.minimumAmount.toString()) : undefined,
      maximumAmount: config.maximumAmount ? parseFloat(config.maximumAmount.toString()) : undefined,
      networkFee: config.networkFee ? parseFloat(config.networkFee.toString()) : undefined,
      processingTime: config.processingTime,
      riskLevel: config.riskLevel as "low" | "medium" | "high",
      iconUrl: config.iconUrl || undefined,
      explorerUrl: config.explorerUrl || undefined,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      lastModifiedBy: config.lastModifiedBy || "",
    };

    console.log("✅ Crypto Deposit Config API - Returning configuration");
    return NextResponse.json({ config: transformedConfig });
  } catch (error) {
    console.error("❌ Crypto Deposit Config API - Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update crypto deposit configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("🔍 Crypto Deposit Config API - Starting PUT request for ID:", id);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Crypto Deposit Config API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is superadmin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Crypto Deposit Config API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Superadmin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    // Fetch existing configuration
    const existingConfig = await prisma.cryptoDepositConfig.findUnique({
      where: { id: id },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: UpdateData = {};
    if (validatedData.chainName !== undefined) updateData.chainName = validatedData.chainName;
    if (validatedData.displayName !== undefined) updateData.displayName = validatedData.displayName;
    if (validatedData.isEnabled !== undefined) updateData.isEnabled = validatedData.isEnabled;
    if (validatedData.supportedTokens !== undefined) updateData.supportedTokens = validatedData.supportedTokens as Prisma.InputJsonValue;
    if (validatedData.depositInstructions !== undefined) updateData.depositInstructions = validatedData.depositInstructions;
    if (validatedData.minimumAmount !== undefined) updateData.minimumAmount = validatedData.minimumAmount;
    if (validatedData.maximumAmount !== undefined) updateData.maximumAmount = validatedData.maximumAmount;
    if (validatedData.networkFee !== undefined) updateData.networkFee = validatedData.networkFee;
    if (validatedData.processingTime !== undefined) updateData.processingTime = validatedData.processingTime;
    if (validatedData.riskLevel !== undefined) updateData.riskLevel = validatedData.riskLevel;
    if (validatedData.iconUrl !== undefined) updateData.iconUrl = validatedData.iconUrl;
    if (validatedData.explorerUrl !== undefined) updateData.explorerUrl = validatedData.explorerUrl;

    updateData.lastModifiedBy = currentUserProfile.id;
    updateData.lastModifiedAt = new Date();

    // Update the configuration
    const updatedConfig = await prisma.cryptoDepositConfig.update({
      where: { id: id },
      data: updateData,
    });

    // Create history record
    await prisma.cryptoDepositHistory.create({
      data: {
        configId: updatedConfig.id,
        changeType: "updated",
        oldValues: {
          chainName: existingConfig.chainName,
          displayName: existingConfig.displayName,
          isEnabled: existingConfig.isEnabled,
          supportedTokens: existingConfig.supportedTokens,
          depositInstructions: existingConfig.depositInstructions,
          minimumAmount: existingConfig.minimumAmount?.toString(),
          maximumAmount: existingConfig.maximumAmount?.toString(),
          networkFee: existingConfig.networkFee?.toString(),
          processingTime: existingConfig.processingTime,
          riskLevel: existingConfig.riskLevel,
          iconUrl: existingConfig.iconUrl,
          explorerUrl: existingConfig.explorerUrl,
        },
        newValues: validatedData,
        changeReason: "Configuration updated",
        modifiedBy: currentUserProfile.id,
      },
    });

    // Transform response
    const transformedConfig: CryptoDepositConfig = {
      id: updatedConfig.id,
      chainId: updatedConfig.chainId,
      chainName: updatedConfig.chainName,
      displayName: updatedConfig.displayName,
      isEnabled: updatedConfig.isEnabled,
      supportedTokens: Array.isArray(updatedConfig.supportedTokens) 
        ? (updatedConfig.supportedTokens as unknown as SupportedToken[]).map((token, index) => ({
            id: `${updatedConfig.chainId}-${token.symbol}-${index}`,
            ...token,
          }))
        : [],
      depositInstructions: updatedConfig.depositInstructions,
      minimumAmount: updatedConfig.minimumAmount ? parseFloat(updatedConfig.minimumAmount.toString()) : undefined,
      maximumAmount: updatedConfig.maximumAmount ? parseFloat(updatedConfig.maximumAmount.toString()) : undefined,
      processingTime: updatedConfig.processingTime,
      riskLevel: updatedConfig.riskLevel as "low" | "medium" | "high",
      iconUrl: updatedConfig.iconUrl || undefined,
      explorerUrl: updatedConfig.explorerUrl || undefined,
      createdAt: updatedConfig.createdAt.toISOString(),
      updatedAt: updatedConfig.updatedAt.toISOString(),
      lastModifiedBy: updatedConfig.lastModifiedBy || "",
    };

    console.log("✅ Crypto Deposit Config API - Configuration updated successfully");
    return NextResponse.json({ config: transformedConfig });
  } catch (error) {
    console.error("❌ Crypto Deposit Config API - Error updating configuration:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete crypto deposit configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("🔍 Crypto Deposit Config API - Starting DELETE request for ID:", id);

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Crypto Deposit Config API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is superadmin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Crypto Deposit Config API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Superadmin access required" },
        { status: 403 }
      );
    }

    // Check if configuration exists
    const existingConfig = await prisma.cryptoDepositConfig.findUnique({
      where: { id: id },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Delete the configuration (this will cascade delete history records)
    await prisma.cryptoDepositConfig.delete({
      where: { id: id },
    });

    console.log("✅ Crypto Deposit Config API - Configuration deleted successfully");
    return NextResponse.json({ success: true, message: "Configuration deleted successfully" });
  } catch (error) {
    console.error("❌ Crypto Deposit Config API - Error deleting configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}