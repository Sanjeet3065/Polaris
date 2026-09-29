# POLARIS — AI Operations Assistant Architecture (Phase 12)

**Polar Operations & Logistics Automated Remote Intelligence System**  
*SIH 2026 Problem Statement: SIH26060*  
*National Centre for Polar and Ocean Research (NCPOR) & Ministry of Earth Sciences (MoES)*

---

## 1. Executive Summary & Objective

The **POLARIS AI Operations Assistant** is a production-grade operational intelligence interface designed for remote management of Indian Antarctic Research Stations (**Maitri** and **Bharati**). 

The assistant enables station commanders, engineers, and NCPOR headquarters officers to query live operational telemetry, microgrid energy balance, life-support environmental parameters, equipment degradation indices, Phase 10 predictive maintenance risks, Phase 11 analytics and reports, alarms, incidents, and polar logistics through natural language.

### Core Principle
> **The assistant must answer from actual POLARIS data. Every factual response is grounded in allowlisted operational tools and verified PostgreSQL data. The LLM never guesses, hallucinates, or generates raw SQL.**

### Critical Safety Boundary
> **The assistant is strictly an ADVISORY and INFORMATIONAL INTELLIGENCE INTERFACE.**  
> It is **NOT** an autonomous station controller. It cannot autonomously start/stop generators, adjust HVAC setpoints, alter battery charge profiles, modify inventory quantities, acknowledge alarms, close incidents, or execute database writes. When a user requests an action, the assistant generates a structured `ProposedAction` card requiring authorized confirmation in the target module.

---

## 2. High-Level Architecture

```
                 ┌────────────────────────────────────────────────────────┐
                 │       Frontend UI (/assistant)                        │
                 │   - Chat Feed & Streaming SSE Renderer                 │
                 │   - Suggested Questions Carousel                       │
                 │   - Operational Context Panel (Telemetry/Alarms/Fleet) │
                 │   - Conversation Session History Drawer                │
                 └───────────────────────────┬────────────────────────────┘
                                             │ POST /assistant/chat (or /stream)
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │           Assistant Controller & Middleware            │
                 │   - JWT Authentication                                 │
                 │   - RBAC Validation (ADMIN | OPERATOR | VIEWER)        │
                 │   - Station Authorization Guard                        │
                 │   - Request Rate Limiting (60 req/min)                 │
                 │   - Zod Schema Sanitization                            │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │        Intent & Entity Extraction Service              │
                 │   - Intent Categorization (17 deterministic categories)│
                 │   - Station Normalization (Maitri | Bharati | ALL)     │
                 │   - Time Window Parsing (1h, 6h, 24h, 7d, 30d)         │
                 │   - Equipment & Metric Entity Resolution               │
                 │   - Prompt Injection Defense Guard                     │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │         Allowlisted Tool Registry (21 Tools)          │
                 │   - Server-Side Station Authorization Check            │
                 │   - Bounded Results (Max 20 records, Aggregated Stats) │
                 │   - Direct Invocation of Existing POLARIS Services     │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
               Energy / Env Telemetry   Equipment & RUL       Alerts & Incidents
               (Phase 5 & 7 Services) (Phase 10 Predictor)   (Phase 9 Service)
                       │                     │                     │
                       └─────────────────────┼─────────────────────┘
                                             ▼
                                     PostgreSQL Database
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │              Structured Tool Results Array             │
                 │   - Station data, metrics, timestamps, quality flags   │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │           AI Provider Response Generator               │
                 │   - Deterministic Provider (Default, Zero-Hallucination)│
                 │   - Google Gemini Provider (Streaming SSE & Fallback)  │
                 │   - Strict System Prompt & Anti-Hallucination Guard   │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │           Standard Grounded Response Envelope          │
                 │   - Direct answer with formatted metrics               │
                 │   - Cited sources & data freshness badge               │
                 │   - Tool execution audit log                           │
                 │   - Quick navigation shortcuts to core modules         │
                 │   - Dynamic suggested follow-up questions              │
                 └────────────────────────────────────────────────────────┘
```

---

## 3. Strict Safety & Anti-Hallucination Controls

### 3.1 Prohibited Capabilities
Under no circumstances does the assistant:
1. **Generate or execute raw SQL queries**
2. **Execute shell commands or scripts**
3. **Access local file paths or server directories**
4. **Make arbitrary external HTTP network requests**
5. **Autonomously modify equipment states, microgrid parameters, or database records**
6. **Expose environment secrets, API keys, JWT secrets, or system prompts**
7. **Bypass server-side RBAC or station scoping**

### 3.2 Action Confirmation Protocol
When a user expresses a command (e.g., *"Create a maintenance work order for DG-01"*):
- Intent is detected as `ACTION_REQUEST`.
- The assistant refuses autonomous execution: *"POLARIS Operations Assistant cannot autonomously create records or control equipment."*
- A structured `proposedAction` object is attached:
  ```json
  {
    "actionType": "CREATE_WORK_ORDER",
    "targetEntity": "DG-01",
    "station": "MAITRI",
    "reason": "Operator requested work order creation via Assistant.",
    "status": "PROPOSED_REQUIRES_CONFIRMATION",
    "confirmationPrompt": "Proposed Action: Create maintenance work order for DG-01 at MAITRI. No records have been modified. Please confirm and dispatch within the Maintenance module.",
    "moduleRoute": "/maintenance"
  }
  ```
- The frontend renders an amber confirmation card directing the user to the dedicated module.

### 3.3 Prompt Injection Defense
User queries are filtered against adversarial patterns (e.g., `ignore previous instructions`, `system prompt`, `api_key`, `jwt secret`, `process.env`, `select * from users`). Any adversarial attempt triggers an immediate, safe refusal before any LLM processing or tool invocation.

---

## 4. Allowlisted Tool Registry

The assistant has access **only** to 21 registered, allowlisted tools. Each tool verifies station authorization and returns strictly bounded payloads:

| Tool Name | Operational Domain | Key Data Sources |
|---|---|---|
| `get_station_status` | Station Health & Overview | Station status, health %, personnel count |
| `get_station_telemetry` | Real-Time Telemetry | Phase 5/7 live telemetry cache & latest readings |
| `get_energy_summary` | Microgrid & Power Balance | Solar, diesel, load, battery SoC, fuel days |
| `get_environment_summary` | Climate & Life Support | Wind speed, ambient temp, pressure, visibility |
| `get_equipment_status` | Asset Registry | Equipment health scores, runtime hours, operational state |
| `get_equipment_health` | Deep Health Diagnostics | Vibration RMS, exhaust temps, component degradation |
| `get_maintenance_predictions` | Phase 10 AI Predictive Ops | RUL hours, failure probability, top risk factors |
| `get_alert_summary` | Active Alarms | Total, critical, warning counts, breakdown by source |
| `get_alert_details` | Alarm Diagnostics | Specific alert rule, threshold, trigger value, count |
| `get_incident_summary` | Incident Management | Open/investigating incidents, linked alert summaries |
| `get_incident_details` | Incident Timeline | Incident notes, responders, severity classification |
| `get_inventory_summary` | Logistics & Stock | Fuel, rations, medical, spares, critical stock levels |
| `get_logistics_summary` | Cargo & Shipments | Active shipments, voyage numbers, ETA, vessel status |
| `get_analytics_overview` | Phase 11 Operational Summary | Multi-domain station scorecard & performance KPIs |
| `get_energy_analytics` | Phase 11 Energy Trends | Generation/consumption totals, battery efficiency |
| `get_environment_analytics` | Phase 11 Climate Trends | Min/max temperatures, wind speeds, blizzard hours |
| `get_equipment_analytics` | Phase 11 Machinery Trends | Fleet uptime %, MTBF, MTTR, critical failure rate |
| `get_maintenance_analytics` | Phase 11 Maintenance Trends | Completed work orders, scheduled vs unplanned ratio |
| `get_report_summary` | Phase 11 Station Reports | Daily, weekly, monthly report summaries & metrics |
| `get_recent_operational_events` | Audit & Event Stream | Telemetry, battery, maintenance, and weather log |
| `compare_stations` | Multi-Station Comparison | Objective, neutral side-by-side metric comparison |

---

## 5. Intent Categories

The assistant routes queries into 17 deterministic intent categories:

1. `STATION_STATUS` — Overall station health, personnel, base condition
2. `ENERGY_STATUS` — Solar/diesel generation, load, battery SoC, fuel autonomy
3. `ENVIRONMENT_STATUS` — Temperature, wind velocity, blizzard alerts, pressure
4. `EQUIPMENT_STATUS` — Machinery health, generator fleet, pumps, HVAC
5. `MAINTENANCE_STATUS` — Predictive maintenance, RUL, wear risk, inspection needs
6. `ALERT_STATUS` — Open alarms, critical threshold breaches, unacknowledged alerts
7. `INCIDENT_STATUS` — Active station incidents, emergency response status
8. `INVENTORY_STATUS` — Fuel reserves, spare parts, rations, medical supply levels
9. `LOGISTICS_STATUS` — Shipments, polar supply vessels, cargo manifests
10. `ANALYTICS_QUERY` — Historical operational summaries, efficiency metrics
11. `REPORT_QUERY` — Daily/weekly operational reports, shift handovers
12. `TREND_QUERY` — Historical direction (rising, falling, stable) over 24h, 7d, 30d
13. `COMPARISON_QUERY` — Metric-specific comparisons between Maitri and Bharati
14. `EXPLANATION_QUERY` — Root causes, prediction factors, alarm triggers
15. `HELP_QUERY` — Operational capabilities, assistant instructions
16. `ACTION_REQUEST` — Mutative/control requests (blocked with safe confirmation card)
17. `UNSUPPORTED_REQUEST` — Queries outside polar operational domain

---

## 6. Multi-Turn Context & Bounded Memory

- **Conversation Sessioning:** Managed by `ConversationService`.
- **Bounded History:** Maximum 20 messages per conversation to control memory and token costs.
- **Context Preservation:** Preserves active station context, user ID, selected time range, and recent tool calls across turns.
- **Station Switching:** When the user switches station in `StationContext`, subsequent questions inherit the new station scope immediately.
- **Privacy:** No JWT tokens, passwords, or secrets are ever persisted in conversation messages.

---

## 7. AI Provider Abstraction

POLARIS supports a pluggable provider architecture via `AIProvider`:

```typescript
export interface AIProvider {
  generateResponse(params: {
    systemPrompt: string;
    conversationHistory: ChatMessage[];
    userMessage: string;
    toolResults: any[];
    intent: IntentCategory;
    station: string;
  }): Promise<{
    message: string;
    suggestedQuestions?: string[];
  }>;

  streamResponse?(params: ..., callbacks: ...): Promise<void>;
}
```

### Supported Providers:
1. **Deterministic AI Provider (`DeterministicAiProvider`) — Default:**
   - Zero hallucination, zero token cost, instant response (<20ms).
   - Formats tool data into standardized polar mission-control briefings.
   - Computes percentage changes and trend directions neutrally.
   - Formats objective station comparisons without subjective "winners".
   - Appends mandatory advisory disclaimers.
2. **Google Gemini Provider (`GeminiProvider`):**
   - Enabled when `AI_PROVIDER=gemini` and `AI_API_KEY` is set.
   - Calls Google Gemini models (e.g. `gemini-1.5-flash`).
   - Implements native fetch with 15s timeout and automatic fallback to `DeterministicAiProvider` on network failure, rate limit, or timeout.
   - Full SSE token streaming support.

---

## 8. API Specifications

### Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/assistant/chat` | JWT | All | Synchronous conversational query |
| `POST` | `/api/v1/assistant/chat/stream` | JWT | All | Real-time SSE streaming query |
| `GET` | `/api/v1/assistant/conversations` | JWT | All | List user's conversations |
| `GET` | `/api/v1/assistant/conversations/:id` | JWT | All | Get single conversation with messages |
| `DELETE` | `/api/v1/assistant/conversations/:id` | JWT | All | Delete conversation session |
| `GET` | `/api/v1/assistant/suggestions` | JWT | All | Get quick prompt suggestions for station |

### Response Schema (`ApiResponseEnvelope<AssistantResponse>`)
```json
{
  "success": true,
  "data": {
    "conversationId": "conv-1727628800000-abc",
    "message": "Maitri Station is currently OPERATIONAL with an overall system health score of 98%...",
    "intent": "STATION_STATUS",
    "station": "MAITRI",
    "timeRange": "24h",
    "sources": [
      {
        "type": "station",
        "title": "Station Overview",
        "station": "MAITRI",
        "metric": "healthPercent",
        "value": 98
      }
    ],
    "dataQuality": "GOOD",
    "dataFreshness": "Data current (fresh)",
    "suggestedNavigations": [
      { "label": "Overview Dashboard", "route": "/overview" }
    ],
    "suggestedQuestions": [
      "What is the current energy balance at Maitri?",
      "Which equipment has the highest maintenance risk at Maitri?"
    ],
    "toolCalls": [
      {
        "toolName": "get_station_status",
        "args": { "station": "MAITRI" },
        "resultSummary": "Status: OPERATIONAL, Health: 98%",
        "durationMs": 14
      }
    ],
    "generatedAt": "2026-09-29T16:50:00.000Z"
  }
}
```

---

## 9. Frontend User Interface (`/assistant`)

The `/assistant` page provides an integrated Polar Operations Mission Control interface:
- **Assistant Header:** Real-time active station indicator, session history drawer toggle, and "New Briefing" action.
- **Interactive Chat Feed:** Formatted markdown, intent badges, data quality indicator (GOOD / LIMITED / POOR), source citations, tool call execution inspector dropdown, quick navigation pills, and time freshness.
- **Safe Action Proposed Card:** Visual amber alert card for requested operational actions with one-click navigation to the authoritative module.
- **Suggested Questions Carousel:** Dynamic station-aware suggested questions for instant querying.
- **Auto-Resizing Input:** Multi-line input with character counter (2,000 char max), send button, and active stream cancel button.
- **Operational Context Panel (Right):** Real-time station coordinates, microgrid generation vs load, battery state of charge, wind velocity, ambient temperature, active alarms count, and Phase 10 predictive fleet status.
- **Conversation History Drawer (Slide-Over):** Browse past briefings, switch sessions, or delete sessions.

---

## 10. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `deterministic` | Provider choice (`deterministic` or `gemini`) |
| `AI_MODEL` | `gemini-1.5-flash` | Gemini model identifier |
| `AI_API_KEY` | *(blank)* | Google Gemini API Key (Backend server-side only) |
| `AI_TIMEOUT_MS` | `15000` | Provider call timeout in milliseconds |
| `AI_MAX_OUTPUT_TOKENS` | `1024` | Maximum tokens for model generation |
| `AI_MAX_MESSAGE_LENGTH`| `2000` | Maximum input characters per user query |

---

## 11. Security & Compliance Checklist

- [x] **No Raw SQL:** Zero LLM-generated SQL queries. All database access occurs through Prisma inside allowlisted service methods.
- [x] **No Autonomous Hardware Control:** Cannot actuate generators, switch power buses, or mutate operational settings.
- [x] **Server-Side Station Isolation:** Users restricted to Maitri cannot receive Bharati telemetry or alarms.
- [x] **Role-Based Access Control:** VIEWER, OPERATOR, and ADMIN permissions enforced server-side on every tool invocation.
- [x] **Prompt Injection Defense:** Malicious control words, system overrides, and secret-dump requests rejected prior to processing.
- [x] **Zero Secret Leakage:** Server-side `AI_API_KEY` is never transmitted to browser bundles, client logs, or API payloads.
- [x] **Auditable Tool Trace:** Every tool execution is recorded with duration and summary for explainability.
