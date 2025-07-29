# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PEYO Pagos is a business payment management dashboard built with Next.js, integrating with Bridge Protocol for KYC/compliance, PayWithMoon for card services, and Supabase for authentication. This is a full-stack financial services application with role-based access control and comprehensive audit trails.

## Development Commands

### Common Development Tasks
- `npm run dev` or `pnpm dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run lint` - Run ESLint for code quality
- `npm start` - Start production server

### Database Management
- `pnpm prisma generate` - Generate Prisma client after schema changes
- `pnpm prisma db push` - Push schema changes to database
- `pnpm prisma studio` - Open Prisma Studio for database inspection
- `pnpm prisma db reset` - Reset database (development only)

### Data Seeding Scripts
- `pnpm seed:kyc` - Seed KYC test data
- `pnpm seed:rejection-scenarios` - Seed KYC rejection scenarios
- `pnpm clean:kyc` - Clean KYC test data
- `pnpm check:kyc` - Check KYC setup
- `pnpm seed:existing-bridge-user` - Seed existing Bridge user data
- `pnpm seed:crypto-deposits` - Seed initial crypto deposit configurations

### Code Quality
Always run `npm run lint` before committing changes. The project uses ESLint with Next.js rules and Prettier for formatting.

## Application Architecture

### Tech Stack
- **Frontend**: Next.js 15.1.7 with App Router, React 19, TypeScript
- **UI**: TailwindCSS 3.4, shadcn/ui components, Lucide React icons
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: Supabase Auth with role-based access control
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation

### Core Application Flow

1. **Authentication Layer**: Supabase handles auth, middleware protects routes
2. **Database Layer**: All operations use Prisma ORM exclusively
3. **API Layer**: RESTful routes in `/src/app/api/` handle business logic
4. **Component Layer**: React components in `/src/components/` consume data via hooks
5. **Data Layer**: Custom hooks in `/src/hooks/` use React Query for API calls

### User Roles and Permissions
- **SUPERADMIN**: Full system access, user management, system configuration
- **ADMIN**: Limited administrative access, cannot create SUPERADMIN users
- **USER**: Standard user with KYC requirements, wallet and card access

### Route Protection
- Public routes: `/sign-in`, `/`, auth callbacks
- Protected routes: Everything under `/dashboard/` requires authentication
- Role-based access enforced in components and API routes

## Database Schema

### Core Models
- **Profile**: Basic user information, role management
- **KYCProfile**: Bridge Protocol integration, compliance data
- **Wallet**: Blockchain wallets via Bridge Protocol
- **Card**: PayWithMoon debit card integration
- **Transaction**: Financial transaction history
- **SystemConfig/FeeConfig**: Admin-configurable system settings
- **CryptoDepositConfig**: Blockchain deposit configurations for mobile app
- **CryptoDepositHistory**: Audit trail for crypto deposit configuration changes

### Bridge Protocol Integration
The application integrates with Bridge Protocol for:
- KYC/compliance verification
- Wallet creation and management
- Transaction processing
- Liquidation address management

### Data Flows
1. **User Registration**: Profile → KYC submission → Bridge verification
2. **Wallet Creation**: Approved KYC → Bridge wallet API → local wallet record
3. **Card Management**: USER role only → PayWithMoon integration
4. **Transaction Sync**: Periodic sync from Bridge API → local transaction records
5. **Crypto Deposits**: SUPERADMIN configures supported chains → mobile app fetches configs

## Key Implementation Patterns

### API Route Structure
```
/api/[domain]/route.ts - Standard CRUD operations
/api/[domain]/[id]/route.ts - Entity-specific operations  
/api/[domain]/stats/route.ts - Statistics endpoints
```

All API routes follow:
1. Authentication check using Supabase helpers
2. Role-based authorization
3. Input validation with Zod schemas
4. Prisma for all database operations
5. Consistent error handling and logging

### Component Organization
```
/components/ui/ - shadcn/ui component library
/components/[domain]/ - Feature-specific components
/components/auth/ - Authentication components
/components/dashboard/ - Dashboard layout components
```

### Custom Hooks Pattern
All data fetching uses custom hooks in `/src/hooks/` with React Query:
- Consistent loading states and error handling
- Automatic caching and background updates
- Optimistic updates for better UX

### Form Handling
Forms use react-hook-form with Zod validation:
- Type-safe form definitions
- Automatic validation on client and server
- Consistent error display patterns

## Security Considerations

### Password Handling
- Client-side encryption using crypto-js
- Server-side re-hashing for Supabase compatibility
- Never store plain-text passwords

### Data Protection
- Role-based access at API and component level
- Sensitive card data encrypted at application level
- Audit trails for all admin actions

### Content Security Policy
Configured in next.config.js with strict policies for:
- Script sources (self, Supabase, Stripe)
- Image sources (self, Supabase storage)
- Connect sources (APIs and WebSocket)

## External Integrations

### Bridge Protocol API
- KYC verification and status management
- Wallet creation and transaction processing
- Liquidation address management
- Raw API responses stored for debugging

### PayWithMoon API
- Debit card creation and management
- Balance and transaction tracking
- Card security tokens

### Supabase Services
- Authentication and user management
- File storage for documents
- Real-time subscriptions where needed

## Development Guidelines

### Code Style
- Use TypeScript for all files with strict typing
- Follow early return pattern for readability
- Use Tailwind exclusively for styling
- shadcn/ui components from `/components/ui/`
- Lucide React for all icons

### Database Operations
- ALL database queries must use Prisma client
- Use transactions for multi-step operations
- Implement proper error handling and retries
- Index commonly queried fields

### Component Patterns
- Server components for initial data loading
- Client components for interactivity
- Custom hooks for data fetching
- Context providers for global state

### Testing Approach
Use the seeding scripts to create test data for development and testing various user scenarios and edge cases.

## Common Pitfalls to Avoid

1. **Never bypass Prisma** - All database operations must use Prisma ORM
2. **Role checking** - Always verify user roles in both components and API routes
3. **Input validation** - Validate data on both client and server side
4. **Error handling** - Provide meaningful error messages without exposing sensitive data
5. **Bridge API integration** - Store raw API responses for debugging and handle API errors gracefully
6. **Card data security** - Encrypt sensitive card information at the application level