# AI Bot Ecosystem Platform - Enhanced PRP (Product Requirements Prompt)

**Name**: AI Bot Ecosystem Platform - Multi-Tenant SaaS with Bot Management
**Confidence Score**: 9/10
**Generated**: 2025-08-07

## 🎯 Executive Summary

Build a production-ready multi-tenant SaaS platform using Next.js 15 where businesses can deploy and manage AI-powered bots. The platform will demonstrate enterprise-grade architecture with complete data isolation, role-based access control, and an extensible bot ecosystem supporting multiple AI bot types.

## 📋 Core Requirements

### Business Requirements
- SuperAdmin can manage multiple companies and platform settings
- Company Admins can deploy/configure AI bots for their business
- Complete multi-tenant data isolation with zero cross-company leakage
- Real-time dashboard updates and comprehensive analytics
- Extensible bot ecosystem (starting with scheduling, expandable to support, FAQ, etc.)

### Technical Requirements
- **Frontend**: Next.js 15 App Router + TypeScript + Shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase PostgreSQL
- **ORM**: Prisma with type-safe database operations
- **State**: Zustand for client-side state management
- **Validation**: Zod for runtime type validation
- **Auth**: Supabase Auth with custom role management
- **Deployment**: Vercel with edge functions

## 🚨 Critical Context & Gotchas

### MUST READ Documentation
```yaml
documentation:
  - url: "https://nextjs.org/docs/app"
    sections: ["building-your-application/routing", "building-your-application/data-fetching", "building-your-application/rendering"]
    why: "Next.js 15 App Router patterns are different from Pages Router"
    
  - url: "https://supabase.com/docs/guides/auth/server-side-auth"
    sections: ["nextjs", "row-level-security", "custom-claims"] 
    why: "Multi-tenant security depends on proper RLS configuration"
    
  - url: "https://www.prisma.io/docs/concepts/components/prisma-client/transactions"
    sections: ["sequential-operations", "the-transaction-api"]
    why: "Complex bot operations require atomic transactions"
    
  - url: "https://ui.shadcn.com/docs/components"
    sections: ["data-table", "form", "dialog"]
    why: "Consistent UI patterns across the platform"
```

### Known Gotchas & Solutions
```typescript
// GOTCHA 1: Supabase RLS policies for multi-tenancy
// SOLUTION: Always include company_id in RLS policies
CREATE POLICY "Users can only see their company data" ON bots
  FOR SELECT USING (auth.jwt() ->> 'company_id' = company_id);

// GOTCHA 2: Next.js 15 async components require proper error boundaries
// SOLUTION: Wrap async components with Suspense and ErrorBoundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Loading />}>
    <AsyncBotList companyId={companyId} />
  </Suspense>
</ErrorBoundary>

// GOTCHA 3: Prisma JSON fields need explicit typing
// SOLUTION: Use Zod schemas for JSON field validation
const botConfig = botConfigSchema.parse(bot.config as unknown)

// GOTCHA 4: Zustand SSR hydration issues
// SOLUTION: Use proper hydration patterns
const useBotStore = create<BotState>()(
  devtools(
    persist(
      (set) => ({ /* store */ }),
      {
        name: 'bot-store',
        skipHydration: true, // Critical for SSR
      }
    )
  )
)

// GOTCHA 5: TypeScript strict mode with Supabase types
// SOLUTION: Generate types from database
npx supabase gen types typescript --local > types/supabase.ts
```

## 📁 Implementation Blueprint

### Step 1: Project Initialization (30 mins)
```bash
# 1. Create Next.js 15 project with TypeScript
npx create-next-app@latest igent-platform \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd igent-platform

# 2. Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @prisma/client prisma
npm install zustand zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query @tanstack/react-table
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install date-fns recharts

# 3. Install dev dependencies
npm install -D @types/node @testing-library/react @testing-library/jest-dom
npm install -D jest jest-environment-jsdom eslint-config-prettier

# 4. Setup Shadcn/ui
npx shadcn-ui@latest init
# Select: TypeScript, Tailwind CSS, default style, CSS variables

# 5. Install essential Shadcn components
npx shadcn-ui@latest add button card dialog form input label
npx shadcn-ui@latest add select table tabs toast navigation-menu
npx shadcn-ui@latest add dropdown-menu sheet alert badge skeleton
npx shadcn-ui@latest add data-table calendar popover command
```

### Step 2: Database Setup & Schema (45 mins)
```bash
# 1. Initialize Prisma
npx prisma init

# 2. Create schema file
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Core User model with multi-tenant support
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  role      UserRole @default(COMPANY_ADMIN)
  
  // Multi-tenant relation
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Metadata
  metadata  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLogin DateTime?
  
  @@index([email])
  @@index([companyId])
  @@map("users")
}

enum UserRole {
  SUPERADMIN
  COMPANY_ADMIN
  COMPANY_USER
  @@map("user_roles")
}

model Company {
  id          String        @id @default(cuid())
  name        String
  slug        String        @unique
  email       String        @unique
  phone       String?
  website     String?
  logo        String?
  description String?
  
  // Business configuration
  timezone      String        @default("UTC")
  businessHours Json          @default("{}")
  settings      Json          @default("{}")
  
  // Status and limits
  status        CompanyStatus @default(TRIAL)
  maxBots       Int           @default(5)
  maxUsers      Int           @default(10)
  
  // Relations
  users         User[]
  bots          Bot[]
  services      Service[]
  appointments  Appointment[]
  chatSessions  ChatSession[]
  metrics       DailyMetric[]
  
  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@index([slug])
  @@index([status])
  @@map("companies")
}

enum CompanyStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELLED
  @@map("company_status")
}

model Bot {
  id          String    @id @default(cuid())
  companyId   String    
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Bot configuration
  name        String
  type        BotType
  description String?
  avatar      String?
  status      BotStatus @default(INACTIVE)
  
  // Configuration stored as JSON
  config      Json      @default("{}")
  prompts     Json      @default("{}")
  
  // Integration settings
  webhookUrl  String?
  apiKeys     Json      @default("{}")  // Encrypted in application layer
  
  // Relations
  chatSessions ChatSession[]
  appointments Appointment[]
  metrics      BotMetric[]
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  lastActive  DateTime?
  
  @@unique([companyId, name])
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
  SALES_ASSISTANT
  @@map("bot_types")
}

enum BotStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  ERROR
  @@map("bot_status")
}

model Service {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  duration    Int      // in minutes
  price       Decimal? @db.Decimal(10, 2)
  
  // Availability
  isActive    Boolean  @default(true)
  
  // Relations
  appointments Appointment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([companyId, name])
  @@index([companyId, isActive])
  @@map("services")
}

model Appointment {
  id          String            @id @default(cuid())
  companyId   String
  company     Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  botId       String?
  bot         Bot?              @relation(fields: [botId], references: [id], onDelete: SetNull)
  serviceId   String?
  service     Service?          @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  
  // Customer information
  customerName  String
  customerEmail String
  customerPhone String?
  
  // Appointment details
  scheduledAt   DateTime
  duration      Int               // in minutes
  status        AppointmentStatus @default(PENDING)
  notes         String?
  
  // Metadata
  metadata      Json              @default("{}")
  
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  
  @@index([companyId, scheduledAt])
  @@index([status])
  @@map("appointments")
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
  @@map("appointment_status")
}

model ChatSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  botId       String
  bot         Bot      @relation(fields: [botId], references: [id], onDelete: Cascade)
  
  // Session data
  customerInfo Json     @default("{}")
  messages     Message[]
  
  // Session status
  status       SessionStatus @default(ACTIVE)
  startedAt    DateTime      @default(now())
  endedAt      DateTime?
  
  @@index([companyId, botId])
  @@index([sessionId])
  @@map("chat_sessions")
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  ABANDONED
  @@map("session_status")
}

model Message {
  id           String       @id @default(cuid())
  sessionId    String
  session      ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  role         MessageRole
  content      String       @db.Text
  metadata     Json         @default("{}")
  
  createdAt    DateTime     @default(now())
  
  @@index([sessionId])
  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  @@map("message_roles")
}

// Analytics models
model DailyMetric {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  date        DateTime @db.Date
  metrics     Json     // Stores various metrics as JSON
  
  @@unique([companyId, date])
  @@index([companyId, date])
  @@map("daily_metrics")
}

model BotMetric {
  id          String   @id @default(cuid())
  botId       String
  bot         Bot      @relation(fields: [botId], references: [id], onDelete: Cascade)
  
  date        DateTime @db.Date
  sessions    Int      @default(0)
  messages    Int      @default(0)
  completions Int      @default(0)
  
  @@unique([botId, date])
  @@index([botId, date])
  @@map("bot_metrics")
}
```

```bash
# 3. Setup Supabase project
# Go to https://app.supabase.com and create a new project
# Get your project URL and anon key

# 4. Create .env.local file
cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

# Application
NEXTAUTH_SECRET="[GENERATE_WITH_OPENSSL]"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
EOF

# 5. Push schema to database
npx prisma db push

# 6. Generate Prisma client
npx prisma generate
```

### Step 3: Authentication Setup (1 hour)
```typescript
// lib/auth/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const createServerClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
})

export const createBrowserClient = () => {
  return createClientComponentClient()
}

// lib/auth/session.ts
import { createServerClient } from './supabase'
import { User } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function getSession() {
  const supabase = createServerClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    // Fetch user with company data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { company: true }
    })
    
    return {
      ...session,
      user
    }
  } catch {
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth()
  
  if (!roles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }
  
  return session
}

// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const { pathname } = req.nextUrl
  
  // Protected routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/admin') ||
                          pathname.startsWith('/company')
  
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    const user = await prisma.user.findUnique({
      where: { email: session?.user.email || '' }
    })
    
    if (user?.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/company/:path*',
  ],
}
```

### Step 4: Core API Routes (2 hours)
```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createServerClient } from '@/lib/auth/supabase'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  companyName: z.string().min(2),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)
    
    const supabase = createServerClient()
    
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
    
    // Create company and user in database
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug: data.companyName.toLowerCase().replace(/\s+/g, '-'),
          email: data.email,
          status: 'TRIAL',
        }
      })
      
      // Create user
      const user = await tx.user.create({
        data: {
          id: authData.user!.id,
          email: data.email,
          name: data.name,
          role: 'COMPANY_ADMIN',
          companyId: company.id,
        }
      })
      
      return { company, user }
    })
    
    return NextResponse.json({
      message: 'Registration successful',
      user: result.user,
      company: result.company,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// app/api/company/bots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'

const createBotSchema = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(['SCHEDULING', 'CUSTOMER_SUPPORT', 'LEAD_GENERATION', 'FAQ']),
  description: z.string().optional(),
  config: z.object({
    welcomeMessage: z.string().optional(),
    businessHours: z.record(z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    })).optional(),
    services: z.array(z.string()).optional(),
  }).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    
    // SuperAdmin can see all bots, Company Admin only their own
    const where = session.user.role === 'SUPERADMIN' 
      ? {} 
      : { companyId: session.user.companyId! }
    
    const bots = await prisma.bot.findMany({
      where,
      include: {
        company: true,
        _count: {
          select: {
            chatSessions: true,
            appointments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ bots })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get bots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = createBotSchema.parse(body)
    
    // Check bot limit for company
    const botCount = await prisma.bot.count({
      where: { companyId: session.user.companyId! }
    })
    
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId! }
    })
    
    if (botCount >= company!.maxBots) {
      return NextResponse.json(
        { error: 'Bot limit reached for your plan' }, 
        { status: 403 }
      )
    }
    
    const bot = await prisma.bot.create({
      data: {
        companyId: session.user.companyId!,
        name: data.name,
        type: data.type,
        description: data.description,
        config: data.config || {},
        status: 'INACTIVE',
      }
    })
    
    return NextResponse.json({ bot }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    console.error('Create bot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// app/api/company/bots/[id]/route.ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    
    // Verify bot belongs to user's company
    const bot = await prisma.bot.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId!,
      }
    })
    
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    
    const updatedBot = await prisma.bot.update({
      where: { id: params.id },
      data: body,
    })
    
    return NextResponse.json({ bot: updatedBot })
  } catch (error) {
    console.error('Update bot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    
    // Verify bot belongs to user's company
    const bot = await prisma.bot.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId!,
      }
    })
    
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    
    await prisma.bot.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Bot deleted successfully' })
  } catch (error) {
    console.error('Delete bot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Step 5: State Management (1 hour)
```typescript
// stores/auth-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createBrowserClient } from '@/lib/auth/supabase'

interface User {
  id: string
  email: string
  name: string
  role: string
  companyId?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,
        
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          
          try {
            const supabase = createBrowserClient()
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            
            if (error) throw error
            
            // Fetch user details from database
            const response = await fetch('/api/auth/me')
            const userData = await response.json()
            
            set({ user: userData, isLoading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false 
            })
          }
        },
        
        logout: async () => {
          const supabase = createBrowserClient()
          await supabase.auth.signOut()
          set({ user: null })
        },
        
        register: async (data) => {
          set({ isLoading: true, error: null })
          
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            
            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.message || 'Registration failed')
            }
            
            const result = await response.json()
            set({ user: result.user, isLoading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Registration failed',
              isLoading: false 
            })
          }
        },
        
        fetchUser: async () => {
          set({ isLoading: true })
          
          try {
            const response = await fetch('/api/auth/me')
            
            if (!response.ok) {
              throw new Error('Failed to fetch user')
            }
            
            const user = await response.json()
            set({ user, isLoading: false })
          } catch (error) {
            set({ user: null, isLoading: false })
          }
        },
        
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-store',
        skipHydration: true,
      }
    )
  )
)

// stores/bot-store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Bot {
  id: string
  name: string
  type: string
  status: string
  config: any
  companyId: string
}

interface BotState {
  bots: Bot[]
  selectedBot: Bot | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchBots: () => Promise<void>
  createBot: (data: Partial<Bot>) => Promise<void>
  updateBot: (id: string, data: Partial<Bot>) => Promise<void>
  deleteBot: (id: string) => Promise<void>
  selectBot: (bot: Bot | null) => void
  toggleBotStatus: (id: string) => Promise<void>
}

export const useBotStore = create<BotState>()(
  devtools(
    (set, get) => ({
      bots: [],
      selectedBot: null,
      isLoading: false,
      error: null,
      
      fetchBots: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/company/bots')
          
          if (!response.ok) {
            throw new Error('Failed to fetch bots')
          }
          
          const data = await response.json()
          set({ bots: data.bots, isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch bots',
            isLoading: false 
          })
        }
      },
      
      createBot: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/company/bots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to create bot')
          }
          
          const result = await response.json()
          set((state) => ({
            bots: [...state.bots, result.bot],
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create bot',
            isLoading: false 
          })
        }
      },
      
      updateBot: async (id, data) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/company/bots/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          
          if (!response.ok) {
            throw new Error('Failed to update bot')
          }
          
          const result = await response.json()
          set((state) => ({
            bots: state.bots.map((bot) => 
              bot.id === id ? result.bot : bot
            ),
            selectedBot: state.selectedBot?.id === id ? result.bot : state.selectedBot,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update bot',
            isLoading: false 
          })
        }
      },
      
      deleteBot: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/company/bots/${id}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            throw new Error('Failed to delete bot')
          }
          
          set((state) => ({
            bots: state.bots.filter((bot) => bot.id !== id),
            selectedBot: state.selectedBot?.id === id ? null : state.selectedBot,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete bot',
            isLoading: false 
          })
        }
      },
      
      selectBot: (bot) => set({ selectedBot: bot }),
      
      toggleBotStatus: async (id) => {
        const bot = get().bots.find((b) => b.id === id)
        if (!bot) return
        
        const newStatus = bot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        await get().updateBot(id, { status: newStatus })
      },
    }),
    { name: 'bot-store' }
  )
)
```

### Step 6: UI Components (2 hours)
```typescript
// components/bots/bot-card.tsx
'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Bot, Brain, Calendar, HelpCircle, MessageSquare, MoreVertical, Users } from 'lucide-react'
import { useBotStore } from '@/stores/bot-store'

const botIcons = {
  SCHEDULING: Calendar,
  CUSTOMER_SUPPORT: HelpCircle,
  LEAD_GENERATION: Users,
  FAQ: MessageSquare,
}

interface BotCardProps {
  bot: {
    id: string
    name: string
    type: string
    description?: string
    status: string
    _count?: {
      chatSessions: number
      appointments: number
    }
  }
}

export function BotCard({ bot }: BotCardProps) {
  const { selectBot, toggleBotStatus, deleteBot } = useBotStore()
  const Icon = botIcons[bot.type as keyof typeof botIcons] || Brain
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{bot.name}</CardTitle>
              <CardDescription>{bot.description || `${bot.type} Bot`}</CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => selectBot(bot)}>
                Edit Configuration
              </DropdownMenuItem>
              <DropdownMenuItem>View Analytics</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => deleteBot(bot.id)}>
                Delete Bot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center space-x-2">
              <Badge variant={bot.status === 'ACTIVE' ? 'success' : 'secondary'}>
                {bot.status}
              </Badge>
              <Switch
                checked={bot.status === 'ACTIVE'}
                onCheckedChange={() => toggleBotStatus(bot.id)}
              />
            </div>
          </div>
          
          {bot._count && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{bot._count.chatSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{bot._count.appointments || 0}</p>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full" onClick={() => selectBot(bot)}>
          Configure Bot
        </Button>
      </CardFooter>
    </Card>
  )
}

// components/bots/create-bot-dialog.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useBotStore } from '@/stores/bot-store'

const createBotSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['SCHEDULING', 'CUSTOMER_SUPPORT', 'LEAD_GENERATION', 'FAQ']),
  description: z.string().optional(),
})

type FormData = z.infer<typeof createBotSchema>

interface CreateBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBotDialog({ open, onOpenChange }: CreateBotDialogProps) {
  const { createBot, isLoading } = useBotStore()
  const [step, setStep] = useState(1)
  
  const form = useForm<FormData>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      name: '',
      type: 'SCHEDULING',
      description: '',
    },
  })
  
  const onSubmit = async (data: FormData) => {
    await createBot(data)
    onOpenChange(false)
    form.reset()
    setStep(1)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogDescription>
            Deploy a new AI bot for your business. Start with basic configuration.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bot type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SCHEDULING">
                            <div className="flex items-center">
                              <span className="font-medium">Scheduling Bot</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                Handles appointments and bookings
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="CUSTOMER_SUPPORT">
                            <div className="flex items-center">
                              <span className="font-medium">Customer Support</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                Answers questions and resolves issues
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="LEAD_GENERATION">
                            <div className="flex items-center">
                              <span className="font-medium">Lead Generation</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                Captures and qualifies leads
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="FAQ">
                            <div className="flex items-center">
                              <span className="font-medium">FAQ Bot</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                Answers frequently asked questions
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Appointment Assistant" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a friendly name for your bot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this bot does..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Bot'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

## 🧪 Validation Gates

### Stage 1: Development Environment
```bash
# Verify all dependencies installed
npm list @supabase/supabase-js @prisma/client zustand zod

# Verify TypeScript configuration
npx tsc --noEmit

# Verify Prisma schema is valid
npx prisma validate

# Verify database connection
npx prisma db push --accept-data-loss

# Expected output: All commands should succeed with no errors
```

### Stage 2: Code Quality
```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format

# Expected: Zero errors, all files formatted
```

### Stage 3: Unit Tests
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Expected: All tests passing, coverage > 80%
```

### Stage 4: Integration Tests
```bash
# Test authentication flow
npm run test:auth

# Test API routes
npm run test:api

# Test database operations
npm run test:db

# Expected: All integration tests passing
```

### Stage 5: E2E Tests
```bash
# Run end-to-end tests
npm run test:e2e

# Critical paths to verify:
# 1. User registration and company creation
# 2. Bot deployment and configuration
# 3. Multi-tenant data isolation
# 4. Role-based access control
```

### Stage 6: Performance & Security
```bash
# Check bundle size
npm run analyze

# Run security audit
npm audit

# Check for exposed secrets
npx secretlint **/*

# Lighthouse audit
npm run lighthouse

# Expected: 
# - Bundle size < 1MB
# - No high/critical vulnerabilities
# - No exposed secrets
# - Lighthouse score > 90
```

### Stage 7: Production Readiness
```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Verify all environment variables set
node scripts/check-env.js

# Database migrations ready
npx prisma migrate deploy

# Expected: Production build runs without errors
```

## 📊 Success Metrics

### Implementation Checkpoints
- [ ] Project initialized with all dependencies
- [ ] Database schema deployed and seeded
- [ ] Authentication system working
- [ ] SuperAdmin can manage companies
- [ ] Company Admin can deploy bots
- [ ] Multi-tenant data isolation verified
- [ ] All CRUD operations functional
- [ ] Real-time updates working
- [ ] Responsive design implemented
- [ ] Error handling comprehensive
- [ ] Tests passing with > 80% coverage
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Documentation complete

### Quality Gates
```yaml
must_pass:
  - typescript_compilation: true
  - eslint_errors: 0
  - test_coverage: ">= 80%"
  - security_vulnerabilities: 0
  - lighthouse_score: ">= 90"
  - bundle_size: "< 1MB"
  - api_response_time: "< 500ms"
  - build_success: true
```

## 🚀 Deployment Instructions

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Link to Vercel project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXTAUTH_SECRET
```

## 🎯 Confidence Score: 9/10

### Why High Confidence?
- ✅ Well-established tech stack (Next.js 15, Supabase, Prisma)
- ✅ Clear architectural patterns
- ✅ Comprehensive validation gates
- ✅ Strong TypeScript throughout
- ✅ Multi-tenant patterns well-documented
- ✅ Extensive error handling

### Minor Uncertainties
- Supabase RLS complexity for advanced multi-tenancy
- Performance at scale with many concurrent bots
- Third-party AI integration specifics

---

**Ready for Implementation**: This PRP provides everything needed for one-pass implementation success. All context, patterns, and validation gates are included.