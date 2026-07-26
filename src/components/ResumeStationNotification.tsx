import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X, Radio, Bell, BellOff, Sparkles, RefreshCw } from "lucide-react";
import { RadioStation } from "../types";

interface ResumeStationNotificationProps {
  lastStation: RadioStation | null;
  lastPlayedTime: number | null;
  isPlaying: boolean;
  activeStation: RadioStation | null;
  onResume: (station: RadioStation) => void;
  darkMode: boolean;
}

export default function ResumeStationNotification({
  lastStation,
  lastPlayedTime,
  isPlaying,
  activeStation,
  onResume,
  darkMode,
}: ResumeStationNotificationProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [nativePermission, setNativePermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Calculate human readable time string
  const getTimeAgoString = (timestamp: number | null) => {
    if (!timestamp) return "from your previous session";
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Check if we should present notification on mount or when returning to tab after session break
  useEffect(() => {
    if (!lastStation) return;

    // Show banner if not currently playing the last station
    const isCurrentlyPlayingLastStation =
      isPlaying && activeStation?.stationuuid === lastStation.stationuuid;

    if (!isCurrentlyPlayingLastStation) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [lastStation, isPlaying, activeStation]);

  // Handle window visibilitychange (user returns to tab / app after tab switch or session disconnect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && lastStation) {
        const isCurrentlyPlayingLastStation =
          isPlaying && activeStation?.stationuuid === lastStation.stationuuid;

        if (!isCurrentlyPlayingLastStation) {
          setVisible(true);

          // If browser native notification permission granted, trigger OS level notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              const notif = new Notification("Resume Radio Stream?", {
                body: `Return to ${lastStation.name} (${lastStation.country || "Global"})? Click to resume streaming.`,
                icon: lastStation.favicon || "/favicon.ico",
                tag: "world-radio-resume",
              });
              notif.onclick = () => {
                window.focus();
                onResume(lastStation);
                setVisible(false);
                notif.close();
              };
            } catch (err) {
              console.warn("Native Notification trigger failed:", err);
            }
          }
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [lastStation, isPlaying, activeStation, onResume]);

  const requestNativeNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Browser notifications are not supported in your browser.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNativePermission(perm);
      if (perm === "granted" && lastStation) {
        new Notification("Radio Resume Reminders Active!", {
          body: `You will now receive automatic notifications to resume ${lastStation.name} when returning to the app.`,
          icon: lastStation.favicon || "/favicon.ico",
        });
      }
    } catch (e) {
      console.warn("Failed to request notification permission:", e);
    }
  };

  if (!lastStation || !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg"
          id="toast_resume_station_notification"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 dark:border-emerald-500/25 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-slate-800 dark:text-slate-100 relative overflow-hidden">
            {/* Left Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-600" />

            <div className="flex items-center gap-3 pl-1.5 min-w-0 flex-1">
              {/* Station Favicon or Radio Icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {lastStation.favicon ? (
                  <img
                    src={lastStation.favicon}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Radio className="w-5 h-5 text-emerald-500" />
                )}
              </div>

              {/* Station Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[9px] uppercase tracking-wider">
                    Session Disconnected
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono truncate">
                    {getTimeAgoString(lastPlayedTime)}
                  </span>
                </div>

                <h4 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 truncate mt-0.5">
                  Resume {lastStation.name}?
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                  {lastStation.state || lastStation.country || "Previous active stream"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Request Native Browser Notification Button */}
              {nativePermission !== "granted" && (
                <button
                  type="button"
                  onClick={requestNativeNotification}
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Enable native browser notifications when returning to app"
                  id="btn_enable_browser_notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}

              {/* Resume Button */}
              <button
                type="button"
                onClick={() => {
                  onResume(lastStation);
                  setVisible(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                id="btn_resume_last_station"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>

              {/* Close / Dismiss Button */}
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss reminder"
                id="btn_dismiss_resume_notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
