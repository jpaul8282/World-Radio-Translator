import React, { useState, useMemo } from "react";
import { LivePodcastShow, RadioStation, PodcastCategory, PodcastShowInsights } from "../types";
import {
  CURATED_PODCAST_SHOWS,
  PODCAST_CATEGORIES,
  SUPPORTED_PODCAST_LANGUAGES,
  podcastToStation,
  filterPodcastShows,
} from "../lib/podcastDirectory";
import {
  Mic,
  Play,
  Volume2,
  Search,
  X,
  Star,
  Sparkles,
  Share2,
  Check,
  RefreshCw,
  Info,
  Radio,
  Globe2,
  ExternalLink,
  MessageSquare,
  Compass,
} from "lucide-react";

interface LivePodcastShowsProps {
  onSelectPodcast: (station: RadioStation) => void;
  activeStation: RadioStation | null;
  isPlaying: boolean;
  onTriggerTranslation?: () => void;
  liveTargetLang: string;
}

export default function LivePodcastShows({
  onSelectPodcast,
  activeStation,
  isPlaying,
  onTriggerTranslation,
  liveTargetLang,
}: LivePodcastShowsProps) {
  const [shows, setShows] = useState<LivePodcastShow[]>(CURATED_PODCAST_SHOWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PodcastCategory>("All Categories");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All Languages");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isDiscoveringOnline, setIsDiscoveringOnline] = useState(false);
  const [onlineLoaded, setOnlineLoaded] = useState(false);

  // Starred / Favorite podcast shows persisted to localStorage
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("starred_podcast_shows");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal state for Gemini AI Show Insights
  const [selectedInsightsShow, setSelectedInsightsShow] = useState<LivePodcastShow | null>(null);
  const [insightsData, setInsightsData] = useState<PodcastShowInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sharedShowId, setSharedShowId] = useState<string | null>(null);

  const toggleFavorite = (e: React.MouseEvent, show: LivePodcastShow) => {
    e.stopPropagation();
    const isStarred = starredIds.includes(show.id);
    const nextStarred = isStarred
      ? starredIds.filter((id) => id !== show.id)
      : [...starredIds, show.id];

    setStarredIds(nextStarred);
    try {
      localStorage.setItem("starred_podcast_shows", JSON.stringify(nextStarred));
    } catch (err) {
      console.warn("Failed to persist starred podcasts to localStorage", err);
    }
  };

  const handleShareShow = async (e: React.MouseEvent, show: LivePodcastShow) => {
    e.stopPropagation();
    const shareText = `Listening to live podcast show "${show.showName}" (${show.network}) with real-time translation on World Radio Translator!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: show.showName,
          text: shareText,
          url: shareUrl,
        });
        setSharedShowId(show.id);
        setTimeout(() => setSharedShowId(null), 2500);
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setSharedShowId(show.id);
      setTimeout(() => setSharedShowId(null), 2500);
    } catch (err) {
      console.warn("Clipboard copy failed", err);
    }
  };

  // Fetch online podcast extensions from server
  const handleDiscoverOnline = async () => {
    setIsDiscoveringOnline(true);
    try {
      const res = await fetch("/api/podcasts?includeOnline=true");
      if (res.ok) {
        const data = await res.json();
        if (data.shows && Array.isArray(data.shows)) {
          setShows(data.shows);
          setOnlineLoaded(true);
        }
      }
    } catch (err) {
      console.warn("Failed to discover online podcast extensions:", err);
    } finally {
      setIsDiscoveringOnline(false);
    }
  };

  // Fetch Gemini AI Show Insights
  const handleOpenShowInsights = async (e: React.MouseEvent, show: LivePodcastShow) => {
    e.stopPropagation();
    setSelectedInsightsShow(show);
    setLoadingInsights(true);
    setInsightsData(null);

    try {
      const res = await fetch("/api/podcast-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showName: show.showName,
          network: show.network,
          category: show.category,
          topic: show.episodeOrTopic,
          language: show.language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsightsData(data);
      } else {
        throw new Error("Insights request failed");
      }
    } catch (err) {
      console.warn("Failed to load podcast show insights:", err);
      // Fallback
      setInsightsData({
        showName: show.showName,
        network: show.network,
        executiveSummary: `"${show.showName}" is a continuous spoken talk broadcast featuring investigative analysis and cultural dialogue.`,
        coreThemes: ["Investigative reporting", "Contemporary culture", "In-depth interviews"],
        hostBio: `Presented by ${show.host || show.network} with international correspondents.`,
        currentEpisodeAnalysis: `Current session: "${show.episodeOrTopic}". Spoken content optimized for real-time speech translation.`,
        suggestedDiscussionPoints: [
          "How does this regional talk perspective compare to global news?",
          "What cultural idioms are most prominent in this broadcast?",
        ],
        targetLanguageAdvice: `Listen for specialized terminology when translating from ${show.language}.`,
        source: "resilient-curator-fallback",
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Filtered shows calculation
  const filteredShows = useMemo(() => {
    let result = filterPodcastShows(shows, searchQuery, selectedCategory, selectedLanguage);
    if (showFavoritesOnly) {
      result = result.filter((s) => starredIds.includes(s.id));
    }
    return result;
  }, [shows, searchQuery, selectedCategory, selectedLanguage, showFavoritesOnly, starredIds]);

  const handleTuneIn = (show: LivePodcastShow) => {
    const station = podcastToStation(show);
    onSelectPodcast(station);
    if (onTriggerTranslation) {
      onTriggerTranslation();
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner / Hero Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 dark:border-emerald-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25 shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                Live Podcast Shows & Spoken Relays
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Speech-Optimized
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
              Stream continuous 24/7 spoken podcast programs, investigative documentaries, and intellectual debates from around the world. Spoken audio is interpreted in real time by Gemini 3.5 into {liveTargetLang}.
            </p>
          </div>
        </div>

        {/* Discovery & Stats action pill */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleDiscoverOnline}
            disabled={isDiscoveringOnline}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            id="btn_discover_online_podcasts"
            title="Scan Radio Browser for additional live community podcast streams"
          >
            <Compass className={`w-3.5 h-3.5 text-emerald-500 ${isDiscoveringOnline ? "animate-spin" : ""}`} />
            <span>{isDiscoveringOnline ? "Scanning Web..." : onlineLoaded ? "Online Relays Loaded" : "Discover More Online"}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Search, Language selector, and Favorites toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shows, topics, networks (BBC, NPR, France Culture), hosts, or keywords..."
              id="input_podcast_search"
              className="w-full pl-8 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Language filter dropdown */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                id="select_podcast_language"
              >
                {SUPPORTED_PODCAST_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Favorites filter toggle */}
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold border flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                showFavoritesOnly
                  ? "bg-amber-500 text-white border-amber-600"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-amber-400"
              }`}
              id="btn_toggle_podcast_favorites"
              title="Show favorite podcast shows only"
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-white text-white" : "text-amber-500 fill-amber-500/30"}`} />
              <span className="hidden sm:inline">Favorites</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                showFavoritesOnly ? "bg-amber-600 text-amber-100" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              }`}>
                {starredIds.length}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Category filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {PODCAST_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
                }`}
                id={`btn_podcast_cat_${cat.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shows Grid */}
      {filteredShows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredShows.map((show) => {
            const isCurrent = activeStation?.stationuuid === show.stationuuid;
            const isStarred = starredIds.includes(show.id);

            return (
              <div
                key={show.id}
                onClick={() => handleTuneIn(show)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative cursor-pointer group bg-white dark:bg-slate-900 shadow-xs ${
                  isCurrent
                    ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/20 dark:bg-emerald-950/20"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                }`}
                id={`podcast_card_${show.id}`}
              >
                {/* Header: Network, LIVE status, Favorite */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-800">
                      {show.favicon ? (
                        <img
                          src={show.favicon}
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const sib = target.nextSibling as HTMLDivElement;
                            if (sib) sib.style.display = "flex";
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        style={{ display: show.favicon ? "none" : "flex" }}
                      >
                        <Mic className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="overflow-hidden min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 block truncate">
                        {show.network}
                      </span>
                      <h4 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                        {show.showName}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, show)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isStarred
                          ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40"
                          : "text-slate-300 dark:text-slate-600 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title={isStarred ? "Remove from favorite podcasts" : "Add to favorite podcasts"}
                      id={`btn_fav_pod_${show.id}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-500" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShareShow(e, show)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title="Share podcast show"
                      id={`btn_share_pod_${show.id}`}
                    >
                      {sharedShowId === show.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Episode / Current Discussion Topic Preview */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-slate-400 mb-1">
                    <span className="uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                      CURRENT DISCUSSION
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-rose-500 font-bold">LIVE RELAY</span>
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {show.episodeOrTopic}
                  </p>
                  {show.host && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Hosted by <strong className="font-semibold text-slate-600 dark:text-slate-300">{show.host}</strong>
                    </p>
                  )}
                </div>

                {/* Badges & Tags */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/20">
                    {show.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                    {show.language}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                    {show.country}
                  </span>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-3">
                  {/* AI Show Guide trigger */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenShowInsights(e, show)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    title="View Gemini AI analysis & educational show notes"
                    id={`btn_insights_${show.id}`}
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>AI Show Guide</span>
                  </button>

                  {/* Primary Tune In Action */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 hidden sm:inline">
                      {isCurrent && isPlaying ? "Playing Live" : "Click to Stream"}
                    </span>
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isCurrent && isPlaying
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white"
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 translate-x-[0.5px]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
          <Mic className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
            {showFavoritesOnly ? "No Favorite Podcast Shows Found" : "No Podcast Shows Found Matching Filters"}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
            {showFavoritesOnly
              ? "Click the star icon on any podcast card to add it to your favorites for instant access."
              : "Try clearing search keywords, adjusting the category, or click 'Discover More Online'."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All Categories");
              setSelectedLanguage("All Languages");
              setShowFavoritesOnly(false);
            }}
            className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-3.5 py-1.5 transition-colors shadow-xs cursor-pointer"
            id="btn_reset_podcast_filters"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* AI Show Guide Modal Dialog */}
      {selectedInsightsShow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedInsightsShow(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar p-5 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
            id="modal_podcast_insights"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{selectedInsightsShow.showName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[9px]">
                      AI Guide
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedInsightsShow.network} • {selectedInsightsShow.country}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInsightsShow(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                id="btn_close_podcast_insights_modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            {loadingInsights ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center">
                <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Synthesizing Broadcast Factsheet with Gemini...
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Generating verified educational insights, host bio, and translation tips.
                </p>
              </div>
            ) : insightsData ? (
              <div className="flex flex-col gap-4 text-xs">
                {/* Executive Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                  <h4 className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    Executive Summary
                  </h4>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                    {insightsData.executiveSummary}
                  </p>
                </div>

                {/* Current Episode Analysis & Host Bio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <h5 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Current Broadcast Topic
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {insightsData.currentEpisodeAnalysis}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <h5 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Host & Editorial Approach
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {insightsData.hostBio}
                    </p>
                  </div>
                </div>

                {/* Core Themes */}
                {insightsData.coreThemes && insightsData.coreThemes.length > 0 && (
                  <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <h5 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Core Analytical Themes
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {insightsData.coreThemes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-medium"
                        >
                          • {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Discussion Points */}
                {insightsData.suggestedDiscussionPoints && insightsData.suggestedDiscussionPoints.length > 0 && (
                  <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <h5 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-amber-500" />
                      Key Questions Raised in this Show
                    </h5>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300">
                      {insightsData.suggestedDiscussionPoints.map((pt, i) => (
                        <li key={i} className="leading-relaxed">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Translation Advice */}
                {insightsData.targetLanguageAdvice && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-amber-700 dark:text-amber-300">
                      <Globe2 className="w-3 h-3" />
                      Speech Translation Tip
                    </h5>
                    <p className="leading-relaxed">{insightsData.targetLanguageAdvice}</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setSelectedInsightsShow(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
              >
                Close Factsheet
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedInsightsShow) {
                    handleTuneIn(selectedInsightsShow);
                    setSelectedInsightsShow(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                id="btn_tune_in_from_modal"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Tune In & Translate Show</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
