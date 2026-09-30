import React from "react";
import { MapPin, Users, Calendar, Radio } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ANTARCTIC_STATIONS } from "../../constants/stations";
import { StationCode } from "../../types";

interface StationSelectorProps {
  selectedStation: StationCode;
  onSelectStation: (code: StationCode) => void;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  selectedStation,
  onSelectStation
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.values(ANTARCTIC_STATIONS).map((station) => {
        const isSelected = selectedStation === station.code;
        return (
          <div
            key={station.code}
            onClick={() => onSelectStation(station.code)}
            className="cursor-pointer"
          >
            <Card
              glow={isSelected}
              className={`relative overflow-hidden transition-all duration-300 ${
                isSelected
                  ? "border-orange-500/60 bg-polar-900/90 shadow-titanium"
                  : "border-polar-750 bg-polar-950/70 hover:border-polar-700"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-orange-500/20 to-transparent pointer-events-none" />
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-100">{station.name}</h3>
                    <Badge variant={isSelected ? "ice" : "neutral"} size="sm">
                      {station.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{station.tagline}</p>
                </div>
                <Badge variant="success" size="sm">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                  {station.operationalStatus}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-polar-750 pt-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">{station.location.region}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Est. {station.commissionedYear}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{station.currentPersonnelCount} / {station.personnelCapacity} Expeditioners</span>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
};
