# Financial Planning App - UI/UX Notes

**Started:** April 13, 2026

---

## Core UI Philosophy

**Target User:** Power users who want visual, interactive financial planning
- Comfortable with financial concepts
- Appreciate "Git-style" branching
- Currently use spreadsheets
- Ages 30-55

**Design Principles:**
- Visual first — charts and timelines over tables
- Interactive — drag, zoom, click to explore
- Information dense — power users want data
- Clean but not minimal — show what matters

---

## Layout Architecture — 4-Panel System

**Core Layout:** Responsive 4-panel design with adaptive behavior

### Panels Overview

| Panel | Position | States | Purpose |
|-------|----------|--------|---------|
| **Main** | Center | Always open | Primary chart/timeline view |
| **Left** | Left sidebar | Open / Closed | Main navigation menu |
| **Right** | Right sidebar | Open / Closed | Context information, details |
| **Bottom** | Bottom | Open / Closed / Full-screen | Secondary tools, data tables, logs |

### Large Screen Layout (All Panels Open)

```
┌─────────┬─────────────────────────────┬──────────┐
│         │                             │          │
│  LEFT   │                             │  RIGHT   │
│  PANEL  │      MAIN PANEL             │  PANEL   │
│  [◀]    │      (Chart/Canvas)         │  [▶]     │
│         │                             │          │
│         │                             │          │
├─────────┴─────────────────────────────┴──────────┤
│  BOTTOM PANEL                                    │
│  [▲] [⛶]                                         │
└──────────────────────────────────────────────────┘
```

- **Left & Right:** Full height, fixed width (e.g., 250-300px)
- **Main:** Occupies remaining center space
- **Bottom:** Full width, height adjustable (e.g., 200px default)
- **Toggle icons:** Left [◀], Right [▶], Bottom [▲] and [⛶] (expand)

### Responsive Behavior

**Large Screens (≥1200px):**
- All panels take fixed space
- Main panel shrinks to accommodate open panels
- Smooth transitions when panels open/close

**Medium Screens (768px - 1199px):**
- Left/Right panels become sliding drawers
- Main panel remains visible
- Bottom panel can be sheet or inline

**Small Screens (< 768px):**
- Left/Right panels become bottom sheets
- Bottom panel becomes full-screen modal
- Main panel is full-width

### Panel Controls

**Left Panel:**
- Toggle: Arrow icon [◀] / [▶]
- Opens/closes with animation

**Right Panel:**
- Toggle: Arrow icon [▶] / [◀]
- Opens/closes with animation

**Bottom Panel:**
- Toggle 1: Arrow [▲] / [▼] — Open/Closed
- Toggle 2: Expand icon [⛶] / [🗗] — Full-screen/Contracted
- Full-screen: Covers entire viewport except maybe top nav

### State Management

**Default State (Large Screen):**
- Main: Open (full center)
- Left: Closed (icon only or hidden)
- Right: Closed (icon only or hidden)
- Bottom: Closed or minimal height

**User Preference:**
- Remember panel states across sessions
- Different defaults for different view modes

### Panel Contents

**Main Panel:**
- Timeline chart (net worth over time)
- Interactive canvas
- Primary visualization
- Always visible

**Left Panel (Main Menu):**
- Navigation between views
- Account list/quick access
- Branch/scenario selector
- Global actions

**Right Panel (Context):**
- Selected item details
- Event properties
- Account breakdown
- Help/tooltips

**Bottom Panel (Tools):**
- Data tables
- Event list timeline
- Log/console output
- Advanced tools
- Full-screen data view

---

## Primary Views

### 1. Timeline View (Main Dashboard)

**Purpose:** Visual representation of entire financial journey

**Layout:**
- Horizontal scrollable timeline (years on x-axis)
- Net worth line chart as primary visual
- Events as markers/icons above/below timeline
- Zoom controls: 1yr, 5yr, 10yr, full view

**Elements:**
- **Net worth trajectory:** Primary line (maybe area chart)
- **Confidence bands:** Optional (when Monte Carlo enabled)
- **Event markers:**
  - Income events (salary, social security)
  - Expense events (college, healthcare)
  - Major purchases (house, car)
  - Life milestones (retirement)
- **Current year indicator:** Vertical line or highlight
- **Branch points:** Where scenarios diverge

**Interactions:**
- Click any year → see detailed breakdown
- Click event → edit event details
- Drag event → adjust timing
- Hover → quick summary tooltip
- Zoom → time range adjustment

**Empty State:**
- Prompt to add first account
- Sample/demo timeline
- "Get Started" CTA

---

### 2. Accounts Panel

**Purpose:** Manage accounts and their allocations

**Layout:**
- Sidebar or expandable panel
- List of accounts with key details
- Click to expand and edit

**Account Card:**
- Account name
- Current balance
- Account type icon (401k, IRA, taxable, etc.)
- Asset allocation pie/bar
- Growth rate indicator

**Actions:**
- Add new account
- Edit account
- Delete/archive account
- View account details/timeline

**Asset Allocation Editor:**
- Drag handles or percentage inputs
- Visual representation (pie chart)
- Asset class selector
- Total must = 100%

---

### 3. Events Manager

**Purpose:** Create and manage timeline events

**Layout:**
- List view or timeline view
- Filter by type (savings, expenditure, income)
- Sort by date

**Event Types:**

**Savings Events:**
- Name
- Amount (monthly/yearly)
- Target account
- Start date
- End date (optional)
- Frequency (monthly/yearly)

**Expenditure Events:**
- Name
- Amount
- Start date
- End date (optional)
- Frequency
- Category (optional)

**Income Events:**
- Name
- Amount
- Source
- Duration
- Growth rate (raises, inflation)

**Visual Indicators:**
- Color coding by type
- Icons for common events
- Duration bar showing start/end

---

### 4. Branch/Scenario Comparison

**Purpose:** Compare different "what if" scenarios

**Layout:**
- Side-by-side view (2-3 scenarios)
- Synced timelines
- Highlighted differences

**Controls:**
- Select scenarios to compare
- Create new branch
- Merge branches
- Archive/delete branches

**Visual Comparison:**
- Overlaid line charts (different colors)
- Difference highlighting
- Key metrics comparison table

---

### 5. Monte Carlo Results View

**Purpose:** Show probabilistic outcomes

**Layout:**
- Same timeline but with confidence bands
- Probability metrics displayed

**Elements:**
- **Confidence bands:** Shaded area between p10 and p90
- **Median line:** p50
- **Probability of success:** Big number display
- **Key metrics:**
  - % chance of hitting $0
  - % chance of exceeding target
  - Worst case scenario
  - Best case scenario

**Controls:**
- Adjust simulation count
- Toggle confidence bands
- View specific percentiles

---

## Navigation & Layout

### Top Navigation
- App logo/name
- Primary views (Timeline, Accounts, Events, Branches)
- User menu (settings, profile, logout)
- Save status indicator

### Sidebar (Collapsible)
- Quick account overview
- Recent events
- Branch selector
- Key metrics summary

### Mobile Considerations
- Stack views vertically
- Simplified timeline (shorter range)
- Touch-friendly controls
- Bottom navigation

---

## Visual Design Notes

### Color Scheme
- **Primary:** Professional but not corporate
- **Net worth line:** Green (positive) or gradient
- **Events:** Color by type (income = green, expense = red, etc.)
- **Confidence bands:** Semi-transparent overlays
- **Branches:** Distinct colors per scenario

### Typography
- Sans-serif for UI
- Monospace for numbers (tabular)
- Clear hierarchy (headers, labels, values)

### Charts
- Use Recharts or D3
- Responsive sizing
- Clear axes and labels
- Hover tooltips
- Legends where needed

---

## Interactions & Animations

### Smooth Transitions
- Timeline zooming
- Branch switching
- Event editing
- Chart updates

### Feedback
- Loading states for simulations
- Success/error toasts
- Auto-save indicators

### Keyboard Shortcuts (Power Users)
- `Ctrl/Cmd + S` - Save
- `Ctrl/Cmd + Z` - Undo
- `Arrow keys` - Navigate timeline
- `+/-` - Zoom in/out

---

## Form Design

### Account Form
- Account name (text)
- Account type (dropdown)
- Current balance (currency)
- Asset allocation (visual editor)

### Event Form
- Event name (text)
- Type (savings/expenditure/income)
- Amount (currency)
- Frequency (monthly/yearly)
- Start date (date picker)
- End date (date picker, optional)
- Target account (if savings)

### Validation
- Real-time validation
- Clear error messages
- Prevent invalid submissions
- Show required fields

---

## States & Edge Cases

### Loading States
- Initial app load
- Running Monte Carlo
- Saving data
- Switching branches

### Empty States
- No accounts created
- No events added
- First-time user
- No branches yet

### Error States
- Failed to save
- Invalid data
- Simulation error
- Network issues

### Success States
- Save complete
- Simulation finished
- Branch created
- Event added

---

## Future UI Features (Post-MVP)

- **Historical data import:** CSV upload interface
- **Collaboration:** Share scenarios with spouse/advisor
- **Reports:** PDF export of projections
- **Mobile app:** Native app experience
- **Voice commands:** "Show me retirement at 60"
- **AI insights:** "You're saving 20% below target"

---

## Open Questions

- [ ] Dark mode support?
- [ ] Accessibility requirements?
- [ ] Print-friendly styles?
- [ ] Onboarding flow design?
- [ ] Help/tooltip system?

