import { Request, Response, NextFunction } from "express";
import { reportService } from "../services/analytics/report.service";
import { ApiResponse } from "../utils/apiResponse";

export class ReportController {
  public getReportTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const types = reportService.getReportTypes();
      ApiResponse.success(res, types, 200);
    } catch (error) {
      next(error);
    }
  };

  public generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorName = req.user?.name || "Station Officer";
      const report = await reportService.generateReport({
        ...req.body,
        authorName
      });
      ApiResponse.success(res, report, 201);
    } catch (error) {
      next(error);
    }
  };

  public getReports = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reports = await reportService.listGeneratedReports();
      ApiResponse.success(res, reports, 200);
    } catch (error) {
      next(error);
    }
  };

  public getReportById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportId = req.params.reportId as string;
      const report = await reportService.getReportById(reportId);
      ApiResponse.success(res, report, 200);
    } catch (error) {
      next(error);
    }
  };

  public exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportId = req.params.reportId as string;
      const report = await reportService.getReportById(reportId);
      const format = (req.query.format as string) || "csv";

      if (format === "csv") {
        const csv = reportService.exportToCsv(report);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${report.id}-${report.station.code}.csv"`
        );
        res.status(200).send(csv);
        return;
      }

      if (format === "html") {
        const html = reportService.exportToHtml(report);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.status(200).send(html);
        return;
      }

      // Default json
      ApiResponse.success(res, report, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const reportController = new ReportController();
