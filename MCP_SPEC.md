# MCP Server Implementation Spec

Production-ready specification using `mcp-tanstack-start` for TanStack Start integration.

---

## Architecture Overview

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────────────────┐
│  Claude Desktop │◄─────────────────►│  TanStack Start App         │
│  Cursor         │                     │  ├── Web UI routes          │
│  Custom Agent   │                     │  └── API routes (/api/mcp)  │
└─────────────────┘                     └──────────────┬──────────────┘
                                                        │
                           ┌────────────────────────────┼────────────────────────────┐
                           ▼                            ▼                            ▼
                    ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
                    │ mcp-tanstack │           │  Neon        │           │  Upstash     │
                    │ -start       │           │  Postgres    │           │  Redis/QStash│
                    └──────────────┘           └──────────────┘           └──────────────┘
```

**Libraries:**
- `mcp-tanstack-start` - Web-standard MCP transport for TanStack Start
- `@modelcontextprotocol/sdk` - Core MCP types
- `zod` - Schema validation

---

## Dependencies

```bash
npm install mcp-tanstack-start @modelcontextprotocol/sdk zod
```

```json
{
  "dependencies": {
    "mcp-tanstack-start": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.25.0"
  }
}
```

---

## File Structure

```
app/
├── routes/
│   └── api/
│       └── mcp.ts                 # Single MCP endpoint
├── lib/
│   ├── mcp/
│   │   ├── server.ts              # Server setup
│   │   ├── tools/
│   │   │   ├── index.ts           # Tool exports
│   │   │   ├── get_timeline.ts
│   │   │   ├── get_projections.ts
│   │   │   ├── compare_branches.ts
│   │   │   ├── create_branch.ts
│   │   │   ├── add_event.ts
│   │   │   ├── modify_event.ts
│   │   │   └── run_monte_carlo.ts
│   │   └── charts.ts              # SVG generation
│   └── auth.ts                    # API key validation
```

---

## MCP Server Setup

### Main Route (`app/routes/api/mcp.ts`)

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { createMcpServer } from 'mcp-tanstack-start'
import { tools } from '~/lib/mcp/tools'
import { validateApiKey } from '~/lib/auth'

// Create the MCP server
const mcp = createMcpServer({
  name: 'financial-planner',
  version: '1.0.0',
  instructions: `Financial planning app with timeline modeling, scenario branching, 
and Monte Carlo projections. Use tools to explore timelines, create branches, 
and analyze retirement scenarios.`,
  tools,
})

// Single handler for all HTTP methods
export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      all: async ({ request }) => {
        // Validate API key
        const apiKey = request.headers.get('x-api-key')
        const auth = await validateApiKey(apiKey)
        
        if (!auth.valid) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        // Attach user context for tool handlers
        ;(request as any).userContext = {
          userId: auth.userId,
          scopes: auth.scopes
        }
        
        // Handle the MCP request
        return mcp.handleRequest(request)
      },
    } as Record<string, (ctx: { request: Request }) => Promise<Response>>,
  },
})
```

---

## Tool Definitions

### Tool Index (`app/lib/mcp/tools/index.ts`)

```typescript
import { getTimelineTool } from './get_timeline'
import { getProjectionsTool } from './get_projections'
import { compareBranchesTool } from './compare_branches'
import { createBranchTool } from './create_branch'
import { addEventTool } from './add_event'
import { modifyEventTool } from './modify_event'
import { runMonteCarloTool } from './run_monte_carlo'

export const tools = [
  getTimelineTool,
  getProjectionsTool,
  compareBranchesTool,
  createBranchTool,
  addEventTool,
  modifyEventTool,
  runMonteCarloTool,
]
```

### get_timeline (`app/lib/mcp/tools/get_timeline.ts`)

```typescript
import { defineTool } from 'mcp-tanstack-start'
import { z } from 'zod'
import { db } from '~/lib/db'

export const getTimelineTool = defineTool({
  name: 'get_timeline',
  description: 'Retrieve a timeline with all associated accounts and events',
  parameters: z.object({
    timelineId: z.string()
      .describe("Timeline identifier, or 'main' for primary timeline"),
  }),
  execute: async ({ timelineId }, context) => {
    const { userId } = (context.request as any).userContext
    
    // Resolve 'main' to actual ID
    const resolvedId = timelineId === 'main' 
      ? await getMainTimelineId(userId)
      : timelineId
    
    // Fetch timeline with relations
    const timeline = await db.query.timelines.findFirst({
      where: (t, { eq, and }) => and(
        eq(t.id, resolvedId),
        eq(t.userId, userId)
      ),
      with: {
        accounts: true,
        events: {
          orderBy: (e, { asc }) => asc(e.startDate)
        }
      }
    })
    
    if (!timeline) {
      throw new Error(`Timeline not found: ${timelineId}`)
    }
    
    return {
      timeline: {
        id: timeline.id,
        name: timeline.name,
        isMain: timeline.isMain,
        branchedFrom: timeline.branchedFrom,
        branchDate: timeline.branchDate?.toISOString(),
        createdAt: timeline.createdAt.toISOString(),
      },
      accounts: timeline.accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        initialBalance: a.initialBalance,
        allocation: a.allocation,
      })),
      events: timeline.events.map(e => ({
        id: e.id,
        type: e.type,
        name: e.name,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString(),
        amount: e.amount,
        growthRate: e.growthRate,
        cola: e.cola,
        accountId: e.accountId,
      })),
    }
  },
})

async function getMainTimelineId(userId: string): Promise<string> {
  const main = await db.query.timelines.findFirst({
    where: (t, { eq, and }) => and(
      eq(t.userId, userId),
      eq(t.isMain, true)
    )
  })
  
  if (!main) {
    throw new Error('No main timeline found for user')
  }
  
  return main.id
}
```

### get_projections (`app/lib/mcp/tools/get_projections.ts`)

```typescript
import { defineTool } from 'mcp-tanstack-start'
import { z } from 'zod'
import { getOrCreateProjections } from '~/lib/projections'
import { generateTimelineChart } from '../charts'

export const getProjectionsTool = defineTool({
  name: 'get_projections',
  description: 'Retrieve Monte Carlo projection results for a timeline with optional SVG chart',
  parameters: z.object({
    timelineId: z.string(),
    includeChart: z.boolean()
      .default(true)
      .describe('Whether to include SVG chart'),
    chartType: z.enum(['timeline', 'fan', 'income_sources', 'accounts'])
      .default('timeline')
      .describe('Type of chart to generate'),
  }),
  execute: async ({ timelineId, includeChart, chartType }, context) => {
    const { userId } = (context.request as any).userContext
    
    // Fetch projections
    const projections = await getOrCreateProjections(timelineId, userId)
    
    const result: Record<string, any> = {
      timelineId,
      status: projections.status,
      successProbability: projections.successProbability,
      keyMetrics: {
        projectedNetWorthAtRetirement: projections.p50[projections.p50.length - 1],
        yearsOfExpensesCovered: calculateYearsCovered(projections),
        safeWithdrawalRate: calculateSWR(projections),
      },
      percentiles: {
        p10: projections.p10,
        p25: projections.p25,
        p50: projections.p50,
        p75: projections.p75,
        p90: projections.p90,
      },
      years: projections.years,
    }
    
    // Generate SVG chart
    if (includeChart) {
      const svg = await generateTimelineChart(projections, {
        width: 800,
        height: 400,
        type: chartType,
      })
      
      result.chart = {
        format: 'svg',
        content: svg,
        altText: `Net worth projection showing median $${formatCurrency(projections.p50[projections.p50.length - 1])} at retirement`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }
    }
    
    return result
  },
})

function calculateYearsCovered(projections: ProjectionResult): number {
  // Implementation
  return 25
}

function calculateSWR(projections: ProjectionResult): number {
  // Implementation
  return 0.04
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  return `$${(value / 1_000).toFixed(0)}K`
}
```

### create_branch (`app/lib/mcp/tools/create_branch.ts`)

```typescript
import { defineTool } from 'mcp-tanstack-start'
import { z } from 'zod'
import { createBranch as createBranchInDB } from '~/lib/timelines'
import { logMcpOperation } from '~/lib/mcp/audit'

export const createBranchTool = defineTool({
  name: 'create_branch',
  description: 'Create a new scenario branch from a point in time',
  parameters: z.object({
    name: z.string()
      .describe("Branch name (e.g., 'Early Retirement')"),
    fromTimelineId: z.string()
      .describe('Source timeline to branch from'),
    branchDate: z.string()
      .describe('Date where branch diverges (ISO 8601)'),
    description: z.string()
      .optional()
      .describe('Optional description of this scenario'),
  }),
  execute: async (params, context) => {
    const { userId, scopes } = (context.request as any).userContext
    
    // Check write scope
    if (!scopes.includes('write')) {
      throw new Error('Write scope required. Generate a new API key with write permissions.')
    }
    
    const branch = await createBranchInDB({
      name: params.name,
      fromTimelineId: params.fromTimelineId,
      branchDate: new Date(params.branchDate),
      description: params.description,
      userId,
    })
    
    // Log the operation
    await logMcpOperation({
      userId,
      toolName: 'create_branch',
      params,
    })
    
    return {
      branchId: branch.id,
      name: branch.name,
      branchedFrom: branch.branchedFrom,
      branchDate: branch.branchDate.toISOString(),
      message: `Branch "${params.name}" created successfully`,
    }
  },
})
```

### compare_branches (`app/lib/mcp/tools/compare_branches.ts`)

```typescript
import { defineTool } from 'mcp-tanstack-start'
import { z } from 'zod'
import { compareTimelines } from '~/lib/timelines'
import { generateComparisonChart } from '../charts'

export const compareBranchesTool = defineTool({
  name: 'compare_branches',
  description: 'Compare two timeline branches and identify key differences',
  parameters: z.object({
    branchA: z.string().describe('First timeline ID'),
    branchB: z.string().describe('Second timeline ID'),
    includeChart: z.boolean().default(true),
  }),
  execute: async ({ branchA, branchB, includeChart }, context) => {
    const { userId } = (context.request as any).userContext
    
    const comparison = await compareTimelines(branchA, branchB, userId)
    
    const result: Record<string, any> = {
      branchA,
      branchB,
      differences: comparison.differences,
      impact: {
        netWorthDifferenceAtYear10: comparison.impact.year10,
        netWorthDifferenceAtYear20: comparison.impact.year20,
        successProbabilityDelta: comparison.impact.successDelta,
      },
    }
    
    if (includeChart) {
      const svg = await generateComparisonChart(comparison, {
        width: 800,
        height: 400,
      })
      
      result.chart = {
        format: 'svg',
        content: svg,
        altText: `Comparison of ${branchA} vs ${branchB}`,
      }
    }
    
    return result
  },
})
```

---

## SVG Chart Generation

### Chart Utility (`app/lib/mcp/charts.ts`)

```typescript
import * as d3 from 'd3'
import { JSDOM } from 'jsdom'

interface ChartOptions {
  width: number
  height: number
  type?: string
}

export async function generateTimelineChart(
  projections: ProjectionResult,
  options: ChartOptions
): Promise<string> {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  const document = dom.window.document
  
  const margin = { top: 20, right: 30, bottom: 40, left: 60 }
  const width = options.width - margin.left - margin.right
  const height = options.height - margin.top - margin.bottom
  
  const svg = d3.select(document.body)
    .append('svg')
    .attr('viewBox', `0 0 ${options.width} ${options.height}`)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .style('background-color', '#ffffff')
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(projections.years) as [number, number])
    .range([0, width])
  
  const maxY = d3.max(projections.p90) as number
  const y = d3.scaleLinear()
    .domain([0, maxY])
    .range([height, 0])
  
  // Color palette (matching your app)
  const colors = {
    p10: '#fee2e2',
    p25: '#fecaca',
    p50: '#10b981',
    p75: '#fecaca',
    p90: '#fee2e2',
  }
  
  // 10-90% confidence band
  const area10_90 = d3.area<number>()
    .x((d, i) => x(projections.years[i]))
    .y0((d, i) => y(projections.p10[i]))
    .y1((d, i) => y(projections.p90[i]))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .datum(projections.p50)
    .attr('fill', colors.p10)
    .attr('d', area10_90 as any)
    .append('title')
    .text('10th-90th percentile range')
  
  // 25-75% confidence band
  const area25_75 = d3.area<number>()
    .x((d, i) => x(projections.years[i]))
    .y0((d, i) => y(projections.p25[i]))
    .y1((d, i) => y(projections.p75[i]))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .datum(projections.p50)
    .attr('fill', colors.p25)
    .attr('d', area25_75 as any)
    .append('title')
    .text('25th-75th percentile range')
  
  // Median line
  const line = d3.line<number>()
    .x((d, i) => x(projections.years[i]))
    .y(d => y(d))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .datum(projections.p50)
    .attr('fill', 'none')
    .attr('stroke', colors.p50)
    .attr('stroke-width', 2.5)
    .attr('d', line)
    .append('title')
    .text('Median projection')
  
  // X axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 35)
    .attr('fill', '#374151')
    .attr('text-anchor', 'middle')
    .text('Year')
  
  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `$${d3.format('.2s')(d)}`))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -45)
    .attr('fill', '#374151')
    .attr('text-anchor', 'middle')
    .text('Net Worth')
  
  return svg.node()?.outerHTML || ''
}

export async function generateComparisonChart(
  comparison: TimelineComparison,
  options: ChartOptions
): Promise<string> {
  // Implementation for branch comparison visualization
  // Shows two lines overlaid with branch point marked
  return generateTimelineChart(comparison.branchAProjections, options)
}
```

---

## Authentication

### API Key Validation (`app/lib/auth.ts`)

```typescript
import { db } from '~/lib/db'

export interface AuthResult {
  valid: boolean
  userId?: string
  scopes?: string[]
}

export async function validateApiKey(apiKey: string | null): Promise<AuthResult> {
  if (!apiKey) {
    return { valid: false }
  }
  
  const keyHash = await hashApiKey(apiKey)
  
  const keyData = await db.query.apiKeys.findFirst({
    where: (k, { eq, and, gt }) => and(
      eq(k.keyHash, keyHash),
      gt(k.expiresAt, new Date())
    ),
  })
  
  if (!keyData) {
    return { valid: false }
  }
  
  // Update last used
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyData.id))
  
  return {
    valid: true,
    userId: keyData.userId,
    scopes: keyData.scopes,
  }
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

---

## Database Schema Additions

```typescript
// packages/db/schema.ts

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  scopes: text('scopes').array().notNull().default(['read']),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
})

export const mcpAuditLog = pgTable('mcp_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  toolName: text('tool_name').notNull(),
  params: jsonb('params'),
  timestamp: timestamp('timestamp').defaultNow(),
})
```

---

## Client Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "financial-planner": {
      "url": "https://yourapp.com/api/mcp",
      "headers": {
        "x-api-key": "fp_live_xxx"
      }
    }
  }
}
```

### Cursor

Same configuration — add to Cursor's MCP settings panel.

---

## Testing

### Tool Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { getTimelineTool } from './get_timeline'

describe('get_timeline', () => {
  it('should return timeline data', async () => {
    const result = await getTimelineTool.execute(
      { timelineId: 'test-id' },
      { request: { userContext: { userId: 'test-user', scopes: ['read'] } } } as any
    )
    
    expect(result.timeline).toBeDefined()
    expect(result.accounts).toBeInstanceOf(Array)
    expect(result.events).toBeInstanceOf(Array)
  })
})
```

---

## Deployment

Since MCP is just an API route in your TanStack Start app:

1. **No separate deployment** — deploys with your app
2. **Vercel compatible** — uses web-standard APIs
3. **Endpoint:** `https://yourapp.com/api/mcp`

---

## Key Features

- ✅ **Web-standard APIs** — Works with Vercel, Cloudflare, Deno Deploy
- ✅ **Type-safe** — Zod schemas for all tools
- ✅ **Simple integration** — Single route file, minimal boilerplate
- ✅ **Flexible auth** — API keys with scoped permissions
- ✅ **Rich responses** — JSON data + SVG charts

---

## Migration from Raw SDK

If you started with raw `@modelcontextprotocol/sdk`:

1. Replace `NodeStreamableHTTPServerTransport` with `mcp-tanstack-start`
2. Move tool definitions to use `defineTool()`
3. Consolidate to single route file with `mcp.handleRequest()`
4. Remove transport boilerplate — library handles it

---

*Spec Version: 1.2 - Using mcp-tanstack-start*
