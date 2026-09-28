import { StationComparisonMetric } from "../types";

export const MOCK_STATION_COMPARISON: StationComparisonMetric[] = [
  {
    metric: "Station Health",
    unit: "%",
    maitriValue: 98,
    bharatiValue: 94,
    displayMaitri: "98%",
    displayBharati: "94%",
    benchmark: "higher-better"
  },
  {
    metric: "Power Generation",
    unit: "kW",
    maitriValue: 420,
    bharatiValue: 390,
    displayMaitri: "420 kW",
    displayBharati: "390 kW",
    benchmark: "neutral"
  },
  {
    metric: "Power Consumption",
    unit: "kW",
    maitriValue: 378,
    bharatiValue: 365,
    displayMaitri: "378 kW",
    displayBharati: "365 kW",
    benchmark: "neutral"
  },
  {
    metric: "Battery Reserve",
    unit: "%",
    maitriValue: 82,
    bharatiValue: 74,
    displayMaitri: "82%",
    displayBharati: "74%",
    benchmark: "higher-better"
  },
  {
    metric: "Fuel Autonomy",
    unit: "%",
    maitriValue: 68,
    bharatiValue: 61,
    displayMaitri: "68% (218d)",
    displayBharati: "61% (195d)",
    benchmark: "higher-better"
  },
  {
    metric: "Active Alarms",
    unit: "count",
    maitriValue: 3,
    bharatiValue: 5,
    displayMaitri: "3",
    displayBharati: "5",
    benchmark: "lower-better"
  },
  {
    metric: "Avg Equipment Health",
    unit: "%",
    maitriValue: 94,
    bharatiValue: 89,
    displayMaitri: "94%",
    displayBharati: "89%",
    benchmark: "higher-better"
  }
];
