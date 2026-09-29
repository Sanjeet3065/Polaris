/**
 * POLARIS — SIH Demo Mode Controller
 * Phase 16: HTTP request handlers for demo lifecycle management
 */

import { Request, Response, NextFunction } from "express";
import { demoService } from "../services/demo.service";
import { ApiResponse } from "../utils/apiResponse";

export class DemoController {
  /**
   * POST /api/v1/demo/start
   * Launches the scripted SIH Demo Mode narrative.
   * Requires ADMIN or OPERATOR role (enforced in routes).
   */
  start = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = await demoService.startDemo();
      ApiResponse.success(res, state, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/demo/stop
   * Immediately halts the demo and deactivates all running scenarios.
   */
  stop = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = demoService.stopDemo();
      ApiResponse.success(res, state, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/demo/status
   * Returns current demo state — polled every 2s by the frontend banner.
   */
  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = demoService.getStatus();
      ApiResponse.success(res, state, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const demoController = new DemoController();
