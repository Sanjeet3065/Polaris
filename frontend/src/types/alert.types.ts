import {
  AlertSeverity,
  AlertStatus,
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory,
  IncidentImpact
} from "../utils/alertRules";

export interface Alert {
  id: string;
  stationId: string;
  station?: {
    id: string;
    code: string;
    name: string;
  };
  equipmentId?: string | null;
  equipment?: {
    id: string;
    code: string;
    name: string;
    category?: string;
    status?: string;
  } | null;
  severity: AlertSeverity;
  title: string;
  description: string;
  message?: string | null;
  status: AlertStatus;
  source?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  ruleCode?: string | null;
  triggerValue?: number | null;
  thresholdValue?: number | null;
  unit?: string | null;
  occurredAt: string;
  firstDetectedAt: string;
  lastDetectedAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  suppressedAt?: string | null;
  suppressedBy?: string | null;
  occurrenceCount: number;
  metadata?: string | null;
  createdAt: string;
  updatedAt: string;
  incidentAlerts?: Array<{
    incident: {
      id: string;
      incidentNumber: string;
      title: string;
      status: IncidentStatus;
      severity: IncidentSeverity;
    };
  }>;
}

export interface AlertOverviewKpi {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  infoAlerts: number;
  acknowledgedAlerts: number;
  unacknowledgedAlerts: number;
  resolvedAlerts: number;
  suppressedAlerts: number;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  authorId?: string | null;
  author?: {
    id: string;
    name: string;
    role: string;
  } | null;
  authorName?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Incident {
  id: string;
  stationId: string;
  station?: {
    id: string;
    code: string;
    name: string;
  };
  incidentNumber: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  impact: IncidentImpact;
  source?: string | null;
  startedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  assignedTo?: string | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  resolvedBy?: string | null;
  closedBy?: string | null;
  rootCause?: string | null;
  resolutionSummary?: string | null;
  createdAt: string;
  updatedAt: string;
  alerts?: Array<{
    alert: Alert;
  }>;
  notes?: IncidentNote[];
  _count?: {
    alerts: number;
    notes: number;
  };
}

export interface IncidentOverviewKpi {
  totalIncidents: number;
  openIncidents: number;
  investigatingIncidents: number;
  mitigatingIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  criticalSeverity: number;
  highSeverity: number;
  criticalImpact: number;
}

export interface AlertFilterState {
  stationId?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  sourceType?: string;
  search?: string;
}

export interface IncidentFilterState {
  stationId?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  assignedTo?: string;
  search?: string;
}
