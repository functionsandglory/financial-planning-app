# Financial Planning App - Development Plan

## Philosophy: Build Incrementally, Ship Early

Instead of building everything at once, we'll deliver working software in phases. Each phase produces a usable product that can be tested and refined.

---

## Phase 1: Project Foundation (Week 1)

**Goal:** Working development environment with auth and database.

### Features:
- [ ] Initialize TanStack Start project
- [ ] Set up Neon Postgres database
- [ ] Configure Drizzle ORM with migrations
- [ ] Integrate auth system (user provides existing code)
- [ ] Basic project structure and layout
- [ ] Deploy to Vercel (staging)

### Success Criteria:
- User can sign up/log in
- Database connection working
- Basic page loads at deployed URL

**Technical Focus:**
- Project scaffolding
- Database schema foundation
- Auth integration
- CI/CD pipeline

---

## Phase 2: Monte Carlo Core (Weeks 2-5)

**Goal:** Working Monte Carlo simulation with accounts and savings.

### Features:
- [ ] Account creation (401k, IRA, taxable, savings)
- [ ] Asset class selection (preset or custom)
  - Presets: Stocks, Bonds, Cash, etc.
  - Custom: User-defined average return + standard deviation
- [ ] Monthly savings configuration
  - Fixed amount per account, OR
  - Split by percentage across accounts
- [ ] Monte Carlo simulation engine (1,000+ runs)
- [ ] Results visualization (confidence bands, probability)
- [ ] Simple timeline showing outcomes

### Data Model:
```typescript
// Account
{
  id: string;
  name: string;
  type: '401k' | 'ira' | 'roth_ira' | 'taxable' | 'savings';
  currentBalance: number;
  assetAllocation: {
    assetClassId: string;
    percentage: number;
  }[];
}

// Asset Class
{
  id: string;
  name: string;
  avgReturn: number;      // Annual %
  stdDev: number;         // Annual %
  isCustom: boolean;
}

// Savings Plan
{
  totalMonthlyAmount: number;
  allocationMethod: 'fixed' | 'percentage';
  accounts: {
    accountId: string;
    amount?: number;        // For fixed
    percentage?: number;    // For percentage split
  }[];
}

// Simulation Result
{
  percentiles: {
    p10: number[];  // Array of values per year
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  probabilityOfSuccess: number;  // % of runs that don't hit $0
}
```

### Success Criteria:
- User creates 2-3 accounts with asset allocations
- User sets monthly savings ($1000 split 60/40 between 401k/IRA)
- Runs Monte Carlo simulation
- Sees confidence bands and probability of success

**Technical Focus:**
- Monte Carlo engine (web workers for performance)
- Portfolio math (weighted returns, rebalancing)
- Interactive charts (confidence bands)
- State management for simulation inputs

---

## Phase 3: Timeline & Events (Weeks 6-8)

**Goal:** Add time-based events and richer projections.

### Features:
- [ ] Time-based modeling (set retirement date, end date)
- [ ] Income events (salary, Social Security)
- [ ] Expense events (living expenses, healthcare, one-time purchases)
- [ ] Withdrawal phase modeling (retirement drawdown)
- [ ] Simple net worth timeline

### Success Criteria:
- User models working years + retirement years
- Events affect projections correctly
- Can see net worth over full lifetime

---

## Phase 4: Branching — Git for Your Future (Weeks 9-11)

**Goal:** Enable scenario comparison with branches.

### Features:
- [ ] Create branches from main timeline
- [ ] Modify events/accounts on branches independently
- [ ] Side-by-side comparison view
- [ ] Switch between branches

### Success Criteria:
- User creates "What if I save $500 more per month?" branch
- Compare two scenarios simultaneously
- Changes on branches don't affect main

---

## Phase 5: Forecast vs. Actual (Weeks 12-14)

**Goal:** Compare projections to real-world outcomes.

### Features:
- [ ] Log actual account balances (ad hoc)
- [ ] Plot forecast line + actual line on same chart
- [ ] Visual gap indicator

### Success Criteria:
- User enters starting balance and logs updates
- Chart shows both lines
- Can see if ahead or behind projection

---

## Phase 6: Advanced Features (Weeks 15-18)

**Goal:** Add depth to the modeling.

### Features:
- [ ] Tax treatment modeling (tax-deferred, Roth, taxable)
- [ ] Asset class correlations
- [ ] Historical scenarios (Great Recession, COVID, etc.)
- [ ] Inflation adjustments (real vs. nominal)

### Success Criteria:
- Account types affect tax drag calculations
- Can stress-test against 2008 scenario
- Toggle between real and nominal dollars

---

## Phase 7: Polish & Reports (Weeks 19-22)

**Goal:** Make it delightful and professional.

### Features:
- [ ] Summary dashboard with key metrics
- [ ] Data export (CSV)
- [ ] Onboarding flow
- [ ] Mobile improvements

### Success Criteria:
- New user understands app in 5 minutes
- Professional look and feel
- Works well on mobile

---

## Post-V1 Ideas (Future Phases)

**Not in initial scope:**
- Account syncing (Plaid integration)
- Collaboration/sharing
- Advanced tax optimization
- Financial advisor features
- Native mobile app
- AI recommendations

---

## Current Status

**Ready to start:** Phase 1 — Project Foundation

**Prerequisites:**
- [ ] User provides existing auth code
- [ ] Set up Neon database
- [ ] Initialize TanStack Start project
