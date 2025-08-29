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

    // Only allow users to view their own profile (or admin users to view any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to view this profile" },
        { status: 403 }
      );
    }

    let profile;
    try {
      profile = await prisma.profile.findUnique({
        where: { userId },
      });
    } catch (dbError) {
      console.error("Database error when fetching profile:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!profile) {
      console.log(`Profile not found for userId: ${userId}`);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Convertir el formato para que sea compatible con el middleware
    const middlewareProfile = {
      id: profile.id,
      email: profile.email || "",
      name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
      role: profile.role,
      isActive: profile.status === "active",
      isDeleted: profile.status === "deleted",
      roleId: profile.id,
      permissions: {
        dashboard: profile.role === "ADMIN" || profile.role === "SUPERADMIN",
        analytics: profile.role === "SUPERADMIN",
        users: profile.role === "ADMIN" || profile.role === "SUPERADMIN",
        kyc: profile.role === "ADMIN" || profile.role === "SUPERADMIN",
        wallets: profile.role === "ADMIN" || profile.role === "SUPERADMIN",
        settings: profile.role === "ADMIN" || profile.role === "SUPERADMIN",
      },
    };

    // Debug logging
    console.log(`[API] Profile data for ${userId}:`, {
      originalStatus: profile.status,
      convertedIsActive: middlewareProfile.isActive,
      role: profile.role,
    });

    return NextResponse.json({ profile: middlewareProfile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Only allow users to update their own profile (or admin users to update any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to update this profile" },
        { status: 403 }
      );
    }

    const json = await request.json();

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        firstName: json.firstName || undefined,
        lastName: json.lastName || undefined,
        status: json.status || undefined,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
