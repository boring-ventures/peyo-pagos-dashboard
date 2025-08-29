import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Document upload request received');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const documentSide = formData.get('documentSide') as string; // 'front' | 'back'

    console.log('📄 File upload details:', {
      fileName: file?.name,
      fileSize: file?.size,
      documentType,
      documentSide,
      userId: user.id
    });

    if (!file || !documentType) {
      console.error('Missing file or document type');
      return NextResponse.json({ error: "File and document type are required" }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${documentType}/${documentSide || 'document'}_${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('📤 Uploading to Supabase storage:', fileName);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('❌ Supabase storage error:', error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    console.log('✅ File uploaded successfully:', data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log('🔗 Public URL generated:', publicUrlData.publicUrl);

    return NextResponse.json({
      success: true,
      fileName: fileName,
      publicUrl: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}