# POLARIS Phase 11 — Reports & Operational Intelligence Specification

## 1. System Purpose

The **POLARIS Report Builder & Export Subsystem** enables station managers, expedition leaders, and MoES/NCPOR administrators to generate official operational reports from consolidated station telemetry and system records.

Reports are formatted with standardized POLARIS branding, executive summaries, key performance indicators (KPIs), metric tables, and operational observations.

---

## 2. Standard Operational Report Types

POLARIS Phase 11 provides 9 standardized operational report templates:

| ID | Report Type | Description | Key Contents |
| :--- | :--- | :--- | :--- |
| `DAILY_OPERATIONS` | **Daily Station Operations Report** | 24-hour summary of power, climate, fleet health, and active alarms. | Power balance, weather extremes, equipment health, unresolved alerts. |
| `WEEKLY_OPERATIONS` | **Weekly Operations Report** | 7-day multi-system performance audit. | Weekly energy trend, blizzard events, maintenance progress, stock consumption. |
| `ENERGY_ANALYSIS` | **Energy Audit & Power Report** | In-depth generation vs. consumption audit. | Diesel/Solar split, battery cycling, fuel reserves, days of fuel autonomy. |
| `ENVIRONMENTAL_SUMMARY` | **Environmental & Meteorological Report** | Atmospheric conditions and blizzard safety records. | Katabatic wind gusts, chill factors, barometric pressure drops, blizzard duration. |
| `EQUIPMENT_INTELLIGENCE` | **Equipment Fleet Health Report** | Machinery health score distributions and risk bands. | High-risk assets, degradation trends, operational status breakdown. |
| `ALERTS_INCIDENTS` | **Alerts & Incidents Audit Report** | Incident investigations and alarm response latencies. | Severity distribution, recurring alert rules, MTTA & MTTR response metrics. |
| `MAINTENANCE_SCHEDULE` | **Predictive Maintenance Intelligence Report** | Phase 10 AI predictive indicators and work orders. | Wear index, estimated remaining useful life (RUL), scheduled work orders. |
| `LOGISTICS_INVENTORY` | **Logistics & Inventory Audit Report** | Stock depletion rates, critical items, and shipments. | Consumption movements, critical stock alerts, inter-station transfers. |
| `STATION_COMPARISON` | **Station Comparison Matrix Report** | Side-by-side benchmark of Maitri vs. Bharati. | Neutral multi-domain performance matrix, environmental differences. |

---

## 3. Report Document Anatomy

Every generated report follows a structured operational anatomy:

1. **Header & POLARIS Branding**: Station code, report title, classification, generated timestamp.
2. **Metadata Banner**: Period label (`24h`, `7d`, `custom`), station name, generator user identifier.
3. **Data Quality & Coverage Indicator**: Telemetry coverage score (`GOOD`, `LIMITED`, `POOR`), data gap warnings.
4. **Executive Operational Summary**: Deterministic narrative highlighting key observations.
5. **Key Performance Indicators (KPIs)**: Standardized KPI tiles (Generation, Consumption, Alerts, Critical Items, Health).
6. **Detailed Data Tables**: Multi-column tabular metrics corresponding to the report domain.
7. **Operational Observations & Advisories**: Bulleted operational facts and advisory recommendations.
8. **Security & Audit Sign-Off Footer**: Authenticity signature, confidentiality notice, zero credential leakage.

---

## 4. Export Capabilities

### 1. CSV Tabular Export (`GET /api/v1/reports/:id/export?format=csv`)
- Exports raw data tables directly into RFC 4180 standard CSV format.
- Compatible with Microsoft Excel, LibreOffice Calc, and data science pipelines.
- Preserves headers and numeric precisions.

### 2. Print-Ready HTML / PDF Export (`GET /api/v1/reports/:id/export?format=html`)
- Generates a standalone, print-optimized document utilizing standard `@media print` CSS rules.
- Eliminates application sidebars, navigation bars, and interactive controls when printing or exporting via browser "Save as PDF".
- Employs dark/light printing adaptations, high-contrast borders, and page-break rules.

---

## 5. Security & Data Integrity Guarantees

1. **Station Scoping**: Operators can only generate and view reports for stations within their RBAC authorization.
2. **Zero Credential Exposure**: Passwords, JWT tokens, API keys, database connection strings, and internal secrets are strictly excluded from report payloads.
3. **No Fabricated Gaps**: Telemetry gaps are labeled as `"Data gap detected"` and calculated as `N/A` rather than fabricating values.
