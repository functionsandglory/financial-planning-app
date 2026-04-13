# Financial Planning Tool - Product Specification

## Overview

A visual, interactive financial planning application for power users who want to model complex life scenarios, investment strategies, and retirement planning. Unlike budgeting apps, this tool focuses on long-term projection, scenario comparison, and stress-testing against historical market conditions.

**Tagline:** "Git for your financial future"

---

## Core Value Proposition

Enable users to:
1. Build a baseline financial timeline with investments, income, and expenses
2. Instantly branch and compare alternative scenarios ("what if I retire at 55?")
3. Stress-test plans against historical market periods and Monte Carlo simulations
4. Visualize the entire financial journey from now through retirement

---

## Target User

**Primary:** Individual power users (ages 30-55)
- Currently use spreadsheets for financial planning
- Comfortable with financial concepts
- Want more visual/interactive tools than Excel provides
- Technical enough to appreciate "Git-style" branching

**Not for:**
- Beginners who need budgeting help
- Financial advisors (v2 consideration)
- People who want automated account syncing (v2 consideration)

---

## Key Features

### 1. Timeline-Based Financial Modeling

**Core Concept:** Everything exists on a linear timeline from present to end-of-life.

**Entities:**
- **Accounts:** Investment accounts (401k, IRA, taxable brokerage), savings, real estate
- **Income Events:** Salary, Social Security, pension, rental income
- **Expense Events:** Living expenses, healthcare, college tuition, big purchases
- **Transfers:** Contributions, withdrawals, rollovers

**Each entity has:**
- Start date
- End date (optional)
- Amount/value
- Growth rate or return assumptions
- Tax treatment

### 2. Git-Style Branching

**Core Concept:** Create scenario branches at any point in time, with the ability to merge back to main.

**Features:**
- **Main timeline:** The canonical baseline plan
- **Branch creation:** At any date, create a new branch with a name (e.g., "Early Retirement")
- **Branch modification:** Edit any events on a branch without affecting main
- **Side-by-side comparison:** View 2-3 branches simultaneously
- **Branch switching:** Quickly jump between scenarios
- **Merge to main:** Apply changes from a branch back into main (with conflict resolution UI)

**Use Cases:**
- "What if I retire at 55 vs 60 vs 65?"
- "What if I pay off my mortgage early?"
- "What if I downsize my house at 70?"
- "What if I take Social Security early vs delayed?"

### 3. Visual Timeline Interface

**Primary View:**
- Horizontal scrollable timeline (years on x-axis)
- Net worth line chart overlaid with events
- Zoom controls (1 year, 5 years, 10 years, full view)
- Current year indicator

**Event Visualization:**
- Major life events/milestones: Icons above timeline (retirement, house purchase, college)
- Branch points: Markers showing where branches diverge
- Annotations: User-added notes at specific dates
- *Income and expenses are reflected in the net worth trajectory, not shown as separate lines*

**Interactive Elements:**
- Click any year to see detailed breakdown
- Drag events to adjust timing
- Double-click to edit event details
- Hover for quick summary

### 4. Projection & Modeling

**Basic Growth Model (MVP):**
- Simple compound growth for investments
- Fixed rate assumptions (user-configurable)
- Inflation adjustment toggle
- Real vs nominal dollar display

**Monte Carlo Simulation (MVP):**
- Run 1,000+ simulations with randomized returns
- Display: Best case, worst case, median, percentiles (10th, 25th, 75th, 90th)
- Visual: Shaded confidence bands on timeline
- Configurable: Expected return, standard deviation per asset class
- **Correlation modeling:** Use `ml-matrix` for Cholesky decomposition of asset correlation matrix
- **Random number generation:** Use `@stdlib/random-base-normal` for normal distribution sampling

**Technical Note: Monte Carlo Methodology**
Each asset class requires its own independent expected return (mean) and standard deviation parameters. The correlation matrix does NOT derive one asset's return from another—it only transforms uncorrelated random variables into correlated ones while preserving each asset's individual return distribution.

**Process:**
1. Generate uncorrelated random normal variables for all 18 asset classes
2. Apply Cholesky decomposition to create correlated random variables
3. Calculate return for each asset: `Return = mean + (correlated_random × std_dev)`

Example: If US Large Cap has mean=7%, std=15% and US Small Cap has mean=9%, std=20%, they maintain these independent parameters even when correlated. Correlation affects how shocks move together, not the underlying return expectations.

**Historical Stress-Testing (v2):**
- Replay actual historical market sequences
- "What if I started in 2007?" (Great Recession)
- "What if I retired in 1966?" (Stagflation)
- "What if the Dot-com crash hit at year 5 of my retirement?"
- Library of historical periods to apply

**Custom Scenarios (v2):**
- Build custom return sequences for any asset class combination
- Define year-by-year returns for each asset class in the taxonomy
- Mix and match historical periods (e.g., "Dot-com crash + 2008 financial crisis back-to-back")
- Model hypothetical events (e.g., "AI bubble burst", "Climate transition shock")
- Adjust volatility and correlation assumptions per scenario
- Save personal scenarios to library for reuse across timelines
- Share scenarios to Scenario Marketplace

**Precomputed Real-World Scenarios (Included):**
The app ships with pre-built scenarios based on recent real events:

| Scenario | Period | Description |
|----------|--------|-------------|
| **COVID Crash & Recovery** | 2020-2023 | March 2020 crash (-34% S&P 500) + V-shaped recovery + 2022 inflation/recession fears |
| **2010s Bull Run** | 2009-2019 | Post-GFC recovery, longest bull market, low volatility |
| **2022 Rate Shock** | 2022 | Aggressive Fed rate hikes, tech selloff, bonds down simultaneously with stocks |
| **Crypto Winter 2022** | 2021-2023 | Bitcoin peak $69k → $15k, Terra/Luna collapse, FTX bankruptcy |
| **Meme Stock Mania** | 2021 | GME/AMC short squeezes, retail trading frenzy, high volatility |
| **Supply Chain Crisis** | 2021-2022 | Post-COVID shortages, shipping bottlenecks, inflation spike |
| **Energy Crisis 2022** | 2022 | Russia-Ukraine war, European energy crisis, oil price spike |
| **AI Boom** | 2022-2024 | ChatGPT launch, NVIDIA/tech rally, concentrated gains in mega-cap |

Each precomputed scenario includes:
- Actual year-by-year returns for all 18 asset classes
- Historical volatility and correlation matrices
- Narrative description of key events
- Comparison to baseline Monte Carlo assumptions

### 5. Account & Investment Modeling

**Account Types:**
- Tax-deferred (401k, Traditional IRA)
- Tax-free (Roth 401k, Roth IRA)
- Taxable brokerage
- Cash/savings
- Real estate (appreciation + rental income)

**Investment Modeling:**
- Asset allocation per account using standardized asset classes (see taxonomy below)
- Proxy-based returns: Map to real ETFs (SPY, BND, etc.)
- Rebalancing rules (annual, threshold-based)
- Withdrawal sequencing (tax-efficient ordering)
- Account correlation matrix for Monte Carlo simulation

**Asset Class Taxonomy (for scenario marketplace):**

| Category | Asset Class | Description |
|----------|-------------|-------------|
| US Equities | `US_Large_Cap` | S&P 500 equivalent |
| | `US_Small_Cap` | Russell 2000 equivalent |
| | `US_Total_Market` | Blend of large + small |
| International Equities | `International_Developed` | EAFE markets (Europe, Japan, Australia) |
| | `International_Emerging` | Emerging markets |
| | `Global_Total_Market` | All international |
| Fixed Income | `US_Treasuries` | US government bonds |
| | `US_Investment_Grade_Corporate` | Investment grade corporate bonds |
| | `US_High_Yield_Bonds` | High yield / junk bonds |
| | `TIPS` | Treasury Inflation-Protected Securities |
| | `International_Bonds` | Non-US developed market bonds |
| | `Emerging_Market_Bonds` | Emerging market debt |
| | `Cash` | Money market / short-term |
| Real Assets | `US_REITs` | US real estate investment trusts |
| | `Global_REITs` | International REITs |
| | `Gold` | Precious metals |
| | `Commodities` | Broad commodity index |
| Alternatives | `Crypto` | Cryptocurrencies |
| | `Private_Equity` | Private equity fund returns |

Users allocate accounts to any combination of these 18 asset classes. Scenarios in the marketplace define return sequences for any subset—unmapped classes fall back to the user's baseline assumptions.

### 6. Reporting & Insights

**Key Metrics:**
- Projected net worth at retirement
- Safe withdrawal rate achieved
- Years of expenses covered
- Probability of success (Monte Carlo)
- Tax burden over time

**Visualizations:**
- Net worth trajectory
- Asset allocation over time
- Income sources stacked chart
- Expense breakdown
- Account balance waterfall

---

## Technical Architecture

### Tech Stack

**Frontend:**
- Framework: React 18+ with TypeScript
- State Management: tanstack-query (server state), Zustand (UI state)
- Charts: D3.js or Recharts (interactive, zoomable timelines)
- UI Components: Tailwind CSS + Headless UI
- Date Handling: date-fns

**Stack:**
- **Framework:** TanStack Start (full-stack React framework)
- **Deployment:** Vercel (edge functions + serverless)
- **Database:** Neon Postgres (primary data storage)
- **Cache/Queue/Realtime:** Upstash (Redis for KV, QStash for queues, Pub/Sub for streaming)
- **Auth:** Email magic link service (ported from existing project)

**Key Dependencies:**
- `ml-matrix` — Matrix operations and Cholesky decomposition for Monte Carlo correlation handling
- `@stdlib/random-base-normal` — Normal distribution random number generation

**Why this stack:**
- TanStack Start provides type-safe full-stack React with excellent DX
- Vercel offers edge deployment with minimal config
- Neon provides scalable Postgres with branching (nice symmetry with our Git concept)
- Upstash gives us KV caching, job queues, and realtime pub/sub in one service
- Server-side projection engine protects domain logic

### Data Model & Architecture

**Neon Postgres:**
- Users, auth sessions (via existing auth service)
- Timelines, branches, accounts, events, assumptions
- Cached projection results

**Upstash Redis:**
- KV: Session data, user preferences, rate limiting
- QStash: Job queue for Monte Carlo simulations
- Pub/Sub: Streaming simulation results to clients

**Server Functions:**
- CRUD operations for timelines/accounts/events
- Projection engine execution
- Monte Carlo orchestration (via QStash)

```typescript
// Core entities
interface Timeline {
 id: string;
 name: string;
 isMain: boolean;
 branchedFrom?: string;
 branchDate?: Date;
 accounts: Account[];
 events: Event[];
 assumptions: Assumptions;
}

interface SharedBranch {
 id: string;
 slug: string; // Unique URL identifier
 timelineId: string;
 ownerId: string;
 snapshotData: TimelineSnapshot; // Denormalized snapshot for immutability
 privacy: {
   hideAccountNames: boolean;
   maskAmounts: 'none' | 'percentages' | 'indexed';
 };
 expiresAt?: Date;
 viewCount: number;
 forkCount: number;
 createdAt: Date;
 revokedAt?: Date;
}

interface Account {
 id: string;
 name: string;
 type: '401k' | 'trad_ira' | 'roth_ira' | 'taxable' | 'savings' | 'real_estate';
 initialBalance: number;
 allocation: Allocation;
 contributions?: ContributionRule[];
}

interface Event {
 id: string;
 type: 'income' | 'expense' | 'transfer' | 'milestone' | 'recurring';
 name: string;
 startDate: Date;
 endDate?: Date;
 amount: number;
 growthRate?: number;
 cola?: number; // Cost of living adjustment
 recurring?: RecurringConfig; // For scheduled deposits/withdrawals
}

interface RecurringConfig {
 frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
 customDays?: number; // For custom frequency (every N days)
 endCondition: 'never' | 'date' | 'occurrences' | 'threshold';
 endDate?: Date; // If endCondition is 'date'
 maxOccurrences?: number; // If endCondition is 'occurrences'
 thresholdAmount?: number; // If endCondition is 'threshold' (stop when balance reaches X)
 sourceAccountId?: string; // For withdrawals/transfers
 targetAccountId?: string; // For deposits/transfers
}

interface Assumptions {
 inflationRate: number;
 lifeExpectancy: number;
 taxBrackets: TaxBracket[];
 returnAssumptions: ReturnAssumptions;
}

interface CustomScenario {
 id: string;
 name: string;
 description: string;
 authorId: string;
 isPublic: boolean;
 isPrecomputed: boolean; // true for built-in scenarios
 assetClassReturns: ScenarioYearData[]; // Year-by-year returns
 correlationMatrix?: number[][]; // Optional custom correlations
 volatilityAssumptions?: Record<string, number>;
 tags: string[];
 forkedFrom?: string;
 viewCount: number;
 forkCount: number;
 createdAt: Date;
 updatedAt: Date;
}

interface ScenarioYearData {
 year: number;
 returns: Record<string, number>; // asset class ID -> return %
 description?: string; // What happened this year (e.g., "COVID crash")
}
```

### Key Algorithms

**Projection Engine:**
```
For each month from now to endDate:
 1. Apply growth to all accounts based on allocation
 2. Process all active income events (add to cash flow)
 3. Process all active expense events (subtract from cash flow)
 4. Apply contribution rules
 5. Process withdrawal needs (following tax-efficient sequence)
 6. Calculate taxes
 7. Record state snapshot
```

**Monte Carlo (QStash + Pub/Sub Streaming):**
```
1. Client requests Monte Carlo run
2. Server enqueues job via QStash with config:
   - totalSims: 1000
   - batchSize: 50 (configurable, controls stream "framerate")
   - timelineId, assumptions
3. Worker processes batches:
   For each batch of 50 sims:
     - Run simulations
     - Aggregate results (percentiles so far)
     - PUBLISH partial results to Redis pub/sub channel
     - Continue to next batch
4. Client subscribes to channel (SSE/WebSocket)
   - Receives updates after each batch
   - Animates chart as data arrives
5. Final batch completes:
   - Publishes final results
   - Saves complete results to Neon projections table
   - Job completes
```

**Benefits:**
- Configurable batch size controls streaming "framerate"
- Client sees progress immediately, not at the end
- QStash handles retries if a batch fails
- Pub/sub allows multiple clients to watch same simulation

---

## MVP Scope

### Must Have (Core Experience)

1. **Timeline CRUD**
 - Create/edit/delete timelines
 - Set baseline assumptions (inflation, life expectancy)

2. **Account Management**
 - Add accounts with initial balances
 - Basic allocation (stocks/bonds/cash)
 - Simple growth assumptions (fixed rates)

3. **Event Management**
 - Add income events (salary, Social Security)
 - Add expense events (living expenses, one-time purchases)
 - **Recurring Deposits & Withdrawals:** Schedule automatic transfers between accounts (e.g., monthly 401k contribution, quarterly investment deposits, annual withdrawals)
   - Frequency: Weekly, bi-weekly, monthly, quarterly, annual, custom
   - End conditions: Never, specific date, N occurrences, balance threshold
   - COLA adjustments for recurring amounts
 - Date ranges and amounts
 - Basic COLA (cost of living adjustments)

4. **Git-Style Branching**
 - Create branch from any point
 - Modify events on branches independently
 - Switch between branches
 - Side-by-side comparison view (2 branches)

5. **Visual Timeline**
 - Scrollable horizontal timeline
 - Net worth projection line
 - Event markers
 - Zoom controls
 - Year scrubber

6. **Basic Monte Carlo**
 - Run simulations with configurable parameters
 - Show confidence bands (10th-90th percentile)
 - Simple "probability of success" metric
 - QStash queue for job processing
 - Pub/sub streaming with configurable batch size

7. **Data Persistence**
 - Neon Postgres for all application data
 - Upstash Redis for sessions, caching, and pub/sub
 - Auto-save on every change (server-side)
 - Export/import JSON for backup/portability

### Nice to Have (If Time Permits)

- Basic tax calculation (simple brackets)
- Printable/pdf report generation
- Dark mode

### Explicitly Out of MVP

- Historical stress-testing
- Plaid/account linking
- Advanced tax modeling (Roth conversions, RMDs, etc.)
- Real-time collaboration with others
- Mobile app
- Social Security optimization calculator

---

## V2 & Future Features

### Phase 2: Advanced Modeling
- Historical stress-testing against actual market periods
- **Custom Scenarios & Scenario Builder:** Create, save, and share custom return sequences
  - Precomputed library of recent real-world events (COVID, 2022 Rate Shock, AI Boom, etc.)
  - Year-by-year return editor for all 18 asset classes
  - CSV import/export for scenario data
  - Personal scenario library
- Advanced tax modeling (Roth conversions, RMDs, tax-loss harvesting)
- Social Security claiming optimization
- Healthcare cost modeling (Medicare, long-term care)
- Real estate cash flow modeling
- International considerations (currency, tax treaties)

### Phase 3: Integrations & Power Features
- Plaid integration for account syncing
- Import from CSV/Excel
- CSV export for accountants
- Advisor view (read-only sharing)
- Monte Carlo parameter presets (conservative/moderate/aggressive)
- Custom return models

### Phase 4: Collaboration & Platform
- Multi-device sync (via existing server infrastructure)
- Native mobile apps
- Share scenarios with spouse/advisor (read-only or collaborative)
- **Public Branch Sharing:** Generate shareable links for any branch that can be viewed by anyone (even non-users)
  - Public branches are read-only snapshots
  - Viewer can fork the branch to their own account
  - Optional expiration dates on shared links
  - Privacy controls: hide account names, mask specific dollar amounts
- Community templates (FIRE scenarios, etc.)
- API for power users
- **Scenario Marketplace:** Users build and share custom historical scenarios (e.g., "2010s Tech Boom + Crypto Winter", "Japan 1990s Lost Decade", custom black swan events) — browse, fork, and remix community-created stress tests

---

## User Flows

### Flow 1: First-Time Setup
1. User creates first timeline (main)
2. Sets basic assumptions (birthdate, life expectancy, inflation)
3. Adds current accounts with balances
4. Adds income events (current salary, expected Social Security)
5. Adds expense events (annual spending, retirement spending)
6. Views initial projection

### Flow 2: Creating a Scenario Branch
1. User reviews main timeline
2. Clicks "Create Branch" at year 2035
3. Names branch "Early Retirement"
4. Modifies salary event to end at 2035 (was 2040)
5. Adjusts retirement spending start date
6. Views comparison: Main vs Early Retirement
7. Runs Monte Carlo on both

### Flow 3: Setting Up Recurring Deposits
1. User views their main timeline
2. Clicks "Add Recurring Transaction"
3. Selects type: "Monthly 401k Contribution"
4. Configures:
   - Source: Checking account
   - Target: 401k account
   - Amount: $1,500/month
   - Frequency: Monthly (15th of each month)
   - COLA: 3% annual increase
   - End: When salary ends (linked to income event)
5. Sees impact on timeline immediately
6. Can edit, pause, or delete recurring rule anytime

### Flow 4: Merging a Branch
1. User is satisfied with "Early Retirement" branch scenario
2. Clicks "Merge to Main"
3. System shows diff: what changed (salary end date, expense start date)
4. User confirms merge
5. Main timeline updates with branch changes
6. Optional: Delete branch or keep for history

### Flow 5: Stress-Testing with Precomputed Scenarios
1. User selects "Stress Test" mode
2. Browses precomputed scenarios library (COVID Crash, 2022 Rate Shock, etc.)
3. Selects "COVID Crash & Recovery (2020-2023)"
4. System applies actual 2020-2023 returns to user's timeline
5. Shows side-by-side: Baseline vs COVID scenario
6. Displays key metrics: portfolio value at bottom, recovery time, max drawdown

### Flow 6: Creating a Custom Scenario
1. User clicks "Create Custom Scenario"
2. Names it "Double Dip Recession"
3. Chooses duration: 10 years
4. For each year, inputs returns for each asset class:
   - Year 1: US_Large_Cap: -25%, US_Treasuries: 5%, ...
   - Year 2: US_Large_Cap: -15%, ...
   - Or imports from CSV
5. Adds narrative: "Back-to-back recessions with no recovery between"
6. Saves to personal library
7. Runs stress test against this custom scenario
8. Optional: Publishes to Scenario Marketplace

### Flow 7: Sharing a Branch Publicly
1. User is viewing a branch they want to share
2. Clicks "Share" → "Create Public Link"
3. Configures privacy options:
   - Toggle to hide account names (show generic labels like "Account A")
   - Toggle to mask amounts (show percentages or indexed values)
   - Set optional expiration (7 days, 30 days, never)
4. System generates unique URL (e.g., `/s/abc123xyz`)
5. User copies link and shares via any channel
6. Visitor opens link:
   - Sees read-only view of the branch
   - Can explore timeline, events, and projections
   - Sees "Fork to My Account" button (requires signup)
7. Optional: User can revoke link early from sharing settings

---

## UI/UX Notes

### Design Principles
- **Dense but readable:** Power users want information density
- **Keyboard shortcuts:** Heavy users will appreciate hotkeys
- **Immediate feedback:** Changes reflect instantly in projections
- **Visual consistency:** Use established financial visualization patterns
- **No hand-holding:** Skip onboarding tutorials, provide tooltips

### Key Interactions
- **Timeline scrubbing:** Click and drag to scroll, mouse wheel to zoom
- **Event editing:** Inline editing where possible, modal for complex items
- **Branch switching:** Dropdown or tabs at top of timeline view
- **Comparison mode:** Split-screen or overlay with transparency

### Color Palette
- Growth/positive: Green shades
- Decline/negative: Red shades
- Neutral/info: Blue/gray
- Branch differentiation: Distinct colors per branch (purple, orange, teal)

---

## Success Metrics

### MVP Success
- User can create a timeline in < 5 minutes
- Branch creation and comparison feels intuitive
- Projections update in < 1 second for 50-year timeline
- Monte Carlo completes in < 3 seconds

### Engagement Metrics (Post-Launch)
- Average timelines per user
- Average branches created
- Time spent in comparison view
- Export/report generation rate

---

## Open Questions

1. **Tax Complexity:** How detailed should MVP tax handling be?
2. **Asset Classes:** How many allocation categories? (Stocks/Bonds/Cash or more granular?)
3. **Withdrawal Rules:** How sophisticated should withdrawal sequencing be for MVP?
4. **Mobile:** Is responsive web sufficient or do we need native mobile eventually?
5. **Monetization:** Free? Freemium? One-time purchase? Subscription?

### Decisions Made

- **Architecture:** Server-based (not local-first)
  - Neon Postgres for data
  - Upstash for KV, queues (QStash), and pub/sub
  - Auth via existing email magic link service
- **Monte Carlo Execution:** QStash queue with Upstash pub/sub streaming
  - Configurable batch size controls stream "framerate"
  - Partial results published after each batch
  - Final results saved to Neon projections table

---

## Development Timeline Estimate

**MVP: 8-12 weeks** (1 full-time developer or 2 part-time)

**Breakdown:**
- Week 1-2: Setup, data model, basic CRUD
- Week 3-4: Timeline visualization, chart components
- Week 5-6: Branching logic, comparison view
- Week 7: Monte Carlo engine
- Week 8: Polish, testing, export/import
- Week 9-12: Buffer, bug fixes, documentation

---

## Appendix: Competitive Landscape

**Similar Tools:**
- **Personal Capital (Empower):** Account aggregation, basic retirement planner
- **NewRetirement:** More comprehensive, but less visual, no branching
- **ProjectionLab:** Closest competitor—has scenarios but different UX
- **Spreadsheets:** Current solution for target users

**Differentiation:**
- Git-style branching is unique
- Visual timeline focus
- Historical stress-testing
- Power user-first (not beginner-oriented)

---

*Spec Version: 1.1*
*Last Updated: 2026-03-15*
*Status: Draft - In Progress*