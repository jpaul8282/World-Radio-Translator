import React, { useState, useEffect, useMemo } from "react";
import { RadioStation, LocationGeoProfile } from "../types";
import { Radio, Play, Volume2, ShieldAlert, BadgeCheck, Search, X, Star } from "lucide-react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";

interface StationListProps {
  currentCountryProfile: LocationGeoProfile | null;
  onSelectStation: (station: RadioStation) => void;
  activeStation: RadioStation | null;
  isPlaying: boolean;
  isProfileLoading?: boolean;
  onStationsLoaded?: (stations: RadioStation[]) => void;
}

export default function StationList({
  currentCountryProfile,
  onSelectStation,
  activeStation,
  isPlaying,
  isProfileLoading = false,
  onStationsLoaded,
}: StationListProps) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Starred / Favorited stations state persisted in localStorage
  const [starredUuids, setStarredUuids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("starred_radio_stations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedStarredStations, setSavedStarredStations] = useState<RadioStation[]>(() => {
    try {
      const saved = localStorage.getItem("starred_radio_stations_data");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (e: React.MouseEvent, station: RadioStation) => {
    e.stopPropagation();
    const isStarred = starredUuids.includes(station.stationuuid);

    const nextUuids = isStarred
      ? starredUuids.filter((id) => id !== station.stationuuid)
      : [...starredUuids, station.stationuuid];

    const existsInSaved = savedStarredStations.some((s) => s.stationuuid === station.stationuuid);
    const nextSaved = isStarred
      ? savedStarredStations.filter((s) => s.stationuuid !== station.stationuuid)
      : existsInSaved
      ? savedStarredStations
      : [...savedStarredStations, station];

    setStarredUuids(nextUuids);
    setSavedStarredStations(nextSaved);

    try {
      localStorage.setItem("starred_radio_stations", JSON.stringify(nextUuids));
      localStorage.setItem("starred_radio_stations_data", JSON.stringify(nextSaved));
    } catch (err) {
      console.warn("Failed to persist favorites to localStorage", err);
    }

    // Optional sync to Firestore user_favorites
    const user = auth.currentUser;
    if (user) {
      const favoriteDocRef = doc(db, "user_favorites", `${user.uid}_${station.stationuuid}`);
      if (isStarred) {
        deleteDoc(favoriteDocRef).catch((err) => {
          handleFirestoreError(err, OperationType.DELETE, `user_favorites/${user.uid}_${station.stationuuid}`);
        });
      } else {
        setDoc(
          favoriteDocRef,
          {
            stationuuid: station.stationuuid,
            name: station.name || "Station",
            country: station.country || "",
            state: station.state || "",
            url_resolved: station.url_resolved || "",
            favicon: station.favicon || "",
            tags: station.tags || "",
            userId: user.uid,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `user_favorites/${user.uid}_${station.stationuuid}`);
        });
      }
    }
  };

  // Default Global Broadcast fallbacks if region is empty or has poor service
  const DEFAULT_GLOBAL_STATIONS: RadioStation[] = [
    {
      changeid: "glob-1",
      stationuuid: "global-bbc",
      name: "BBC World Service",
      url: "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
      url_resolved: "https://bbradio.gcdn.co/bbcworldservice", // High CORS/Certs stable address
      homepage: "https://bbc.co.uk",
      favicon: "https://www.bbc.co.uk/favicon.ico",
      tags: "news,talk,world,english",
      country: "United Kingdom",
      countrycode: "GB",
      state: "London",
      language: "english",
      votes: 12053,
      clickcount: 24520,
      codec: "MP3",
      bitrate: 128,
      geo_lat: 51.5074,
      geo_long: -0.1278
    },
    {
      changeid: "glob-2",
      stationuuid: "global-fip",
      name: "FIP Paris",
      url: "https://stream.radiofrance.fr/fip/fip.m3u8",
      url_resolved: "https://stream.radiofrance.fr/fip/fip_hifi.mp3",
      homepage: "https://fip.fr",
      favicon: "https://www.radiofrance.fr/favicon.ico",
      tags: "eclectic,jazz,rock,chanson,france",
      country: "France",
      countrycode: "FR",
      state: "Paris, Île-de-France",
      language: "french",
      votes: 9540,
      clickcount: 18451,
      codec: "MP3",
      bitrate: 192,
      geo_lat: 48.8566,
      geo_long: 2.3522
    },
    {
      changeid: "glob-3",
      stationuuid: "global-somafm",
      name: "SomaFM - Groove Salad",
      url: "https://somafm.com/groovesalad130.pls",
      url_resolved: "https://ice1.somafm.com/groovesalad-128-mp3",
      homepage: "https://somafm.com",
      favicon: "https://somafm.com/img3/groovesalad120.png",
      tags: "ambient,chillout,downtempo,groove",
      country: "United States",
      countrycode: "US",
      state: "San Francisco, California",
      language: "english",
      votes: 8450,
      clickcount: 14500,
      codec: "MP3",
      bitrate: 128,
      geo_lat: 37.7749,
      geo_long: -122.4194
    },
    {
      changeid: "glob-4",
      stationuuid: "global-kexp",
      name: "KEXP Seattle",
      url: "https://kexp-mp3-128.stream.publicradio.org/kexp-mp3-128",
      url_resolved: "https://kexp-mp3-128.stream.publicradio.org/kexp-mp3-128",
      homepage: "https://kexp.org",
      favicon: "https://www.kexp.org/static/images/favicon.ico",
      tags: "indie,alternative,rock,eclectic",
      country: "United States",
      countrycode: "US",
      state: "Seattle, Washington",
      language: "english",
      votes: 11200,
      clickcount: 16290,
      codec: "MP3",
      bitrate: 128,
      geo_lat: 47.6062,
      geo_long: -122.3321
    },
    {
      changeid: "glob-5",
      stationuuid: "global-ibiza",
      name: "Ibiza Global Radio",
      url: "https://ibizaglobalradio-com.ibizaglobalradio.com:8024/stream",
      url_resolved: "https://live.ibizaglobalradio.com/static/hifi.mp3",
      homepage: "https://ibizaglobalradio.com",
      favicon: "https://ibizaglobalradio.com/favicon.ico",
      tags: "electronic,deep house,tech house,dance",
      country: "Spain",
      countrycode: "ES",
      state: "Ibiza, Balearic Islands",
      language: "spanish",
      votes: 7520,
      clickcount: 13200,
      codec: "MP3",
      bitrate: 128,
      geo_lat: 38.9067,
      geo_long: 1.4206
    }
  ];

  useEffect(() => {
    if (onStationsLoaded) {
      onStationsLoaded(stations);
    }
  }, [stations, onStationsLoaded]);

  useEffect(() => {
    if (!currentCountryProfile) {
      // If no clicked region, display globally high-rated stations for entry experience
      setStations(DEFAULT_GLOBAL_STATIONS);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchQuery("");

    // Look up nearby region codes. If none specified, fallback to the single region code
    const rawCodes = currentCountryProfile?.countryCodes && currentCountryProfile.countryCodes.length > 0
      ? currentCountryProfile.countryCodes
      : [currentCountryProfile?.countryCode];

    const codesToQuery = (rawCodes || []).filter(
      (code): code is string => typeof code === "string" && code.trim().length > 0
    );

    // Query Radio-Browser API for all nearby territories concurrently
    const fetchPromises = codesToQuery.map(codeString => {
      const code = codeString.toLowerCase().trim();
      return fetch(`https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${code}?limit=30&hidebroken=true&order=clickcount&reverse=true`)
        .then((res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .catch(() => []);
    });

    Promise.all(fetchPromises)
      .then((resultsArray: RadioStation[][]) => {
        // Flatten list of stations
        let combinedStations: RadioStation[] = resultsArray.flat();

        // Filter out broken streams and handle duplicates
        const seenUuids = new Set<string>();
        combinedStations = combinedStations.filter((s) => {
          const mainUrl = s.url_resolved || s.url;
          if (!mainUrl || !mainUrl.startsWith("http")) return false;
          if (seenUuids.has(s.stationuuid)) return false;
          seenUuids.add(s.stationuuid);
          return true;
        });

        // Sort combined stations by clickcount/votes to keep high quality first
        combinedStations.sort((a, b) => (b.clickcount || b.votes || 0) - (a.clickcount || a.votes || 0));

        if (combinedStations.length === 0) {
          // Fall back to a general tag-matching query or region tag if the code count is 0
          fetch(`https://de1.api.radio-browser.info/json/stations/search?country=${encodeURIComponent(currentCountryProfile.country)}&limit=30&hidebroken=true&order=clickcount&reverse=true`)
            .then((fallRes) => fallRes.json())
            .then((fallData: RadioStation[]) => {
              const resFilter = fallData.filter((s) => {
                const mainUrl = s.url_resolved || s.url;
                return mainUrl && mainUrl.startsWith("http");
              });
              if (resFilter.length === 0) {
                // Return default global stations with a matching region header
                // and a few customized genre tags to maintain usability!
                setStations(DEFAULT_GLOBAL_STATIONS.map(s => ({
                  ...s,
                  state: "Regional Stream"
                })));
              } else {
                setStations(resFilter);
               }
              setLoading(false);
            })
            .catch(() => {
              setStations(DEFAULT_GLOBAL_STATIONS);
              setLoading(false);
            });
        } else {
          setStations(combinedStations.slice(0, 45)); // show top 45 high quality streams in vicinity
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Radio browser region lookup error, loading stable fallback", err);
        setStations(DEFAULT_GLOBAL_STATIONS);
        setLoading(false);
      });
  }, [currentCountryProfile]);

  // Base candidate stations list
  const baseStationsList = useMemo(() => {
    if (!showFavoritesOnly) return stations;
    // When viewing favorites only, combine active fetched stations and saved favorited stations
    const map = new Map<string, RadioStation>();
    savedStarredStations.forEach((s) => map.set(s.stationuuid, s));
    stations.forEach((s) => map.set(s.stationuuid, s));
    return Array.from(map.values()).filter((s) => starredUuids.includes(s.stationuuid));
  }, [stations, savedStarredStations, starredUuids, showFavoritesOnly]);

  // Filter stations based on search query or tag searches
  const filteredStations = baseStationsList.filter((station) => {
    const sQuery = searchQuery.trim().toLowerCase();
    const tQuery = tagQuery.trim().toLowerCase();
    
    const matchesKeyword = sQuery
      ? (station.name || '').toLowerCase().includes(sQuery) ||
        (station.country && String(station.country).toLowerCase().includes(sQuery)) ||
        (station.state && String(station.state).toLowerCase().includes(sQuery)) ||
        (station.tags && String(station.tags).toLowerCase().includes(sQuery))
      : true;

    const matchesTag = tQuery
      ? station.tags && String(station.tags).toLowerCase().includes(tQuery)
      : true;

    return matchesKeyword && matchesTag;
  });

  const isCurrentlyLoading = loading || isProfileLoading;

  return (
    <div className="flex flex-col h-full bg-transparent gap-4">
      
      {/* Search & Filter Header Panel */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
            {showFavoritesOnly ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Favorite Stations
              </span>
            ) : isCurrentlyLoading ? (
              "Scanning Regional Airwaves..."
            ) : currentCountryProfile ? (
              "Regional Radio Streams"
            ) : (
              "Featured Global Broadcasts"
            )}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-300 font-mono flex items-center gap-2">
            <span>
              {isCurrentlyLoading
                ? "Connecting to local frequencies..."
                : `${filteredStations.length} stations ${showFavoritesOnly ? "favorited" : "active"}`}
            </span>
            {tagQuery && (
              <button
                onClick={() => setTagQuery("")}
                className="cursor-pointer text-[9px] text-emerald-500 hover:text-emerald-600 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200/20 font-mono"
                title="Clear active tag filter"
              >
                filtered by #{tagQuery} (clear)
              </button>
            )}
          </p>
        </div>

        {/* Controls: Search Input & Favorites Toggle Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Favorites Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 text-xs rounded-xl font-semibold border flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
              showFavoritesOnly
                ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60"
            }`}
            title="Toggle Favorites Filter"
            id="btn_toggle_favorites_filter"
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-white text-white" : "text-amber-500 fill-amber-500/30"}`} />
            <span className="hidden sm:inline">Favorites</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              showFavoritesOnly ? "bg-amber-600 text-amber-100" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
            }`}>
              {starredUuids.length}
            </span>
          </button>

          {/* Real-time Search Input Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations or country..."
              id="input_station_search"
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isCurrentlyLoading ? (
        /* Bento Grid Skeleton Loaders */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-3 animate-pulse h-[135px]"
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded mt-auto" />
              <div className="flex justify-between items-center mt-2">
                <div className="h-2.5 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredStations.length > 0 ? (
        /* Bento Grid Stations Display */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStations.map((station) => {
            const isCurrent = activeStation?.stationuuid === station.stationuuid;
            const isStarred = starredUuids.includes(station.stationuuid);
            const tagsList = station.tags ? station.tags.split(",").slice(0, 3) : ["variety"];

            return (
              <div
                key={station.stationuuid}
                onClick={() => onSelectStation(station)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-[150px] relative cursor-pointer group bg-white dark:bg-slate-900 shadow-sm ${
                  isCurrent
                    ? "border-emerald-500 ring-1 ring-emerald-500/20"
                    : "border-slate-200/60 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow"
                }`}
                id={`station_card_${station.stationuuid}`}
                title={isCurrent && isPlaying ? `Now playing: ${station.name}` : `Tune into ${station.name}`}
              >
                {/* Station Upper Section */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
                    {station.favicon ? (
                      <img
                        src={station.favicon}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          // reveal background fallback
                          const sib = target.nextSibling as HTMLDivElement;
                          if (sib) sib.style.display = "flex";
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      style={{ display: station.favicon ? "none" : "flex" }}
                    >
                      <Radio className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden min-w-0">
                    <h4 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate flex items-center gap-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      {station.name}
                      {station.votes > 8000 && (
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-300 truncate block mt-0.5">
                      {station.state || station.country || "Regional Broadcast"}
                    </span>
                  </div>

                  {/* Favorite Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, station)}
                    className={`p-1.5 rounded-lg transition-all shrink-0 ${
                      isStarred
                        ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 shadow-xs"
                        : "text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={isStarred ? "Remove from favorites" : "Add to favorites"}
                    id={`btn_favorite_${station.stationuuid}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-500" : ""}`} />
                  </button>
                </div>

                {/* Tags lists */}
                <div className="flex flex-wrap gap-1 mt-2.5 h-6 overflow-hidden">
                  {tagsList.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagQuery(tag);
                      }}
                      className="text-[9px] font-mono hover:bg-slate-200 dark:hover:bg-slate-850 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded transition-colors"
                      title={`Filter list by tag #${tag.trim()}`}
                    >
                      #{tag.trim()}
                    </button>
                  ))}
                </div>

                {/* Station Footer Section */}
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50 pt-2 mt-2">
                  <div className="flex items-center gap-2.5 text-[9px] text-slate-400 dark:text-slate-300 font-mono uppercase tracking-wider">
                    <span>{station.codec || "MP3"}</span>
                    <span className="opacity-40">•</span>
                    <span>{station.bitrate ? `${station.bitrate}kbps` : "128k"}</span>
                  </div>

                  {/* Dynamic Play / Visualizer Trigger */}
                  <div className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-950 text-emerald-500 border border-slate-200/50 dark:border-slate-800 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    {isCurrent && isPlaying ? (
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Play className="w-3.5 h-3.5 translate-x-[0.5px]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Filter States */
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-center flex flex-col justify-center items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-700" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {showFavoritesOnly ? "No favorited radio stations found" : "No radio stations found matching filter"}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
            {showFavoritesOnly
              ? "Click the star icon on any station card to save it to your favorites for instant access."
              : "Try correcting your search spelling, clearing active tags, or click on a different region on the world map."}
          </p>
          {(searchQuery || tagQuery || showFavoritesOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setTagQuery("");
                setShowFavoritesOnly(false);
              }}
              className="mt-3 text-xs bg-emerald-500 text-white rounded-lg px-3 py-1.5 hover:bg-emerald-600 transition-colors shadow-sm"
              id="btn_reset_filters"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
