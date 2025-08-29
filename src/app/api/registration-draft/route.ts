import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { formData, currentStep, files } = body;

    // Save or update the registration draft
    const draft = await prisma.registrationDraft.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        formData: formData,
        currentStep: currentStep,
        files: files || {},
        updatedAt: new Date(),
      },
      update: {
        formData: formData,
        currentStep: currentStep,
        files: files || {},
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, draftId: draft.id });
  } catch (error) {
    console.error("Error saving registration draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get the registration draft
    const draft = await prisma.registrationDraft.findUnique({
      where: { userId: user.id },
    });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error loading registration draft:", error);
    return NextResponse.json(
      { error: "Failed to load draft" },
      { status: 500 }
    );
  }
}