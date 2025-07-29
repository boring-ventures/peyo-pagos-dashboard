import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type {
  CryptoDepositConfig,
  CryptoDepositConfigsResponse,
} from "@/types/crypto-deposits";
import { z } from "zod";

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

// Validation schema for creating crypto deposit config
const createConfigSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  chainName: z.string().min(1, "Chain name is required"),
  displayName: z.string().min(1, "Display name is required"),
  isEnabled: z.boolean(),
  supportedTokens: z.array(z.object({
    symbol: z.string().min(1),
    name: z.string().min(1),
    contractAddress: z.string().optional(),
    decimals: z.number().int().min(0),
    isEnabled: z.boolean(),
    minimumDeposit: z.number().optional(),
    maximumDeposit: z.number().optional(),
    depositInstructions: z.string().optional(),
    iconUrl: z.string().optional(),
  })),
  depositInstructions: z.string().min(1, "Deposit instructions are required"),
  minimumAmount: z.number().optional(),
  maximumAmount: z.number().optional(),
  processingTime: z.string().min(1, "Processing time is required"),
  riskLevel: z.enum(["low", "medium", "high"]),
  iconUrl: z.string().optional(),
  explorerUrl: z.string().optional(),
});

// GET: Fetch all crypto deposit configurations
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Crypto Deposits API - Starting GET request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Crypto Deposits API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is superadmin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Crypto Deposits API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Superadmin access required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get("enabledOnly") === "true";

    // Build where clause
    const whereClause = enabledOnly ? { isEnabled: true } : {};

    // Fetch crypto deposit configurations
    const configs = await prisma.cryptoDepositConfig.findMany({
      where: whereClause,
      orderBy: [
        { isEnabled: "desc" },
        { chainName: "asc" },
      ],
    });

    // Transform the data to match the frontend interface
    const transformedConfigs: CryptoDepositConfig[] = configs.map((config) => ({
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
      processingTime: config.processingTime,
      riskLevel: config.riskLevel as "low" | "medium" | "high",
      iconUrl: config.iconUrl || undefined,
      explorerUrl: config.explorerUrl || undefined,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      lastModifiedBy: config.lastModifiedBy || "",
    }));

    const response: CryptoDepositConfigsResponse = {
      configs: transformedConfigs,
      totalCount: transformedConfigs.length,
    };

    console.log(`✅ Crypto Deposits API - Returning ${configs.length} configurations`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Crypto Deposits API - Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new crypto deposit configuration
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Crypto Deposits API - Starting POST request");

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("❌ Crypto Deposits API - Authentication failed:", sessionError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is superadmin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      console.log(
        "❌ Crypto Deposits API - Authorization failed. User role:",
        currentUserProfile?.role
      );
      return NextResponse.json(
        { error: "Unauthorized - Superadmin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createConfigSchema.parse(body);

    // Check if chain ID already exists
    const existingConfig = await prisma.cryptoDepositConfig.findUnique({
      where: { chainId: validatedData.chainId },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: "Chain ID already exists" },
        { status: 409 }
      );
    }

    // Create new crypto deposit configuration
    const newConfig = await prisma.cryptoDepositConfig.create({
      data: {
        chainId: validatedData.chainId,
        chainName: validatedData.chainName,
        displayName: validatedData.displayName,
        isEnabled: validatedData.isEnabled,
        supportedTokens: validatedData.supportedTokens,
        depositInstructions: validatedData.depositInstructions,
        minimumAmount: validatedData.minimumAmount,
        maximumAmount: validatedData.maximumAmount,
        processingTime: validatedData.processingTime,
        riskLevel: validatedData.riskLevel,
        iconUrl: validatedData.iconUrl,
        explorerUrl: validatedData.explorerUrl,
        lastModifiedBy: currentUserProfile.id,
        lastModifiedAt: new Date(),
      },
    });

    // Create history record
    await prisma.cryptoDepositHistory.create({
      data: {
        configId: newConfig.id,
        changeType: "created",
        newValues: {
          chainId: validatedData.chainId,
          chainName: validatedData.chainName,
          displayName: validatedData.displayName,
          isEnabled: validatedData.isEnabled,
          supportedTokens: validatedData.supportedTokens,
          depositInstructions: validatedData.depositInstructions,
          minimumAmount: validatedData.minimumAmount,
          maximumAmount: validatedData.maximumAmount,
            processingTime: validatedData.processingTime,
          riskLevel: validatedData.riskLevel,
          iconUrl: validatedData.iconUrl,
          explorerUrl: validatedData.explorerUrl,
        },
        changeReason: "Initial configuration created",
        modifiedBy: currentUserProfile.id,
      },
    });

    // Transform response
    const transformedConfig: CryptoDepositConfig = {
      id: newConfig.id,
      chainId: newConfig.chainId,
      chainName: newConfig.chainName,
      displayName: newConfig.displayName,
      isEnabled: newConfig.isEnabled,
      supportedTokens: Array.isArray(newConfig.supportedTokens) 
        ? (newConfig.supportedTokens as unknown as SupportedToken[]).map((token, index) => ({
            id: `${newConfig.chainId}-${token.symbol}-${index}`,
            ...token,
          }))
        : [],
      depositInstructions: newConfig.depositInstructions,
      minimumAmount: newConfig.minimumAmount ? parseFloat(newConfig.minimumAmount.toString()) : undefined,
      maximumAmount: newConfig.maximumAmount ? parseFloat(newConfig.maximumAmount.toString()) : undefined,
      processingTime: newConfig.processingTime,
      riskLevel: newConfig.riskLevel as "low" | "medium" | "high",
      iconUrl: newConfig.iconUrl || undefined,
      explorerUrl: newConfig.explorerUrl || undefined,
      createdAt: newConfig.createdAt.toISOString(),
      updatedAt: newConfig.updatedAt.toISOString(),
      lastModifiedBy: newConfig.lastModifiedBy || "",
    };

    console.log("✅ Crypto Deposits API - Configuration created successfully");
    return NextResponse.json({ config: transformedConfig }, { status: 201 });
  } catch (error) {
    console.error("❌ Crypto Deposits API - Error creating configuration:", error);
    
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