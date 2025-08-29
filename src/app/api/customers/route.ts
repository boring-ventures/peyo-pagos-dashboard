import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { hashPasswordServer } from "@/lib/auth/password-server";
import { getBridgeApiClient, bridgeUtils } from "@/lib/bridge/api";
import { 
  convertCustomerToBridgeFormat, 
  validateCustomerDataForBridge,
  sanitizeCustomerDataForLogging,
  processFileForBridge
} from "@/lib/bridge/validators";
import { customerRegistrationSchema } from "@/types/customer";
import type { CustomerRegistrationData, RegistrationResponse } from "@/types/customer";
import type { BridgeCustomerResponse, ProcessedFile } from "@/types/bridge";
import type { KYCStatus, DocumentType, DocumentPurpose } from "@prisma/client";

// Helper function to map document types to valid Prisma enum values
function mapToValidDocumentType(docType: string | undefined): DocumentType {
  const validTypes: Record<string, DocumentType> = {
    'drivers_license': 'drivers_license',
    'matriculate_id': 'matriculate_id',
    'military_id': 'military_id',
    'national_id': 'national_id',
    'passport': 'passport',
    'permanent_residency_id': 'permanent_residency_id',
    'state_or_provisional_id': 'state_or_provisional_id',
    'visa': 'visa',
    // Map unsupported types to closest match
    'ssn': 'national_id',
    'ein': 'national_id',
  };
  
  return validTypes[docType || ''] || 'national_id';
}

// Helper function to map document purposes to valid Prisma enum values
function mapToValidDocumentPurposes(purposes: string[] | undefined): DocumentPurpose[] {
  if (!purposes || purposes.length === 0) return ['other'];
  
  const validPurposes: Record<string, DocumentPurpose> = {
    'proof_of_account_purpose': 'proof_of_account_purpose',
    'proof_of_address': 'proof_of_address',
    'proof_of_individual_name_change': 'proof_of_individual_name_change',
    'proof_of_relationship': 'proof_of_relationship',
    'proof_of_source_of_funds': 'proof_of_source_of_funds',
    'proof_of_source_of_wealth': 'proof_of_source_of_wealth',
    'proof_of_tax_identification': 'proof_of_tax_identification',
    'other': 'other',
    // Map unsupported purposes to closest match
    'statement_of_funds': 'proof_of_source_of_funds',
    'flow_of_funds': 'proof_of_source_of_funds',
    'ownership_document': 'other',
    'formation_document': 'other',
  };
  
  return purposes
    .map(purpose => validPurposes[purpose])
    .filter(Boolean)
    .slice(0, 1); // Take only first valid purpose since array handling is complex
}

// POST: Create new customer with KYC/KYB processing
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Customer Registration API - Starting request");

    // Parse request body (could be JSON or FormData with files)
    let customerData: CustomerRegistrationData;
    const uploadedFiles: Map<string, ProcessedFile> = new Map();

    const contentType = request.headers.get('content-type');
    console.log("📋 Request Content-Type:", contentType);
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart form data with files
      const formData = await request.formData();
      console.log("📁 FormData entries:", Array.from(formData.keys()));
      
      const dataJson = formData.get('data') as string;
      
      if (!dataJson) {
        return NextResponse.json(
          { error: "Customer data is required" },
          { status: 400 }
        );
      }

      try {
        customerData = JSON.parse(dataJson);
      } catch (parseError) {
        console.error("Failed to parse customer data JSON:", parseError);
        return NextResponse.json(
          { error: "Invalid JSON in customer data" },
          { status: 400 }
        );
      }

      // Process uploaded files
      console.log("📁 Processing uploaded files...");
      let fileCount = 0;
      for (const [key, value] of formData.entries()) {
        console.log(`🔍 FormData entry: ${key} = ${value instanceof File ? `File(${value.name}, ${value.size}B)` : typeof value}`);
        
        if (key !== 'data' && value instanceof File) {
          try {
            const processed = await processFileForBridge(value);
            uploadedFiles.set(key, processed);
            fileCount++;
            console.log(`✅ Processed file: ${key} (${Math.round(processed.size / 1024)}KB)`);
          } catch (error) {
            console.error(`❌ Failed to process file ${key}:`, error);
            return NextResponse.json(
              { error: `Failed to process file ${key}: ${error}` },
              { status: 400 }
            );
          }
        }
      }
      console.log(`📊 File processing summary: ${fileCount} files processed, ${uploadedFiles.size} stored`);
    } else {
      // Handle JSON data (no files)
      console.log("📄 Processing JSON request (no files)");
      customerData = await request.json();
    }

    console.log("📋 Customer data received:", {
      type: customerData.customerType,
      email: customerData.email,
      hasFiles: uploadedFiles.size > 0,
    });

    // Reconstruct customer data with placeholder File objects for validation
    // Since files are processed separately, we need to add dummy File objects for schema validation
    const customerDataWithFiles = {
      ...customerData,
      identifyingInformation: customerData.identifyingInformation?.map((doc: { [key: string]: unknown }) => ({
        ...doc,
        // Add placeholder File objects if files were uploaded
        imageFront: uploadedFiles.has('identifyingInformation_0') ? new File([''], 'front.jpg') : undefined,
        imageBack: uploadedFiles.has('identifyingInformation_1') ? new File([''], 'back.jpg') : undefined,
      })) || [],
      documents: customerData.documents?.map((doc: { [key: string]: unknown; purposes?: string[] }, index: number) => ({
        ...doc,
        // Ensure purposes is an array
        purposes: doc.purposes || ["other"],
        // Add placeholder File object if file was uploaded
        file: uploadedFiles.has(`documents_${index}`) ? new File([''], 'document.pdf') : undefined,
      })) || [],
    };

    console.log("🔧 Reconstructed data for validation:", {
      identifyingInfoCount: customerDataWithFiles.identifyingInformation?.length || 0,
      documentsCount: customerDataWithFiles.documents?.length || 0,
      hasImageFront: !!customerDataWithFiles.identifyingInformation?.[0]?.imageFront,
      hasImageBack: !!customerDataWithFiles.identifyingInformation?.[0]?.imageBack,
    });

    // Validate customer data with Zod schema
    const validation = customerRegistrationSchema.safeParse(customerDataWithFiles);
    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.errors);
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    // validatedData is available but not used in current implementation

    // Only allow individual customers for now
    if (customerData.customerType !== 'individual') {
      console.error("❌ Business registration is disabled");
      return NextResponse.json(
        { 
          error: "Business registration is currently disabled", 
          details: "Only individual customer registration is supported at this time"
        },
        { status: 400 }
      );
    }

    // Additional Bridge-specific validation for individual customers
    const bridgeValidationErrors = validateCustomerDataForBridge(customerData);
    if (bridgeValidationErrors.length > 0) {
      console.error("❌ Bridge validation failed:", bridgeValidationErrors);
      return NextResponse.json(
        { 
          error: "Bridge validation failed", 
          details: bridgeValidationErrors.map(error => ({
            field: 'bridge_requirements',
            message: error,
          }))
        },
        { status: 400 }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseServiceKey) {
      console.error("❌ SUPABASE_SERVICE_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);

    // Check for existing customer by email in database
    const existingProfile = await prisma.profile.findUnique({
      where: { email: customerData.email }
    });

    if (existingProfile) {
      console.log("⚠️ Customer already exists in database:", customerData.email);
      return NextResponse.json(
        { error: "Customer already exists with this email address" },
        { status: 409 }
      );
    }

    // Check for existing Supabase auth user by email
    console.log("🔍 Checking for existing Supabase user...");
    const { data: existingUsers, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Adjust as needed
    });

    if (getUserError) {
      console.error("❌ Failed to check existing users:", getUserError);
      return NextResponse.json(
        { error: "Failed to validate user uniqueness" },
        { status: 500 }
      );
    }

    const existingSupabaseUser = existingUsers.users.find(user => user.email === customerData.email);
    
    if (existingSupabaseUser) {
      console.log("⚠️ Supabase auth user already exists:", customerData.email);
      
      // Check if this is an orphaned auth user (no corresponding profile in database)
      if (!existingProfile) {
        console.log("🧹 Found orphaned Supabase user, cleaning up...");
        await supabaseAdmin.auth.admin.deleteUser(existingSupabaseUser.id);
        console.log("✅ Orphaned user cleaned up, proceeding with registration");
      } else {
        return NextResponse.json(
          { error: "Customer already exists with this email address" },
          { status: 409 }
        );
      }
    }

    // Generate secure password for customer
    const generatedPassword = generateSecurePassword();
    const hashedPassword = hashPasswordServer(generatedPassword);

    // Create Supabase auth user
    console.log("👤 Creating Supabase auth user...");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: customerData.email,
      password: hashedPassword,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        customer_type: 'individual',
        role: 'USER',
      },
    });

    if (authError || !authUser.user) {
      console.error("❌ Failed to create auth user:", authError);
      return NextResponse.json(
        { error: `Failed to create user account: ${authError?.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Supabase auth user created:", authUser.user.id);

    let bridgeCustomer: BridgeCustomerResponse | null = null;

    try {
      // Convert to Bridge API format and submit
      console.log("🌉 Submitting to Bridge.xyz API...");
      const bridgeApiClient = getBridgeApiClient();
      // Use original customerData for Bridge conversion since it handles files separately
      const bridgeRequest = convertCustomerToBridgeFormat(customerData, uploadedFiles);

      console.log("📤 Bridge API Request:", sanitizeCustomerDataForLogging(customerData));

      const bridgeResponse = await bridgeApiClient.createCustomer(bridgeRequest);

      if (!bridgeResponse.success || !bridgeResponse.data) {
        console.error("❌ Bridge API failed:", bridgeResponse.error);
        
        // Clean up created auth user
        console.log("🧹 Cleaning up created Supabase user due to Bridge failure...");
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        
        return NextResponse.json(
          { 
            error: "KYC/KYB processing failed", 
            details: bridgeResponse.error?.message || "Unknown Bridge API error",
            bridgeResponse: bridgeResponse.error || bridgeResponse // Include Bridge error details
          },
          { status: 400 }
        );
      }

      bridgeCustomer = bridgeResponse.data;
      console.log("✅ Bridge customer created:", bridgeCustomer.id);

    } catch (bridgeError) {
      console.error("❌ Bridge API error:", bridgeError);
      
      // Clean up created auth user
      console.log("🧹 Cleaning up created Supabase user due to Bridge error...");
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log("✅ Supabase user cleanup successful");
      } catch (cleanupError) {
        console.error("❌ Failed to cleanup Supabase user:", cleanupError);
      }
      
      return NextResponse.json(
        { 
          error: "KYC/KYB processing failed", 
          details: bridgeError instanceof Error ? bridgeError.message : "Bridge API error",
          bridgeResponse: bridgeError // Include error details for debugging
        },
        { status: 500 }
      );
    }

    // Create database records in a transaction
    console.log("💾 Creating database records...");
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create Profile record for individual customer
        const profile = await tx.profile.create({
          data: {
            userId: authUser.user.id,
            email: customerData.email,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            role: 'USER',
            status: 'active',
            userTag: `customer_${Date.now()}`,
          },
        });

        // Prepare KYC profile data
        const kycData = bridgeUtils.formatCustomerForDatabase(bridgeCustomer!);
        
        // Create KYCProfile record for individual customer
        const kycProfile = await tx.kYCProfile.create({
          data: {
            profileId: profile.id,
            customerType: 'individual',
            middleName: customerData.middleName || null,
            phone: customerData.phone,
            birthDate: new Date(customerData.birthDate),
            nationality: customerData.nationality,
            accountPurpose: customerData.accountPurpose,
            accountPurposeOther: customerData.accountPurposeOther || null,
            employmentStatus: customerData.employmentStatus,
            expectedMonthlyPaymentsUsd: bridgeUtils.mapExpectedMonthlyPaymentsToPrisma(customerData.expectedMonthlyPayments),
            mostRecentOccupation: customerData.mostRecentOccupation || null,
            ...kycData, // Bridge API response data
          },
        });

        // Create Address record for individual customer
        const address = customerData.residentialAddress;
          
        await tx.address.create({
          data: {
            kycProfileId: kycProfile.id,
            streetLine1: address.streetLine1,
            streetLine2: address.streetLine2,
            city: address.city,
            subdivision: address.subdivision,
            postalCode: address.postalCode,
            country: address.country,
          },
        });

        // Create Document records
        for (const doc of customerData.identifyingInformation) {
          await tx.identifyingInformation.create({
            data: {
              kycProfileId: kycProfile.id,
              type: mapToValidDocumentType(doc.type),
              issuingCountry: doc.issuingCountry,
              number: doc.number,
              description: doc.description,
              expiration: doc.expiration ? new Date(doc.expiration) : null,
              // Note: Image data is stored in Bridge, not locally
            },
          });
        }

        // Create supporting documents
        if (customerData.documents) {
          for (const doc of customerData.documents) {
            await tx.document.create({
              data: {
                kycProfileId: kycProfile.id,
                purposes: mapToValidDocumentPurposes(doc.purposes),
                description: doc.description,
                // Note: File data is stored in Bridge, not locally
              },
            });
          }
        }

        // Create Event record for audit trail
        await tx.event.create({
          data: {
            type: 'USER_SIGNED_UP',
            module: 'PROFILE',
            description: `Individual customer registered: ${customerData.email}`,
            profileId: profile.id,
            metadata: {
              customer_type: 'individual',
              bridge_customer_id: bridgeCustomer!.id,
              bridge_status: bridgeCustomer!.status,
              registration_source: 'self_service',
              has_uploaded_files: uploadedFiles.size > 0,
            },
          },
        });

        return { profile, kycProfile };
      });

      console.log("✅ Database records created:", {
        profileId: result.profile.id,
        kycProfileId: result.kycProfile.id,
      });

      // TODO: Send welcome email with login instructions
      // await sendWelcomeEmail(customerData.email, generatedPassword);

      // Prepare success response
      const response: RegistrationResponse = {
        success: true,
        customerId: bridgeCustomer.id,
        profileId: result.profile.id,
        kycStatus: bridgeCustomer.status as KYCStatus,
        bridgeResponse: bridgeCustomer, // Include full Bridge response for detailed display
      };

      console.log("✅ Customer registration completed successfully");
      return NextResponse.json(response, { status: 201 });

    } catch (dbError) {
      console.error("❌ Database transaction failed:", dbError);
      
      // Clean up created auth user and Bridge customer
      console.log("🧹 Cleaning up due to database failure...");
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log("✅ Supabase user cleanup successful");
        // Note: Bridge customer cleanup would require Bridge API delete endpoint
      } catch (cleanupError) {
        console.error("❌ Failed to cleanup Supabase user:", cleanupError);
      }
      
      return NextResponse.json(
        { 
          error: "Database operation failed", 
          details: dbError instanceof Error ? dbError.message : "Database error"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Customer registration error:", error);
    
    return NextResponse.json(
      {
        error: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

// GET: Get customer registration status (for checking progress)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const customerId = searchParams.get("customerId");

    if (!email && !customerId) {
      return NextResponse.json(
        { error: "Email or customer ID is required" },
        { status: 400 }
      );
    }

    let profile;
    if (email) {
      profile = await prisma.profile.findUnique({
        where: { email },
        include: {
          kycProfile: true,
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
          kycProfile: true,
        },
      });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        status: profile.status,
        role: profile.role,
        createdAt: profile.createdAt,
      },
      kycStatus: profile.kycProfile?.kycStatus,
      bridgeCustomerId: profile.kycProfile?.bridgeCustomerId,
    });

  } catch (error) {
    console.error("Error fetching customer status:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer status" },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure password for customer account
 */
function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}