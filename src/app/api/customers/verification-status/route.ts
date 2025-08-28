import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBridgeApiClient } from "@/lib/bridge/api";
import type { BridgeCustomerResponse } from "@/types/bridge";

// GET: Check KYC verification status
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 KYC Verification Status API - Starting request");

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const customerId = searchParams.get("customerId");
    const profileId = searchParams.get("profileId");
    const syncFromBridge = searchParams.get("syncFromBridge") === "true";

    if (!email && !customerId && !profileId) {
      return NextResponse.json(
        { error: "Email, customer ID, or profile ID is required" },
        { status: 400 }
      );
    }

    console.log("📋 Status check parameters:", {
      email,
      customerId,
      profileId,
      syncFromBridge,
    });

    // Find customer profile
    let profile;
    if (email) {
      profile = await prisma.profile.findUnique({
        where: { email },
        include: {
          kycProfile: {
            include: {
              addresses: true,
              identifyingInformation: true,
              documents: true,
            },
          },
        },
      });
    } else if (profileId) {
      profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          kycProfile: {
            include: {
              addresses: true,
              identifyingInformation: true,
              documents: true,
            },
          },
        },
      });
    } else if (customerId) {
      profile = await prisma.profile.findFirst({
        where: {
          kycProfile: {
            bridgeCustomerId: customerId,
          },
        },
        include: {
          kycProfile: {
            include: {
              addresses: true,
              identifyingInformation: true,
              documents: true,
            },
          },
        },
      });
    }

    if (!profile || !profile.kycProfile) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    let bridgeCustomer: BridgeCustomerResponse | null = null;
    let statusUpdated = false;

    // Sync with Bridge API if requested or if local status is pending
    if (syncFromBridge || ["pending", "under_review", "incomplete"].includes(profile.kycProfile.kycStatus || "")) {
      try {
        console.log("🌉 Syncing status with Bridge.xyz API...");
        const bridgeApiClient = getBridgeApiClient();
        
        if (profile.kycProfile.bridgeCustomerId) {
          const bridgeResponse = await bridgeApiClient.getCustomerStatus(
            profile.kycProfile.bridgeCustomerId
          );

          if (bridgeResponse.success && bridgeResponse.data) {
            bridgeCustomer = bridgeResponse.data;
            console.log("✅ Bridge status retrieved:", bridgeCustomer.status);

            // Update local database if status has changed
            if (bridgeCustomer.status !== profile.kycProfile.kycStatus) {
              console.log(`🔄 Updating KYC status: ${profile.kycProfile.kycStatus} → ${bridgeCustomer.status}`);
              
              await prisma.kYCProfile.update({
                where: { id: profile.kycProfile.id },
                data: {
                  kycStatus: bridgeCustomer.status,
                  kybStatus: bridgeCustomer.status, // For business customers
                  bridgeRawResponse: bridgeCustomer as unknown as Record<string, unknown>,
                  updatedAt: new Date(),
                },
              });

              // Create an audit event
              await prisma.event.create({
                data: {
                  type: 'KYC_STATUS_UPDATED',
                  module: 'VERIFICATION',
                  description: `KYC status updated from ${profile.kycProfile.kycStatus} to ${bridgeCustomer.status}`,
                  profileId: profile.id,
                  metadata: {
                    previous_status: profile.kycProfile.kycStatus,
                    new_status: bridgeCustomer.status,
                    sync_source: 'bridge_api',
                    customer_id: profile.kycProfile.bridgeCustomerId,
                  },
                },
              });

              statusUpdated = true;
              profile.kycProfile.kycStatus = bridgeCustomer.status;
            }
          } else {
            console.warn("⚠️ Failed to fetch Bridge status:", bridgeResponse.error);
          }
        } else {
          console.warn("⚠️ No Bridge customer ID found for profile");
        }
      } catch (error) {
        console.error("❌ Bridge API sync error:", error);
        // Don't fail the request, just log the error and continue with local data
      }
    }

    // Prepare verification status response
    const verificationStatus = {
      profileId: profile.id,
      email: profile.email,
      customerType: profile.kycProfile.customerType,
      kycStatus: profile.kycProfile.kycStatus,
      kybStatus: profile.kycProfile.kybStatus,
      bridgeCustomerId: profile.kycProfile.bridgeCustomerId,
      statusUpdated,
      lastUpdated: profile.kycProfile.updatedAt,
      createdAt: profile.kycProfile.createdAt,
    };

    // Add additional details based on status
    const additionalInfo: any = {};

    if (profile.kycProfile.kycStatus === 'rejected' && bridgeCustomer?.rejection_reasons) {
      additionalInfo.rejectionReasons = bridgeCustomer.rejection_reasons;
    }

    if (profile.kycProfile.kycStatus === 'incomplete' && bridgeCustomer?.required_fields) {
      additionalInfo.requiredFields = bridgeCustomer.required_fields;
    }

    if (profile.kycProfile.kycStatus === 'under_review') {
      const expectedDays = profile.kycProfile.customerType === 'business' ? '3-5' : '1-2';
      additionalInfo.expectedProcessingTime = `${expectedDays} business days`;
    }

    // Include basic profile information
    const responseData = {
      success: true,
      verification: verificationStatus,
      customer: {
        name: profile.kycProfile.customerType === 'individual' 
          ? `${profile.firstName} ${profile.lastName}`.trim()
          : profile.kycProfile.businessLegalName,
        customerType: profile.kycProfile.customerType,
        accountPurpose: profile.kycProfile.accountPurpose,
      },
      ...additionalInfo,
    };

    console.log("✅ Verification status retrieved successfully");
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ KYC verification status error:", error);
    
    return NextResponse.json(
      {
        error: "Failed to retrieve verification status",
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

// POST: Retry KYC verification process
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 KYC Verification Retry API - Starting request");

    const body = await request.json();
    const { email, customerId, profileId } = body;

    if (!email && !customerId && !profileId) {
      return NextResponse.json(
        { error: "Email, customer ID, or profile ID is required" },
        { status: 400 }
      );
    }

    // Find customer profile
    let profile;
    if (email) {
      profile = await prisma.profile.findUnique({
        where: { email },
        include: { kycProfile: true },
      });
    } else if (profileId) {
      profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: { kycProfile: true },
      });
    } else if (customerId) {
      profile = await prisma.profile.findFirst({
        where: {
          kycProfile: {
            bridgeCustomerId: customerId,
          },
        },
        include: { kycProfile: true },
      });
    }

    if (!profile || !profile.kycProfile) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if retry is allowed based on current status
    const retryableStatuses = ['rejected', 'incomplete', 'error'];
    if (!retryableStatuses.includes(profile.kycProfile.kycStatus || "")) {
      return NextResponse.json(
        { 
          error: "Verification retry not allowed", 
          details: `Current status '${profile.kycProfile.kycStatus}' does not allow retry`
        },
        { status: 400 }
      );
    }

    console.log("🌉 Requesting KYC retry via Bridge.xyz API...");
    const bridgeApiClient = getBridgeApiClient();
    
    if (!profile.kycProfile.bridgeCustomerId) {
      return NextResponse.json(
        { error: "Bridge customer ID not found" },
        { status: 400 }
      );
    }

    // Request retry from Bridge API
    const retryResponse = await bridgeApiClient.retryCustomerVerification(
      profile.kycProfile.bridgeCustomerId
    );

    if (!retryResponse.success) {
      console.error("❌ Bridge retry failed:", retryResponse.error);
      return NextResponse.json(
        { 
          error: "Verification retry failed", 
          details: retryResponse.error?.message || "Bridge API error"
        },
        { status: 400 }
      );
    }

    // Update local status
    await prisma.kYCProfile.update({
      where: { id: profile.kycProfile.id },
      data: {
        kycStatus: 'pending',
        kybStatus: profile.kycProfile.customerType === 'business' ? 'pending' : null,
        updatedAt: new Date(),
      },
    });

    // Create audit event
    await prisma.event.create({
      data: {
        type: 'KYC_RETRY_REQUESTED',
        module: 'VERIFICATION',
        description: `KYC verification retry requested for ${profile.email}`,
        profileId: profile.id,
        metadata: {
          previous_status: profile.kycProfile.kycStatus,
          retry_reason: body.reason || 'manual_retry',
          customer_id: profile.kycProfile.bridgeCustomerId,
        },
      },
    });

    console.log("✅ KYC retry requested successfully");
    return NextResponse.json({
      success: true,
      message: "Verification retry requested successfully",
      newStatus: 'pending',
    });

  } catch (error) {
    console.error("❌ KYC verification retry error:", error);
    
    return NextResponse.json(
      {
        error: "Failed to retry verification",
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}