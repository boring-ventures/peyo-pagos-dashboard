import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password-crypto";
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

// POST: Create new customer with KYC/KYB processing
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Customer Registration API - Starting request");

    // Parse request body (could be JSON or FormData with files)
    let customerData: CustomerRegistrationData;
    const uploadedFiles: Map<string, ProcessedFile> = new Map();

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart form data with files
      const formData = await request.formData();
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
      for (const [key, value] of formData.entries()) {
        if (key !== 'data' && value instanceof File) {
          try {
            const processed = await processFileForBridge(value);
            uploadedFiles.set(key, processed);
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
    } else {
      // Handle JSON data (no files)
      customerData = await request.json();
    }

    console.log("📋 Customer data received:", {
      type: customerData.customerType,
      email: customerData.email,
      hasFiles: uploadedFiles.size > 0,
    });

    // Validate customer data with Zod schema
    const validation = customerRegistrationSchema.safeParse(customerData);
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

    const validatedData = validation.data;

    // Only allow individual customers for now
    if (validatedData.customerType !== 'individual') {
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
    const bridgeValidationErrors = validateCustomerDataForBridge(validatedData);
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

    // Check for existing customer by email
    const existingProfile = await prisma.profile.findUnique({
      where: { email: validatedData.email }
    });

    if (existingProfile) {
      console.log("⚠️ Customer already exists:", validatedData.email);
      return NextResponse.json(
        { error: "Customer already exists with this email address" },
        { status: 409 }
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

    // Generate secure password for customer
    const generatedPassword = generateSecurePassword();
    const hashedPassword = await hashPassword(generatedPassword);

    // Create Supabase auth user
    console.log("👤 Creating Supabase auth user...");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: hashedPassword,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
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
      const bridgeRequest = convertCustomerToBridgeFormat(validatedData, uploadedFiles);

      console.log("📤 Bridge API Request:", sanitizeCustomerDataForLogging(validatedData));

      const bridgeResponse = await bridgeApiClient.createCustomer(bridgeRequest);

      if (!bridgeResponse.success || !bridgeResponse.data) {
        console.error("❌ Bridge API failed:", bridgeResponse.error);
        
        // Clean up created auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        
        return NextResponse.json(
          { 
            error: "KYC/KYB processing failed", 
            details: bridgeResponse.error?.message || "Unknown Bridge API error"
          },
          { status: 400 }
        );
      }

      bridgeCustomer = bridgeResponse.data;
      console.log("✅ Bridge customer created:", bridgeCustomer.id);

    } catch (bridgeError) {
      console.error("❌ Bridge API error:", bridgeError);
      
      // Clean up created auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return NextResponse.json(
        { 
          error: "KYC/KYB processing failed", 
          details: bridgeError instanceof Error ? bridgeError.message : "Bridge API error"
        },
        { status: 500 }
      );
    }

    // Create database records in a transaction
    console.log("💾 Creating database records...");
    const result = await prisma.$transaction(async (tx) => {
      // Create Profile record for individual customer
      const profile = await tx.profile.create({
        data: {
          userId: authUser.user.id,
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
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
          middleName: validatedData.middleName || null,
          phone: validatedData.phone,
          birthDate: new Date(validatedData.birthDate),
          nationality: validatedData.nationality,
          accountPurpose: validatedData.accountPurpose,
          accountPurposeOther: validatedData.accountPurposeOther || null,
          employmentStatus: validatedData.employmentStatus,
          expectedMonthlyPaymentsUsd: validatedData.expectedMonthlyPayments,
          mostRecentOccupation: validatedData.mostRecentOccupation || null,
          ...kycData, // Bridge API response data
        },
      });

      // Create Address record for individual customer
      const address = validatedData.residentialAddress;
        
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
      for (const doc of validatedData.identifyingInformation) {
        await tx.identifyingInformation.create({
          data: {
            kycProfileId: kycProfile.id,
            type: doc.type,
            issuingCountry: doc.issuingCountry,
            number: doc.number,
            description: doc.description,
            expiration: doc.expiration ? new Date(doc.expiration) : null,
            // Note: Image data is stored in Bridge, not locally
          },
        });
      }

      // Create supporting documents
      if (validatedData.documents) {
        for (const doc of validatedData.documents) {
          await tx.document.create({
            data: {
              kycProfileId: kycProfile.id,
              purposes: doc.purposes,
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
          description: `Individual customer registered: ${validatedData.email}`,
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
    // await sendWelcomeEmail(validatedData.email, generatedPassword);

    // Prepare success response
    const response: RegistrationResponse = {
      success: true,
      customerId: bridgeCustomer.id,
      profileId: result.profile.id,
      kycStatus: bridgeCustomer.status,
    };

    console.log("✅ Customer registration completed successfully");
    return NextResponse.json(response, { status: 201 });

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