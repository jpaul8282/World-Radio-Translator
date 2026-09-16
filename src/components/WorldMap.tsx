import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  Radio,
  Play,
  Volume2,
  MapPin,
  Eye,
  EyeOff,
  Flame,
  Activity,
  Wifi,
  Satellite,
  Zap,
  Cpu,
  Orbit,
  Sparkles,
  Signal,
  Waves,
  ShieldCheck,
  Info,
  Lock,
  Unlock,
  ArrowUpRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocationGeoProfile, RadioStation, NeuralSatellite } from "../types";
import {
  INITIAL_SATELLITE_CONSTELLATION,
  getNearestSatellite,
  tickSatelliteOrbits,
  calculateGeoDistanceKm
} from "../lib/satelliteConstellation";

interface ParsedPath {
  id: string; 
  name: string; 
  d: string;
}

interface WorldMapProps {
  darkMode: boolean;
  onMapClick: (coords: { lat: number; lng: number }) => void;
  selectedProfile: LocationGeoProfile | null;
  loading: boolean;
  selectedCoords: { lat: number; lng: number } | null;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  onRadiusChangeEnd: () => void;
  stations?: RadioStation[];
  activeStation?: RadioStation | null;
  isPlaying?: boolean;
  onSelectStation?: (station: RadioStation) => void;
}

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  US: { lat: 37.0902, lng: -95.7129 },
  GB: { lat: 55.3781, lng: -3.4360 },
  FR: { lat: 46.2276, lng: 2.2137 },
  DE: { lat: 51.1657, lng: 10.4515 },
  ES: { lat: 40.4637, lng: -3.7492 },
  IT: { lat: 41.8719, lng: 12.5674 },
  JP: { lat: 36.2048, lng: 138.2529 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
  BR: { lat: -14.2350, lng: -51.9253 },
  IN: { lat: 20.5937, lng: 78.9629 },
  MX: { lat: 23.6345, lng: -102.5528 },
  CN: { lat: 35.8617, lng: 104.1954 },
  RU: { lat: 61.5240, lng: 105.3188 },
  ZA: { lat: -30.5595, lng: 22.9375 },
  AR: { lat: -38.4161, lng: -63.6167 },
  NL: { lat: 52.1326, lng: 5.2913 },
  SE: { lat: 60.1282, lng: 18.6435 },
  NO: { lat: 60.4720, lng: 8.4689 },
  FI: { lat: 61.9241, lng: 25.7482 },
  DK: { lat: 56.2639, lng: 9.5018 },
  PL: { lat: 51.9194, lng: 19.1451 },
  CH: { lat: 46.8182, lng: 8.2275 },
  AT: { lat: 47.5162, lng: 14.5501 },
  BE: { lat: 50.5039, lng: 4.4699 },
  GR: { lat: 39.0742, lng: 21.8243 },
  TR: { lat: 38.9637, lng: 35.2433 },
  EG: { lat: 26.8206, lng: 30.8025 },
  KR: { lat: 35.9078, lng: 127.7669 },
  NZ: { lat: -40.9006, lng: 174.8860 },
  PT: { lat: 39.3999, lng: -8.2245 },
  IE: { lat: 53.1424, lng: -7.6921 },
  ID: { lat: -0.7893, lng: 113.9213 },
  TH: { lat: 15.8700, lng: 100.9925 },
  PH: { lat: 12.8797, lng: 121.7740 },
  VN: { lat: 14.0583, lng: 108.2772 },
  CO: { lat: 4.5709, lng: -74.2973 },
  CL: { lat: -35.6751, lng: -71.5430 },
  PE: { lat: -9.1900, lng: -75.0152 },
  UA: { lat: 48.3794, lng: 31.1656 },
  RO: { lat: 45.9432, lng: 24.9668 },
  HU: { lat: 47.1625, lng: 19.5033 },
  CZ: { lat: 49.8175, lng: 15.4730 },
  KE: { lat: -0.0236, lng: 37.9062 },
  NG: { lat: 9.0820, lng: 8.6753 },
  MA: { lat: 31.7917, lng: -7.0926 },
  IL: { lat: 31.0461, lng: 34.8516 },
  AE: { lat: 23.4241, lng: 53.8478 },
  SA: { lat: 23.8859, lng: 45.0792 },
};

function getStationCoordinates(
  station: RadioStation,
  index: number,
  selectedCoords: { lat: number; lng: number } | null
): { lat: number; lng: number } {
  const latNum = station.geo_lat != null ? Number(station.geo_lat) : NaN;
  const lngNum = station.geo_long != null ? Number(station.geo_long) : NaN;

  if (!isNaN(latNum) && !isNaN(lngNum) && (latNum !== 0 || lngNum !== 0)) {
    return { lat: latNum, lng: lngNum };
  }

  const code = (station.countrycode || "").toUpperCase().trim();
  if (code && COUNTRY_COORDINATES[code]) {
    const base = COUNTRY_COORDINATES[code];
    const angle = (index * 137.5) * (Math.PI / 180);
    const dist = 0.8 + (index % 6) * 0.9;
    return {
      lat: Math.max(-85, Math.min(85, base.lat + dist * Math.cos(angle))),
      lng: Math.max(-180, Math.min(180, base.lng + dist * Math.sin(angle))),
    };
  }

  const baseLat = selectedCoords ? selectedCoords.lat : 48.8566;
  const baseLng = selectedCoords ? selectedCoords.lng : 2.3522;
  const angle = (index * 137.5) * (Math.PI / 180);
  const dist = 1.5 + (index % 7) * 1.2;
  return {
    lat: Math.max(-85, Math.min(85, baseLat + dist * Math.cos(angle))),
    lng: Math.max(-180, Math.min(180, baseLng + dist * Math.sin(angle))),
  };
}

export default function WorldMap({
  darkMode,
  onMapClick,
  selectedProfile,
  loading,
  selectedCoords,
  radiusKm,
  setRadiusKm,
  onRadiusChangeEnd,
  stations = [],
  activeStation = null,
  isPlaying = false,
  onSelectStation
}: WorldMapProps) {
  const [mapPaths, setMapPaths] = useState<ParsedPath[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredStation, setHoveredStation] = useState<{ station: RadioStation; x: number; y: number } | null>(null);

  // Neural Satellite Constellation & WiFi State
  const [satellites, setSatellites] = useState<NeuralSatellite[]>(INITIAL_SATELLITE_CONSTELLATION);
  const [showSatellites, setShowSatellites] = useState(true);
  const [lockedSatelliteId, setLockedSatelliteId] = useState<string | null>(null);
  const [hoveredSatellite, setHoveredSatellite] = useState<{ satellite: NeuralSatellite; x: number; y: number } | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [neuralRelayMode, setNeuralRelayMode] = useState<"auto-mesh" | "manual-lock" | "ionosphere-quantum">("auto-mesh");

  const svgRef = useRef<SVGSVGElement>(null);

  // Real-time orbital movement simulator ticker
  useEffect(() => {
    const orbitInterval = setInterval(() => {
      setSatellites((prev) => tickSatelliteOrbits(prev));
    }, 2800);

    return () => clearInterval(orbitInterval);
  }, []);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/@highcharts/map-collection@1.1.3/custom/world.svg")
      .then((res) => {
        if (!res.ok) throw new Error("SVG map fetch failed");
        return res.text();
      })
      .then((svgText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const paths = doc.querySelectorAll("path");

        const parsed: ParsedPath[] = Array.from(paths)
          .map((p) => {
            const hcKeyClass = p.getAttribute("class") || "";
            const keyMatch = hcKeyClass.match(/highcharts-key-([a-z2-9]+)/i);
            const id = (keyMatch ? keyMatch[1] : p.getAttribute("id") || p.getAttribute("data-id") || "").toUpperCase();
            
            return {
              id: id,
              name: p.getAttribute("name") || p.getAttribute("data-name") || id,
              d: p.getAttribute("d") || "",
            };
          })
          .filter((p) => p.d && p.id && p.id.length <= 3 && p.id !== "KEY");

        setMapPaths(parsed);
        setLoadingMap(false);
      })
      .catch((err) => {
        console.error("Failed to load map background graphics:", err);
        setLoadingMap(false);
      });
  }, []);

  const getSvgCoordinates = (lat: number, lng: number) => {
    const x = 1.9018 * lng + 338.5973;
    const y = -1.9940 * lat + 212.6994;
    return { x, y };
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();

    const clickX = event.clientX - svgRect.left;
    const clickY = event.clientY - svgRect.top;

    const viewBoxWidth = 700;
    const viewBoxHeight = 340;

    const svgAspect = viewBoxWidth / viewBoxHeight;
    const containerAspect = svgRect.width / svgRect.height;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > svgAspect) {
      scale = svgRect.height / viewBoxHeight;
      const renderedWidth = viewBoxWidth * scale;
      offsetX = (svgRect.width - renderedWidth) / 2;
    } else {
      scale = svgRect.width / viewBoxWidth;
      const renderedHeight = viewBoxHeight * scale;
      offsetY = (svgRect.height - renderedHeight) / 2;
    }

    const xOnMap = (clickX - offsetX) / scale;
    const yOnMap = (clickY - offsetY) / scale;

    const lng = (xOnMap - 338.5973) / 1.9018;
    const lat = (yOnMap - 212.6994) / -1.9940;

    const clampedLng = Math.max(-180, Math.min(180, lng));
    const clampedLat = Math.max(-90, Math.min(90, lat));

    onMapClick({ lat: clampedLat, lng: clampedLng });
  };

  // Compute station pin positions on SVG
  const stationPins = React.useMemo(() => {
    if (!stations || stations.length === 0) return [];
    return stations.map((st, idx) => {
      const coords = getStationCoordinates(st, idx, selectedCoords);
      const svgPos = getSvgCoordinates(coords.lat, coords.lng);
      const isActive = activeStation ? st.stationuuid === activeStation.stationuuid : false;
      return {
        station: st,
        coords,
        x: svgPos.x,
        y: svgPos.y,
        isActive,
        index: idx,
      };
    });
  }, [stations, selectedCoords, activeStation]);

  const activePin = stationPins.find((p) => p.isActive);
  const regularPins = stationPins.filter((p) => !p.isActive);

  // Compute positions of neural satellites
  const satelliteNodes = React.useMemo(() => {
    return satellites.map((sat, index) => {
      const svgPos = getSvgCoordinates(sat.lat, sat.lng);
      const isLocked = sat.id === lockedSatelliteId;
      return {
        ...sat,
        x: svgPos.x,
        y: svgPos.y,
        isLocked,
        index,
      };
    });
  }, [satellites, lockedSatelliteId]);

  // Determine active ground origin coordinates for the neural satellite beam
  const groundOrigin = React.useMemo(() => {
    if (activePin) {
      return { lat: activePin.coords.lat, lng: activePin.coords.lng, x: activePin.x, y: activePin.y };
    }
    if (selectedCoords) {
      const svgPos = getSvgCoordinates(selectedCoords.lat, selectedCoords.lng);
      return { lat: selectedCoords.lat, lng: selectedCoords.lng, x: svgPos.x, y: svgPos.y };
    }
    return null;
  }, [activePin, selectedCoords]);

  // Compute active neural uplink telemetry (closest satellite or locked satellite)
  const activeUplink = React.useMemo(() => {
    if (!groundOrigin) return null;
    const result = getNearestSatellite(
      groundOrigin.lat,
      groundOrigin.lng,
      satellites,
      lockedSatelliteId
    );
    const satSvgPos = getSvgCoordinates(result.satellite.lat, result.satellite.lng);
    return {
      ...result,
      groundX: groundOrigin.x,
      groundY: groundOrigin.y,
      satX: satSvgPos.x,
      satY: satSvgPos.y,
    };
  }, [groundOrigin, satellites, lockedSatelliteId]);

  // Compute inter-satellite orbital mesh links
  const interSatelliteLinks = React.useMemo(() => {
    if (!satelliteNodes || satelliteNodes.length < 2) return [];
    const links: { fromX: number; fromY: number; toX: number; toY: number; id: string }[] = [];
    for (let i = 0; i < satelliteNodes.length; i++) {
      const from = satelliteNodes[i];
      const to = satelliteNodes[(i + 1) % satelliteNodes.length];
      // Only draw link if they are on same side or wrap cleanly
      if (Math.abs(from.x - to.x) < 480) {
        links.push({
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          id: `isl-${from.id}-${to.id}`,
        });
      }
    }
    return links;
  }, [satelliteNodes]);

  // Compute heatmap nodes based on listener tuning activity (votes + clickcounts)
  const heatmapNodes = React.useMemo(() => {
    if (!stationPins || stationPins.length === 0) return [];
    return stationPins.map((pin) => {
      const votes = pin.station.votes || 0;
      const clicks = pin.station.clickcount || 0;
      const activityScore = Math.max(15, votes + clicks);
      const radius = Math.min(50, Math.max(18, Math.sqrt(activityScore) * 1.5 + 10));
      
      let gradientId = "heat_gradient_medium";
      if (activityScore > 2000) {
        gradientId = "heat_gradient_high";
      } else if (activityScore < 200) {
        gradientId = "heat_gradient_low";
      }

      return {
        id: pin.station.stationuuid || `heat-${pin.index}`,
        x: pin.x,
        y: pin.y,
        radius,
        gradientId,
        stationName: pin.station.name,
        activityScore,
      };
    });
  }, [stationPins]);

  const handleToggleLockSatellite = (satelliteId: string) => {
    if (lockedSatelliteId === satelliteId) {
      setLockedSatelliteId(null);
      setNeuralRelayMode("auto-mesh");
    } else {
      setLockedSatelliteId(satelliteId);
      setNeuralRelayMode("manual-lock");
    }
  };

  return (
    <div className="flex flex-col w-full aspect-[700/340] max-w-5xl max-h-[360px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[490px] mx-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50">
      
      {/* Top Bar Map Controls & Station Counter Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>{stations.length} Station Pins</span>
          </div>

          {/* Active Neural WiFi Satellite Uplink Pill */}
          {showSatellites && activeUplink && (
            <button
              onClick={() => setShowDiagnosticsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 dark:bg-sky-950/40 hover:bg-sky-500/20 backdrop-blur-md border border-sky-500/30 text-xs font-semibold text-sky-800 dark:text-sky-300 shadow-md transition-all cursor-pointer group"
              title="Click to view Neural WiFi Satellite Constellation Diagnostics"
              id="btn_satellite_uplink_telemetry"
            >
              <Satellite className="w-3.5 h-3.5 text-sky-500 animate-pulse group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-mono">Uplink:</span>
              <span className="font-bold">{activeUplink.satellite.name}</span>
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-sky-500/20 text-[10px] font-mono">
                <Wifi className="w-2.5 h-2.5" />
                {activeUplink.calculatedLatencyMs}ms
              </span>
              {lockedSatelliteId && (
                <Lock className="w-2.5 h-2.5 text-amber-500 ml-0.5" />
              )}
            </button>
          )}

          {activeStation && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 dark:bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-md">
              <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="truncate max-w-[130px]">{activeStation.name}</span>
            </div>
          )}
        </div>

        {/* Action Controls: Neural Satellites, Heatmap Toggle & Show/Hide Pins */}
        <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
          {/* Neural WiFi Satellite Constellation Toggle */}
          <button
            type="button"
            onClick={() => setShowSatellites(!showSatellites)}
            className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border shadow-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showSatellites
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-600 text-white border-sky-400/80 shadow-sky-500/20"
                : "bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-sky-400"
            }`}
            title={showSatellites ? "Hide neural satellite mesh network" : "Show neural WiFi satellite constellation"}
            id="btn_toggle_neural_satellites"
          >
            <Satellite className={`w-3.5 h-3.5 ${showSatellites ? "fill-white text-white animate-spin [animation-duration:12s]" : "text-sky-500"}`} />
            <span className="hidden sm:inline font-semibold">Neural Satellites</span>
            {showSatellites && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border shadow-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showHeatmap
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400/80 shadow-rose-500/20"
                : "bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-amber-400"
            }`}
            title={showHeatmap ? "Hide activity heatmap" : "Show activity heatmap overlay"}
            id="btn_toggle_activity_heatmap"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? "fill-white text-white" : "text-amber-500"}`} />
            <span className="hidden md:inline font-semibold">Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            className="px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
            title={showPins ? "Hide radio station pins on map" : "Show radio station pins on map"}
            id="btn_toggle_map_pins"
          >
            {showPins ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline">Hide Pins</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden lg:inline">Show Pins</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
        {loadingMap ? (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 font-display text-slate-500">
            <Globe className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm">Loading dynamic geographic projection...</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox="0 0 700 340"
            className="w-full h-full select-none cursor-crosshair"
            onClick={handleSvgClick}
            id="world_svg_container"
          >
            <defs>
              {/* High Activity Gradient (Peak tuning volume - Fiery Rose/Red to Amber) */}
              <radialGradient id="heat_gradient_high" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="80%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              {/* Medium Activity Gradient (Moderate tuning volume - Amber to Blue) */}
              <radialGradient id="heat_gradient_medium" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>

              {/* Low Activity Gradient (Soft emerald) */}
              <radialGradient id="heat_gradient_low" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>

              {/* Smooth Blur Filter for Heat Density Clouds */}
              <filter id="heatmap_blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="9" />
              </filter>

              {/* Neural Satellite Uplink Beam Gradients */}
              <linearGradient id="neural_beam_grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.85" />
                <stop offset="80%" stopColor="#6366f1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="neural_beam_core" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#67e8f9" stopOpacity="1" />
              </linearGradient>

              {/* Satellite Solar Array Gradient */}
              <linearGradient id="sat_solar_panel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>

              {/* Glow Filter for Neural Laser Beams */}
              <filter id="laser_glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Landmass Paths */}
            <g id="landmass_group">
              {mapPaths.map((region) => {
                const landColor = darkMode ? "#1e293b" : "#e2e8f0";
                return (
                  <path
                    key={region.id || Math.random().toString()}
                    d={region.d}
                    className="transition-all duration-150 cursor-pointer opacity-100"
                    stroke={landColor} 
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    fill={landColor}
                    id={region.id ? `map_path_${region.id.toLowerCase()}` : undefined}
                  />
                );
              })}
            </g>

            {/* Toggleable Activity Heatmap Density Overlay Layer */}
            {showHeatmap && (
              <g id="activity_heatmap_overlay_layer" className="pointer-events-none">
                {heatmapNodes.map((node) => (
                  <circle
                    key={node.id}
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={`url(#${node.gradientId})`}
                    filter="url(#heatmap_blur)"
                    className="transition-all duration-300"
                  />
                ))}
              </g>
            )}

            {/* Vicinity Circle Overlay */}
            {selectedCoords && (() => {
              const { x, y } = getSvgCoordinates(selectedCoords.lat, selectedCoords.lng);
              return (
                <g id="vicinity_overlay_group" className="pointer-events-none">
                  <g transform={`translate(${x}, ${y})`}>
                    <circle cx="0" cy="0" r="14" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" style={{ animationDuration: "1.8s" }} />
                    <circle cx="0" cy="0" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" className="shadow" />
                  </g>
                </g>
              );
            })()}

            {/* Clickable Radio Station Pins Overlay */}
            {showPins && (
              <g id="radio_station_pins_group">
                {/* Regular Pins */}
                {regularPins.map((pin) => (
                  <g
                    key={pin.station.stationuuid || `pin-${pin.index}`}
                    transform={`translate(${pin.x}, ${pin.y})`}
                    className="cursor-pointer group select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectStation) onSelectStation(pin.station);
                    }}
                    onMouseEnter={() => setHoveredStation({ station: pin.station, x: pin.x, y: pin.y })}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="4.5"
                      fill={darkMode ? "rgba(99, 102, 241, 0.3)" : "rgba(79, 70, 229, 0.2)"}
                      className="group-hover:scale-150 transition-all duration-200"
                    />
                    <path
                      d="M0 -7 C-3.5 -7 -5 -4.5 -5 -1 C-5 2.5 0 7 0 7 C0 7 5 2.5 5 -1 C5 -4.5 3.5 -7 0 -7 Z"
                      fill={darkMode ? "#818cf8" : "#4f46e5"}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      className="group-hover:scale-125 transition-all duration-200 origin-center drop-shadow-sm"
                    />
                    <circle cx="0" cy="-2" r="1.5" fill="#ffffff" />
                  </g>
                ))}

                {/* Active Station Pin (Rendered Last so it stays on top) */}
                {activePin && (
                  <g
                    transform={`translate(${activePin.x}, ${activePin.y})`}
                    className="cursor-pointer group select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectStation) onSelectStation(activePin.station);
                    }}
                    onMouseEnter={() => setHoveredStation({ station: activePin.station, x: activePin.x, y: activePin.y })}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    <circle cx="0" cy="0" r="16" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" style={{ animationDuration: "1.6s" }} />
                    <circle cx="0" cy="0" r="8" fill="rgba(16, 185, 129, 0.4)" className="animate-pulse" />
                    <path
                      d="M0 -11 C-5.5 -11 -8 -7 -8 -2 C-8 3.5 0 10 0 10 C0 10 8 3.5 8 -2 C8 -7 5.5 -11 0 -11 Z"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="drop-shadow-md"
                    />
                    <circle cx="0" cy="-3.5" r="3" fill="#ffffff" />
                    <circle cx="0" cy="-3.5" r="1.5" fill="#10b981" />
                  </g>
                )}
              </g>
            )}

            {/* NEURAL SATELLITE CONSTELLATION & INTER-LINK MESH LAYER */}
            {showSatellites && (
              <g id="neural_satellite_constellation_layer">
                {/* 1. Inter-Satellite Laser Mesh Rings (ISL) */}
                <g id="inter_satellite_mesh_links" className="pointer-events-none">
                  {interSatelliteLinks.map((link) => (
                    <g key={link.id}>
                      <line
                        x1={link.fromX}
                        y1={link.fromY}
                        x2={link.toX}
                        y2={link.toY}
                        stroke={darkMode ? "rgba(56, 189, 248, 0.35)" : "rgba(14, 165, 233, 0.45)"}
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                        className="animate-pulse"
                      />
                      {/* Traveling laser pulse packets */}
                      <circle
                        cx={(link.fromX + link.toX) / 2}
                        cy={(link.fromY + link.toY) / 2}
                        r="1.8"
                        fill="#38bdf8"
                        filter="url(#laser_glow)"
                      />
                    </g>
                  ))}
                </g>

                {/* 2. Active Ground-to-Satellite Neural WiFi Uplink Beam */}
                {activeUplink && (
                  <g id="neural_ground_uplink_beam_group" className="pointer-events-none">
                    {/* Ground WiFi Concentric Emission Ripples */}
                    <circle
                      cx={activeUplink.groundX}
                      cy={activeUplink.groundY}
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      className="animate-ping"
                      style={{ animationDuration: "2s" }}
                    />
                    <circle
                      cx={activeUplink.groundX}
                      cy={activeUplink.groundY}
                      r="20"
                      fill="none"
                      stroke="rgba(6, 182, 212, 0.4)"
                      strokeWidth="0.8"
                      className="animate-ping"
                      style={{ animationDuration: "3s" }}
                    />

                    {/* Glowing outer neural beam */}
                    <line
                      x1={activeUplink.groundX}
                      y1={activeUplink.groundY}
                      x2={activeUplink.satX}
                      y2={activeUplink.satY}
                      stroke="url(#neural_beam_grad)"
                      strokeWidth="3.5"
                      strokeOpacity="0.45"
                      filter="url(#laser_glow)"
                    />

                    {/* High-speed inner core beam */}
                    <line
                      x1={activeUplink.groundX}
                      y1={activeUplink.groundY}
                      x2={activeUplink.satX}
                      y2={activeUplink.satY}
                      stroke="url(#neural_beam_core)"
                      strokeWidth="1.6"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />

                    {/* Animated Synaptic Carrier Pulse Particles */}
                    <circle
                      cx={activeUplink.groundX * 0.7 + activeUplink.satX * 0.3}
                      cy={activeUplink.groundY * 0.7 + activeUplink.satY * 0.3}
                      r="2.5"
                      fill="#ffffff"
                      filter="url(#laser_glow)"
                    />
                    <circle
                      cx={activeUplink.groundX * 0.3 + activeUplink.satX * 0.7}
                      cy={activeUplink.groundY * 0.3 + activeUplink.satY * 0.7}
                      r="2.5"
                      fill="#38bdf8"
                      filter="url(#laser_glow)"
                    />

                    {/* Satellite Dish Receiver Concentric Ripples */}
                    <circle
                      cx={activeUplink.satX}
                      cy={activeUplink.satY}
                      r="16"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      className="animate-ping"
                      style={{ animationDuration: "1.8s" }}
                    />
                  </g>
                )}

                {/* 3. Orbiting Neural Satellite Nodes */}
                <g id="neural_satellite_nodes_group">
                  {satelliteNodes.map((sat) => {
                    const isUplinkTarget = activeUplink?.satellite.id === sat.id;
                    const isLocked = sat.isLocked;

                    return (
                      <g
                        key={sat.id}
                        transform={`translate(${sat.x}, ${sat.y})`}
                        className="cursor-pointer group select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLockSatellite(sat.id);
                        }}
                        onMouseEnter={() => setHoveredSatellite({ satellite: sat, x: sat.x, y: sat.y })}
                        onMouseLeave={() => setHoveredSatellite(null)}
                      >
                        {/* Aura Glow when active or locked */}
                        {(isUplinkTarget || isLocked) && (
                          <circle
                            cx="0"
                            cy="0"
                            r="14"
                            fill={isLocked ? "rgba(245, 158, 11, 0.25)" : "rgba(56, 189, 248, 0.25)"}
                            className="animate-pulse"
                          />
                        )}

                        {/* Solar Array Left Wing */}
                        <rect
                          x="-14"
                          y="-3.5"
                          width="8"
                          height="7"
                          rx="1"
                          fill="url(#sat_solar_panel)"
                          stroke={darkMode ? "#38bdf8" : "#0284c7"}
                          strokeWidth="0.6"
                          className="group-hover:scale-110 origin-right transition-transform"
                        />
                        <line x1="-10" y1="-3.5" x2="-10" y2="3.5" stroke="#bae6fd" strokeWidth="0.4" />

                        {/* Solar Array Right Wing */}
                        <rect
                          x="6"
                          y="-3.5"
                          width="8"
                          height="7"
                          rx="1"
                          fill="url(#sat_solar_panel)"
                          stroke={darkMode ? "#38bdf8" : "#0284c7"}
                          strokeWidth="0.6"
                          className="group-hover:scale-110 origin-left transition-transform"
                        />
                        <line x1="10" y1="-3.5" x2="10" y2="3.5" stroke="#bae6fd" strokeWidth="0.4" />

                        {/* Satellite Bus Chassis Core */}
                        <rect
                          x="-5"
                          y="-5"
                          width="10"
                          height="10"
                          rx="2"
                          fill={isLocked ? "#b45309" : darkMode ? "#0f172a" : "#1e293b"}
                          stroke={isLocked ? "#fbbf24" : isUplinkTarget ? "#38bdf8" : "#94a3b8"}
                          strokeWidth="1.2"
                          className="group-hover:scale-125 origin-center transition-transform drop-shadow"
                        />

                        {/* Neural Synapse Core LED */}
                        <circle
                          cx="0"
                          cy="0"
                          r="2.2"
                          fill={isLocked ? "#fbbf24" : isUplinkTarget ? "#10b981" : "#38bdf8"}
                          className="animate-ping"
                          style={{ animationDuration: "1.2s" }}
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="1.5"
                          fill="#ffffff"
                        />

                        {/* WiFi Dish Transceiver Antenna */}
                        <path
                          d="M-3 5 Q0 8 3 5"
                          fill="none"
                          stroke={isLocked ? "#fbbf24" : "#38bdf8"}
                          strokeWidth="1.2"
                        />
                        <line x1="0" y1="5" x2="0" y2="8" stroke={isLocked ? "#fbbf24" : "#38bdf8"} strokeWidth="1" />

                        {/* Satellite Code Badge */}
                        <g transform="translate(0, -9)">
                          <rect
                            x="-11"
                            y="-6"
                            width="22"
                            height="8"
                            rx="2"
                            fill={isLocked ? "#d97706" : isUplinkTarget ? "#0284c7" : darkMode ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)"}
                            stroke={isLocked ? "#f59e0b" : isUplinkTarget ? "#38bdf8" : "rgba(148, 163, 184, 0.5)"}
                            strokeWidth="0.5"
                          />
                          <text
                            x="0"
                            y="-0.5"
                            textAnchor="middle"
                            fontSize="5.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            fill={isLocked || isUplinkTarget ? "#ffffff" : darkMode ? "#e2e8f0" : "#1e293b"}
                          >
                            {sat.code}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              </g>
            )}
          </svg>
        )}

        {/* Hovered Station Popover Tooltip */}
        <AnimatePresence>
          {hoveredStation && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                left: `${Math.min(80, Math.max(20, (hoveredStation.x / 700) * 100))}%`,
                top: `${hoveredStation.y < 130 ? (hoveredStation.y / 340) * 100 + 10 : (hoveredStation.y / 340) * 100 - 4}%`,
                transform: hoveredStation.y < 130 ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
              }}
              className="absolute z-30 pointer-events-auto min-w-[210px] max-w-[260px] p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {hoveredStation.station.favicon ? (
                    <img
                      src={hoveredStation.station.favicon}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  ) : (
                    <Radio className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs truncate leading-snug">
                    {hoveredStation.station.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-rose-500 flex-shrink-0" />
                    <span className="truncate">
                      {[hoveredStation.station.state, hoveredStation.station.country].filter(Boolean).join(", ")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono">
                {hoveredStation.station.language && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {hoveredStation.station.language}
                  </span>
                )}
                {hoveredStation.station.bitrate ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {hoveredStation.station.bitrate} kbps
                  </span>
                ) : null}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectStation) {
                    onSelectStation(hoveredStation.station);
                  }
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeStation?.stationuuid === hoveredStation.station.stationuuid
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95"
                }`}
              >
                {activeStation?.stationuuid === hoveredStation.station.stationuuid ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Currently Playing</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tune In Directly</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hovered Neural Satellite Popover Tooltip */}
        <AnimatePresence>
          {hoveredSatellite && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                left: `${Math.min(80, Math.max(20, (hoveredSatellite.x / 700) * 100))}%`,
                top: `${hoveredSatellite.y < 140 ? (hoveredSatellite.y / 340) * 100 + 12 : (hoveredSatellite.y / 340) * 100 - 6}%`,
                transform: hoveredSatellite.y < 140 ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
              }}
              className="absolute z-30 pointer-events-auto min-w-[240px] max-w-[290px] p-3.5 rounded-xl bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-sky-500/40 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Satellite className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight flex items-center gap-1.5">
                      <span>{hoveredSatellite.satellite.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/30 text-sky-200">
                        {hoveredSatellite.satellite.orbitType}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {hoveredSatellite.satellite.region}
                    </p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  {hoveredSatellite.satellite.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[9px]">Uplink Protocol:</span>
                  <span className="text-sky-300 font-semibold truncate">{hoveredSatellite.satellite.wifiProtocol}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[9px]">Carrier Band:</span>
                  <span className="text-emerald-300 font-semibold truncate">{hoveredSatellite.satellite.uplinkBand}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[9px]">Orbital Alt / Speed:</span>
                  <span className="text-slate-200">{hoveredSatellite.satellite.altitudeKm}km • {hoveredSatellite.satellite.velocityKmS}km/s</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[9px]">Latency / Quality:</span>
                  <span className="text-amber-300 font-semibold">{hoveredSatellite.satellite.latencyMs}ms • {hoveredSatellite.satellite.signalStrength}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLockSatellite(hoveredSatellite.satellite.id);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    lockedSatelliteId === hoveredSatellite.satellite.id
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-sky-600 hover:bg-sky-500 text-white"
                  }`}
                >
                  {lockedSatelliteId === hoveredSatellite.satellite.id ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Release Lock</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Neural Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDiagnosticsModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="View full constellation diagnostics"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heatmap Activity Legend Overlay */}
        <AnimatePresence>
          {showHeatmap && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-3 left-3 z-20 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md text-[10px] font-mono text-slate-600 dark:text-slate-300"
              id="heatmap_activity_legend"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Tuning Density:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-medium">Low</span>
                <div className="w-16 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shadow-xs" />
                <span className="text-rose-500 font-bold">Peak</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Neural WiFi Satellite Constellation Diagnostics Modal */}
      <AnimatePresence>
        {showDiagnosticsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <Satellite className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>Neural WiFi Satellite Constellation</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        LEO/GEO SpaceMesh
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time orbital telemetry, WiFi 7 neural laser crosslinks, and stream relay diagnostics
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-5 overflow-y-auto flex flex-col gap-4">
                {/* Active Relay Telemetry Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Active Constellation</span>
                    <span className="text-lg font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mt-0.5">
                      <Satellite className="w-4 h-4" />
                      {satellites.length} Nodes
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1">100% Inter-Link Synced</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Downlink Ping</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Wifi className="w-4 h-4" />
                      {activeUplink ? `${activeUplink.calculatedLatencyMs} ms` : "14 ms"}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1">Sub-20ms Ultra Low</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Mesh Throughput</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-0.5">
                      <Zap className="w-4 h-4" />
                      24.8 Gbps
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1">THz Optical Backbone</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Relay Protocol</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-1 truncate">
                      <Cpu className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      WiFi 7 SpaceMesh
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1">802.11be Neural Array</span>
                  </div>
                </div>

                {/* Satellite Nodes Table */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Orbital Node Fleet Telemetry
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                    {satellites.map((sat) => {
                      const isLocked = lockedSatelliteId === sat.id;
                      const isUplink = activeUplink?.satellite.id === sat.id;

                      return (
                        <div
                          key={sat.id}
                          className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isLocked
                              ? "bg-amber-500/10 dark:bg-amber-950/20"
                              : isUplink
                              ? "bg-sky-500/5 dark:bg-sky-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-850"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg font-mono text-xs font-bold ${
                              isLocked ? "bg-amber-500 text-white" : isUplink ? "bg-sky-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}>
                              {sat.code}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{sat.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {sat.orbitType} • {sat.altitudeKm}km
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {sat.region} • {sat.uplinkBand}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right font-mono text-[10px]">
                              <div className="text-slate-700 dark:text-slate-300 font-semibold">{sat.latencyMs}ms ping • {sat.signalStrength}% sync</div>
                              <div className="text-slate-400">{sat.activeRelays} active carrier streams</div>
                            </div>

                            <button
                              onClick={() => handleToggleLockSatellite(sat.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isLocked
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {isLocked ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Locked</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3 text-slate-400" />
                                  <span>Lock</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Neural WiFi 7 SpaceMesh Active</span>
                </div>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
                >
                  Close Telemetry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
