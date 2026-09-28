import { HourlyTemperatureDataPoint } from "../types";

export const MOCK_TEMPERATURE_TRENDS: Record<"MAITRI" | "BHARATI" | "ALL", {
  trendLabel: string;
  trendDelta: string;
  direction: "cooling" | "warming" | "stable";
  data: HourlyTemperatureDataPoint[];
}> = {
  MAITRI: {
    trendLabel: "Cooling trend",
    trendDelta: "↓ 3.2 °C",
    direction: "cooling",
    data: [
      { time: "00:00", temperature: -28.2, windSpeed: 28 },
      { time: "02:00", temperature: -28.9, windSpeed: 30 },
      { time: "04:00", temperature: -29.5, windSpeed: 32 },
      { time: "06:00", temperature: -30.1, windSpeed: 35 },
      { time: "08:00", temperature: -30.8, windSpeed: 36 },
      { time: "10:00", temperature: -31.0, windSpeed: 38 },
      { time: "12:00", temperature: -30.6, windSpeed: 40 },
      { time: "14:00", temperature: -30.9, windSpeed: 39 },
      { time: "16:00", temperature: -31.2, windSpeed: 38 },
      { time: "18:00", temperature: -31.4, windSpeed: 38 },
      { time: "20:00", temperature: -31.6, windSpeed: 37 },
      { time: "22:00", temperature: -31.4, windSpeed: 38 }
    ]
  },
  BHARATI: {
    trendLabel: "Mild warming trend",
    trendDelta: "↑ 1.8 °C",
    direction: "warming",
    data: [
      { time: "00:00", temperature: -30.5, windSpeed: 38 },
      { time: "02:00", temperature: -30.2, windSpeed: 40 },
      { time: "04:00", temperature: -29.8, windSpeed: 42 },
      { time: "06:00", temperature: -29.5, windSpeed: 44 },
      { time: "08:00", temperature: -29.1, windSpeed: 45 },
      { time: "10:00", temperature: -28.6, windSpeed: 46 },
      { time: "12:00", temperature: -28.2, windSpeed: 45 },
      { time: "14:00", temperature: -28.4, windSpeed: 44 },
      { time: "16:00", temperature: -28.5, windSpeed: 43 },
      { time: "18:00", temperature: -28.7, windSpeed: 44 },
      { time: "20:00", temperature: -28.9, windSpeed: 42 },
      { time: "22:00", temperature: -28.7, windSpeed: 44 }
    ]
  },
  ALL: {
    trendLabel: "Stable polar baseline",
    trendDelta: "↓ 0.7 °C",
    direction: "stable",
    data: [
      { time: "00:00", temperature: -29.3, windSpeed: 33 },
      { time: "02:00", temperature: -29.5, windSpeed: 35 },
      { time: "04:00", temperature: -29.6, windSpeed: 37 },
      { time: "06:00", temperature: -29.8, windSpeed: 39 },
      { time: "08:00", temperature: -29.9, windSpeed: 40 },
      { time: "10:00", temperature: -29.8, windSpeed: 42 },
      { time: "12:00", temperature: -29.4, windSpeed: 42 },
      { time: "14:00", temperature: -29.6, windSpeed: 41 },
      { time: "16:00", temperature: -29.8, windSpeed: 40 },
      { time: "18:00", temperature: -30.0, windSpeed: 41 },
      { time: "20:00", temperature: -30.2, windSpeed: 39 },
      { time: "22:00", temperature: -30.0, windSpeed: 41 }
    ]
  }
};
