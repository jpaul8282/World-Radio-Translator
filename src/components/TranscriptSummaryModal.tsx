import React, { useState } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Radio,
  Clock,
  ListFilter,
  AlertCircle,
  FileText,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TranscriptSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  turnsCount: number;
  windowMinutes: number;
  stationName: string;
  targetLanguage: string;
  isFallback?: boolean;
  onEmailViaGmail?: () => void;
}

export const TranscriptSummaryModal: React.FC<TranscriptSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading,
  error,
  onRefresh,
  turnsCount,
  windowMinutes,
  stationName,
  targetLanguage,
  isFallback = false,
  onEmailViaGmail,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([
      `=== BROADCAST TRANSCRIPT SUMMARY ===\n` +
      `Station: ${stationName}\n` +
      `Window: Last ${windowMinutes} Minutes\n` +
      `Analyzed Turns: ${turnsCount}\n` +
      `Language: ${targetLanguage}\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `\n${summary}\n`
    ], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Broadcast_Summary_${stationName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple clean markdown-like line parser for pleasant rendering
  const renderFormattedSummary = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2.5" />;
      }

      // Headers (### or ## or **)
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-3.5 mb-1.5 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-slate-850 dark:text-slate-100 mt-4 mb-2">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
            {trimmed.replace(/^#\s*/, "")}
          </h2>
        );
      }

      // Bullet points
      if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const bulletText = trimmed.replace(/^[•\-\*]\s*/, "");
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 my-1 leading-relaxed pl-1">
            <span className="text-emerald-500 font-bold select-none">•</span>
            <span>{renderInlineFormatting(bulletText)}</span>
          </div>
        );
      }

      // Numbered list items
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          return (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 my-1 leading-relaxed pl-1">
              <span className="text-emerald-500 font-bold font-mono text-[11px] select-none">{match[1]}.</span>
              <span>{renderInlineFormatting(match[2])}</span>
            </div>
          );
        }
      }

      // Standard paragraph
      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  // Helper for bold **text** inline rendering
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    Broadcast Intelligence Summary
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isFallback ? "Local Summary" : "Gemini 3.8 Flash"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{stationName}</span>
                  <span>•</span>
                  <span>Last {windowMinutes} minutes</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Window: <strong>{windowMinutes} min</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ListFilter className="w-3 h-3 text-emerald-500" />
                <span>Analyzed Turns: <strong>{turnsCount}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-500" />
                <span>Language: <strong>{targetLanguage}</strong></span>
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              title="Re-run summary with the latest broadcast turns"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>Update with latest audio</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    Synthesizing Broadcast Intelligence...
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Processing the last {windowMinutes} minutes of audio transcript turns on {stationName} with Gemini 3.8 Flash.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 font-mono">
                    Summarization Error
                  </h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={onRefresh}
                    className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Generation
                  </button>
                </div>
              </div>
            ) : summary ? (
              <div className="bg-slate-50/70 dark:bg-slate-950/40 rounded-xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800/80">
                {renderFormattedSummary(summary)}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                No summary available. Click "Update with latest audio" to generate.
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!summary || isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5 shadow-2sm disabled:opacity-50 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                disabled={!summary || isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5 shadow-2sm disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download TXT</span>
              </button>

              {onEmailViaGmail && (
                <button
                  type="button"
                  id="btn_summary_email_gmail"
                  onClick={() => {
                    onClose();
                    onEmailViaGmail();
                  }}
                  disabled={!summary || isLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 shadow-2sm disabled:opacity-50 cursor-pointer"
                  title="Email this summary and broadcast transcript via Gmail"
                >
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  <span>Email via Gmail</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
