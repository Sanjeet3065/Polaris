import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.error(
    res,
    "ENDPOINT_NOT_FOUND",
    `Route ${req.method} ${req.originalUrl} does not exist on this server`,
    404
  );
};
