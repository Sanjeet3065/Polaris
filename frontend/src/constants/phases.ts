export interface PhaseItem {
  phase: number;
  name: string;
  description: string;
  status: "COMPLETED" | "ACTIVE" | "PENDING";
}

export const DEVELOPMENT_PHASES: PhaseItem[] = [
  {
    phase: 0,
    name: "Foundation & Architecture",
    description: "Monorepo layout, Docker configs, typed Express backend, FastAPI AI skeleton, and system documentation.",
    status: "ACTIVE"
  },
  {
    phase: 1,
    name: "Frontend UI + Dashboard Foundation",
    description: "Polar-themed design system, layout shell, station switcher, and responsive navigation.",
    status: "PENDING"
  },
  {
    phase: 2,
    name: "Backend + PostgreSQL + Prisma",
    description: "Complete relational & time-series database models, migrations, and seed scripts.",
    status: "PENDING"
  },
  {
    phase: 3,
    name: "Authentication + RBAC",
    description: "JWT authentication, refresh tokens, and granular station role access control.",
    status: "PENDING"
  },
  {
    phase: 4,
    name: "Sensor / IoT Simulator",
    description: "Autonomous telemetry engine simulating Antarctic weather, generators, batteries, and sensors.",
    status: "PENDING"
  },
  {
    phase: 5,
    name: "Real-Time WebSocket Monitoring",
    description: "Bi-directional Socket.IO telemetry streaming and reconnection lifecycle handlers.",
    status: "PENDING"
  },
  {
    phase: 6,
    name: "3D Digital Twin",
    description: "Interactive Three.js & React Three Fiber station digital twin with real-time entity mapping.",
    status: "PENDING"
  },
  {
    phase: 7,
    name: "Energy + Environment Monitoring",
    description: "Real-time energy balance charts, Katabatic wind speed analytics, and microclimate monitors.",
    status: "PENDING"
  },
  {
    phase: 8,
    name: "Logistics + Inventory",
    description: "Antarctic cargo manifests, fuel reserve forecasting, and supply request tracking.",
    status: "PENDING"
  },
  {
    phase: 9,
    name: "Alerts + Incident Management",
    description: "Automated threshold anomaly detection, incident response workflows, and audit logs.",
    status: "PENDING"
  },
  {
    phase: 10,
    name: "AI Predictive Maintenance",
    description: "FastAPI ML models predicting Remaining Useful Life (RUL) and generator failure hazards.",
    status: "PENDING"
  },
  {
    phase: 11,
    name: "Analytics + Reports",
    description: "MoES/NCPOR compliance reports, PDF generation, and historical telemetry aggregations.",
    status: "PENDING"
  },
  {
    phase: 12,
    name: "AI Operations Assistant",
    description: "Intelligent polar operations assistant for SOP lookups and situation diagnosis.",
    status: "PENDING"
  },
  {
    phase: 13,
    name: "Security + Complete Testing",
    description: "Rate limiting, penetration defense, Vitest unit tests, and Playwright end-to-end testing.",
    status: "PENDING"
  },
  {
    phase: 14,
    name: "Final UI/UX Polish",
    description: "Micro-animations, sound effects, keyboard shortcuts, and dark/polar high-contrast mode.",
    status: "PENDING"
  },
  {
    phase: 15,
    name: "Docker + Deployment",
    description: "Multi-container production orchestration, health checks, and deployment manifests.",
    status: "PENDING"
  },
  {
    phase: 16,
    name: "Autonomous Incident Drill",
    description: "Scripted extreme telemetry scenarios (Blizzard Event, Generator Failure, Fuel Emergency).",
    status: "PENDING"
  }
];
