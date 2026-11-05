import React, { useState } from "react";
import {
  X,
  Bell,
  BellRing,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Languages,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  LanguageAlertRule,
  LanguageAlertTrigger,
  BackgroundScannerStatus,
  RadioStation,
} from "../types";
import { playRadioChime } from "../services/languageAlertService";

interface LanguageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: LanguageAlertRule[];
  onUpdateRules: (rules: LanguageAlertRule[]) => void;
  scannerStatus: BackgroundScannerStatus;
  onToggleScanner: (enabled: boolean) => void;
  onUpdateScannerInterval: (seconds: number) => void;
  onUpdateScannerMode: (mode: BackgroundScannerStatus["scanMode"]) => void;
  alertHistory: LanguageAlertTrigger[];
  onClearHistory: () => void;
  onTuneInStation: (stationuuid: string) => void;
  onTriggerTestAlert: (language: string) => void;
  supportedLanguages: string[];
}

export const LanguageAlertsModal: React.FC<LanguageAlertsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRules,
  scannerStatus,
  onToggleScanner,
  onUpdateScannerInterval,
  onUpdateScannerMode,
  alertHistory,
  onClearHistory,
  onTuneInStation,
  onTriggerTestAlert,
  supportedLanguages,
}) => {
  const [activeTab, setActiveTab] = useState<"rules" | "scanner" | "history">("rules");

  // New rule form state
  const [targetLang, setTargetLang] = useState<string>("Spanish");
  const [customLang, setCustomLang] = useState<string>("");
  const [ruleLabel, setRuleLabel] = useState<string>("");
  const [minConfidence, setMinConfidence] = useState<number>(0.65);
  const [notifyToast, setNotifyToast] = useState<boolean>(true);
  const [notifySound, setNotifySound] = useState<boolean>(true);
  const [autoTune, setAutoTune] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLang = targetLang === "custom" ? customLang.trim() : targetLang;
    if (!finalLang) return;

    const newRule: LanguageAlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetLanguage: finalLang,
      label: ruleLabel.trim() || `${finalLang} Airwaves Alert`,
      enabled: true,
      minConfidence,
      notifyToast,
      notifySound,
      autoTune,
      triggerCount: 0,
      createdAt: Date.now(),
    };

    onUpdateRules([...rules, newRule]);
    setRuleLabel("");
    setCustomLang("");
    setShowAddForm(false);
  };

  const handleToggleRule = (ruleId: string) => {
    onUpdateRules(
      rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    onUpdateRules(rules.filter((r) => r.id !== ruleId));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language_alerts_modal_title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="language_alerts_modal_title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Custom Language Alerts
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {rules.filter((r) => r.enabled).length} Active
                </span>
                {scannerStatus.isScanning && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Scanning
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive instant toast notifications when specific languages are detected on background airwaves
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "rules"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alert Rules ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Background Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Detection Log ({alertHistory.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: RULES */}
          {activeTab === "rules" && (
            <div className="space-y-5">
              {/* Top Action Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Monitored Languages
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Background scanner tests radio stations and triggers these alerts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playRadioChime();
                      onTriggerTestAlert(rules[0]?.targetLanguage || "Spanish");
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Simulate a language detection alert toast and sound"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Test Alert</span>
                  </button>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Alert</span>
                  </button>
                </div>
              </div>

              {/* Add New Rule Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateRule}
                    className="p-4 rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        Configure New Alert
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Target Language to Detect
                        </label>
                        <select
                          value={targetLang}
                          onChange={(e) => setTargetLang(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          {supportedLanguages.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                          <option value="custom">Other / Custom Language...</option>
                        </select>
                      </div>

                      {targetLang === "custom" ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Custom Language Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Catalan, Tagalog, Swahili..."
                            value={customLang}
                            onChange={(e) => setCustomLang(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Alert Label (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder={`e.g., My ${targetLang} Scanner`}
                            value={ruleLabel}
                            onChange={(e) => setRuleLabel(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Confidence Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Minimum Detection Confidence Threshold:
                        </span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {Math.round(minConfidence * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="0.95"
                        step="0.05"
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>50% (Catch more broadcasts)</span>
                        <span>95% (High certainty only)</span>
                      </div>
                    </div>

                    {/* Options Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyToast}
                          onChange={(e) => setNotifyToast(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Toast Banner
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySound}
                          onChange={(e) => setNotifySound(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Radio Chime
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoTune}
                          onChange={(e) => setAutoTune(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Auto Tune-In
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Save Alert Rule
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Rules List */}
              <div className="space-y-2.5">
                {rules.length === 0 ? (
                  <div className="text-center py-8 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                    <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No custom alerts configured. Click "Add Alert" to monitor a language.
                    </p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        rule.enabled
                          ? "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                          : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            rule.enabled
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}
                          title={rule.enabled ? "Disable alert" : "Enable alert"}
                        >
                          {rule.enabled ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <VolumeX className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {rule.label || rule.targetLanguage}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono">
                              {rule.targetLanguage}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span>Confidence ≥ {Math.round(rule.minConfidence * 100)}%</span>
                            <span>•</span>
                            <span>
                              {rule.notifyToast && "Toast"}
                              {rule.notifySound && " + Chime"}
                              {rule.autoTune && " + Auto-tune"}
                            </span>
                            {rule.triggerCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {rule.triggerCount} triggered
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            playRadioChime();
                            onTriggerTestAlert(rule.targetLanguage);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Test this alert"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete alert rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BACKGROUND SCANNER */}
          {activeTab === "scanner" && (
            <div className="space-y-6">
              {/* Master Scanner Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-amber-50/20 dark:from-slate-800/40 dark:to-amber-950/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-500" />
                    <span>Background Airwaves Scanner</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Periodically probes stations in the background and evaluates language detection against your rules
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleScanner(!scannerStatus.isScanning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                    scannerStatus.isScanning
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {scannerStatus.isScanning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Scanner</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Background Scan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scanner Status & Telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="text-sm font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {scannerStatus.isScanning ? "Active Scanning" : "Idle / Paused"}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Stations Probed
                  </span>
                  <span className="text-sm font-bold font-mono mt-0.5 block text-slate-800 dark:text-slate-200">
                    {scannerStatus.totalScannedCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Language Matches
                  </span>
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {scannerStatus.matchCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Scan Cadence
                  </span>
                  <span className="text-sm font-bold font-mono mt-0.5 block text-slate-800 dark:text-slate-200">
                    Every {scannerStatus.scanIntervalSeconds}s
                  </span>
                </div>
              </div>

              {scannerStatus.isScanning && scannerStatus.scannedStationName && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-semibold">Probing Station:</span>
                    <span className="font-bold underline">{scannerStatus.scannedStationName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300">
                    Index #{scannerStatus.currentStationIndex}
                  </span>
                </div>
              )}

              {/* Scanner Configuration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Scanning Cadence
                  </label>
                  <select
                    value={scannerStatus.scanIntervalSeconds}
                    onChange={(e) => onUpdateScannerInterval(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value={10}>Every 10 seconds (Fast)</option>
                    <option value={20}>Every 20 seconds (Balanced)</option>
                    <option value={30}>Every 30 seconds (Standard)</option>
                    <option value={60}>Every 60 seconds (Power Saver)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Scan Station Pool
                  </label>
                  <select
                    value={scannerStatus.scanMode}
                    onChange={(e) =>
                      onUpdateScannerMode(e.target.value as BackgroundScannerStatus["scanMode"])
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="filtered_list">Current Filtered Vicinity List</option>
                    <option value="global_random">Global Airwaves Random Sample</option>
                    <option value="favorites">Saved Favorite Stations Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALERT HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Detection Log
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recent airwaves triggers matching your custom language criteria
                  </p>
                </div>

                {alertHistory.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    Clear Log
                  </button>
                )}
              </div>

              {alertHistory.length === 0 ? (
                <div className="text-center py-8 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No language alert events recorded yet. Alerts will appear here when detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertHistory.map((trig) => (
                    <div
                      key={trig.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {trig.stationName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              {trig.language} ({Math.round(trig.confidence * 100)}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{new Date(trig.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{trig.stationCountry || "Airwaves"}</span>
                            <span>•</span>
                            <span className="capitalize">{trig.source.replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onTuneInStation(trig.stationuuid);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Tune In</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Rules saved in browser storage & synced to account</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
