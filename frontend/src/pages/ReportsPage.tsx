import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportService, GenerateReportRequest } from "../services/reportService";
import { GeneratedReport, ReportType, TimeRangeOption } from "../types/analytics.types";
import { useStation } from "../context/StationContext";
import { ReportPreviewModal } from "../components/reports/ReportPreviewModal";
import {
  FileText,
  Download,
  Printer,
  Eye,
  PlusCircle,
  Sparkles
} from "lucide-react";

export const ReportsPage: React.FC = () => {
  const { selectedStation } = useStation();
  const queryClient = useQueryClient();

  const [selectedReportType, setSelectedReportType] = useState<ReportType>("DAILY_OPERATIONS");
  const [stationId, setStationId] = useState<string>(selectedStation === "ALL" ? "ALL" : selectedStation);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("24h");
  const [reportTitle, setReportTitle] = useState<string>("");
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);

  // Fetch Report Types Template Catalog
  const { data: reportTypes } = useQuery({
    queryKey: ["report-types"],
    queryFn: () => reportService.getReportTypes()
  });

  // Fetch Previously Generated Reports
  const { data: generatedReports, isLoading: isReportsLoading } = useQuery({
    queryKey: ["generated-reports"],
    queryFn: () => reportService.listReports(),
    refetchInterval: 15000
  });

  // Mutation to Generate a New Report
  const generateMutation = useMutation({
    mutationFn: (req: GenerateReportRequest) => reportService.generateReport(req),
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ["generated-reports"] });
      setPreviewReport(newReport);
    },
    onError: (err: any) => {
      alert(`Report generation failed: ${err.message || String(err)}`);
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      reportType: selectedReportType,
      stationId,
      timeRange,
      title: reportTitle.trim() || undefined
    });
  };

  const handleQuickDownloadCsv = (r: GeneratedReport) => {
    reportService.downloadReportCsv(r.id, `${r.id}-${r.station.code}.csv`);
  };

  const handleQuickPrint = (r: GeneratedReport) => {
    reportService.openReportPrintView(r.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Reports & Operational Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official NCPOR / MoES polar operations governance, compliance logs, and exportable intelligence
          </p>
        </div>
      </div>

      {/* Report Generator Studio Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Operational Report Generation Studio
          </h2>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Report Template Category:
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                className="w-full bg-slate-950 border border-slate-750 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                {reportTypes?.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.title}
                  </option>
                ))}
              </select>
              {reportTypes && (
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {reportTypes.find((t) => t.type === selectedReportType)?.description}
                </p>
              )}
            </div>

            {/* Station Target */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Research Station:
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-750 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Stations (Maitri & Bharati)</option>
                <option value="MAITRI">Maitri Station</option>
                <option value="BHARATI">Bharati Station</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Station boundary isolation enforced by POLARIS access control
              </p>
            </div>

            {/* Time Window */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Observation Time Period:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
                className="w-full bg-slate-950 border border-slate-750 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Calibrated telemetry interval matching polar sensor logs
              </p>
            </div>
          </div>

          {/* Optional Title & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Custom report title (leave empty for auto-generated)..."
                className="w-full bg-slate-950 border border-slate-750 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-md disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{generateMutation.isPending ? "Generating Intelligence..." : "Generate Operational Report"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Reports Registry */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Generated Reports Archive</h3>
            <p className="text-[11px] text-slate-400">Available operational documents ready for review and audit export</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {generatedReports?.length || 0} reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Report Title & ID</th>
                <th className="pb-3 px-3">Station</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Data Quality</th>
                <th className="pb-3 px-3">Generated At</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {isReportsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading reports archive...
                  </td>
                </tr>
              ) : !generatedReports || generatedReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No reports generated yet in this session. Use the studio form above to generate your first report.
                  </td>
                </tr>
              ) : (
                generatedReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{r.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.id}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-sky-400">{r.station.code}</td>
                    <td className="py-3 px-3 text-slate-400 font-medium">{r.reportType}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {r.dataQuality.rating} ({r.dataQuality.coveragePercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(r.generatedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewReport(r)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-all"
                          title="Preview full report"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickDownloadCsv(r)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-all"
                          title="Download CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickPrint(r)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-all"
                          title="Print / PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Interactive Preview Modal */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
};
