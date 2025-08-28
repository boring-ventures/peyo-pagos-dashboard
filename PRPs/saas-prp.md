# AI Bot Ecosystem Platform - PRP (Product Requirements Project)

name: "AI Bot Ecosystem Platform: Multi-Tenant SaaS with Bot Management Dashboard"
description: |

## Purpose
Build a comprehensive Next.js 15 SaaS platform where businesses can deploy and manage multiple AI-powered bots across various use cases. This demonstrates modern full-stack architecture with multi-tenancy, role-based access control, and extensible bot ecosystem management.

## Core Principles
1. **Security First**: Multi-tenant data isolation with zero cross-company data leakage
2. **Type Safety**: End-to-end TypeScript with Zod validation and Prisma ORM
3. **Scalable Architecture**: Extensible bot ecosystem supporting multiple AI bot types
4. **Modern Stack**: Next.js 15, Supabase, Prisma, Zustand, Shadcn/ui

---

## Goal
Create a production-ready multi-tenant SaaS platform where SuperAdmins can manage companies and Company Admins can deploy/configure AI bots (starting with scheduling automation). The system should support role-based access control, real-time updates, and comprehensive analytics.

## Why
- **Business value**: Enables businesses to automate customer interactions through AI bots
- **Technical showcase**: Demonstrates advanced Next.js patterns with multi-tenancy
- **Problems solved**: Eliminates manual setup for AI bot deployment and management

## What
A web application where:
- SuperAdmins manage companies, billing, and platform-wide settings
- Company Admins deploy bots, configure services, and view analytics
- System supports scheduling bots initially with extensible architecture for more bot types
- Real-time dashboard updates with comprehensive role-based security

### Success Criteria
- [ ] Zero data leakage between company tenants
- [ ] Sub-3 second page load times across all dashboards
- [ ] 95% task completion rate for company onboarding
- [ ] Complete CRUD operations for companies, bots, services, appointments
- [ ] Role-based access control with proper middleware protection
- [ ] Responsive design working on mobile/tablet/desktop
- [ ] 80%+ test coverage with comprehensive error handling

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://nextjs.org/docs
  why: Next.js 15 App Router patterns, API routes, middleware
  
- url: https://supabase.com/docs
  why: Database setup, authentication, row-level security
  
- url: https://www.prisma.io/docs
  why: Database schema design, type-safe queries, migrations
  
- url: https://ui.shadcn.com/docs
  why: Component library patterns, theming, responsive design
  
- url: https://docs.pmnd.rs/zustand/getting-started/introduction
  why: State management patterns for complex applications
  
- url: https://zod.dev/
  why: Runtime validation schemas and type inference
  
- url: https://vercel.com/docs
  why: Deployment, environment variables, performance optimization
```

### Current Codebase Structure (to be created)
```bash
.
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── admin/                # SuperAdmin routes
│   │   │   │   ├── companies/
│   │   │   │   ├── analytics/
│   │   │   │   └── system/
│   │   │   └── company/              # Company Admin routes
│   │   │       ├── bots/
│   │   │       ├── scheduling/
│   │   │       ├── settings/
│   │   │       └── analytics/
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   └── company/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # Shadcn/ui components
│   │   ├── forms/
│   │   ├── charts/
│   │   └── layout/
│   ├── lib/                          # Utilities
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── validations/
│   │   └── utils.ts
│   ├── stores/                       # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── company-store.ts
│   │   ├── bot-store.ts
│   │   └── appointment-store.ts
│   ├── hooks/                        # Custom React hooks
│   └── types/                        # TypeScript definitions
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── __tests__/                        # Test files
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Known Gotchas & Critical Requirements
```typescript
// CRITICAL: Multi-tenant security - ALWAYS validate company access
// CRITICAL: Use Supabase RLS (Row Level Security) for data isolation
// CRITICAL: All API routes must validate user roles and company access
// CRITICAL: Use middleware for route protection - don't rely on client-side only
// CRITICAL: Prisma schema MUST include proper relations and cascade deletes
// CRITICAL: Always use TypeScript strict mode - no 'any' types allowed
// CRITICAL: Validate all inputs with Zod before database operations
// CRITICAL: Use Zustand devtools in development for debugging
// CRITICAL: Implement proper error boundaries for React components
// CRITICAL: Use Next.js Image component for optimized images
// CRITICAL: Follow Shadcn/ui patterns for consistent design system
```

## Implementation Blueprint

### Data Models and Database Schema

```prisma
// prisma/schema.prisma - Core models for multi-tenant architecture
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(COMPANY_ADMIN)
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}

enum UserRole {
  SUPERADMIN
  COMPANY_ADMIN
}

model Company {
  id            String        @id @default(cuid())
  name          String
  email         String        @unique
  phone         String?
  website       String?
  description   String?
  logo          String?
  status        CompanyStatus @default(ACTIVE)
  businessHours Json?
  timezone      String        @default("UTC")
  
  // Relations - critical for multi-tenancy
  users         User[]
  bots          Bot[]
  services      Service[]
  appointments  Appointment[]
  chatSessions  ChatSession[]
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@map("companies")
}

model Bot {
  id          String    @id @default(cuid())
  companyId   String    // CRITICAL: Every bot belongs to a company
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  name        String
  type        BotType
  description String?
  status      BotStatus @default(INACTIVE)
  config      Json      @default("{}")
  
  chatSessions ChatSession[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Performance indexes
  @@index([companyId, type])
  @@index([status])
  @@map("bots")
}

enum BotType {
  SCHEDULING
  CUSTOMER_SUPPORT
  LEAD_GENERATION
  FAQ
  BOOKING_CONFIRMATION
}

// Additional models: Service, Appointment, ChatSession, BotTemplate...
```

### List of Implementation Tasks

```yaml
Task 1: Project Setup & Foundation
SETUP Next.js 15 project:
  - PATTERN: Use create-next-app with TypeScript
  - Configure app router structure
  - Setup Tailwind CSS and Shadcn/ui
  - Configure ESLint and Prettier with strict rules

SETUP Supabase and Prisma:
  - Create Supabase project with PostgreSQL
  - Configure Prisma schema with multi-tenant models
  - Setup database migrations and seed data
  - Configure Supabase Auth with custom user metadata

Task 2: Authentication & Authorization System
CREATE auth system:
  - PATTERN: Supabase Auth with custom role management
  - Implement middleware for route protection
  - Create auth utilities for session management
  - Setup role-based access control

CREATE auth components:
  - Login/register forms with validation
  - Protected route wrapper components
  - User profile management
  - Password reset functionality

Task 3: SuperAdmin Dashboard
CREATE admin layouts:
  - PATTERN: Follow dashboard layout patterns
  - Responsive sidebar navigation
  - Breadcrumb navigation
  - Role-based menu items

CREATE company management:
  - Companies overview with data table
  - Company creation/editing forms
  - Company status management
  - User assignment to companies

Task 4: Company Admin Dashboard
CREATE bot management:
  - Bot deployment wizard
  - Bot configuration interface
  - Bot status monitoring
  - Bot analytics dashboard

CREATE scheduling features:
  - Service management CRUD
  - Appointment calendar component
  - Business hours configuration
  - Customer management interface

Task 5: API Routes & Database Operations
CREATE API architecture:
  - PATTERN: RESTful API with proper validation
  - Authentication middleware for all routes
  - Company access validation
  - Error handling and logging

CREATE database repositories:
  - Type-safe Prisma operations
  - Multi-tenant data access patterns
  - Proper error handling
  - Transaction management for complex operations

Task 6: State Management & Real-time Updates
SETUP Zustand stores:
  - Auth state management
  - Company data management
  - Bot state management
  - Appointment scheduling state

IMPLEMENT real-time features:
  - Supabase subscriptions for live updates
  - Optimistic UI updates
  - Error recovery patterns
  - Loading state management

Task 7: Testing & Quality Assurance
CREATE comprehensive tests:
  - Unit tests for utilities and components
  - Integration tests for API routes
  - E2E tests for critical user flows
  - Security tests for authorization

SETUP quality gates:
  - TypeScript strict mode validation
  - ESLint and Prettier enforcement
  - Test coverage requirements (80%+)
  - Performance monitoring
```

### Per Task Implementation Details

```typescript
// Task 2: Authentication Middleware Pattern
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // CRITICAL: Always check authentication for protected routes
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const { pathname } = req.nextUrl
  
  // PATTERN: Role-based route protection
  if (pathname.startsWith('/admin') && (!session || session.user.user_metadata.role !== 'SUPERADMIN')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (pathname.startsWith('/company') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}

// Task 4: Multi-tenant API Route Pattern
// app/api/company/bots/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const companyId = request.nextUrl.searchParams.get('companyId')
    
    // CRITICAL: Validate company access
    if (session.user.role === 'COMPANY_ADMIN' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const bots = await prisma.bot.findMany({
      where: { companyId },
      include: { company: true }
    })
    
    return NextResponse.json({ bots })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Task 6: Zustand Store Pattern
// stores/bot-store.ts
interface BotState {
  bots: Bot[]
  selectedBot: Bot | null
  isLoading: boolean
  error: string | null
  
  fetchBots: (companyId: string) => Promise<void>
  createBot: (data: BotCreateInput) => Promise<void>
  updateBot: (id: string, data: BotUpdateInput) => Promise<void>
  selectBot: (bot: Bot) => void
}

export const useBotStore = create<BotState>()(
  devtools((set, get) => ({
    bots: [],
    selectedBot: null,
    isLoading: false,
    error: null,
    
    fetchBots: async (companyId: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/company/bots?companyId=${companyId}`)
        if (!response.ok) throw new Error('Failed to fetch bots')
        const data = await response.json()
        set({ bots: data.bots, isLoading: false })
      } catch (error) {
        set({ error: error.message, isLoading: false })
      }
    }
  }))
)
```

### Integration Points & Environment Setup
```yaml
ENVIRONMENT_SETUP:
  - file: .env.example
  - vars: |
      # Database
      DATABASE_URL="postgresql://user:pass@localhost:5432/bot_ecosystem"
      DIRECT_URL="postgresql://user:pass@localhost:5432/bot_ecosystem"
      
      # Supabase
      NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
      NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
      SUPABASE_SERVICE_ROLE_KEY="your-service-key"
      
      # Auth
      NEXTAUTH_SECRET="your-secret-key"
      NEXTAUTH_URL="http://localhost:3000"
      
      # Application
      NODE_ENV="development"

PACKAGE_DEPENDENCIES:
  - Next.js 15 with App Router
  - TypeScript (strict mode)
  - Prisma with PostgreSQL
  - Supabase Auth
  - Shadcn/ui + Tailwind CSS
  - Zustand for state management
  - Zod for validation
  - Jest + Testing Library for testing
```

## Validation Loop

### Level 1: Type Safety & Code Quality
```bash
# CRITICAL: Run these checks continuously during development
npx tsc --noEmit                    # TypeScript compilation check
npm run lint                        # ESLint validation
npm run format                      # Prettier formatting
npx prisma validate                 # Database schema validation

# Expected: Zero errors. Fix any issues before proceeding.
```

### Level 2: Database & Schema Validation
```bash
# Database operations validation
npx prisma db push                  # Apply schema changes
npx prisma generate                 # Generate Prisma client
npm run db:seed                     # Seed test data

# Test database queries
npx prisma studio                   # Visual database inspection
```

### Level 3: Component & API Testing
```typescript
// __tests__/api/company/bots.test.ts
describe('Bot API Routes', () => {
  it('should fetch bots for authenticated company admin', async () => {
    const session = mockSession({ role: 'COMPANY_ADMIN', companyId: 'company-1' })
    const request = new NextRequest('http://localhost/api/company/bots?companyId=company-1')
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.bots).toBeDefined()
  })
  
  it('should deny access to different company data', async () => {
    const session = mockSession({ role: 'COMPANY_ADMIN', companyId: 'company-1' })
    const request = new NextRequest('http://localhost/api/company/bots?companyId=company-2')
    
    const response = await GET(request)
    expect(response.status).toBe(403)
  })
})

// __tests__/components/bot-card.test.tsx
describe('BotCard Component', () => {
  it('renders bot information correctly', () => {
    const mockBot = { id: '1', name: 'Test Bot', type: 'SCHEDULING', status: 'ACTIVE' }
    render(<BotCard bot={mockBot} />)
    
    expect(screen.getByText('Test Bot')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })
})
```

### Level 4: End-to-End User Flows
```bash
# Install and run E2E tests
npm run test:e2e

# Critical user journeys to test:
# 1. SuperAdmin creates company and assigns admin
# 2. Company Admin logs in and deploys scheduling bot
# 3. Company Admin configures services and business hours
# 4. Multi-tenant data isolation verification
# 5. Role-based access control validation
```

## Security & Performance Validation

### Multi-Tenant Security Checklist
```yaml
SECURITY_TESTS:
  - [ ] Row-level security policies in Supabase
  - [ ] Company ID validation in all API routes
  - [ ] No cross-tenant data leakage in queries
  - [ ] Proper session management and token validation
  - [ ] Input sanitization and XSS prevention
  - [ ] SQL injection prevention via Prisma
  - [ ] Rate limiting on public endpoints
  - [ ] Secure environment variable handling

PERFORMANCE_TARGETS:
  - [ ] Page load time < 3 seconds
  - [ ] API response time < 500ms
  - [ ] Database query time < 100ms
  - [ ] Bundle size < 1MB initial load
  - [ ] Lighthouse score > 90
  - [ ] Core Web Vitals in green zone
```

## Final Validation Checklist
- [ ] All TypeScript errors resolved
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database schema deployed and seeded
- [ ] Authentication flows working correctly
- [ ] Multi-tenant data isolation verified
- [ ] Role-based access control functioning
- [ ] Responsive design working on all devices
- [ ] Performance metrics meeting targets
- [ ] Security audit completed
- [ ] Documentation updated and complete
- [ ] Environment variables configured
- [ ] Production deployment pipeline ready

---

## Anti-Patterns to Avoid
- ❌ Don't skip TypeScript strict mode - use proper types everywhere
- ❌ Don't use client-side only authentication - always validate server-side
- ❌ Don't forget company ID validation in multi-tenant queries
- ❌ Don't use synchronous operations in React Server Components
- ❌ Don't skip input validation - always use Zod schemas
- ❌ Don't hardcode configuration - use environment variables
- ❌ Don't ignore error handling - implement proper error boundaries
- ❌ Don't skip database indexes - optimize for performance from start

## Success Indicators & Confidence Score

**Confidence Score: 9/10**

High confidence due to:
- ✅ Well-established patterns in Next.js ecosystem
- ✅ Mature tooling (Supabase, Prisma, Shadcn/ui)
- ✅ Clear separation of concerns with App Router
- ✅ Strong TypeScript ecosystem support
- ✅ Comprehensive testing strategies available
- ✅ Multi-tenant architecture patterns well-documented

Minor uncertainty on:
- Supabase RLS configuration complexity for multi-tenancy
- Performance optimization at scale with multiple bot types

**Expected Timeline**: 6-8 weeks for full implementation
**Team Requirements**: 1-2 full-stack developers with Next.js experience
**Critical Dependencies**: Supabase project setup, domain configuration, SSL certificates