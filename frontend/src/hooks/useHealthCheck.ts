import { useQuery } from "@tanstack/react-query";
import { healthService, HealthData } from "../services/healthService";

export function useHealthCheck() {
  return useQuery<HealthData, Error>({
    queryKey: ["backend-health"],
    queryFn: () => healthService.getBackendHealth(),
    refetchInterval: 10000,
    retry: 1
  });
}
