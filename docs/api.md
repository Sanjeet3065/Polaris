# POLARIS API Specification

For the complete API design standard and endpoint catalog, see [api-design.md](file:///c:/Users/SANJEET%20CHAUHAN/Desktop/New%20folder%20%283%29/docs/api-design.md).

## Phase 11 Analytics & Reports Endpoints Summary

All endpoints require standard `Bearer <access_token>` authorization header.

### Analytics Endpoints
- `GET /api/v1/analytics/overview`
  - Query: `stationId`, `timeRange` (`1h`, `6h`, `24h`, `7d`, `30d`, `custom`), `startDate`, `endDate`
  - Returns: Top 10 KPI grid, mathematical period-over-period comparisons, neutral trends, data quality indicator, deterministic operational executive summary.

- `GET /api/v1/analytics/energy`
  - Returns: Total and peak generation/consumption, net power balance, battery SoC & voltage, fuel reserves & autonomy, solar fraction, generator utilization.

- `GET /api/v1/analytics/environment`
  - Returns: Temperature, katabatic wind velocity, barometric pressure, visibility, humidity, solar radiation, threshold exceedances (Blizzard, Gale, Extreme Cold).

- `GET /api/v1/analytics/equipment`
  - Returns: Fleet inventory, health score distribution, operational status breakdown, risk scores, maintenance counts.

- `GET /api/v1/analytics/maintenance`
  - Returns: Phase 10 AI predictive integration (`"AI-assisted prediction • Advisory only"`), risk band distribution, RUL histograms, work orders created.

- `GET /api/v1/analytics/alerts`
  - Returns: Total alarms, status lifecycle (OPEN, ACKNOWLEDGED, RESOLVED, SUPPRESSED), severity distribution, MTTA, MTTR, top recurring alert rules.

- `GET /api/v1/analytics/incidents`
  - Returns: Incident lifecycle, category breakdown, resolution durations, linked alerts (`IncidentAlert`).

- `GET /api/v1/analytics/logistics`
  - Returns: Inventory stock counts, critical items, immutable consumption movements (`InventoryMovement`), resupply shipments.

- `GET /api/v1/analytics/stations`
  - Returns: Side-by-side benchmark comparison between Maitri and Bharati (strictly neutral comparison with no subjective winner).

### Reports Endpoints
- `GET /api/v1/reports`: List generated operational reports.
- `GET /api/v1/reports/types`: List available report template types.
- `GET /api/v1/reports/:id`: Retrieve single report details.
- `POST /api/v1/reports/generate`: Generate new operational report.
- `GET /api/v1/reports/:id/export?format=csv|html`: Export report as CSV or print-ready HTML/PDF.

### Phase 12 AI Operations Assistant Endpoints
- `POST /api/v1/assistant/chat`: Send synchronous conversational query to the AI Assistant.
  - Body: `{ message: string, stationId?: string, conversationId?: string, timeRange?: string }`
  - Returns: `AssistantResponse` with grounded answer, metrics, sources, quality rating, and tool execution audit.
- `POST /api/v1/assistant/chat/stream`: Stream natural-language response over Server-Sent Events (SSE).
  - Emits events: `meta`, `token`, `done`, `error`.
- `GET /api/v1/assistant/conversations`: List active user's conversation sessions.
- `GET /api/v1/assistant/conversations/:id`: Retrieve single conversation thread and full message history.
- `DELETE /api/v1/assistant/conversations/:id`: Delete conversation thread.
- `GET /api/v1/assistant/suggestions?station=MAITRI`: Retrieve context-aware quick prompt suggestions.
