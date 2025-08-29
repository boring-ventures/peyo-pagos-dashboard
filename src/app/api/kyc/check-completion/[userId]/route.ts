import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;

    // Create Supabase client
    const supabase = createRouteHandlerClient({ 
      cookies 
    });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user exists in profiles
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({
        hasProfile: false,
        hasKYCProfile: false,
        kycStatus: null,
        isRegistrationComplete: false,
      });
    }

    // Check if KYC profile exists and its status
    const kycProfile = await prisma.kYCProfile.findUnique({
      where: { profileId: profile.id },
    });

    if (!kycProfile) {
      return NextResponse.json({
        hasProfile: true,
        hasKYCProfile: false,
        kycStatus: null,
        isRegistrationComplete: false,
      });
    }

    // Determine if registration is complete based on KYC status
    // A user is considered to have completed registration if:
    // 1. They have a KYC profile
    // 2. KYC status is not "not_started" (they've at least submitted something)
    // 3. They have accepted terms of service
    // 4. They have the required information filled out
    const isRegistrationComplete = 
      kycProfile.kycStatus !== "not_started" &&
      kycProfile.hasAcceptedTermsOfService === true &&
      !!kycProfile.firstName &&
      !!kycProfile.lastName &&
      !!kycProfile.email &&
      !!kycProfile.birthDate;

    return NextResponse.json({
      hasProfile: true,
      hasKYCProfile: true,
      kycStatus: kycProfile.kycStatus,
      isRegistrationComplete,
    });

  } catch (error) {
    console.error("Error checking KYC completion:", error);
    return NextResponse.json(
      { error: "Failed to check completion status" },
      { status: 500 }
    );
  }
}