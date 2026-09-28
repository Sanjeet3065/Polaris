/**
 * POLARIS — Mission Control Formatting Utilities
 * Standardized scientific, environmental, power, and UTC time formatters.
 */

export function formatTemperature(celsius: number): string {
  const sign = celsius > 0 ? "+" : "";
  return `${sign}${celsius.toFixed(1)} °C`;
}

export function formatPower(kw: number): string {
  if (Math.abs(kw) >= 1000) {
    return `${(kw / 1000).toFixed(2)} MW`;
  }
  return `${Math.round(kw)} kW`;
}

export function formatEnergy(mwh: number): string {
  return `${mwh.toFixed(2)} MWh`;
}

export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`;
}

export function formatWind(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

export function formatPercentage(pct: number): string {
  return `${Math.round(pct)}%`;
}

export function formatLiters(liters: number): string {
  return `${liters.toLocaleString()} L`;
}

/**
 * Returns live UTC time string formatted as HH:mm:ss UTC
 */
export function formatUtcTime(date: Date = new Date()): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Returns UTC timestamp formatted as DD MMM YYYY · HH:mm UTC
 */
export function formatUtcDateTime(date: Date = new Date()): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${minutes} UTC`;
}

/**
 * Returns a humanized relative time (e.g., "12 seconds ago", "8 minutes ago")
 */
export function formatRelativeTime(secondsAgo: number): string {
  if (secondsAgo < 60) {
    return `${secondsAgo} seconds ago`;
  }
  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? "s" : ""} ago`;
}
