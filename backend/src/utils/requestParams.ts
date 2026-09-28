/**
 * Safely extracts a route parameter as a single string
 */
export function getRouteParam(param: string | string[] | undefined, paramName = "param"): string {
  if (Array.isArray(param)) {
    return param[0] || "";
  }
  return param || "";
}
