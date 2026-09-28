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
      color: "text-sky-300"
    },
    {
      label: "Wind Speed",
      value: formatWind(environment.windSpeedKmh),
      subtext: `Katabatic Gusts · ${environment.windDirectionCompass}`,
      icon: Wind,
      status: environment.windSpeedKmh > 60 ? "CRITICAL" : environment.windSpeedKmh > 40 ? "WARNING" : "NORMAL",
      color: "text-indigo-300"
    },
    {
      label: "Barometric Pressure",
      value: formatPressure(environment.atmosphericPressureHpa),
      subtext: "Stable Gradient",
      icon: Gauge,
      status: environment.atmosphericPressureHpa < 970 ? "WARNING" : "NORMAL",
      color: "text-emerald-300"
    },
    {
      label: "Relative Humidity",
      value: `${environment.humidityPercentage}%`,
      subtext: "Ice Fog Saturation",
      icon: Droplets,
      status: "NORMAL",
      color: "text-sky-200"
    },
    {
      label: "Wind Direction",
      value: `${environment.windDirectionDegrees}° ${environment.windDirectionCompass}`,
      subtext: "Inland to Coast Line",
      icon: Navigation,
      status: "NORMAL",
      color: "text-purple-300"
    },
    {
      label: "Horizontal Visibility",
      value: `${environment.visibilityKm} km`,
      subtext: "Unobstructed Line-of-Sight",
      icon: Eye,
      status: environment.visibilityKm < 5 ? "WARNING" : "NORMAL",
      color: "text-amber-200"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-400" />
            Environmental Snapshot
          </h3>
          <p className="text-xs text-slate-400">Microclimate telemetry from automated AWS weather stations</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>MICROCLIMATE STABLE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.label}
              className="p-3.5 bg-polar-900/70 border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <Icon className="h-4 w-4 text-sky-400" />
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    m.status === "WARNING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : m.status === "CRITICAL"
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 truncate">{m.label}</div>
              <div className={`text-lg font-black font-mono tracking-tight mt-0.5 ${m.color}`}>
                {m.value}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-1">{m.subtext}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
