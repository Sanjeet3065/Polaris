import { z } from "zod";

export const healthCheckQuerySchema = z.object({
  verbose: z.enum(["true", "false"]).optional()
});

export type HealthCheckQuery = z.infer<typeof healthCheckQuerySchema>;
