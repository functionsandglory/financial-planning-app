# Forecast vs. Actual — Mechanics

*How tracking projected vs. real financial outcomes works in practice*

---

## The Core Concept

Every event in your timeline has **two values**:
- **Forecast:** What you planned/planned to happen
- **Actual:** What really happened (updated over time)

**Example:**
```
Event: 401k Monthly Contribution
  Date: January 2025
  Forecast: $500
  Actual: $450 (updated Feb 1, 2025)
  Variance: -$50 (-10%) 🟡
```

---

## How Users Update Actuals

### Method 1: Ad Hoc Balance Updates (Preferred)

**User-driven updates:**
- No rigid schedule or forced check-ins
- User updates balances whenever they want
- Could be weekly, monthly, quarterly, or just occasionally
- System shows "last updated" date for each account

**Example flow:**
1. User opens app, sees dashboard
2. Notices 401k shows "Last updated: 2 months ago"
3. Clicks "Update Balance" button
4. Enters current 401k balance
5. System calculates variance since last update
6. Shows drift over time

**Why this works:**
- Flexible - fits user's schedule
- No annoying notifications
- User stays in control
- Can see gaps since last update

**UI indicator:**
```
401k Account
  Projected: $50,000
  Actual: $48,500 (updated 3 days ago) 🟢
  
Savings Account
  Projected: $10,000
  Actual: Unknown (last updated 2 months ago) ⚪
  [Update Balance]
```

### Method 2: Event-Level Updates

**Granular Flow:**
1. User looks at timeline
2. Sees January events with forecast values
3. Clicks event: "401k Contribution - $500 forecast"
4. Enters actual: "$450"
5. System updates variance immediately

**Why this works:**
- Precise tracking per event
- Good for specific categories ("How much did I actually spend on groceries?")
- More work but more detail

### Method 3: Bulk Import (Future)

**CSV Import:**
1. User exports transactions from bank
2. Uploads CSV to app
3. App auto-matches to forecasted events
4. Calculates variances automatically

**Why this works:**
- Minimal manual entry
- Uses real transaction data
- Most accurate

---

## What Gets Tracked

### Account Balance Variance

**Global accounts have:**
- Projected balance (from forecast events)
- Actual balance (user-entered)
- Variance between them

**Example Dashboard:**
```
401k Account
  Projected (Jan 2025): $50,000
  Actual (Jan 2025): $48,500
  Variance: -$1,500 (-3%) 🟡
  
Savings Account
  Projected (Jan 2025): $10,000
  Actual (Jan 2025): $10,200
  Variance: +$200 (+2%) 🟢
```

### Market Performance vs. Projected Growth

**For investment accounts, track separately:**
- **Projected growth:** Based on your return assumptions (e.g., "7% annually for stocks")
- **Actual growth:** What the market actually did (e.g., "12% this year" or "-5%")
- **Attribution:** Did variance come from contributions or market performance?

**Example:**
```
401k Account (Dec 2025)
  Starting balance (Jan 2025): $40,000
  
  Projected:
    - Contributions: +$6,000
    - Growth (7% assumed): +$3,220
    - End balance: $49,220
  
  Actual:
    - Contributions: +$5,500 (you contributed less)
    - Growth (actual 12%): +$5,460
    - End balance: $50,960
  
  Variance Analysis:
    - From contributions: -$500 🟡 (under-contributed)
    - From market: +$2,240 🟢 (market beat projections)
    - Net variance: +$1,740 🟢
```

**Why this matters:**
- Market variance: "Stocks did better than my 7% assumption"
- Contribution variance: "I didn't contribute as much as planned"
- Helps you separate what you control (contributions) from what you don't (market)

### Event-Level Variance

**Each event shows:**
```
Event: Monthly 401k Contribution
  Forecast: $500
  Actual: $450
  Variance: -$50 (-10%) 🟡
  
Event: Grocery Spending
  Forecast: $600
  Actual: $720
  Variance: +$120 (+20%) 🔴
```

---

## Variance Indicators

### Color Coding

| Variance | Color | Meaning |
|----------|-------|---------|
| Within ±5% | 🟢 Green | On track |
| ±5% to ±15% | 🟡 Yellow | Warning - worth monitoring |
| Beyond ±15% | 🔴 Red | Significant deviation |

**Examples:**
- Forecast $500, Actual $490 → 🟢 (2% variance)
- Forecast $500, Actual $430 → 🟡 (14% variance)
- Forecast $500, Actual $350 → 🔴 (30% variance)

### Timeline Visualization

**On the timeline:**
```
Jan 2025    Feb 2025    Mar 2025
  |            |            |
[$500]      [$450]      [$500]
  🟢          🟡          🟢
  
Click any month to see:
- All events with variances
- Account balance drift
- Cumulative variance
```

---

## Drift Detection

### Automatic Monitoring (When Data Available)

**System watches for patterns after multiple ad hoc updates:**
```
Insight: "Over your last 3 balance updates, your 401k contributions 
have averaged 12% below forecast"

Suggestion: "Update your forecast to $440/month or increase contributions"
```

**Types of drift detected:**
1. **Sustained underperformance** — consistently below forecast over multiple updates
2. **Sustained overperformance** — consistently above forecast (good problem!)
3. **Category drift** — "You consistently underestimate groceries by 20%"
4. **Seasonal patterns** — "December spending is always 40% above forecast"

### Variance Alerts (Optional)

**On-demand insights:**
- User opens app: "⚠️ Based on your last update 2 months ago, grocery spending 
is trending 25% above forecast"
- Dashboard shows: "✅ Your savings rate is on track!" (when data current)
- No forced notifications — user checks when they want

---

## Learning & Adjustment

### Historical Accuracy

**Dashboard shows:**
```
Your Forecasting Accuracy

Overall: 87% 🟢

By Category:
- Income: 95% 🟢 (you nail this)
- Savings: 82% 🟡 (slightly optimistic)
- Expenses: 73% 🟡 (underestimate by ~15%)
- Investments: 60% 🔴 (market variance)

Trend: Improving (+5% vs. last year)
```

### Auto-Adjustment Suggestions

**System recommends updates:**
```
Based on your actuals from the past 6 months:

"You consistently spend $720/month on groceries,
but your forecast is $600/month.

Update grocery forecast to $720?"

[Update Forecast] [Keep Current] [Remind Me Later]
```

**Smart suggestions:**
- Detect seasonal patterns (higher spending in December)
- Account for raises/inflation
- Flag consistent underestimation

---

## User Flow Example

### Month 1: Setting Up

1. User creates branch "main"
2. Adds forecast events:
   - 401k contribution: $500/month
   - Rent: $1,500/month
   - Groceries: $600/month
3. Sets projected account balances

### Month 2: Ad Hoc Update

1. User opens app on their own schedule
2. Sees "401k last updated 6 weeks ago" reminder
3. Decides to update balances
4. Enters current balances:
   - 401k: $48,500
   - Savings: $10,200
5. System calculates variances from last update:
   - 401k variance: -$1,500 over 6 weeks
   - Savings variance: +$200
6. Shows timeline with 🟡 yellow indicators where relevant

### Month 3: Pattern Emerges (After Multiple Updates)

1. User updates balances again (when convenient)
2. System now has 3 data points and detects pattern:
   - "You've undersaved by an average of $60/month"
3. Suggests adjustment:
   - "Update 401k forecast to $440 or increase contributions"
4. User decides to update forecast
5. Future projections automatically adjust

### Month 6: Review

1. User opens "Forecast Accuracy" dashboard
2. Sees:
   - Overall accuracy: 85%
   - Income forecasts: 98% accurate
   - Expense forecasts: 72% accurate (underestimating)
3. Makes adjustments to future forecasts based on patterns
4. Branch projections update

---

## Technical Implementation

### Data Model

```
events table:
  - id
  - branch_id
  - account_id
  - event_type (income, expense, transfer)
  - date
  - forecast_amount
  - actual_amount (nullable)
  - updated_at

account_snapshots table (for balance tracking):
  - id
  - account_id
  - date
  - projected_balance (calculated)
  - actual_balance (user-entered)
  - variance

variance_alerts table:
  - id
  - user_id
  - alert_type (drift, threshold, pattern)
  - message
  - acknowledged
```

### Calculation Logic

**Monthly Variance Calculation:**
```python
# For each account, each month:
projected_balance = calculate_from_events(branch.events, month)
actual_balance = user_entered_balance

variance = actual_balance - projected_balance
variance_percent = (variance / projected_balance) * 100

# Color code:
if abs(variance_percent) <= 5%:
  status = "green"
elif abs(variance_percent) <= 15%:
  status = "yellow"
else:
  status = "red"
```

**Drift Detection:**
```python
# Check last 3 months:
variances = get_monthly_variances(account, last_3_months)

if all(v < 0 for v in variances):  # All negative
  average_drift = sum(variances) / 3
  if average_drift < -threshold:
    create_alert("Sustained underperformance", average_drift)
```

---

## Attribution: Contributions vs. Market Performance

### The Problem

When an investment account is off from projections, there are **two possible causes**:

1. **You contributed/spent differently than planned** (contribution variance)
2. **The market performed differently than assumed** (market variance)

**Example:**
```
Your 401k is $5,000 below projection
  → Is it because you contributed less?
  → Or because stocks tanked?
  → Or both?
```

### How Attribution Works

**Step 1: Calculate projected balance**
```
Starting balance: $40,000
Projected contributions: $6,000
Projected growth (7%): $3,220
Projected end balance: $49,220
```

**Step 2: Calculate what balance WOULD be with actual contributions but projected growth**
```
Starting balance: $40,000
Actual contributions: $5,500
Projected growth (7% on avg balance): $3,083
Hypothetical balance: $48,583

→ This isolates contribution variance: $49,220 - $48,583 = $637
```

**Step 3: Compare to actual balance**
```
Actual end balance: $50,960
Hypothetical balance: $48,583
Market variance: +$2,377

(Or calculate actual growth rate: ($50,960 - $40,000 - $5,500) / avg balance = 12%)
```

**Step 4: Report to user**
```
401k Variance Breakdown:

Total variance: +$1,740 🟢 (better than expected)

Attributed to:
  📥 Contributions: -$500 🟡 (contributed less)
  📈 Market performance: +$2,240 🟢 (stocks grew 12% vs 7% projected)

Insight: "The market bailed out your lower contributions!"
```

### User Interface for Attribution

**Detailed view:**
```
401k Account - 2025 Year in Review

Projected: $49,220 | Actual: $50,960 | Variance: +$1,740 🟢

Breakdown:
  Contributions
    Planned: $500/month × 12 = $6,000
    Actual: $458/month avg = $5,500
    Variance: -$500 🟡
    
  Investment Growth
    Projected: 7% return = $3,220
    Actual: 12% return = $5,460
    Variance: +$2,240 🟢
    
Takeaway: Market outperformed by 5 percentage points, 
compensating for lower contributions.
```

**Trend view:**
```
Market Performance vs. Assumptions

Your "Stocks" allocation assumption: 7% annual

Year | Projected | Actual | Variance
-----|-----------|--------|----------
2021 | 7%        | 15%    | +8% 🟢
2022 | 7%        | -18%   | -25% 🔴
2023 | 7%        | 24%    | +17% 🟢
2024 | 7%        | 11%    | +4%  🟢
2025 | 7%        | 12%    | +5%  🟢

4-year actual average: 8.8%
Your assumption: 7%
Assessment: Your 7% assumption is reasonable 
but slightly conservative.
```

### Adjusting Assumptions

**System suggests based on actuals:**
```
Based on your actual market returns over the past 3 years,
your portfolio has averaged 9.2% vs. your 7% assumption.

Would you like to:
[Update assumption to 8.5%] 
[Keep 7% (conservative)]
[Remind me next year]

Note: Updating your assumption will change all future 
projections but won't affect historical variance tracking.
```

### Technical Implementation

**Calculation pseudocode:**
```python
def calculate_attribution(account, start_date, end_date):
    starting_balance = get_balance_at(account, start_date)
    actual_ending_balance = get_balance_at(account, end_date)
    
    # Get all transactions in period
    actual_contributions = sum(transaction.amount 
                               for transaction in account.transactions 
                               if transaction.type == 'contribution' 
                               and start_date <= transaction.date <= end_date)
    actual_withdrawals = sum(transaction.amount 
                             for transaction in account.transactions 
                             if transaction.type == 'withdrawal'
                             and start_date <= transaction.date <= end_date)
    
    # Projected calculation
    projected_contributions = sum(event.forecast_amount 
                                  for event in account.forecast_events
                                  if event.type == 'contribution'
                                  and start_date <= event.date <= end_date)
    
    # Calculate projected growth
    avg_projected_balance = calculate_average_balance(
        starting_balance, 
        starting_balance + projected_contributions,
        method='midpoint'
    )
    projected_growth_rate = account.asset_class.assumed_return
    projected_growth = avg_projected_balance * projected_growth_rate
    projected_ending = starting_balance + projected_contributions + projected_growth
    
    # Calculate actual growth (backed out from actuals)
    actual_growth = actual_ending_balance - starting_balance - actual_contributions + actual_withdrawals
    
    # Calculate hypothetical: actual contributions with projected growth
    avg_balance_with_actual_contributions = calculate_average_balance(
        starting_balance,
        starting_balance + actual_contributions,
        method='midpoint'
    )
    hypothetical_growth = avg_balance_with_actual_contributions * projected_growth_rate
    hypothetical_ending = starting_balance + actual_contributions + hypothetical_growth
    
    # Attribution
    contribution_variance = hypothetical_ending - projected_ending
    market_variance = actual_ending_balance - hypothetical_ending
    
    return {
        'total_variance': actual_ending_balance - projected_ending,
        'contribution_variance': contribution_variance,
        'market_variance': market_variance,
        'actual_growth_rate': actual_growth / avg_balance_with_actual_contributions
    }
```

---

## Edge Cases

### Missing Actuals

**What if user doesn't update for a few months?**
- Show "⚠️ Actuals 2 months behind"
- Still show forecast line
- When user updates, backfill or just update current month
- Option: "Update all missing months" with simple interpolation

### Account Changes Mid-Year

**What if user creates a new account or archives one?**
- For archived accounts: keep historical actuals visible
- For new accounts: start tracking from creation date
- Variance calculations only for periods where both forecast and actual exist

### Large One-Time Variances

**What if user gets a bonus or has emergency expense?**
- Mark as "one-time" vs "recurring"
- One-time events don't trigger drift alerts
- But still count toward variance for that month

---

## Bottom Line

**Forecast vs. Actual is simple:**
1. User plans events with forecast amounts
2. Time passes, user enters actual balances (ad hoc, on their schedule)
3. System calculates variance (forecast - actual)
4. **For investment accounts:** Attribute variance to contributions vs. market performance
5. Visual indicators show if on track (green), warning (yellow), or off (red)
6. Over time, system learns patterns and suggests forecast adjustments

**Key principle:** 
- Make it easy to update actuals (ad hoc balance updates)
- Show not just "you're off by $5,000" but "market did better, but you contributed less"
- Help users separate what they control from what they don't
