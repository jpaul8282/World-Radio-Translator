import { NeuralSatellite } from "../types";

export const INITIAL_SATELLITE_CONSTELLATION: NeuralSatellite[] = [
  {
    id: "sat-neuro-01",
    name: "NeuroSat Aether-1",
    code: "NS-01",
    orbitType: "LEO",
    altitudeKm: 550,
    velocityKmS: 7.6,
    lat: 38.5,
    lng: -77.0,
    uplinkBand: "Ka-Band Neural 60GHz",
    wifiProtocol: "WiFi 7 / 802.11be SpaceMesh",
    latencyMs: 12,
    signalStrength: 98,
    throughputGbps: 3.8,
    status: "OPTIMAL",
    activeRelays: 42,
    region: "Americas & N. Atlantic"
  },
  {
    id: "sat-neuro-02",
    name: "NeuroSat Celeste-2",
    code: "NS-02",
    orbitType: "GEO",
    altitudeKm: 1250,
    velocityKmS: 6.9,
    lat: 48.8,
    lng: 12.5,
    uplinkBand: "THz Optical Synapse Laser",
    wifiProtocol: "Neural-Mesh 802.11be",
    latencyMs: 16,
    signalStrength: 95,
    throughputGbps: 4.2,
    status: "RELAYING",
    activeRelays: 58,
    region: "Europe & W. Mediterranean"
  },
  {
    id: "sat-neuro-03",
    name: "NeuroSat Zenith-3",
    code: "NS-03",
    orbitType: "LEO",
    altitudeKm: 590,
    velocityKmS: 7.5,
    lat: 25.0,
    lng: 121.5,
    uplinkBand: "Quantum WiFi Carrier 90GHz",
    wifiProtocol: "SpaceMesh Direct Beam",
    latencyMs: 14,
    signalStrength: 99,
    throughputGbps: 5.1,
    status: "OPTIMAL",
    activeRelays: 64,
    region: "Asia-Pacific & Indian Ocean"
  },
  {
    id: "sat-neuro-04",
    name: "NeuroSat Aurora-Polar",
    code: "NS-04",
    orbitType: "Polar",
    altitudeKm: 720,
    velocityKmS: 7.3,
    lat: 68.0,
    lng: 25.0,
    uplinkBand: "Ionospheric Pulse Array",
    wifiProtocol: "Sub-THz Neural Wave",
    latencyMs: 21,
    signalStrength: 91,
    throughputGbps: 2.9,
    status: "ONLINE",
    activeRelays: 29,
    region: "Arctic & High Latitude Mesh"
  },
  {
    id: "sat-neuro-05",
    name: "NeuroSat Helios-South",
    code: "NS-05",
    orbitType: "LEO",
    altitudeKm: 560,
    velocityKmS: 7.6,
    lat: -22.9,
    lng: -43.2,
    uplinkBand: "Ka-Band Synaptic Beam",
    wifiProtocol: "WiFi 7 Gigabeam LEO",
    latencyMs: 15,
    signalStrength: 96,
    throughputGbps: 3.5,
    status: "RELAYING",
    activeRelays: 37,
    region: "South America & S. Atlantic"
  },
  {
    id: "sat-neuro-06",
    name: "NeuroSat Nova-Gateway",
    code: "NS-06",
    orbitType: "LEO",
    altitudeKm: 610,
    velocityKmS: 7.4,
    lat: 24.5,
    lng: 54.4,
    uplinkBand: "Optical Neural Inter-Link",
    wifiProtocol: "Quantum WiFi Relay",
    latencyMs: 13,
    signalStrength: 97,
    throughputGbps: 4.8,
    status: "OPTIMAL",
    activeRelays: 51,
    region: "Middle East & S. Asia"
  }
];

/**
 * Calculates great-circle distance approximate in KM between two coordinates
 */
export function calculateGeoDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Finds the nearest satellite and computes real-time beam telemetry
 */
export function getNearestSatellite(
  lat: number,
  lng: number,
  satellites: NeuralSatellite[],
  forcedSatelliteId?: string | null
): {
  satellite: NeuralSatellite;
  distanceKm: number;
  beamQualityScore: number;
  calculatedLatencyMs: number;
} {
  if (forcedSatelliteId) {
    const forced = satellites.find((s) => s.id === forcedSatelliteId);
    if (forced) {
      const dist = calculateGeoDistanceKm(lat, lng, forced.lat, forced.lng);
      const quality = Math.max(75, Math.min(100, Math.round(100 - dist / 150)));
      return {
        satellite: forced,
        distanceKm: dist,
        beamQualityScore: quality,
        calculatedLatencyMs: Math.max(9, Math.round(dist / 350 + forced.latencyMs * 0.7))
      };
    }
  }

  let closest = satellites[0];
  let minDistance = Infinity;

  for (const sat of satellites) {
    const dist = calculateGeoDistanceKm(lat, lng, sat.lat, sat.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = sat;
    }
  }

  const beamQuality = Math.max(82, Math.min(100, Math.round(100 - minDistance / 200)));
  const calculatedLat = Math.max(8, Math.round(minDistance / 400 + closest.latencyMs * 0.6));

  return {
    satellite: closest,
    distanceKm: minDistance,
    beamQualityScore: beamQuality,
    calculatedLatencyMs: calculatedLat
  };
}

export const findNearestSatellite = getNearestSatellite;

/**
 * Updates satellite orbital coordinates over time for dynamic real-time visualization
 */
export function tickSatelliteOrbits(satellites: NeuralSatellite[]): NeuralSatellite[] {
  return satellites.map((sat, index) => {
    // Orbital drift velocity simulation
    const lngSpeed = 0.25 + (index % 3) * 0.08;
    let newLng = sat.lng + lngSpeed;
    if (newLng > 180) newLng = -180 + (newLng - 180);

    // Subtle sinusoidal latitude inclination
    const baseLat = INITIAL_SATELLITE_CONSTELLATION[index].lat;
    const latOscillation = Math.sin((Date.now() / 15000) + index) * 3.5;
    const newLat = Math.max(-80, Math.min(80, baseLat + latOscillation));

    return {
      ...sat,
      lat: Number(newLat.toFixed(2)),
      lng: Number(newLng.toFixed(2)),
      activeRelays: Math.max(20, sat.activeRelays + (Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0))
    };
  });
}
