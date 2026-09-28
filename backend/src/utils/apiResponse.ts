import { Response } from "express";
import { ApiErrorResponse, ApiSuccessResponse } from "../types/api.types";

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    statusCode = 200,
    meta?: ApiSuccessResponse<T>["meta"]
  ): Response {
    const payload: ApiSuccessResponse<T> = {
      success: true,
      data,
      ...(meta && { meta })
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 500,
    details?: unknown
  ): Response {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details })
      }
    };
    return res.status(statusCode).json(payload);
  }
}
