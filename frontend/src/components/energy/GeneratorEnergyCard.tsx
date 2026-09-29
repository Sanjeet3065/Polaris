/**
 * POLARIS — Diesel Generator Co-Generation Monitoring Card
 * Phase 7: Energy Monitoring
 * 
 * Integrates Phase 4 generator equipment telemetry and scenario states.
 * Synchronizes with GENERATOR_OVERHEAT scenario and active equipment alerts.
 */

import React from "react";
import { Flame, AlertTriangle, Cpu } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { formatPower } from "../../utils/formatters";

export const GeneratorEnergyCard: React.FC = () => {
  const { energy, equipmentList, alertsList } = useStation();

  const dieselKw = energy.dieselGenerationKw ?? (energy as any).dieselGeneratorKw ?? 0;

  // Filter generator equipment for the station
  const generators = equipmentList.filter(
    (eq) => eq.category === "POWER" && eq.name.toLowerCase().includes("generator")
  );

  // Check if GENERATOR_OVERHEAT scenario or generator alerts are active
  const isOverheatScenario = alertsList.some(
    (a) => a.title.toLowerCase().includes("generator") || a.description.toLowerCase().includes("overheat")
  ) || generators.some((g) => g.status === "CRITICAL" || g.healthScore < 70);

  return (
    <Card className={`p-5 bg-polar-900/60 border ${
      isOverheatScenario ? "border-rose-500/50 bg-rose-950/15" : "border-slate-800/80"
    } flex flex-col justify-between`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              isOverheatScenario ? "bg-rose-500/20 text-rose-400" : "bg-orange-500/20 text-orange-400"
            }`}>
              <Flame className={`h-4 w-4 ${isOverheatScenario ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Arctic Diesel Cogeneration
              </h4>
              <p className="text-[11px] text-slate-400">Primary & Standby Power Generators</p>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isOverheatScenario
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}>
            {isOverheatScenario ? "Hazard / Overheat" : "Nominal Sync"}
          </span>
        </div>

        {/* GENERATOR_OVERHEAT Scenario Warning Banner */}
        {isOverheatScenario && (
          <div className="mt-3 p-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 flex items-center gap-2 text-xs font-mono text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">SCENARIO: GENERATOR_OVERHEAT ACTIVE</span>
              <div className="text-[11px] text-rose-400/90 font-sans">
                Cooling jacket thermal limit exceeded on primary generator. Vibration sensors elevated.
              </div>
            </div>
          </div>
        )}

        {/* Overall Co-Gen Output */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-100">
              {formatPower(dieselKw)}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Co-Generation Contribution: <span className="font-semibold text-slate-200">
                {Math.min(100, Math.round((dieselKw / (energy.totalGenerationKw || 1)) * 100))}% of Grid
              </span>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Thermal Heat Recov:</div>
            <div className="text-sm font-bold text-orange-300">~{Math.round(dieselKw * 0.42)} kWth</div>
          </div>
        </div>

        {/* Individual Generator Assets from Equipment List */}
        <div className="mt-4 space-y-2.5">
          {generators.length > 0 ? (
            generators.map((gen) => (
              <div
                key={gen.id}
                className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <div className="text-slate-200 font-semibold truncate max-w-[170px] sm:max-w-[220px]">
                      {gen.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{gen.modelNumber || gen.id}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold ${
                    gen.healthScore < 75 ? "text-rose-400" : gen.healthScore < 90 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {gen.healthScore}% Health
                  </div>
                  <div className="text-[10px] text-slate-400">{gen.status}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs font-mono text-slate-500 py-2 text-center border border-dashed border-slate-800 rounded">
              Standard Cogeneration Active (CAT / Volvo Penta)
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Thermal Exhaust Heat:</span>
        <span className="text-slate-200 font-semibold">Habitation District Heating</span>
      </div>
    </Card>
  );
};
