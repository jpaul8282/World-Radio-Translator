import React, { useState, useEffect, useRef } from "react";
import { Globe, Radio, Play, Volume2, MapPin, Eye, EyeOff, Flame, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocationGeoProfile, RadioStation } from "../types";

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

  const svgRef = useRef<SVGSVGElement>(null);

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

  // Compute heatmap nodes based on listener tuning activity (votes + clickcounts)
  const heatmapNodes = React.useMemo(() => {
    if (!stationPins || stationPins.length === 0) return [];
    return stationPins.map((pin) => {
      const votes = pin.station.votes || 0;
      const clicks = pin.station.clickcount || 0;
      // Derive tuning activity intensity
      const activityScore = Math.max(15, votes + clicks);
      
      // Radius scaled dynamically between 18px and 48px
      const radius = Math.min(50, Math.max(18, Math.sqrt(activityScore) * 1.5 + 10));
      
      // Select appropriate gradient tier
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

  return (
    <div className="flex flex-col w-full aspect-[700/340] max-w-5xl max-h-[360px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[490px] mx-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50">
      
      {/* Top Bar Map Controls & Station Counter Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>{stations.length} Station Pins</span>
          </div>

          {activeStation && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 dark:bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-md">
              <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="truncate max-w-[150px]">{activeStation.name}</span>
            </div>
          )}
        </div>

        {/* Action Controls: Heatmap Toggle & Show/Hide Pins */}
        <div className="flex items-center gap-2 pointer-events-auto">
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
            <span className="hidden sm:inline font-semibold">Activity Heatmap</span>
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
                <span className="hidden md:inline">Hide Pins</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">Show Pins</span>
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
    </div>
  );
}
