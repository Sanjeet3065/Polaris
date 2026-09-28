# POLARIS API Design & Endpoint Specification

## 1. Protocol & Architectural Standards

All HTTP services communicate over **JSON REST APIs** prefixed with `/api/v1/`.

### Consistent Response Envelopes

#### Standard Success (`HTTP 200 / 201`)
```json
{
  "success": true,
  "data": {
    "stationCode": "BHARATI",
    "name": "Bharati Antarctic Research Station"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "timestamp": "2026-09-28T17:00:00.000Z"
  }
}
```

#### Standard Error (`HTTP 4xx / 5xx`)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Station with code 'UNKNOWN' was not found",
    "field": "stationCode",
    "details": null
  }
}
```

*Note: Stack traces and internal database schemas are strictly prohibited from exposure in error payloads.*

---

## 2. API Endpoint Directory (Target Specification)

### System & Health
* `GET /api/v1/health`: System health status, version, uptime. *(Implemented in Phase 0)*

### Authentication & Access Control
* `POST /api/v1/auth/login`: Expeditioner login, returns access JWT and sets refresh cookie.
* `POST /api/v1/auth/refresh`: Issues fresh access token using secure refresh rotation.
* `POST /api/v1/auth/logout`: Revokes refresh token and clears session.
* `GET  /api/v1/users/me`: Current authenticated user profile and permissions.

### Stations & Spatial Structure
* `GET  /api/v1/stations`: List active Antarctic stations (Maitri & Bharati).
* `GET  /api/v1/stations/:code`: Full station summary, coordinates, and operational state.
* `GET  /api/v1/stations/:code/buildings`: Buildings situated at target station.
* `GET  /api/v1/buildings/:id/rooms`: Room breakdown with floor level mapping.

### Equipment & Sensors
* `GET  /api/v1/equipment`: Query equipment filtered by station, room, or health status.
* `GET  /api/v1/equipment/:id`: Equipment profile, health score, and attached sensor feeds.
* `GET  /api/v1/sensors/:id/readings`: Historical telemetry readings with time-window filters.

### Telemetry, Energy & Environment
* `GET  /api/v1/environment/current?station=BHARATI`: Latest atmospheric and weather snapshot.
* `GET  /api/v1/environment/history?station=BHARATI&hours=24`: Time-series weather data.
* `GET  /api/v1/energy/current?station=BHARATI`: Instantaneous solar, diesel, and battery power balance.
* `GET  /api/v1/energy/history?station=BHARATI&days=7`: 7-day load and fuel consumption trend.
* `POST /api/v1/telemetry/ingest`: Secure telemetry ingestion endpoint (used by edge simulator).

### Inventory & Logistics
* `GET  /api/v1/inventory?station=BHARATI&category=FUEL`: Stock levels and days-of-autonomy.
* `POST /api/v1/inventory/transactions`: Record consumption or restocking event.
* `GET  /api/v1/logistics/shipments`: Expeditions and cargo manifests (MV Vasiliy Golovnin).
* `POST /api/v1/logistics/supply-requests`: Create urgent resupply requisition.

### Maintenance, Alerts & Incidents
* `GET  /api/v1/maintenance`: Scheduled, active, and completed maintenance tickets.
* `POST /api/v1/maintenance`: Create preventive or corrective work order.
* `GET  /api/v1/alerts?status=OPEN`: Active station alarms filtered by severity.
* `PATCH /api/v1/alerts/:id/acknowledge`: Operator acknowledgment.
* `POST /api/v1/incidents`: Formalize an escalated incident report.

### AI Predictions & Reports
* `GET  /api/v1/predictions/rul/:equipmentId`: Remaining useful life prediction from AI service.
* `GET  /api/v1/predictions/fuel-autonomy?station=BHARATI`: Winter fuel autonomy forecast.
* `GET  /api/v1/reports/compliance?month=2026-06`: Generate MoES/NCPOR monthly status PDF/JSON.
