# Financial Planning App - Implementation Plan

## Overview

This document outlines the phased implementation approach for the Financial Planning Tool, a visual, interactive financial planning application with Git-style branching.

**Timeline:** 10-12 weeks (MVP)
**Team:** 1 full-time developer or 2 part-time developers

---

## Phase 1: Foundation (Weeks 1-2)

### Goals
- Set up development environment and infrastructure
- Establish data models and database schema
- Build authentication system
- Create basic project structure

---

### 1.1 Project Initialization (Day 1-2)

#### Initialize TanStack Start Project
```bash
# Create project directory
mkdir financial-planning-app
cd financial-planning-app

# Initialize with TanStack Start
echo "my-app" | npx create-tsrouter-app@latest

# Or manual setup
npm init -y
npm install @tanstack/react-start
npm install -D @tanstack/react-start-vite-plugin
```

#### Project Structure Setup
```bash
# Create directory structure
mkdir -p app/routes/api/{timelines,accounts,events,auth,projections}
mkdir -p app/routes/dashboard
mkdir -p app/routes/timeline/{create,edit,$timelineId}
mkdir -p app/components/{ui,timeline,charts,forms}
mkdir -p app/lib/{db,auth,projections,utils}
mkdir -p app/types
mkdir -p db/migrations
mkdir -p tests/{unit,integration,e2e}
```

#### Install Core Dependencies
```bash
# Framework & React
npm install react@18 react-dom@18 @tanstack/react-router @tanstack/react-start

# State Management
npm install zustand @tanstack/react-query

# UI Components
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react @heroicons/react
npm install clsx tailwind-merge

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Date Handling
npm install date-fns

# Charts
npm install recharts  # or d3 if preferred

# Database
npm install @neondatabase/serverless drizzle-orm drizzle-kit

# Cache/Queue
npm install @upstash/redis @upstash/qstash

# Utilities
npm install uuid nanoid
npm install -D @types/uuid @types/node typescript
```

#### Configure Tailwind CSS
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}
```

```css
/* app/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply antialiased;
  }
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg 
           hover:bg-primary-700 transition-colors focus:outline-none 
           focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
}
```

#### Configure TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@/components/*": ["./app/components/*"],
      "@/lib/*": ["./app/lib/*"],
      "@/types/*": ["./app/types/*"]
    }
  },
  "include": ["app/**/*", "tests/**/*"]
}
```

---

### 1.2 Database Setup (Day 2-4)

#### Neon Postgres Configuration

**Step 1: Create Neon Project**
1. Sign up at https://neon.tech
2. Create new project: "financial-planning-app"
3. Copy connection string
4. Save to `.env.local`:
```bash
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]"
```

**Step 2: Initialize Drizzle ORM**
```bash
npx drizzle-kit init
```

**Step 3: Define Database Schema**
```typescript
// app/lib/db/schema.ts
import { pgTable, uuid, varchar, timestamp, decimal, boolean, jsonb, integer, text } from 'drizzle-orm/pg-core';

// Users table (synced with auth provider)
export const users = pgTable('users', {
  id: uuid('id').primaryField(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Timelines (main + branches)
export const timelines = pgTable('timelines', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isMain: boolean('is_main').default(true).notNull(),
  branchedFrom: uuid('branched_from'),
  branchDate: timestamp('branch_date'),
  assumptions: jsonb('assumptions').notNull(), // Store Assumptions object
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Accounts
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  timelineId: uuid('timeline_id').references(() => timelines.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // '401k', 'trad_ira', 'roth_ira', 'taxable', 'savings', 'real_estate'
  initialBalance: decimal('initial_balance', { precision: 15, scale: 2 }).notNull(),
  allocation: jsonb('allocation').notNull(), // Asset allocation object
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events (income, expense, transfer, milestone, recurring)
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  timelineId: uuid('timeline_id').references(() => timelines.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'income', 'expense', 'transfer', 'milestone', 'recurring'
  name: varchar('name', { length: 255 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  growthRate: decimal('growth_rate', { precision: 5, scale: 4 }),
  cola: decimal('cola', { precision: 5, scale: 4 }), // Cost of living adjustment
  recurring: jsonb('recurring'), // RecurringConfig object
  metadata: jsonb('metadata'), // Additional event-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projection cache (for performance)
export const projectionCache = pgTable('projection_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  timelineId: uuid('timeline_id').references(() => timelines.id).notNull(),
  cacheKey: varchar('cache_key', { length: 255 }).notNull(), // Hash of inputs
  result: jsonb('result').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Monte Carlo results
export const monteCarloResults = pgTable('monte_carlo_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  timelineId: uuid('timeline_id').references(() => timelines.id).notNull(),
  simulationCount: integer('simulation_count').notNull(),
  parameters: jsonb('parameters').notNull(), // Monte Carlo config
  results: jsonb('results').notNull(), // Percentiles, confidence bands
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});
```

**Step 4: Create Migration Files**
```bash
# Generate migration
npx drizzle-kit generate:pg

# Run migration
npx drizzle-kit push:pg
```

**Step 5: Database Connection Utility**
```typescript
// app/lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Type exports
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Timeline = typeof schema.timelines.$inferSelect;
export type NewTimeline = typeof schema.timelines.$inferInsert;
export type Account = typeof schema.accounts.$inferSelect;
export type NewAccount = typeof schema.accounts.$inferInsert;
export type Event = typeof schema.events.$inferSelect;
export type NewEvent = typeof schema.events.$inferInsert;
```

---

### 1.3 Authentication System (Day 4-6)

#### Choose Auth Strategy
**Option A: Port existing email magic link service**
- If you have an existing auth service, integrate it
- Use session tokens stored in cookies

**Option B: Use Lucia Auth (Recommended for TanStack Start)**
```bash
npm install lucia @lucia-auth/adapter-postgresql oslo
```

**Option C: Use Clerk (Easiest)**
```bash
npm install @clerk/clerk-react
```

#### Lucia Auth Implementation (Recommended)

**Step 1: Configure Lucia**
```typescript
// app/lib/auth/lucia.ts
import { Lucia } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const adapter = new PostgresJsAdapter(sql, {
  user: 'users',
  session: 'user_sessions'
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production'
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name
    };
  }
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string | null;
    };
  }
}
```

**Step 2: Create Auth Routes**
```typescript
// app/routes/api/auth/login.ts
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { generateId } from 'lucia';
import { generateRandomString } from 'oslo/crypto';
import { sendMagicLinkEmail } from '@/lib/email';

export const APIRoute = createAPIFileRoute('/api/auth/login')({
  POST: async ({ request }) => {
    const { email } = await request.json();
    
    // Generate magic link token
    const token = generateRandomString(32);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    
    // Store token in database
    await db.insert(magicLinks).values({
      token,
      email,
      expiresAt
    });
    
    // Send email
    await sendMagicLinkEmail(email, token);
    
    return json({ success: true });
  }
});
```

**Step 3: Protected Route Middleware**
```typescript
// app/lib/auth/middleware.ts
import { getSession } from '@/lib/auth/session';

export async function requireAuth(request: Request) {
  const session = await getSession(request);
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}
```

**Step 4: Login Page**
```tsx
// app/routes/auth/login.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  
  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return response.json();
    },
    onSuccess: () => setSent(true)
  });
  
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          <p>We've sent you a magic link to sign in.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Sign in to Financial Planner</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          loginMutation.mutate(email);
        }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### 1.4 Upstash Configuration (Day 6-7)

#### Redis (Caching & Sessions)
```typescript
// app/lib/cache/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Cache utilities
export async function getCachedProjection(cacheKey: string) {
  return redis.get(`projection:${cacheKey}`);
}

export async function setCachedProjection(cacheKey: string, data: unknown, ttl: number = 3600) {
  return redis.setex(`projection:${cacheKey}`, ttl, JSON.stringify(data));
}

export async function invalidateTimelineCache(timelineId: string) {
  // Get all keys for this timeline
  const keys = await redis.keys(`projection:${timelineId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

#### QStash (Job Queue)
```typescript
// app/lib/queue/qstash.ts
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!
});

export async function enqueueMonteCarloJob(timelineId: string, config: MonteCarloConfig) {
  return qstash.publishJSON({
    url: `${process.env.APP_URL}/api/jobs/monte-carlo`,
    body: { timelineId, config },
    retries: 3
  });
}
```

#### Pub/Sub (Streaming)
```typescript
// app/lib/realtime/pubsub.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export async function publishSimulationUpdate(jobId: string, data: unknown) {
  return redis.publish(`sim:${jobId}`, JSON.stringify(data));
}
```

---

### 1.5 Project Structure & Base Components (Day 7-10)

#### Type Definitions
```typescript
// app/types/index.ts

// Asset Classes
export type AssetClass = 
  | 'US_Large_Cap'
  | 'US_Small_Cap' 
  | 'US_Total_Market'
  | 'International_Developed'
  | 'International_Emerging'
  | 'Global_Total_Market'
  | 'US_Treasuries'
  | 'US_Investment_Grade_Corporate'
  | 'US_High_Yield_Bonds'
  | 'TIPS'
  | 'International_Bonds'
  | 'Emerging_Market_Bonds'
  | 'Cash'
  | 'US_REITs'
  | 'Global_REITs'
  | 'Gold'
  | 'Commodities'
  | 'Crypto'
  | 'Private_Equity';

export type AccountType = 
  | '401k' 
  | 'trad_ira' 
  | 'roth_ira' 
  | 'taxable' 
  | 'savings' 
  | 'real_estate';

export type EventType = 
  | 'income' 
  | 'expense' 
  | 'transfer' 
  | 'milestone' 
  | 'recurring';

// Core Data Models
export interface Timeline {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isMain: boolean;
  branchedFrom?: string;
  branchDate?: Date;
  assumptions: Assumptions;
  accounts: Account[];
  events: Event[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Assumptions {
  inflationRate: number;
  lifeExpectancy: number;
  retirementAge?: number;
  taxBrackets: TaxBracket[];
  returnAssumptions: Record<AssetClass, ReturnAssumption>;
}

export interface ReturnAssumption {
  expectedReturn: number; // Annual percentage
  standardDeviation: number;
}

export interface TaxBracket {
  min: number;
  max?: number;
  rate: number;
}

export interface Account {
  id: string;
  timelineId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  allocation: Record<AssetClass, number>; // Percentages, sum to 100
}

export interface Event {
  id: string;
  timelineId: string;
  type: EventType;
  name: string;
  startDate: Date;
  endDate?: Date;
  amount: number;
  growthRate?: number;
  cola?: number;
  recurring?: RecurringConfig;
  metadata?: Record<string, unknown>;
}

export interface RecurringConfig {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  customDays?: number;
  endCondition: 'never' | 'date' | 'occurrences' | 'threshold';
  endDate?: Date;
  maxOccurrences?: number;
  thresholdAmount?: number;
}

// Projection Types
export interface ProjectionResult {
  monthlyData: MonthlyProjection[];
  summary: ProjectionSummary;
}

export interface MonthlyProjection {
  date: Date;
  totalNetWorth: number;
  accountBalances: Record<string, number>;
  monthlyIncome: number;
  monthlyExpenses: number;
  contributions: number;
  withdrawals: number;
  taxes: number;
}

export interface ProjectionSummary {
  finalNetWorth: number;
  totalContributions: number;
  totalWithdrawals: number;
  totalTaxes: number;
  yearsOfExpensesCovered: number;
}
```

#### Base UI Components

**Button Component**
```tsx
// app/components/ui/Button.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
            'text-gray-600 hover:bg-gray-100': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
```

**Card Component**
```tsx
// app/components/ui/Card.tsx
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-200',
        {
          'p-0': padding === 'none',
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Input Component**
```tsx
// app/components/ui/Input.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
```

---

### 1.6 Environment Configuration (Day 10)

#### Environment Variables File
```bash
# .env.local (never commit this)

# Database
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/[database]"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://[region].upstash.io"
UPSTASH_REDIS_REST_TOKEN="[token]"

# Upstash QStash
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="[token]"
QSTASH_CURRENT_SIGNING_KEY="[key]"
QSTASH_NEXT_SIGNING_KEY="[key]"

# Application
APP_URL="http://localhost:3000"
NODE_ENV="development"

# Auth (Lucia or your auth provider)
AUTH_SECRET="[generate with: openssl rand -base64 32]"

# Email (for magic links)
EMAIL_PROVIDER="resend" # or sendgrid, aws-ses
EMAIL_API_KEY="[key]"
EMAIL_FROM="noreply@yourapp.com"

# Monitoring (optional)
SENTRY_DSN="[sentry dsn]"
```

#### Environment Variables for Production
```bash
# .env.production
APP_URL="https://yourapp.vercel.app"
NODE_ENV="production"
```

---

### 1.7 Testing Setup (Day 10-12)

#### Install Testing Dependencies
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
npm install -D @playwright/test
```

#### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
});
```

#### Test Setup File
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

#### Example Unit Test
```typescript
// tests/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });
});
```

---

### 1.8 Deployment Setup (Day 12-14)

#### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

#### GitHub Actions CI/CD (Optional)
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build
        run: npm run build
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

### Phase 1 Deliverables (End of Week 2)

#### Technical Deliverables
- [ ] **Project Repository**: Clean, organized codebase with proper structure
- [ ] **Database Schema**: All tables created in Neon Postgres with proper indexes
- [ ] **Type Definitions**: Complete TypeScript types for all domain models
- [ ] **Base Components**: Button, Card, Input components ready to use
- [ ] **Authentication System**: Users can sign up/log in with magic links
- [ ] **Protected Routes**: API routes require authentication
- [ ] **Caching Layer**: Redis connection working, basic cache utilities implemented
- [ ] **Job Queue**: QStash configured and tested
- [ ] **Environment Config**: All environment variables documented and configured

#### Verification Checklist
- [ ] `npm run dev` starts the app locally
- [ ] User can sign up with email
- [ ] User receives magic link email
- [ ] User can log in successfully
- [ ] Database migrations run without errors
- [ ] Redis connection test passes
- [ ] QStash can enqueue a test job
- [ ] App deploys to Vercel successfully
- [ ] All TypeScript types compile without errors
- [ ] At least 5 unit tests passing

#### Documentation
- [ ] README.md with setup instructions
- [ ] Environment variables documented
- [ ] Database schema diagram
- [ ] API endpoint overview (even if empty)

---

### Phase 1 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Neon connection issues | High | Test connection early, have fallback to local Postgres |
| Auth complexity | Medium | Use established library (Lucia/Clerk), don't build custom |
| Upstash setup delays | Medium | Set up accounts early, test connections immediately |
| Scope creep on base components | Medium | Limit to essential 3-5 components, expand later |
| Vercel deployment issues | Low | Deploy hello-world page on day 1, iterate |

---

### Phase 1 Success Criteria
✅ **Done when:**
1. A user can visit the deployed app URL and see a working page
2. User can complete full auth flow (sign up → email → login)
3. Database tables exist and can be queried
4. All external services (Neon, Upstash) are connected
5. Development environment is documented and reproducible
6. Next developer can clone repo and be productive in <30 minutes

---

---

## Phase 2: Core Data Model (Weeks 3-4)

### Goals
- Build CRUD operations for timelines, accounts, and events
- Implement validation and error handling
- Create basic UI for data entry

### Tasks

#### Timeline CRUD
- [ ] Create timeline API endpoints
- [ ] Build timeline creation/editing UI
- [ ] Implement timeline deletion with confirmation
- [ ] Add timeline list/dashboard view
- [ ] Build timeline settings (name, assumptions)

#### Account Management
- [ ] Create account API endpoints
- [ ] Build account creation form (all 6 types)
- [ ] Implement account editing UI
- [ ] Add account deletion
- [ ] Create account list view with balances
- [ ] Build asset allocation editor (basic stocks/bonds/cash)

#### Event Management
- [ ] Create event API endpoints
- [ ] Build event creation forms (income, expense, transfer, milestone)
- [ ] Implement event editing/deletion
- [ ] Add event list view
- [ ] Build date range picker with recurrence options
- [ ] Implement COLA (cost of living adjustment) inputs

#### Recurring Transactions
- [ ] Extend event model with recurring configuration
- [ ] Build recurring transaction UI
- [ ] Implement frequency options (weekly, monthly, etc.)
- [ ] Add end condition logic (date, occurrences, threshold)
- [ ] Create recurring transaction list with pause/resume

### Deliverables
- Full CRUD for timelines, accounts, events
- Working forms with validation
- Data persistence to Neon
- Basic dashboard showing user's timelines

---

## Phase 3: Projection Engine (Weeks 5-6)

### Goals
- Build the core projection calculation engine
- Implement monthly projection calculations
- Create caching layer for performance

### Tasks

#### Projection Algorithm
- [ ] Implement monthly projection loop
- [ ] Add account growth calculation
- [ ] Build income/expense processing
- [ ] Implement contribution/withdrawal rules
- [ ] Add simple tax calculation (basic brackets)
- [ ] Create projection result data structure

#### API Endpoints
- [ ] Build projection calculation endpoint
- [ ] Implement projection caching in Redis
- [ ] Add cache invalidation on data changes
- [ ] Create batch projection endpoint for comparisons

#### Testing
- [ ] Unit tests for projection calculations
- [ ] Test edge cases (zero balance, negative returns)
- [ ] Validate against known financial scenarios
- [ ] Performance testing (50-year projections)

### Deliverables
- Working projection engine
- API endpoint returning projection data
- Caching system working
- Unit tests passing

---

## Phase 4: Visual Timeline (Weeks 7-8)

### Goals
- Build interactive timeline visualization
- Implement zoom and scroll controls
- Add event markers and annotations

### Tasks

#### Timeline Visualization
- [ ] Set up D3.js or Recharts
- [ ] Build horizontal scrollable timeline component
- [ ] Implement net worth line chart
- [ ] Add year axis with labels
- [ ] Create zoom controls (1yr, 5yr, 10yr, full)

#### Interactive Elements
- [ ] Add click-to-view-year-details functionality
- [ ] Implement event markers (icons above timeline)
- [ ] Build hover tooltips for quick summary
- [ ] Add milestone annotations
- [ ] Create current year indicator

#### Year Detail View
- [ ] Build year detail panel/modal
- [ ] Show account balances for selected year
- [ ] Display income/expense breakdown
- [ ] Add contribution/withdrawal details
- [ ] Show tax calculations

#### Real-time Updates
- [ ] Auto-recalculate projections on data change
- [ ] Add loading states
- [ ] Implement optimistic UI updates
- [ ] Create smooth chart transitions

### Deliverables
- Interactive timeline working
- Zoom and scroll functioning
- Year detail view accessible
- Real-time projection updates

---

## Phase 5: Git-Style Branching (Weeks 9-10)

### Goals
- Implement branch creation and management
- Build comparison view
- Add merge functionality

### Tasks

#### Branching System
- [ ] Extend timeline model with branch metadata
- [ ] Build branch creation UI
- [ ] Implement branch point selection
- [ ] Create branch switcher/dropdown
- [ ] Add branch listing in sidebar

#### Comparison View
- [ ] Build side-by-side comparison layout
- [ ] Implement dual timeline charts
- [ ] Add net worth comparison table
- [ ] Create diff highlighting
- [ ] Build branch selector for comparison

#### Merge Functionality
- [ ] Implement diff calculation
- [ ] Build merge conflict detection
- [ ] Create merge confirmation UI
- [ ] Add apply changes logic
- [ ] Implement merge rollback

#### Branch Operations
- [ ] Add branch rename
- [ ] Implement branch deletion
- [ ] Create duplicate branch function
- [ ] Build branch history/log view

### Deliverables
- Branch creation working
- Comparison view functional
- Merge to main working
- All branch operations available

---

## Phase 6: Monte Carlo Simulation (Weeks 11-12)

### Goals
- Implement Monte Carlo engine
- Build QStash job queue integration
- Create streaming results UI

### Tasks

#### Monte Carlo Engine
- [ ] Implement random number generation
- [ ] Add correlation matrix handling (ml-matrix)
- [ ] Build Cholesky decomposition
- [ ] Create simulation batch runner
- [ ] Implement percentile calculations
- [ ] Add confidence band generation

#### Job Queue (QStash)
- [ ] Set up QStash queues
- [ ] Build job enqueue endpoint
- [ ] Create worker function for simulations
- [ ] Implement batch processing logic
- [ ] Add job status tracking
- [ ] Build error handling and retries

#### Streaming Results (Upstash Pub/Sub)
- [ ] Set up Redis pub/sub channels
- [ ] Implement SSE endpoint for streaming
- [ ] Build client-side streaming handler
- [ ] Add progress animation
- [ ] Create final result persistence
- [ ] Implement cancellation logic

#### UI Components
- [ ] Build Monte Carlo run button
- [ ] Create confidence band visualization
- [ ] Add probability of success metric
- [ ] Implement best/worst/median display
- [ ] Build scenario comparison with Monte Carlo

### Deliverables
- Monte Carlo engine working
- Job queue processing simulations
- Streaming results to client
- Confidence bands visualized

---

## Phase 7: Polish & Launch (Week 12+)

### Goals
- Fix bugs and edge cases
- Optimize performance
- Prepare for launch

### Tasks

#### Bug Fixes
- [ ] Fix projection edge cases
- [ ] Resolve branch merge conflicts
- [ ] Fix timeline rendering issues
- [ ] Address mobile responsiveness
- [ ] Fix auth edge cases

#### Performance
- [ ] Optimize projection calculations
- [ ] Add database query optimization
- [ ] Implement virtualization for long timelines
- [ ] Add chart rendering optimization
- [ ] Optimize Monte Carlo batch sizes

#### User Experience
- [ ] Add keyboard shortcuts
- [ ] Implement dark mode
- [ ] Add loading skeletons
- [ ] Create error boundaries
- [ ] Build empty states

#### Export/Import
- [ ] Build JSON export functionality
- [ ] Create JSON import with validation
- [ ] Add CSV export for projections
- [ ] Implement backup/restore

#### Documentation
- [ ] Write user guide
- [ ] Create FAQ
- [ ] Add tooltips throughout app
- [ ] Write API documentation

### Deliverables
- Stable, performant application
- Export/import working
- Documentation complete
- Ready for user testing

---

## Technical Implementation Notes

### Database Optimization
- Use appropriate indexes on foreign keys
- Partition large tables if needed
- Implement connection pooling
- Use transactions for multi-table operations

### Caching Strategy
- Cache projection results in Redis (TTL: 1 hour)
- Cache user preferences in KV
- Invalidate cache on relevant data changes
- Use stale-while-revalidate for performance

### Security Considerations
- Validate all user inputs
- Use parameterized queries
- Implement rate limiting
- Sanitize exported data
- Encrypt sensitive fields at rest

### Monitoring
- Track projection calculation time
- Monitor Monte Carlo queue depth
- Track error rates
- Monitor database performance
- Set up alerts for critical issues

---

## V2 Features (Post-MVP)

### Phase 2: Advanced Modeling (4-6 weeks)
- Historical stress-testing with precomputed scenarios
- Custom scenario builder
- Advanced tax modeling (Roth conversions, RMDs)
- Social Security optimization

### Phase 3: Integrations (3-4 weeks)
- Plaid integration for account syncing
- CSV/Excel import
- PDF report generation
- Advisor view (read-only sharing)

### Phase 4: Collaboration & Platform (6-8 weeks)
- Public branch sharing
- Scenario marketplace
- Multi-device sync
- Native mobile apps
- API for power users

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Monte Carlo performance | Use QStash for async processing, optimize batch sizes |
| Database scaling | Use proper indexing, implement caching, consider read replicas |
| Chart performance | Use canvas rendering, implement virtualization, optimize re-renders |
| Complex branching logic | Extensive unit testing, property-based tests |

### Schedule Risks
| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MVP definition, defer non-critical features |
| Integration delays | Set up infrastructure early, test integrations separately |
| Performance issues | Build performance tests early, optimize iteratively |

---

## Success Metrics

### Development Metrics
- Test coverage: >80%
- API response time: <200ms (p95)
- Projection calculation: <1s for 50-year timeline
- Monte Carlo: <5s for 1000 simulations

### User Metrics (Post-Launch)
- Time to first timeline: <5 minutes
- Branch creation rate: >2 per user
- Monte Carlo usage: >50% of users
- Retention: >40% after 7 days

---

## Appendix: Dependencies to Install

### Core
```bash
npm install @tanstack/react-start @tanstack/react-query zustand
npm install tailwindcss @headlessui/react date-fns
npm install d3 or recharts
npm install zod
```

### Monte Carlo
```bash
npm install ml-matrix @stdlib/random-base-normal
```

### Database & Cache
```bash
npm install @neondatabase/serverless @upstash/redis @upstash/qstash
```

### Auth
```bash
npm install # existing auth service dependencies
```

---

*Implementation Plan Version: 1.0*
*Last Updated: 2026-03-31*
*Status: Draft*
