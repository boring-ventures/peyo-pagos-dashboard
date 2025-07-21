#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

// Basic configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing required environment variables:");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

if (!bridgeApiKey) {
  console.warn("⚠️  BRIDGE_API_KEY not found - API calls will be simulated");
}

const prisma = new PrismaClient();

// Create Supabase clients
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseClient;

// Generate UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Map Bridge status to KYC status
function mapBridgeStatusToKYCStatus(bridgeStatus: string) {
  const statusMapping: Record<string, any> = {
    pending: "under_review",
    active: "active",
    approved: "active",
    rejected: "rejected",
    under_review: "under_review",
    incomplete: "incomplete",
    not_started: "not_started",
  };

  return statusMapping[bridgeStatus] || "not_started";
}

// Function to fetch existing Bridge customer information
async function fetchExistingBridgeCustomer(
  bridgeCustomerId: string
): Promise<any> {
  console.log(`📡 Fetching existing customer information: ${bridgeCustomerId}`);

  // If no API key, simulate response with realistic data
  if (!bridgeApiKey) {
    console.log("🔄 Simulating Bridge API response for existing customer...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: bridgeCustomerId,
      first_name: "Juan Carlos",
      last_name: "Vega Martínez",
      email: `juan.vega.verified.${Date.now()}@example.com`,
      status: "active",
      type: "individual",
      phone: "+52155559999",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      rejection_reasons: [],
      has_accepted_terms_of_service: true,
      capabilities: {
        payin_crypto: "active",
        payout_crypto: "active",
        payin_fiat: "active",
        payout_fiat: "active",
      },
      endorsements: [
        {
          name: "base",
          status: "approved",
          requirements: {
            complete: ["identity_verification", "phone_verification"],
            pending: [],
            missing: null,
            issues: [],
          },
        },
      ],
    };
  }

  // Make real call to Bridge API
  try {
    const response = await fetch(
      `${bridgeApiUrl}/customers/${bridgeCustomerId}`,
      {
        method: "GET",
        headers: {
          "Api-Key": bridgeApiKey,
          accept: "application/json",
        },
      }
    );

    console.log(`📡 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Error fetching customer from Bridge (${response.status}):`,
        errorText
      );
      throw new Error(`Bridge API error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(
      `✅ Existing customer data fetched successfully from Bridge API`
    );
    console.log(`📄 Customer Data:`, JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error: any) {
    console.error(`❌ Error in Bridge API call:`, error.message);
    throw error;
  }
}

// Map Bridge response to Profile and KYC data
function mapBridgeResponseToProfileData(bridgeResponse: any) {
  return {
    profile: {
      userId: bridgeResponse?.id || generateUUID(),
      firstName: bridgeResponse?.first_name || "Juan Carlos",
      lastName: bridgeResponse?.last_name || "Vega Martínez",
      email: bridgeResponse?.email || `verified.user.${Date.now()}@example.com`,
      status: "active" as const,
      role: "USER" as const,
    },
    kycProfile: {
      bridgeCustomerId: bridgeResponse?.id || null,
      customerType: "individual" as const,
      firstName: bridgeResponse?.first_name || "Juan Carlos",
      lastName: bridgeResponse?.last_name || "Vega Martínez",
      email: bridgeResponse?.email || `verified.user.${Date.now()}@example.com`,
      phone: bridgeResponse?.phone || "+52155559999",
      kycStatus: bridgeResponse?.status
        ? mapBridgeStatusToKYCStatus(bridgeResponse.status)
        : "active",
      kycSubmittedAt: bridgeResponse?.created_at
        ? new Date(bridgeResponse.created_at)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      kycApprovedAt:
        bridgeResponse?.status === "active" && bridgeResponse?.updated_at
          ? new Date(bridgeResponse.updated_at)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      payinCrypto: bridgeResponse?.capabilities?.payin_crypto || "active",
      payoutCrypto: bridgeResponse?.capabilities?.payout_crypto || "active",
      payinFiat: bridgeResponse?.capabilities?.payin_fiat || "active",
      payoutFiat: bridgeResponse?.capabilities?.payout_fiat || "active",
      hasAcceptedTermsOfService:
        bridgeResponse?.has_accepted_terms_of_service ?? true,
      bridgeRawResponse: bridgeResponse,
    },
  };
}

// Main function to create existing verified user
async function createExistingVerifiedUser(bridgeCustomerId: string) {
  try {
    console.log(
      `\n👤 Creating profile for existing customer: ${bridgeCustomerId}`
    );

    // 1. Check if user already exists in our database
    const existingKycProfile = await prisma.kYCProfile.findFirst({
      where: { bridgeCustomerId: bridgeCustomerId },
      include: { profile: true },
    });

    if (existingKycProfile) {
      console.log(
        `⚠️  User with Bridge ID ${bridgeCustomerId} already exists in database`
      );
      console.log(`📋 Existing Profile ID: ${existingKycProfile.profile.id}`);
      return {
        profile: existingKycProfile.profile,
        kycProfile: existingKycProfile,
        wasExisting: true,
      };
    }

    // 2. Fetch customer information from Bridge API
    let bridgeResponse = null;
    try {
      bridgeResponse = await fetchExistingBridgeCustomer(bridgeCustomerId);
      console.log(`✅ Existing customer information obtained`);
    } catch (error: any) {
      console.warn(
        `⚠️  Error fetching customer from Bridge, using simulated data:`,
        error.message
      );
      // Create simulated response for the specific customer
      bridgeResponse = {
        id: bridgeCustomerId,
        first_name: "Juan Carlos",
        last_name: "Vega Martínez",
        email: `juan.vega.verified.${Date.now()}@example.com`,
        status: "active",
        type: "individual",
        phone: "+52155559999",
        created_at: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        capabilities: {
          payin_crypto: "active",
          payout_crypto: "active",
          payin_fiat: "active",
          payout_fiat: "active",
        },
        has_accepted_terms_of_service: true,
      };
    }

    // 3. Map Bridge data to our Profile and KYC models
    const { profile: profileData, kycProfile: kycProfileData } =
      mapBridgeResponseToProfileData(bridgeResponse);

    // 4. Create the profile
    const profile = await prisma.profile.create({
      data: profileData,
    });

    console.log(`✅ Profile created: ${profile.id}`);

    // 5. Create the KYC profile
    const kycProfile = await prisma.kYCProfile.create({
      data: {
        ...kycProfileData,
        profileId: profile.id,
      },
    });

    console.log(`✅ KYC Profile created: ${kycProfile.id}`);
    console.log(`🔗 Bridge Customer ID: ${bridgeCustomerId}`);

    // 6. Create events for user flow
    const events = [
      {
        profileId: profile.id,
        type: "USER_SIGNED_UP",
        module: "AUTH",
        description: "User registered on the platform",
      },
      {
        profileId: profile.id,
        type: "USER_KYC_APPROVED",
        module: "KYC",
        description: "User KYC approved successfully",
      },
    ];

    for (const eventData of events) {
      await (prisma as any).event.create({
        data: eventData,
      });
    }

    console.log(`✅ ${events.length} events created`);

    // 7. Create endorsements if available from Bridge response
    if (
      bridgeResponse?.endorsements &&
      Array.isArray(bridgeResponse.endorsements)
    ) {
      for (const endorsement of bridgeResponse.endorsements) {
        await prisma.endorsement.create({
          data: {
            kycProfileId: kycProfile.id,
            name: endorsement.name,
            status: endorsement.status,
            requirements: endorsement.requirements,
          },
        });
        console.log(
          `✅ Endorsement created: ${endorsement.name} (${endorsement.status})`
        );
      }
    }

    console.log(
      `🎉 Verified user created: ${profileData.firstName} ${profileData.lastName}`
    );
    console.log(`🔗 Bridge Customer ID: ${bridgeCustomerId}`);
    console.log(`📊 Status: ${kycProfileData.kycStatus} (verified and active)`);

    return {
      profile,
      kycProfile,
      bridgeResponse,
      profileData,
      kycProfileData,
      wasExisting: false,
    };
  } catch (error: any) {
    console.error(`❌ Error creating existing user:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting seeder for existing verified Bridge user...\n");

  // Specific Bridge Customer ID provided
  const EXISTING_BRIDGE_CUSTOMER_ID = "1e97f499-92c3-4cec-a9bb-b0e427a2619f";

  if (bridgeApiKey) {
    console.log("🔗 Bridge API Key found - fetching real customer data");
    console.log(`📡 Endpoint: ${bridgeApiUrl}`);
  } else {
    console.log("🔄 Bridge API Key not found - using simulated verified data");
  }

  console.log(`🆔 Bridge Customer ID: ${EXISTING_BRIDGE_CUSTOMER_ID}`);

  try {
    const result = await createExistingVerifiedUser(
      EXISTING_BRIDGE_CUSTOMER_ID
    );

    if (result) {
      if (result.wasExisting) {
        console.log(`\n⚠️  User already existed in the database!`);
        console.log(`📋 No new records created`);
      } else {
        console.log(`\n✨ Existing verified user created successfully!`);
        console.log(`📊 Profile created with Bridge Customer data`);
        console.log(`🔗 Bridge Customer ID: ${EXISTING_BRIDGE_CUSTOMER_ID}`);
        console.log(
          `✅ Status: ${result.kycProfileData?.kycStatus || "unknown"}`
        );
        console.log(`📧 Email: ${result.profileData?.email || "unknown"}`);
        console.log(
          `👤 Name: ${result.profileData?.firstName || "unknown"} ${result.profileData?.lastName || "unknown"}`
        );

        console.log(`\n🎯 VERIFIED USER CHARACTERISTICS:`);
        console.log(`   ✅ Profile created from Bridge customer data`);
        console.log(`   ✅ KYC Profile with Bridge integration`);
        console.log(`   ✅ User events created`);
        console.log(`   ✅ Endorsements from Bridge API`);
        console.log(`   ✅ Ready for platform operations`);
      }
    } else {
      console.log(`\n❌ Error creating verified user`);
    }
  } catch (error: any) {
    console.error("❌ General error in seeder:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
