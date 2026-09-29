import { Request, Response, NextFunction } from "express";
import { simulatorService } from "./simulator.service";
import { ApiResponse } from "../utils/apiResponse";
import { StationCode, ScenarioType, NoiseLevel } from "./models/simulator.types";

export class SimulatorController {
  /**
   * GET /api/v1/simulator/status
   */
  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = simulatorService.getStatus();
      ApiResponse.success(res, status, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/simulator/start
   */
  start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { intervalMs, noiseLevel } = req.body as {
        intervalMs?: number;
        noiseLevel?: NoiseLevel;
      };
      const status = await simulatorService.start({ intervalMs, noiseLevel });
      ApiResponse.success(res, status, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/simulator/stop
   */
  stop = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = simulatorService.stop();
      ApiResponse.success(res, status, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/simulator/restart
   */
  restart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { intervalMs, noiseLevel } = req.body as {
        intervalMs?: number;
        noiseLevel?: NoiseLevel;
      };
      const status = await simulatorService.restart({ intervalMs, noiseLevel });
      ApiResponse.success(res, status, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/simulator/scenarios
   */
  getScenarios = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = simulatorService.getAvailableScenarios();
      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/simulator/scenarios/start
   */
  startScenario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { station, scenario, intensity, durationSeconds } = req.body as {
        station: StationCode;
        scenario: ScenarioType;
        intensity?: number;
        durationSeconds?: number;
      };

      const activeScenario = simulatorService.startScenario(
        station,
        scenario,
        intensity,
        durationSeconds
      );
      ApiResponse.success(res, activeScenario, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/simulator/scenarios/stop
   */
  stopScenario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { station } = req.body as { station: StationCode };
      const stopped = simulatorService.stopScenario(station);
      ApiResponse.success(res, { station, stopped }, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/simulator/tick
   */
  manualTick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stations, persist } = (req.body || {}) as {
        stations?: StationCode[];
        persist?: boolean;
      };

      const summary = await simulatorService.executeTick(
        persist !== false,
        stations
      );
      ApiResponse.success(res, summary, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const simulatorController = new SimulatorController();
