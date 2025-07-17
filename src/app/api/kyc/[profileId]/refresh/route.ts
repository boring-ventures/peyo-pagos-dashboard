import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { KYCStatus } from "@prisma/client";

const bridgeApiKey = process.env.BRIDGE_API_KEY;
const bridgeApiUrl =
  process.env.BRIDGE_API_URL || "https://api.sandbox.bridge.xyz/v0";

// Mapeo de status Bridge API a nuestro enum KYCStatus
function mapBridgeStatusToKYCStatus(bridgeStatus: string): string {
  const statusMapping: Record<string, string> = {
    pending: "under_review",
    active: "active",
    approved: "active",
    rejected: "rejected",
    under_review: "under_review",
    incomplete: "incomplete",
    not_started: "not_started",
    awaiting_questionnaire: "awaiting_questionnaire",
    awaiting_ubo: "awaiting_ubo",
    paused: "paused",
    offboarded: "offboarded",
  };

  return statusMapping[bridgeStatus] || "not_started";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const profileId = (await params).profileId;

    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Check if user is admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No autorizado - Se requiere acceso de administrador" },
        { status: 403 }
      );
    }

    // Get profile with KYC data
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        kycProfile: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    if (!profile.kycProfile) {
      return NextResponse.json(
        { error: "Perfil KYC no encontrado" },
        { status: 404 }
      );
    }

    if (!profile.kycProfile.bridgeCustomerId) {
      return NextResponse.json(
        { error: "Customer ID de Bridge no encontrado" },
        { status: 400 }
      );
    }

    if (!bridgeApiKey) {
      return NextResponse.json(
        { error: "Bridge API Key no configurada" },
        { status: 500 }
      );
    }

    // Make API call to Bridge Protocol
    console.log(
      `🔄 Refrescando datos de Bridge para customer: ${profile.kycProfile.bridgeCustomerId}`
    );

    const response = await fetch(
      `${bridgeApiUrl}/customers/${profile.kycProfile.bridgeCustomerId}`,
      {
        method: "GET",
        headers: {
          "Api-Key": bridgeApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error de Bridge API (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Error de Bridge API: ${response.status}` },
        { status: response.status }
      );
    }

    const bridgeData = await response.json();
    console.log(`✅ Datos actualizados recibidos de Bridge Protocol`);

    // Map Bridge data to our KYC fields
    const mappedData = {
      firstName: bridgeData.first_name || profile.kycProfile.firstName,
      lastName: bridgeData.last_name || profile.kycProfile.lastName,
      email: bridgeData.email || profile.kycProfile.email,
      kycStatus: bridgeData.status
        ? (mapBridgeStatusToKYCStatus(bridgeData.status) as KYCStatus)
        : profile.kycProfile.kycStatus,
      kycApprovedAt:
        (bridgeData.status === "active" || bridgeData.status === "approved") &&
        bridgeData.updated_at
          ? new Date(bridgeData.updated_at)
          : profile.kycProfile.kycApprovedAt,
      kycRejectedAt:
        bridgeData.status === "rejected" && bridgeData.updated_at
          ? new Date(bridgeData.updated_at)
          : profile.kycProfile.kycRejectedAt,
      kycRejectionReason:
        bridgeData.rejection_reasons?.[0]?.reason ||
        profile.kycProfile.kycRejectionReason,
      payinCrypto:
        bridgeData.capabilities?.payin_crypto || profile.kycProfile.payinCrypto,
      payoutCrypto:
        bridgeData.capabilities?.payout_crypto ||
        profile.kycProfile.payoutCrypto,
      payinFiat:
        bridgeData.capabilities?.payin_fiat || profile.kycProfile.payinFiat,
      payoutFiat:
        bridgeData.capabilities?.payout_fiat || profile.kycProfile.payoutFiat,
      futureRequirementsDue:
        bridgeData.future_requirements_due ||
        profile.kycProfile.futureRequirementsDue,
      requirementsDue:
        bridgeData.requirements_due || profile.kycProfile.requirementsDue,
      hasAcceptedTermsOfService:
        bridgeData.has_accepted_terms_of_service ??
        profile.kycProfile.hasAcceptedTermsOfService,
      bridgeRawResponse: bridgeData, // Store complete response for debugging
    };

    // Update KYC profile with new data
    await prisma.kYCProfile.update({
      where: { id: profile.kycProfile.id },
      data: mappedData,
    });

    // Handle rejection reasons
    if (
      bridgeData.rejection_reasons &&
      bridgeData.rejection_reasons.length > 0
    ) {
      // Delete old rejection reasons
      await prisma.rejectionReason.deleteMany({
        where: { kycProfileId: profile.kycProfile.id },
      });

      // Create new rejection reasons
      for (const rejectionReason of bridgeData.rejection_reasons) {
        await prisma.rejectionReason.create({
          data: {
            kycProfileId: profile.kycProfile.id,
            reason: rejectionReason.reason,
            developerReason:
              rejectionReason.developer_reason || rejectionReason.reason,
            bridgeCreatedAt: rejectionReason.created_at
              ? new Date(rejectionReason.created_at)
              : new Date(),
          },
        });
      }
    }

    // Handle endorsements
    if (bridgeData.endorsements && Array.isArray(bridgeData.endorsements)) {
      // Delete old endorsements
      await prisma.endorsement.deleteMany({
        where: { kycProfileId: profile.kycProfile.id },
      });

      // Create new endorsements
      for (const endorsement of bridgeData.endorsements) {
        await prisma.endorsement.create({
          data: {
            kycProfileId: profile.kycProfile.id,
            name: endorsement.name,
            status: endorsement.status,
            requirements: endorsement.requirements,
          },
        });
      }
    }

    console.log(`✅ Datos actualizados en base de datos local`);

    return NextResponse.json({
      success: true,
      message:
        "Datos del cliente actualizados exitosamente desde Bridge Protocol",
      bridgeStatus: bridgeData.status,
      updatedFields: Object.keys(mappedData).length,
      endorsements: bridgeData.endorsements?.length || 0,
      rejectionReasons: bridgeData.rejection_reasons?.length || 0,
    });
  } catch (error) {
    console.error("Error refrescando datos desde Bridge:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
