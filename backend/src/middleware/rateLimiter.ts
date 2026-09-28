import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 20, // 20 attempts per 15 min in prod/dev
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    ApiResponse.error(
      res,
      "TOO_MANY_REQUESTS",
      "Too many failed login attempts from this network. Please wait 15 minutes before trying again.",
      429
    );
  }
});
