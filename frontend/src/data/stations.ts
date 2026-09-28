import { Station } from "../types";

export const MOCK_STATIONS: Record<"MAITRI" | "BHARATI", Station> = {
  MAITRI: {
    id: "station-maitri-01",
    code: "MAITRI",
    name: "Maitri Antarctic Research Station",
    tagline: "India's Historic Second Polar Research Station in Schirmacher Oasis",
    location: {
      lat: -70.7667,
      lng: 11.7333,
      altitudeMeters: 117,
      region: "Schirmacher Oasis, Queen Maud Land"
    },
    commissionedYear: 1989,
    operationalStatus: "OPERATIONAL",
    personnelCapacity: 25,
    currentPersonnelCount: 18,
    systemHealthPercent: 98
  },
  BHARATI: {
    id: "station-bharati-02",
    code: "BHARATI",
    name: "Bharati Antarctic Research Station",
    tagline: "India's State-of-the-Art Polar Outpost in Larsemann Hills",
    location: {
      lat: -69.4072,
      lng: 76.1917,
      altitudeMeters: 35,
      region: "Larsemann Hills, East Antarctica"
    },
    commissionedYear: 2012,
    operationalStatus: "OPERATIONAL",
    personnelCapacity: 47,
    currentPersonnelCount: 23,
    systemHealthPercent: 94
  }
};
