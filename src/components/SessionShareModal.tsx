import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Radio,
  Globe,
  Languages,
  Compass,
  Headphones,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RadioStation } from "../types";
import { SessionShareActiveFilters, formatSessionShareInvitation } from "../lib/sessionShare";

interface SessionShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  station: RadioStation | null;
  targetLanguage: string;
  filters: SessionShareActiveFilters;
}

export const SessionShareModal: React.FC<SessionShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  station,
  targetLanguage,
  filters,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  const invitationMessage = formatSessionShareInvitation(
    {
      station,
      targetLanguage,
      filters,
      autoPlay: true,
    },
    shareUrl
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(invitationMessage).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2200);
    });
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Listen & Translate Live: ${station?.name || "World Radio"}`,
          text: invitationMessage,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Native share failed, copying link instead:", err);
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8"
          id="modal-share-full-session"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Share Live Session</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Deep Link Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invite friends and collaborators to listen and translate simultaneously
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
              id="btn-close-share-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Session Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Active Broadcast
                    </span>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {station?.name || "Global Radio Broadcast"}
                    </h4>
                  </div>
                </div>
                {station?.country && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {station.country}
                  </span>
                )}
              </div>

              {/* Grid of shared configuration details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Languages className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-400">Target:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {targetLanguage}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-400">Scan Radius:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {filters.radiusKm || 500} km
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-400">Section:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                    {filters.tab || "Radio Airwaves"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Headphones className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-400">Auto-Tune:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Deep Link URL Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Deep Link URL</span>
                <span className="text-[11px] text-slate-400 font-normal">Direct join link</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 select-all focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  id="input-session-share-url"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                    copiedLink
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                  id="btn-copy-share-url"
                >
                  {copiedLink ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Formatted Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Invitation Message Preview
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  id="btn-copy-share-message"
                >
                  {copiedMessage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? "Copied Message!" : "Copy Full Message"}</span>
                </button>
              </div>
              <pre className="p-3 text-[11px] font-sans leading-relaxed bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                {invitationMessage}
              </pre>
            </div>

            {/* Explanatory Callout */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                When recipients open this link, the application will automatically tune into{" "}
                <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                  {station?.name || "this broadcast"}
                </strong>
                , set their real-time Gemini interpreter to translate into{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {targetLanguage}
                </strong>
                , and apply your active geographical scanner filters.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              id="btn-cancel-share-modal"
            >
              Close
            </button>

            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                id="btn-device-share"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via Device</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              id="btn-primary-copy-link"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
