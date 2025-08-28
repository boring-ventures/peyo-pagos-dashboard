name: "Customer Sign-Up Page with KYC/KYB Integration"
description: |
  Build a comprehensive customer sign-up page that allows individual and business users to register on the platform, perform their KYC/KYB verification through Bridge.xyz API, and store all information in our database.

## Purpose
Create a complete customer onboarding flow for public users to register, submit identity verification documents, and get approved to use the platform's financial services.

## Core Principles
1. **Security First**: Encrypt sensitive data, validate all inputs, secure API calls
2. **Bridge Integration**: Seamless integration with Bridge.xyz for KYC/KYB processing
3. **User Experience**: Progressive disclosure, clear instructions, helpful error messages
4. **Data Integrity**: Comprehensive storage in local database with audit trails
5. **Role-Based Access**: Customer users have different permissions than admin users

---

## Goal
Build a public customer sign-up page that handles both individual and business customer registration with full KYC/KYB processing through Bridge.xyz API integration, storing all data locally while maintaining security and compliance.

## Why
- Enable public customer acquisition without admin intervention
- Automate KYC/KYB compliance through Bridge.xyz integration
- Provide self-service onboarding for faster customer acquisition
- Reduce manual processing overhead for business operations
- Meet regulatory requirements for financial services

## What
Multi-step customer registration form with:
1. Customer type selection (Individual vs Business)
2. Basic information collection (name, email, contact)
3. Address and identification document upload
4. Terms of service acceptance
5. Bridge.xyz KYC/KYB submission
6. Account creation in local database
7. Status tracking and progress updates

### Success Criteria
- [ ] Public users can register without admin intervention
- [ ] Individual customers can complete KYC with required documents
- [ ] Business customers can complete KYB with required documents and UBO information
- [ ] All data is stored securely in local database
- [ ] Bridge.xyz integration creates customer records
- [ ] Users receive appropriate status updates and error messages
- [ ] Validation prevents duplicate registrations
- [ ] Mobile-responsive design for all form steps

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://apidocs.bridge.xyz/api-reference/customers/create-a-customer
  why: Bridge.xyz customer creation API specification and request/response formats
  
- url: https://apidocs.bridge.xyz/docs/create-your-first-customer
  why: Complete examples for individual and business customer creation
  
- url: https://apidocs.bridge.xyz/docs/kyc-links
  why: KYC link generation for identity verification flow

- file: /Users/sarabiaops/Work/BORING/projects/peyo-pagos-dashboard/prisma/schema.prisma
  why: Database schema for Profile, KYCProfile, and related models
  
- file: /Users/sarabiaops/Work/BORING/projects/peyo-pagos-dashboard/src/components/auth/sign-in/components/user-auth-form.tsx
  why: Existing form patterns using react-hook-form and Zod validation
  
- file: /Users/sarabiaops/Work/BORING/projects/peyo-pagos-dashboard/src/app/(dashboard)/users/components/create-user-modal.tsx
  why: User creation patterns and validation schemas
  
- file: /Users/sarabiaops/Work/BORING/projects/peyo-pagos-dashboard/src/app/api/users/route.ts
  why: Backend user creation patterns with Supabase integration

- file: /Users/sarabiaops/Work/BORING/projects/peyo-pagos-dashboard/src/app/api/kyc/[profileId]/refresh/route.ts
  why: Bridge.xyz API integration patterns and error handling

- file: /Users/sarabiaops/Work/BORING/projects/peyo-pagos-dashboard/src/lib/auth/password-crypto.ts
  why: Password encryption patterns used in the system
```

### Current Codebase Structure
```bash
src/
├── app/
│   ├── (auth)/ # Authentication-related pages
│   ├── (dashboard)/ # Protected dashboard pages  
│   └── api/ # API routes
├── components/
│   ├── auth/ # Authentication components
│   ├── ui/ # shadcn/ui components
│   └── utils/ # Utility components
├── hooks/ # React Query hooks
├── lib/ # Utilities and configurations
├── types/ # TypeScript type definitions
└── providers/ # React context providers
```

### Desired Codebase Structure with New Files
```bash
src/
├── app/
│   ├── sign-up/ # NEW: Public sign-up page
│   │   └── page.tsx # Multi-step registration form
│   └── api/
│       ├── customers/ # NEW: Customer registration API
│       │   └── route.ts # POST endpoint for customer creation
│       └── kyc/
│           └── verify/ # NEW: KYC verification status endpoint
│               └── route.ts
├── components/
│   ├── auth/
│   │   └── sign-up/ # NEW: Sign-up specific components
│   │       ├── customer-type-selector.tsx # Individual vs Business selection
│   │       ├── individual-registration-form.tsx # Individual KYC form
│   │       ├── business-registration-form.tsx # Business KYB form
│   │       ├── document-upload.tsx # File upload component
│   │       └── verification-status.tsx # Status display component
│   └── ui/ # Enhanced UI components as needed
├── types/
│   ├── customer.ts # NEW: Customer and KYC type definitions
│   └── bridge.ts # NEW: Bridge.xyz API type definitions
└── lib/
    ├── bridge/ # NEW: Bridge.xyz integration utilities
    │   ├── api.ts # Bridge API client
    │   ├── types.ts # Bridge-specific types
    │   └── validators.ts # Bridge data validation
    └── utils/
        └── file-upload.ts # NEW: File handling utilities
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Bridge.xyz API Requirements
// - All requests require 'Api-Key' header with live key: sk-live-3daf8849bcbbbc458a093d321ff590bd
// - All POST requests require 'Idempotency-Key' header with UUID
// - Base URL: https://api.bridge.xyz/v0
// - Individual customers require: type, first_name, last_name, email, residential_address, birth_date
// - Business customers require: type, business_legal_name, registered_address, business_type, ultimate_beneficial_owners
// - Documents must be base64 encoded with proper MIME type prefix
// - signed_agreement_id is required (Terms of Service acceptance)

// CRITICAL: Existing Authentication Flow
// - Uses Supabase for authentication with email/password
// - Passwords are client-side encrypted using saltAndHashPassword()
// - Profile creation requires userId from Supabase auth
// - Role system: USER (requires KYC) vs ADMIN/SUPERADMIN (no KYC required)

// CRITICAL: Database Patterns
// - Profile table stores basic user info with unique userId constraint
// - KYCProfile table stores Bridge-specific data with bridgeCustomerId
// - All sensitive data encryption happens at application level
// - Use Prisma client for all database operations
// - Include audit trails with createdAt/updatedAt timestamps

// CRITICAL: Form Patterns
// - Use react-hook-form with zodResolver for validation
// - Follow existing shadcn/ui component patterns
// - Use toast notifications for user feedback
// - Implement loading states during API calls
// - Handle file uploads with proper validation (size, type, encoding)

// CRITICAL: API Route Patterns
// - Use NextRequest/NextResponse for request handling
// - Include proper error handling and status codes
// - Log all Bridge.xyz API interactions for debugging
// - Store raw Bridge responses in bridgeRawResponse fields
// - Implement idempotency to prevent duplicate customer creation
```

## Implementation Blueprint

### Data Models and Structure

Create comprehensive type definitions for customer registration and Bridge integration:

```typescript
// types/customer.ts
export interface CustomerRegistrationData {
  customerType: 'individual' | 'business';
  email: string;
  
  // Individual fields
  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  nationality?: string;
  phone?: string;
  
  // Business fields  
  businessLegalName?: string;
  businessType?: string;
  businessIndustry?: string;
  businessDescription?: string;
  
  // Address
  residentialAddress: {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    subdivision: string;
    postalCode: string;
    country: string;
  };
  
  // Documents and identification
  identifyingInformation: IdentifyingDocument[];
  documents: SupportingDocument[];
  
  // Business-specific
  ultimateBeneficialOwners?: UltimateBeneficialOwner[];
  
  // Terms acceptance
  hasAcceptedTerms: boolean;
  signedAgreementId?: string;
}

// Bridge.xyz API types
export interface BridgeCustomerRequest {
  type: 'individual' | 'business';
  first_name?: string;
  last_name?: string;
  email: string;
  residential_address?: BridgeAddress;
  birth_date?: string;
  signed_agreement_id: string;
  identifying_information?: BridgeIdentifyingInfo[];
  documents?: BridgeDocument[];
  ultimate_beneficial_owners?: BridgeUBO[];
}

export interface BridgeCustomerResponse {
  id: string;
  status: string;
  requirements_due: string[];
  created_at: string;
  updated_at: string;
}
```

### List of Tasks to Complete (in order)

```yaml
Task 1: Create Type Definitions
CREATE src/types/customer.ts:
  - Define CustomerRegistrationData interface
  - Define Bridge.xyz API request/response types
  - Include validation schemas using Zod
  - Define file upload and document types

CREATE src/types/bridge.ts:
  - Mirror Bridge.xyz API specifications
  - Include error response types
  - Define status enums and constants

Task 2: Build Bridge.xyz Integration Layer  
CREATE src/lib/bridge/api.ts:
  - PATTERN: Follow existing API patterns from kyc refresh route
  - Implement createCustomer() function with proper error handling
  - Include retry logic for network failures
  - Store raw responses for debugging
  - Use environment variables for API key and base URL

CREATE src/lib/bridge/validators.ts:
  - Validate Bridge.xyz request format
  - Convert internal types to Bridge API format
  - Handle file encoding and validation

Task 3: Create Customer Registration API Endpoint
CREATE src/app/api/customers/route.ts:
  - PATTERN: Mirror pattern from src/app/api/users/route.ts
  - Accept multipart/form-data for file uploads
  - Validate request using Zod schemas
  - Create Supabase auth user account
  - Create Profile and KYCProfile records
  - Submit to Bridge.xyz API
  - Return appropriate success/error responses
  - Implement idempotency using email as key

Task 4: Build File Upload Utility
CREATE src/lib/utils/file-upload.ts:
  - Handle image file validation (size, type, dimensions)
  - Convert files to base64 with proper MIME type prefix
  - Implement client-side compression for large images
  - Validate document types (passport, driver's license, etc.)

Task 5: Create Sign-Up Page Components
CREATE src/components/auth/sign-up/customer-type-selector.tsx:
  - Radio button selection for Individual vs Business
  - Clear descriptions and icons for each type
  - Continue button with validation

CREATE src/components/auth/sign-up/individual-registration-form.tsx:
  - Multi-step form using react-hook-form
  - Personal information step
  - Address information step  
  - Document upload step
  - Terms of service acceptance
  - Submit to API with loading states

CREATE src/components/auth/sign-up/business-registration-form.tsx:
  - Business information step
  - Business address step
  - Ultimate Beneficial Owners (UBO) information
  - Business document uploads
  - Terms of service acceptance
  - Submit to API with loading states

CREATE src/components/auth/sign-up/document-upload.tsx:
  - Drag-and-drop file upload interface
  - Image preview functionality
  - File validation and error display
  - Progress indicators during upload
  - Support for multiple document types

CREATE src/components/auth/sign-up/verification-status.tsx:
  - Display submission confirmation
  - Show verification status from Bridge.xyz
  - Handle rejection reasons display
  - Provide next steps for user

Task 6: Create Main Sign-Up Page
CREATE src/app/sign-up/page.tsx:
  - PATTERN: Follow existing page structure from auth pages
  - Multi-step wizard interface
  - Progress indicator showing current step
  - Navigation between steps with validation
  - Responsive design for mobile devices
  - Integration with all sign-up components

Task 7: Add Navigation and Access Routes
MODIFY src/components/auth/sign-in/components/user-auth-form.tsx:
  - Add "Create Account" link to sign-up page
  - Update styling to accommodate new link

MODIFY src/middleware.ts:
  - Add /sign-up to public routes
  - Ensure proper route protection

Task 8: Create KYC Verification Status API
CREATE src/app/api/kyc/verify/route.ts:
  - Accept customer ID or email to check status
  - Query Bridge.xyz API for current verification status
  - Return formatted status information
  - Handle various verification states (pending, approved, rejected)

Task 9: Add Success and Error Pages
CREATE src/app/sign-up/success/page.tsx:
  - Confirmation page after successful registration
  - Clear next steps for user
  - Link to sign-in page

CREATE src/app/sign-up/error/page.tsx:
  - Error handling page for failed registrations
  - Contact information for support
  - Retry options where appropriate
```

### Implementation Pseudocode

```typescript
// Task 3: Customer Registration API
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const customerData = JSON.parse(formData.get('data') as string);
    
    // Validate input using Zod schema
    const validatedData = customerRegistrationSchema.parse(customerData);
    
    // Check for existing customer by email
    const existingProfile = await prisma.profile.findUnique({
      where: { email: validatedData.email }
    });
    if (existingProfile) {
      return NextResponse.json({ error: 'Customer already exists' }, { status: 409 });
    }
    
    // Process uploaded files
    const processedDocuments = await processDocumentUploads(formData);
    
    // Create Supabase auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: await hashPassword(generatedPassword), // Generate secure password
      email_confirm: false, // Require email verification
    });
    
    if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
    
    // Prepare Bridge.xyz API request
    const bridgeRequest = convertToBridgeFormat(validatedData, processedDocuments);
    
    // Submit to Bridge.xyz
    const bridgeResponse = await createBridgeCustomer(bridgeRequest);
    
    // Create local database records
    const profile = await prisma.profile.create({
      data: {
        userId: authUser.user.id,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: 'USER',
        status: 'active',
      }
    });
    
    const kycProfile = await prisma.kYCProfile.create({
      data: {
        profileId: profile.id,
        bridgeCustomerId: bridgeResponse.id,
        customerType: validatedData.customerType,
        kycStatus: bridgeResponse.status,
        bridgeRawResponse: bridgeResponse,
        // ... other KYC fields
      }
    });
    
    // Send welcome email with login instructions
    await sendWelcomeEmail(validatedData.email, generatedPassword);
    
    return NextResponse.json({ 
      success: true, 
      customerId: bridgeResponse.id,
      profileId: profile.id 
    });
    
  } catch (error) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}

// Task 5: Individual Registration Form Component
export function IndividualRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<IndividualFormData>({
    resolver: zodResolver(individualRegistrationSchema),
    mode: 'onBlur',
  });
  
  const onSubmit = async (data: IndividualFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare form data with files
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      // Add uploaded files
      data.identifyingInformation.forEach((doc, index) => {
        if (doc.imageFront) formData.append(`doc_${index}_front`, doc.imageFront);
        if (doc.imageBack) formData.append(`doc_${index}_back`, doc.imageBack);
      });
      
      // Submit to API
      const response = await fetch('/api/customers', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      
      // Success - redirect to success page
      router.push('/sign-up/success');
      
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render multi-step form with validation
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {currentStep === 1 && <PersonalInfoStep />}
        {currentStep === 2 && <AddressStep />}
        {currentStep === 3 && <DocumentUploadStep />}
        {currentStep === 4 && <TermsAcceptanceStep />}
        
        <StepNavigation 
          currentStep={currentStep}
          totalSteps={4}
          onNext={() => setCurrentStep(prev => prev + 1)}
          onPrevious={() => setCurrentStep(prev => prev - 1)}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
}
```

### Integration Points
```yaml
DATABASE:
  - No migrations needed - existing schema supports customer data
  - Use existing Profile and KYCProfile models
  - Store Bridge.xyz customer ID in bridgeCustomerId field
  - Store raw Bridge responses in bridgeRawResponse field

CONFIG:
  - Bridge API key: BRIDGE_API_KEY (already configured)
  - Bridge API URL: BRIDGE_API_URL (already configured)
  - File upload limits: Add MAX_FILE_SIZE environment variable
  - Email service: Configure for welcome emails

ROUTES:
  - Add /sign-up to public routes in middleware
  - Protect /dashboard routes to require authentication
  - Add customer API endpoints to route handlers

EXTERNAL SERVICES:
  - Bridge.xyz API for KYC/KYB processing
  - Supabase Auth for user account creation
  - File storage for document uploads (Supabase Storage)
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                     # ESLint validation
npm run typecheck               # TypeScript type checking

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: API Testing
```bash
# Test customer registration API
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "customerType": "individual",
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.doe.test@example.com",
    "residentialAddress": {
      "streetLine1": "123 Test St",
      "city": "Test City",
      "subdivision": "TS",
      "postalCode": "12345",
      "country": "USA"
    },
    "birthDate": "1990-01-01",
    "hasAcceptedTerms": true
  }'

# Expected: {"success": true, "customerId": "...", "profileId": "..."}
```

### Level 3: UI Testing
```bash
# Start development server
npm run dev

# Navigate to http://localhost:3000/sign-up
# Test complete registration flow:
# 1. Select customer type
# 2. Fill out all form steps
# 3. Upload required documents
# 4. Accept terms of service
# 5. Submit registration
# 6. Verify success page
```

### Level 4: Database Integration Testing  
```bash
# Check customer data was saved
npx prisma studio

# Verify:
# - Profile record created with correct data
# - KYCProfile record created with Bridge customer ID
# - bridgeRawResponse contains API response
# - All timestamps are properly set
```

## Final Validation Checklist
- [ ] All TypeScript types are properly defined
- [ ] Bridge.xyz API integration works for individual customers
- [ ] Bridge.xyz API integration works for business customers  
- [ ] File upload and document processing functions correctly
- [ ] Multi-step form navigation works smoothly
- [ ] Form validation prevents invalid submissions
- [ ] Database records are created properly
- [ ] Error handling provides meaningful feedback
- [ ] Success flow redirects to appropriate page
- [ ] Mobile responsive design works on all screen sizes
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck` 
- [ ] Manual testing successful on all user paths
- [ ] Duplicate registration prevention works
- [ ] Terms of service acceptance is enforced

## Anti-Patterns to Avoid
- ❌ Don't store raw passwords - always use proper encryption
- ❌ Don't skip Bridge.xyz API error handling - API calls can fail
- ❌ Don't allow file uploads without proper validation
- ❌ Don't create duplicate customer records - check existing emails
- ❌ Don't expose Bridge.xyz API keys in client-side code
- ❌ Don't skip form validation on both client and server side
- ❌ Don't ignore GDPR/privacy requirements for data storage
- ❌ Don't hardcode text - use proper internationalization patterns
- ❌ Don't skip loading states - API calls take time
- ❌ Don't forget to handle Bridge.xyz webhook updates (future enhancement)

---

## Confidence Score: 9/10

This PRP provides comprehensive context, detailed implementation steps, and thorough validation procedures. The Bridge.xyz API documentation has been reviewed, existing patterns have been analyzed, and the database schema supports the requirements. The implementation follows established patterns in the codebase while introducing the necessary new functionality for customer registration and KYC/KYB processing.