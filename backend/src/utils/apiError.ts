export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = "Unauthorized access", code = "UNAUTHORIZED"): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(message = "Access forbidden", code = "FORBIDDEN"): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(message = "Resource not found", code = "RESOURCE_NOT_FOUND"): ApiError {
    return new ApiError(404, code, message);
  }

  static conflict(message: string, code = "CONFLICT"): ApiError {
    return new ApiError(409, code, message);
  }

  static internal(message = "Internal server error", code = "INTERNAL_SERVER_ERROR"): ApiError {
    return new ApiError(500, code, message, undefined, false);
  }
}
