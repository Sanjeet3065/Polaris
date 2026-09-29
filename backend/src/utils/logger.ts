type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private serviceName = "polaris-backend";

  private sanitize(data: unknown): unknown {
    if (!data || typeof data !== "object") return data;

    const sensitiveKeys = [
      "password",
      "token",
      "jwt",
      "secret",
      "authorization",
      "apiKey",
      "key",
      "cookie",
      "credential",
      "hash",
      "bearer",
      "privatekey",
      "database_url",
      "gemini"
    ];

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitizedObj[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitizedObj[key] = this.sanitize(value);
      } else {
        sanitizedObj[key] = value;
      }
    }

    return sanitizedObj;
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: Error): string {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...(meta && { meta: this.sanitize(meta) as Record<string, unknown> }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(process.env.NODE_ENV !== "production" && { stack: error.stack })
        }
      })
    };

    return JSON.stringify(payload);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.format("info", message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format("warn", message, meta));
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(this.format("error", message, meta, error));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, meta));
    }
  }
}

export const logger = new StructuredLogger();
