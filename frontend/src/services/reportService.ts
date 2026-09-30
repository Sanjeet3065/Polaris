import { apiClient } from "../lib/apiClient";
import { ApiResponseEnvelope } from "../types";
import { GeneratedReport, ReportType, TimeRangeOption } from "../types/analytics.types";

export interface ReportTemplateInfo {
  type: ReportType;
  title: string;
  description: string;
  defaultWindow: string;
}

export interface GenerateReportRequest {
  reportType: ReportType;
  stationId?: string;
  timeRange?: TimeRangeOption;
  startDate?: string;
  endDate?: string;
  title?: string;
}

export class ReportService {
  private static instance: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  public async getReportTypes(): Promise<ReportTemplateInfo[]> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<ReportTemplateInfo[]>>("/reports/types");
    return res.data;
  }

  public async listReports(): Promise<GeneratedReport[]> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<GeneratedReport[]>>("/reports");
    return res.data;
  }

  public async generateReport(payload: GenerateReportRequest): Promise<GeneratedReport> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<GeneratedReport>>("/reports/generate", payload);
    return res.data;
  }

  public async getReportById(reportId: string): Promise<GeneratedReport> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<GeneratedReport>>(`/reports/${encodeURIComponent(reportId)}`);
    return res.data;
  }

  public async downloadReportCsv(reportId: string, filename?: string): Promise<void> {
    const res = await apiClient.get<unknown, Blob | string>(`/reports/${encodeURIComponent(reportId)}/export?format=csv`, {
      responseType: "blob" as any
    });

    const blob = res instanceof Blob ? res : new Blob([res as any], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || `${reportId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  public async openReportPrintView(reportId: string): Promise<void> {
    const res = await apiClient.get<unknown, string>(`/reports/${encodeURIComponent(reportId)}/export?format=html`, {
      responseType: "text" as any
    });

    const htmlContent = typeof res === "string" ? res : (res as any)?.data || "";
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  }
}

export const reportService = ReportService.getInstance();
