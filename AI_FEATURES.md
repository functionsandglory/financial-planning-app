# MCP Server Specification

Model Context Protocol integration for external AI tools (Claude Desktop, Cursor, custom agents) to interact with financial planning data.

---

## Core Operations

### Read Operations

| Operation | Description |
|-----------|-------------|
| `get_timeline(timeline_id)` | Fetch main timeline or any branch with full event history |
| `get_projections(timeline_id)` | Retrieve Monte Carlo results (percentiles, success probability) |
| `compare_branches(branch_a, branch_b)` | Structured diff showing what changed between scenarios |
| `get_accounts(timeline_id)` | Account balances, allocations, and growth assumptions |
| `get_events(timeline_id, date_range?)` | Income, expense, transfer events with filters |
| `get_assumptions(timeline_id)` | Inflation, returns, tax brackets, life expectancy |

### Write Operations

| Operation | Description |
|-----------|-------------|
| `create_branch(name, from_date, description?)` | Spawn new scenario from any point in time |
| `add_event(timeline_id, event)` | Inject income/expense/transfer/milestone |
| `modify_event(event_id, changes)` | Update existing event properties |
| `delete_event(event_id)` | Remove event from timeline |
| `modify_assumption(timeline_id, key, value)` | Adjust inflation, returns, life expectancy |
| `run_monte_carlo(timeline_id)` | Queue simulation, return job ID for polling |

---

## Chart Generation

Since MCP clients don't support interactive webviews, charts are delivered as server-generated SVG with basic hover support via `<title>` elements.

### Supported Chart Types

- **Timeline projection:** Net worth over time with confidence bands
- **Branch comparison:** Side-by-side scenario overlay
- **Income sources:** Stacked area showing salary, Social Security, withdrawals
- **Account waterfall:** How balances evolve across accounts
- **Monte Carlo fan:** Percentile ranges (10th, 25th, 50th, 75th, 90th)

### Output Format

```json
{
  "chart_type": "svg",
  "content": "<svg viewBox=\"0 0 800 400\">...</svg>",
  "alt_text": "Net worth projection showing median $2.3M by 2045",
  "expires_at": "2026-03-16T20:00:00Z"
}
```

### Visual Capabilities
- Multi-series line charts
- Gradient fills for confidence bands
- Custom annotations and markers
- `<title>` tooltips on hover (browser-native)

### Limitations
- No JavaScript execution
- No custom hover states or animations
- No zoom/pan interactivity
- Static rendering only

---

## Security Model

### Authentication
- OAuth 2.0 style grants per external AI tool
- User explicitly approves each connection
- Scoped tokens with expiration

### Authorization Scopes
- `read:timelines` — View data only
- `write:timelines` — Create branches, add/modify events
- `write:assumptions` — Modify projections and run simulations

### Audit Logging
- Every MCP operation logged with timestamp, tool ID, user ID
- Write operations include before/after state snapshots
- Exportable audit trail for compliance

---

## Example Workflows

### Explore Scenario
```
User: "Show me my Early Retirement branch"
→ get_timeline("early-retirement")
→ get_projections("early-retirement")
→ Returns: timeline data + SVG chart
```

### Create and Compare
```
User: "What if I add $500/month to my 401k starting next year?"
→ create_branch("Higher 401k", "2026-01-01")
→ add_event(branch_id, contribution_event)
→ run_monte_carlo(branch_id)
→ compare_branches("main", branch_id)
→ Returns: diff summary + comparison SVG
```

### Quick Check
```
User: "Am I on track for 60?"
→ get_projections("main")
→ Returns: success probability + key metrics + mini chart
```

---

## Technical Notes

- **Protocol:** Model Context Protocol (MCP)
- **Transport:** HTTP/SSE for streaming, stdio for local tools
- **Chart Generation:** Server-side D3.js → SVG serialization
- **Rate Limiting:** 100 requests/minute per tool, 1000/hour per user
- **Caching:** SVG charts cached 5 minutes, projection data cached 1 minute

---

*Spec Version: 1.0*
