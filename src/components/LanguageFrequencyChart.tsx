import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Clock, Globe2, RefreshCw, Sparkles, Filter, Activity, Zap, Radio, Trophy, Crown, Award, ChevronRight } from 'lucide-react';
import { LanguageEncounterEvent, LanguageFrequencyData } from '../types';

interface LanguageFrequencyChartProps {
  events: LanguageEncounterEvent[];
  darkMode?: boolean;
  onSelectLanguage?: (lang: string) => void;
  onAddSampleEvent?: () => void;
  onClearEvents?: () => void;
}

// Color palette mapping for popular global languages
const LANGUAGE_COLORS: Record<string, string> = {
  Spanish: '#f59e0b', // Amber
  French: '#3b82f6', // Blue
  German: '#10b981', // Emerald
  English: '#8b5cf6', // Purple
  Arabic: '#ec4899', // Pink
  Japanese: '#ef4444', // Red
  Italian: '#06b6d4', // Cyan
  Portuguese: '#f97316', // Orange
  Russian: '#6366f1', // Indigo
  Chinese: '#dc2626', // Deep Red
  'Chinese (Simplified)': '#dc2626',
  Hindi: '#14b8a6', // Teal
  Dutch: '#f43f5e', // Rose
  Swedish: '#0284c7', // Sky Blue
  Polish: '#a855f7', // Violet
  Turkish: '#eab308', // Yellow
  Korean: '#d946ef', // Fuchsia
  Greek: '#0284c7', // Light Blue
  Swahili: '#84cc16', // Lime
  Ukrainian: '#38bdf8', // Sky
  Vietnamese: '#059669', // Emerald
};

const DEFAULT_BAR_COLOR = '#6366f1'; // Indigo fallback

export default function LanguageFrequencyChart({
  events,
  darkMode = false,
  onSelectLanguage,
  onAddSampleEvent,
  onClearEvents,
}: LanguageFrequencyChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [timeWindowMinutes, setTimeWindowMinutes] = useState<number>(60);
  const [hoveredData, setHoveredData] = useState<LanguageFrequencyData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string | null>(null);

  // Filter events by selected time window (default: last 60 minutes)
  const windowedEvents = useMemo(() => {
    const cutoff = Date.now() - timeWindowMinutes * 60 * 1000;
    return events.filter((e) => e.timestamp >= cutoff);
  }, [events, timeWindowMinutes]);

  // Aggregate frequency distribution data
  const frequencyData = useMemo(() => {
    const map = new Map<string, { count: number; lastSeen: number; stations: Set<string> }>();

    for (const evt of windowedEvents) {
      const lang = evt.language || 'Unknown';
      const current = map.get(lang) || { count: 0, lastSeen: 0, stations: new Set<string>() };
      current.count += 1;
      if (evt.timestamp > current.lastSeen) {
        current.lastSeen = evt.timestamp;
      }
      if (evt.stationName) {
        current.stations.add(evt.stationName);
      }
      map.set(lang, current);
    }

    const total = windowedEvents.length;
    const list: LanguageFrequencyData[] = Array.from(map.entries()).map(([language, meta]) => ({
      language,
      count: meta.count,
      percentage: total > 0 ? Math.round((meta.count / total) * 100) : 0,
      lastSeen: meta.lastSeen,
      stations: Array.from(meta.stations),
    }));

    // Sort descending by frequency count, then by lastSeen
    list.sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen);

    return list;
  }, [windowedEvents]);

  // Active languages displayed (filtered if user clicked a filter chip)
  const displayData = useMemo(() => {
    if (!selectedLanguageFilter) return frequencyData;
    return frequencyData.filter((d) => d.language.toLowerCase() === selectedLanguageFilter.toLowerCase());
  }, [frequencyData, selectedLanguageFilter]);

  // Calculate summary metrics
  const totalEncounters = windowedEvents.length;
  const uniqueLanguageCount = frequencyData.length;
  const topLanguage = frequencyData[0] || null;
  const top5Languages = useMemo(() => frequencyData.slice(0, 5), [frequencyData]);

  // Container width observation for responsive D3 scales
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || 600);
      }
    };
    updateWidth();
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Dimensions & D3 Scales Setup
  const containerHeight = 240;
  const margin = { top: 28, right: 20, bottom: 48, left: 40 };
  const width = Math.max(10, containerWidth - margin.left - margin.right);
  const height = Math.max(10, containerHeight - margin.top - margin.bottom);

  const xScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(displayData.map((d) => d.language))
      .range([0, width])
      .padding(0.32);
  }, [displayData, width]);

  const maxCount = useMemo(() => {
    return d3.max(displayData, (d: LanguageFrequencyData) => d.count) || 1;
  }, [displayData]);

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, Math.ceil(maxCount * 1.15)])
      .range([height, 0]);
  }, [maxCount, height]);

  const yAxisTicks = useMemo(() => yScale.ticks(4), [yScale]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col gap-4">
      {/* Chart Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                Broadcast Language Distribution
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Stream D3 Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Real-time frequency distribution of audio broadcast languages over the last hour
            </p>
          </div>
        </div>

        {/* Time Window Selector & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setTimeWindowMinutes(mins)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                  timeWindowMinutes === mins
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={`Show language frequency for the last ${mins} minutes`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {onAddSampleEvent && (
            <button
              onClick={onAddSampleEvent}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1"
              title="Simulate incoming radio broadcast signal language detection"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">+ Signal Event</span>
            </button>
          )}

          {onClearEvents && (
            <button
              onClick={onClearEvents}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              title="Clear window metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 uppercase tracking-wider font-bold">
            Total Broadcasts
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {totalEncounters}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">last {timeWindowMinutes}m</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 uppercase tracking-wider font-bold">
            Language Diversity
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {uniqueLanguageCount}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">unique tongues</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 uppercase tracking-wider font-bold">
            Top Broadcast Language
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 truncate max-w-[110px]">
              {topLanguage ? topLanguage.language : 'None'}
            </span>
            {topLanguage && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                {topLanguage.percentage}%
              </span>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 uppercase tracking-wider font-bold">
            Most Active Station
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
              {topLanguage && topLanguage.stations[0] ? topLanguage.stations[0] : 'Global Airwaves'}
            </span>
            <Radio className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Filter Language Quick Chips */}
      {frequencyData.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 uppercase font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setSelectedLanguageFilter(null)}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedLanguageFilter === null
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({frequencyData.length})
          </button>
          {frequencyData.slice(0, 8).map((d) => (
            <button
              key={d.language}
              onClick={() => setSelectedLanguageFilter(selectedLanguageFilter === d.language ? null : d.language)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedLanguageFilter === d.language
                  ? 'bg-indigo-600 text-white shadow-2sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: LANGUAGE_COLORS[d.language] || DEFAULT_BAR_COLOR }}
              />
              <span>{d.language}</span>
              <span className="text-[10px] font-mono opacity-80">({d.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* D3 SVG Container with Framer Motion Animated Bars */}
      <div ref={containerRef} className="relative w-full min-h-[240px] flex items-center justify-center">
        <svg
          ref={svgRef}
          width={containerWidth}
          height={containerHeight}
          viewBox={`0 0 ${containerWidth} ${containerHeight}`}
          className="w-full h-[240px] overflow-visible"
        >
          <defs>
            {displayData.map((d) => {
              const baseColor = LANGUAGE_COLORS[d.language] || DEFAULT_BAR_COLOR;
              const gradientId = `bar-gradient-${d.language.replace(/[^a-zA-Z0-9]/g, '-')}`;
              return (
                <linearGradient
                  key={gradientId}
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={baseColor} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={baseColor} stopOpacity={0.65} />
                </linearGradient>
              );
            })}
          </defs>

          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Empty State */}
            {displayData.length === 0 && (
              <text
                x={width / 2}
                y={height / 2}
                textAnchor="middle"
                fill={darkMode ? '#94a3b8' : '#64748b'}
                fontSize="13px"
                fontWeight="500"
              >
                No broadcast language audio detected in this time window
              </text>
            )}

            {/* Gridlines */}
            {displayData.length > 0 &&
              yAxisTicks.map((tick) => (
                <line
                  key={`grid-${tick}`}
                  x1={0}
                  x2={width}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                  strokeDasharray="3,3"
                />
              ))}

            {/* Y-Axis Tick Labels */}
            {displayData.length > 0 &&
              yAxisTicks.map((tick) => (
                <text
                  key={`ytick-${tick}`}
                  x={-8}
                  y={yScale(tick) + 3}
                  textAnchor="end"
                  fill={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize="10px"
                  fontFamily="var(--font-mono)"
                >
                  {tick}
                </text>
              ))}

            {/* X-Axis Domain Line */}
            {displayData.length > 0 && (
              <line
                x1={0}
                x2={width}
                y1={height}
                y2={height}
                stroke={darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
              />
            )}

            {/* X-Axis Language Labels */}
            {displayData.map((d) => {
              const x = (xScale(d.language) || 0) + xScale.bandwidth() / 2;
              const isRotated = displayData.length > 7;
              return (
                <text
                  key={`xtick-${d.language}`}
                  x={x}
                  y={height + 18}
                  textAnchor={isRotated ? 'end' : 'middle'}
                  fill={darkMode ? '#cbd5e1' : '#475569'}
                  fontSize="11px"
                  fontWeight="600"
                  transform={isRotated ? `rotate(-30, ${x}, ${height + 18})` : undefined}
                >
                  {d.language}
                </text>
              );
            })}

            {/* Animated Bars with Framer Motion Entry & Exit */}
            <AnimatePresence mode="sync">
              {displayData.map((d) => {
                const x = xScale(d.language) || 0;
                const barWidth = xScale.bandwidth();
                const targetY = yScale(d.count);
                const targetHeight = Math.max(2, height - targetY);
                const gradientId = `bar-gradient-${d.language.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const isHovered = hoveredData?.language === d.language;

                return (
                  <motion.g
                    key={d.language}
                    layout
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0, transition: { duration: 0.25 } }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    style={{ transformOrigin: `${x + barWidth / 2}px ${height}px` }}
                  >
                    <motion.rect
                      x={x}
                      width={barWidth}
                      initial={{ y: height, height: 0 }}
                      animate={{
                        y: targetY,
                        height: targetHeight,
                      }}
                      exit={{
                        y: height,
                        height: 0,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      rx={6}
                      ry={6}
                      fill={`url(#${gradientId})`}
                      stroke={isHovered ? (darkMode ? '#ffffff' : '#0f172a') : 'none'}
                      strokeWidth={isHovered ? 2 : 0}
                      opacity={isHovered ? 1 : 0.9}
                      className="cursor-pointer transition-opacity"
                      onMouseEnter={(event) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top - 12,
                          });
                        }
                        setHoveredData(d);
                      }}
                      onMouseMove={(event) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top - 12,
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredData(null);
                        setTooltipPos(null);
                      }}
                      onClick={() => {
                        if (onSelectLanguage && d) {
                          onSelectLanguage(d.language);
                        }
                      }}
                    />

                    {/* Bar Value Count Label */}
                    <motion.text
                      x={x + barWidth / 2}
                      initial={{ y: height, opacity: 0 }}
                      animate={{
                        y: Math.max(12, targetY - 6),
                        opacity: 1,
                      }}
                      exit={{
                        y: height,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      textAnchor="middle"
                      fill={darkMode ? '#e2e8f0' : '#1e293b'}
                      fontSize="11px"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                      className="pointer-events-none"
                    >
                      {d.count}
                    </motion.text>
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </g>
        </svg>

        {/* Floating D3 Tooltip Card */}
        {hoveredData && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute pointer-events-none z-30 p-3 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-xl border border-slate-700/60 text-xs backdrop-blur-md flex flex-col gap-1.5 min-w-[180px]"
            style={{
              left: `${Math.min(Math.max(10, tooltipPos.x - 90), (containerRef.current?.clientWidth || 400) - 190)}px`,
              top: `${Math.max(0, tooltipPos.y - 110)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: LANGUAGE_COLORS[hoveredData.language] || DEFAULT_BAR_COLOR }}
                />
                <span className="font-bold text-sm text-slate-100">{hoveredData.language}</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40">
                {hoveredData.percentage}% share
              </span>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-slate-300 font-sans pt-0.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Encounters:</span>
                <span className="font-mono font-bold text-slate-100">{hoveredData.count} times</span>
              </div>
              {hoveredData.stations.length > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 flex-shrink-0">Station:</span>
                  <span className="font-medium text-slate-200 truncate max-w-[120px]">
                    {hoveredData.stations[0]}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1 mt-0.5">
                <span>Last detected:</span>
                <span>
                  {Math.max(0, Math.round((Date.now() - hoveredData.lastSeen) / 60000))} mins ago
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Top 5 Languages Leaderboard Card */}
      <div className="mt-1 p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                Top 5 Languages Leaderboard
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Ranked by real-time audio broadcast encounters ({timeWindowMinutes}m window)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-200/50 dark:bg-slate-800">
            {top5Languages.length} Active Ranked
          </span>
        </div>

        {top5Languages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3 font-sans">
            No broadcast signals recorded yet in this time window.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {top5Languages.map((lang, rankIdx) => {
              const rank = rankIdx + 1;
              const isSelected = selectedLanguageFilter?.toLowerCase() === lang.language.toLowerCase();
              const langColor = LANGUAGE_COLORS[lang.language] || DEFAULT_BAR_COLOR;

              const rankBadgeClass =
                rank === 1
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black'
                  : rank === 2
                  ? 'bg-slate-300/40 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border-slate-400/40 font-bold'
                  : rank === 3
                  ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold';

              return (
                <div
                  key={lang.language}
                  onClick={() => {
                    if (onSelectLanguage) onSelectLanguage(lang.language);
                    setSelectedLanguageFilter(selectedLanguageFilter === lang.language ? null : lang.language);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-2sm'
                  }`}
                  title={`Click to filter dashboard by ${lang.language}`}
                >
                  {/* Top Bar: Rank Badge + Share */}
                  <div className="flex items-center justify-between gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border flex items-center gap-1 ${rankBadgeClass}`}>
                      {rank === 1 && <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                      #{rank}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {lang.percentage}%
                    </span>
                  </div>

                  {/* Language Title & Dot */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: langColor }} />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {lang.language}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 truncate pl-3">
                      {lang.count} encounter{lang.count > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(8, lang.percentage)}%`,
                        backgroundColor: langColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
