# Financial Planning App — Architecture Notes

*Technical considerations for structural changes (accounts, asset classes)*

---

## The Core Problem

When you have Git-style branching + Forecast vs. Actual tracking, structural changes become complex:

**Scenario:**
- You have a "main" branch with a "401k" account
- You create a branch "retire-early" that references that 401k
- You later delete the 401k or change it from "stocks" to "bonds"

**Question:** What happens to historical data? Other branches? Forecast vs. Actual tracking?

---

## Option 1: Global Account Definitions (Simple, but Limiting)

**How it works:**
- Accounts are defined once globally (like a database table)
- All branches reference the same account definitions
- Changing an account affects all branches retroactively

**Pros:**
- Simple to implement
- Easy to manage
- Single source of truth

**Cons:**
- Changing an account changes historical forecasts
- "Retire-early" branch from 2020 suddenly has 2025 account settings
- Breaks the "time capsule" aspect of branches

**When to use:** Small apps, single-user, simple scenarios

---

## Option 2: Branch-Scoped Accounts (Git-Like, Complex)

**How it works:**
- Each branch has its own copy of account definitions
- Accounts are versioned (Account v1, v2, etc.)
- Events reference specific account versions

**Example:**
```
Branch: main
  Account: 401k-v1 (stocks, started 2020)
  
Branch: retire-early (branched from main in 2022)
  Account: 401k-v1 (stocks, inherited from main)
  
User changes 401k to bonds in main branch (2025)
  Account: 401k-v2 (bonds)
  
Branch: retire-early
  Still has: 401k-v1 (stocks, unchanged)
```

**Pros:**
- True Git-like behavior
- Historical integrity preserved
- Can compare "what if I changed to bonds in 2020?"

**Cons:**
- Complex to implement
- Many duplicate accounts across branches
- Hard to reconcile "actuals" (which account version?)

**When to use:** Power users, complex scenario modeling

---

## Option 3: Hybrid — Global Accounts + Branch Overrides (Recommended)

**How it works:**
- Accounts defined globally (name, type, default settings)
- Each branch can have "overrides" for specific attributes
- Events reference global account + branch-specific overrides

**Example:**
```
Global Account: 401k
  - Type: retirement
  - Default asset allocation: 80/20 stocks/bonds
  
Branch: main
  - Uses 401k with default settings
  
Branch: retire-early  
  - Uses 401k BUT override: 60/40 allocation
  
User changes global 401k to 70/30:
  - Branch main: automatically gets 70/30
  - Branch retire-early: stays 60/40 (has override)
```

**Pros:**
- Flexible
- Maintains some historical integrity
- Can have both shared and branch-specific settings
- Easier to reconcile actuals (global account exists)

**Cons:**
- More complex data model
- Need clear UI to show what's inherited vs. overridden

**When to use:** Most real-world scenarios

---

## Option 4: Event-Sourcing Approach (Advanced)

**How it works:**
- Don't store "current state" of accounts
- Store only events ("created account", "changed allocation", "deleted account")
- Reconstruct account state by replaying events up to a point in time

**Example:**
```
Event 1 (2020-01): CreateAccount(401k, stocks)
Event 2 (2022-06): CreateBranch(retire-early)
Event 3 (2023-03): ChangeAllocation(401k, bonds)

State in 2021: 401k is stocks
State in 2022: 401k is stocks  
State in 2024: 401k is bonds
```

**Pros:**
- Perfect historical audit trail
- Can view state at any point in time
- True Git-like immutability

**Cons:**
- Complex to implement
- Query performance issues (must replay events)
- Harder to understand for users

**When to use:** Enterprise apps, regulatory requirements, need full audit trail

---

## Forecast vs. Actual — The Reconciliation Problem

**The Challenge:**
- Forecast created in 2020 using "401k" account
- You delete that 401k in 2025
- What happens to the 2020 forecast? The actuals tracked against it?

### Solution A: Soft Delete (Recommended)

- Accounts are "archived" not deleted
- Old forecasts still reference archived account
- Actuals still tracked against archived account
- Can still view historical data

**Example:**
```
2020: Forecast 401k contribution = $500/month (account active)
2022: Actual 401k contribution = $500/month (account active)
2025: Archive 401k (rolled into new account)
2025+: Can still view 2020-2022 forecast vs. actual for archived 401k
```

### Solution B: Account Merging

- When deleting account, specify which account replaces it
- Historical data automatically remapped
- "401k" data now shows under "Retirement-Savings" account

**Pros:** Clean, consolidated view
**Cons:** Loses historical specificity (can't see "when I had 401k vs. new account")

### Solution C: Keep Separate

- Deleted accounts stay in system but marked "closed"
- New accounts are separate
- Historical data preserved but fragmented

**Example:**
```
2020-2024: 401k account (now closed)
2025+: New "Retirement" account
Historical reports show both separately
```

---

## Asset Class Changes — Specific Consideration

**Scenario:**
- 401k is "Growth Stocks" asset class (high risk, high return)
- You reclassify it as "Balanced" (moderate risk)
- What happens to Monte Carlo simulations on old branches?

### Approach 1: Retroactive (Simple but Wrong)

- All historical simulations use new asset class
- 2020 forecast now uses 2025 asset class

**Problem:** Breaks historical integrity

### Approach 2: Snapshot at Creation (Correct but Complex)

- When branch created, snapshot all account settings
- Simulations use settings as of branch creation date
- Changing asset class in main doesn't affect old branches

**Implementation:**
```
Branch created 2022:
  - Snapshot: 401k was "Growth Stocks" 
  - All sims in this branch use "Growth Stocks"
  
Main branch 2025:
  - Changes 401k to "Balanced"
  - New sims use "Balanced"
  - 2022 branch still uses "Growth Stocks"
```

### Approach 3: Versioned Asset Classes

- Asset classes versioned (v1, v2)
- Accounts reference specific version
- Can upgrade account to new version or keep old

**Example:**
```
Asset Class: Growth Stocks v1 (2020-2024)
Asset Class: Growth Stocks v2 (2025+, new methodology)

401k can use v1 or v2 depending on branch
```

---

## Simplified Architecture (User Feedback)

**Key Insight from discussion:**
> "Branches can just be the events. Accounts, balances, asset classes type are all global."

This is much simpler and cleaner for MVP:

### Architecture: Global State + Branch Events

**Global (Shared across all branches):**
- Account definitions (name, type, asset class)
- Current balances
- Asset class types and return assumptions

**Branch-Specific (Events only):**
- Timeline events (income, expenses, transfers)
- Event amounts and dates
- Event overrides (if any)

**How it works:**
```
Global Accounts:
  - 401k (type: retirement, allocation: 80/20)
  - Savings (type: taxable, allocation: 60/40)
  
Branch: main
  Events:
    - 2020-01: Income $5,000 → 401k contribution $500
    - 2020-01: Expense $2,000 (rent)
    
Branch: retire-early (branched from main at 2022-01)
  Events:
    - Inherits main events up to 2022-01
    - 2022-01: Income $5,500 (raise)
    - 2022-02: Expense $1,500 (downsized rent)
```

**Why this works:**
- Accounts are global → single source of truth
- Changing account allocation affects all branches (consistent)
- Branches only differ in events (what happens when)
- Much simpler to implement
- Easy to understand: branches = different timelines of events

**Forecast vs. Actual:**
- Events have both forecast and actual values
- Same account can have different events in different branches
- Historical actuals preserved per event

## Recommended Architecture (Revised)

### For MVP:

**Global:**
1. **Account definitions** (soft delete for archive)
2. **Asset classes** (stocks, bonds, etc. with return assumptions)
3. **Current balances** (synced across all branches)

**Per Branch:**
1. **Event timeline** (income, expenses, transfers)
2. **Event values** (amount, date, forecast vs. actual)
3. **Branch metadata** (created from, description)

**Calculation:**
- Run simulation: Apply branch's events to global accounts
- Result: projected balances over time

### Example User Flow:

**User has 401k, creates branch, changes account:**

```
Step 1: Create 401k account (Global)
  - Name: "My 401k"
  - Type: Retirement
  - Allocation: 80/20 stocks/bonds

Step 2: Create "main" branch
  - Uses 401k with default settings
  - Add events: contribution $500/month

Step 3: Create "retire-early" branch
  - Inherits 401k from main
  - Override: allocation 60/40 (more conservative)

Step 4: Track actuals (2020-2024)
  - Record actual contributions
  - Compare to forecast

Step 5: Archive 401k (2025)
  - Rolled into new IRA
  - Account marked "archived" not deleted
  - Historical data (2020-2024) still accessible
  - Forecast vs. actual reports still show 401k data

Step 6: Create new IRA account (2025)
  - New forecasts use IRA
  - Old 401k data preserved for historical analysis
```

### Database Schema (Simplified):

```
accounts (global)
  - id, name, type, default_allocation
  - created_at, archived_at (nullable)
  - user_id

branches
  - id, name, parent_branch_id
  - created_at, user_id

branch_account_settings (overrides)
  - branch_id, account_id
  - allocation_override (nullable)
  - is_active

events (timeline items)
  - id, branch_id, account_id
  - type: income | expense | transfer
  - amount, date
  - forecast_value, actual_value (for tracking)

snapshots (for Monte Carlo)
  - branch_id, account_id
  - allocation_at_time_of_snapshot
  - date
```

---

## Key Principles

1. **Never lose historical data**
   - Soft delete, don't hard delete
   - Archive accounts, don't remove them

2. **Branches are snapshots in time**
   - Changing main branch shouldn't retroactively change old branches
   - But can choose to propagate changes forward

3. **Actuals are sacred**
   - Once recorded, shouldn't change
   - Even if account archived, actuals preserved

4. **Flexible but clear**
   - Allow branch-specific overrides
   - But show user what's inherited vs. custom

---

## UI Considerations

**Show inheritance clearly:**
```
Account: 401k
  Allocation: 60/40 [inherited from main: 80/20] ← visual indicator
  
[Reset to inherited] [Customize for this branch]
```

**Archive workflow:**
```
Archive 401k?
  → Data will be preserved
  → Historical reports still accessible
  → Select replacement account for new events: [IRA ▼]
```

**Variance reporting:**
```
2020-2024 (401k - archived)
  Forecast: $24,000 | Actual: $24,500 | Variance: +2% ✓

2025+ (IRA)
  Forecast: $6,000 | Actual: - | Variance: -
```

---

## Bottom Line

**Recommended approach:** Hybrid global + branch overrides with soft delete

- Global accounts for consistency
- Branch overrides for scenario modeling
- Soft delete to preserve history
- Clear UI showing inheritance

This gives you Git-like branching without the complexity of full event sourcing, while preserving the integrity needed for forecast vs. actual tracking.
