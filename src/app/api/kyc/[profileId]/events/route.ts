import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    // Verify profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch events for the profile, ordered by creation date (newest first)
    const events = await prisma.event.findMany({
      where: {
        profileId: profileId,
        module: {
          in: ["AUTH", "KYC"], // Only show AUTH and KYC events as requested
        },
      },
      orderBy: {
        createdAt: "desc", // Newest first (standard for activity feeds)
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching profile events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
