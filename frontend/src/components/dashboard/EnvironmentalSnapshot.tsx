import React from "react";
import { Thermometer, Droplets, Gauge, Wind, Navigation, Eye } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { formatTemperature, formatPressure, formatWind } from "../../utils/formatters";

export const EnvironmentalSnapshot: React.FC = () => {
  const { environment } = useStation();

  const metrics = [
    {
      label: "Ambient Temperature",
      value: formatTemperature(environment.temperatureCelsius),
      subtext: "Deep Polar Cold",
      icon: Thermometer,
      status: environment.temperatureCelsius < -40 ? "WARNING" : "NORMAL",
      color: "text-white"
    },
    {
      label: "Wind Speed",
      value: formatWind(environment.windSpeedKmh),
      subtext: `Katabatic Gusts · ${environment.windDirectionCompass}`,
      icon: Wind,
      status: environment.windSpeedKmh > 60 ? "CRITICAL" : environment.windSpeedKmh > 40 ? "WARNING" : "NORMAL",
      color: "text-orange-400"
    },
    {
      label: "Barometric Pressure",
      value: formatPressure(environment.atmosphericPressureHpa),
      subtext: "Stable Gradient",
      icon: Gauge,
      status: environment.atmosphericPressureHpa < 970 ? "WARNING" : "NORMAL",
      color: "text-emerald-400"
    },
    {
      label: "Relative Humidity",
      value: `${environment.humidityPercentage}%`,
      subtext: "Ice Fog Saturation",
      icon: Droplets,
      status: "NORMAL",
      color: "text-slate-200"
    },
    {
      label: "Wind Direction",
      value: `${environment.windDirectionDegrees}° ${environment.windDirectionCompass}`,
      subtext: "Inland to Coast Line",
      icon: Navigation,
      status: "NORMAL",
      color: "text-slate-300"
    },
    {
      label: "Horizontal Visibility",
      value: `${environment.visibilityKm} km`,
      subtext: "Unobstructed Line-of-Sight",
      icon: Eye,
      status: environment.visibilityKm < 5 ? "WARNING" : "NORMAL",
      color: "text-amber-300"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Wind className="h-4 w-4 text-orange-400" />
            <span>Environmental Telemetry</span>
          </h3>
          <p className="text-[11px] text-slate-400">AWS microclimate sensors & meteorological station array</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>AWS ARRAY NOMINAL</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.label}
              className="p-3 bg-polar-900/75 border-polar-750 hover:border-polar-600 shadow-sm transition-colors flex flex-col gap-1.5"
            >
              {/* Icon + status badge stacked */}
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    m.status === "WARNING"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : m.status === "CRITICAL"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : "bg-polar-800 text-slate-400 border border-polar-700"
                  }`}
                >
                  {m.status}
                </span>
              </div>
              {/* Full label — no truncation */}
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide leading-snug">{m.label}</div>
              {/* Value */}
              <div className={`text-base sm:text-lg font-black font-mono tracking-tight tabular-nums ${m.color}`}>
                {m.value}
              </div>
              {/* Subtext — wraps, no truncation */}
              <div className="text-[10px] text-slate-400 font-mono leading-snug border-t border-polar-750 pt-1.5">{m.subtext}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
