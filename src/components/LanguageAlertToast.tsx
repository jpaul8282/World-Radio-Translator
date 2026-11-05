import React, { useEffect, useState } from "react";
import { Radio, Volume2, X, Check, BellRing, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LanguageAlertTrigger, LanguageAlertRule } from "../types";

interface LanguageAlertToastProps {
  triggers: LanguageAlertTrigger[];
  rules: LanguageAlertRule[];
  onDismiss: (triggerId: string) => void;
  onTuneIn: (trigger: LanguageAlertTrigger) => void;
  onMuteRule: (ruleId: string) => void;
}

export const LanguageAlertToast: React.FC<LanguageAlertToastProps> = ({
  triggers,
  rules,
  onDismiss,
  onTuneIn,
  onMuteRule,
}) => {
  // Only display the 3 most recent active toasts to avoid clutter
  const activeTriggers = triggers.slice(0, 3);

  return (
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Language Detection Alerts"
    >
      <AnimatePresence>
        {activeTriggers.map((trigger) => (
          <ToastCard
            key={trigger.id}
            trigger={trigger}
            rules={rules}
            onDismiss={onDismiss}
            onTuneIn={onTuneIn}
            onMuteRule={onMuteRule}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastCardProps {
  trigger: LanguageAlertTrigger;
  rules: LanguageAlertRule[];
  onDismiss: (triggerId: string) => void;
  onTuneIn: (trigger: LanguageAlertTrigger) => void;
  onMuteRule: (ruleId: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  trigger,
  rules,
  onDismiss,
  onTuneIn,
  onMuteRule,
}) => {
  const [progress, setProgress] = useState(100);
  const matchedRule = rules.find((r) => r.id === trigger.ruleId);
  const durationMs = 10000; // 10 second auto-dismiss

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(trigger.id);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [trigger.id, onDismiss]);

  const confidencePct = Math.round(trigger.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/80 dark:from-slate-950/95 dark:via-slate-900/95 dark:to-amber-950/90 text-white shadow-2xl backdrop-blur-md p-4"
    >
      {/* Auto-dismiss progress bar */}
      <div
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                Language Detected
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40">
                {trigger.language}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white tracking-tight mt-0.5 line-clamp-1">
              {trigger.stationName}
            </h4>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
              <span>{trigger.stationCountry || "Airwaves Broadcast"}</span>
              <span>•</span>
              <span className="text-amber-300 font-mono text-[11px] font-semibold">
                {confidencePct}% Match
              </span>
              {trigger.source === "background_scanner" && (
                <>
                  <span>•</span>
                  <span className="text-[10px] text-teal-400 font-medium">Background Scanner</span>
                </>
              )}
            </div>

            {trigger.snippet && (
              <p className="text-[11px] text-slate-300 italic mt-1 line-clamp-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                "{trigger.snippet}"
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onDismiss(trigger.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
        <button
          onClick={() => onTuneIn(trigger)}
          className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Tune In & Translate</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        {matchedRule && (
          <button
            onClick={() => onMuteRule(matchedRule.id)}
            title="Mute this language alert rule"
            className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Mute
          </button>
        )}
      </div>
    </motion.div>
  );
};
