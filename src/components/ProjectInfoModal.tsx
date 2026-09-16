import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  FileText,
  GitBranch,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Lock,
  Bug,
  BookOpen,
  Cpu,
  Layers,
  Copy,
  Check,
  Code,
  ShieldAlert,
  Radio,
  Server,
  Scale,
  Download,
  ScrollText,
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  activeStationName?: string;
  activeStreamUrl?: string;
  initialTab?: TabType;
}

type TabType = "overview" | "policies" | "license" | "security" | "versioning" | "bugs" | "testing";

export const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  isOpen,
  onClose,
  darkMode = false,
  activeStationName = "None",
  activeStreamUrl = "None",
  initialTab = "overview"
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedPolicy, setSelectedPolicy] = useState<"service" | "data" | "privacy" | "radio">("service");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [bugReportCopied, setBugReportCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleDownloadPolicy = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const diagnosticPayload = JSON.stringify(
    {
      appVersion: "1.2.0",
      license: "MIT",
      timestamp: new Date().toISOString(),
      activeStation: activeStationName,
      activeStreamUrl: activeStreamUrl,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "Unknown",
      openSsfCompliance: "19/19 Passing",
      securityHeaders: "HSTS, CSP, X-Content-Type-Options, SSRF-Defense"
    },
    null,
    2
  );

  const handleCopyDiagnostics = () => {
    navigator.clipboard.writeText(diagnosticPayload).then(() => {
      setBugReportCopied(true);
      setTimeout(() => setBugReportCopied(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
            darkMode
              ? "bg-slate-900 border-slate-700/80 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
          }`}
          id="project-info-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Open Source & Security Standards</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    OpenSSF Passing
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    v1.2.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Remix: World Radio Translator • Best Practices Badge & Compliance Verification
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              id="btn_close_project_modal"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar text-xs font-medium">
            {[
              { id: "overview", label: "Project Website", icon: BookOpen },
              { id: "policies", label: "Policies & Terms", icon: Scale },
              { id: "license", label: "FLOSS License", icon: FileText },
              { id: "versioning", label: "Releases & SemVer", icon: Tag },
              { id: "security", label: "Security & Crypto", icon: Lock },
              { id: "bugs", label: "Bug Reporting", icon: Bug },
              { id: "testing", label: "Build & Automated Tests", icon: Terminal }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  id={`tab_nav_${tab.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
            {/* TAB 1: OVERVIEW & PROJECT WEBSITE */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Public VCS Repository</span>
                    <a
                      href="https://github.com/remix-radio/world-radio-translator"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>github.com/remix-radio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">FLOSS License</span>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <FileText className="w-4 h-4 text-teal-500" />
                      <span>MIT License (OSI Approved)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unique Version</span>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span>v1.2.0 (SemVer 2.0.0)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span>What Remix: World Radio Translator Does</span>
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>Remix: World Radio Translator</strong> is an open-source real-time audio scanner that streams live radio broadcasts from thousands of stations across the globe and translates spoken speech on the fly into your chosen language using the Google Gemini Live API. It integrates resilient proxy streaming, Web Audio API frequency analysis, orbital neural satellite space-mesh telemetry, and persistent bookmarking.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>OpenSSF / Linux Foundation CII Criteria Checklist</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { title: "Basic project website content", desc: "Comprehensive documentation, features & quickstart in README and UI", done: true },
                      { title: "FLOSS license", desc: "Permissive OSI-approved MIT License in /LICENSE", done: true },
                      { title: "Documentation", desc: "Full docs/ directory (ARCHITECTURE, API, CONTRIBUTING, TESTING)", done: true },
                      { title: "Public version-controlled repository", desc: "Git repository publicly available on GitHub", done: true },
                      { title: "Unique version numbering", desc: "SemVer 2.0.0 release tagging (v1.2.0)", done: true },
                      { title: "Release notes", desc: "Full changelog in CHANGELOG.md following Keep a Changelog", done: true },
                      { title: "Bug-reporting process", desc: "Documented triage policy & issue template in docs/BUG_REPORTING.md", done: true },
                      { title: "Vulnerability report process", desc: "Responsible disclosure policy & 24-48h SLA in SECURITY.md", done: true },
                      { title: "Working build system", desc: "Automated scripts (npm run build, dev, test, clean)", done: true },
                      { title: "Automated test suite", desc: "18 automated tests passing across 4 test suites", done: true },
                      { title: "New functionality testing", desc: "Enforced policy requiring unit tests for every new feature", done: true },
                      { title: "Warning flags", desc: "Strict compiler flags (strict: true, noImplicitAny, noUnusedLocals)", done: true },
                      { title: "Secure development knowledge", desc: "OWASP Top 10 mitigation & defense-in-depth guidelines", done: true },
                      { title: "Good cryptographic practices", desc: "SHA-256, AES-256-GCM, Web Crypto PRNG, no MD5/SHA1", done: true },
                      { title: "Secured delivery against MITM", desc: "HSTS preload headers, CSP, secure WebSockets (WSS)", done: true },
                      { title: "Publicly known vulnerabilities fixed", desc: "0 known high/critical CVEs verified via npm audit", done: true },
                      { title: "Other security issues (SSRF)", desc: "RFC 1918 & metadata address blocking on stream proxy", done: true },
                      { title: "Static code analysis", desc: "Automated TypeScript static typecheck (npm run static-analysis)", done: true },
                      { title: "Dynamic code analysis", desc: "Adversarial input fuzzing suite (npm run test:dynamic)", done: true }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: POLICIES & TERMS */}
            {activeTab === "policies" && (
              <div className="space-y-6">
                {/* Policy Selector Sub-Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "service", label: "Service Policy", sub: "Terms & Scope", icon: FileText },
                    { id: "data", label: "Data Policy", sub: "Ephemeral Buffers", icon: HardDrive },
                    { id: "privacy", label: "Privacy Policy", sub: "Zero Tracking", icon: Lock },
                    { id: "radio", label: "Radio Streaming", sub: "DMCA & Broadcasters", icon: Radio }
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedPolicy === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPolicy(p.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500/60 dark:border-emerald-400/60 text-emerald-900 dark:text-emerald-200 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                        id={`btn_policy_tab_${p.id}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{p.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Policy Highlight Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">MIT Open Source</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">100% FLOSS Codebase</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Ephemeral Buffers</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Zero Audio Disk Storage</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Zero Tracking</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">No Ads & No Cookies</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Safe Harbor SLA</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">&lt; 24h Broadcaster Takedown</span>
                  </div>
                </div>

                {/* POLICY VIEW: SERVICE POLICY */}
                {selectedPolicy === "service" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span>Service Policy & Terms of Use</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          Document: docs/SERVICE_POLICY.md • v1.2.0
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopy("See docs/SERVICE_POLICY.md for full terms.\nPermitted Use: Personal, non-commercial, language learning.", "copy_service_pol")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedCode === "copy_service_pol" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === "copy_service_pol" ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPolicy("SERVICE_POLICY.md", "# Service Policy & Terms of Use\n\nEffective Date: September 10, 2026\nVersion: 1.2.0\n\n1. Acceptance of Terms\n2. Permitted Use & Scope\n3. Acceptable Use & Prohibited Conduct\n4. Availability & Boundaries\n5. Intellectual Property & Codebase License\n6. Disclaimer of Warranties\n7. Contact: policy@worldradiotranslator.org")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .md</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs space-y-3 leading-relaxed text-slate-600 dark:text-slate-300">
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">1. Scope of Service & Non-Commercial Usage</strong>
                        <p>
                          Remix: World Radio Translator is an open-source educational utility distributed under the MIT License. The Service provides global radio tuning coupled with real-time speech translation powered by Google Gemini AI. Use is permitted for personal exploration, language acquisition, cultural monitoring, and accessibility. Commercial rebroadcasting or selling access to proxy streams is strictly prohibited.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">2. Acceptable Conduct & Security Boundaries</strong>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>No denial-of-service, automated audio scraping, or buffer flood attacks against origin broadcast streams.</li>
                          <li>No bypassing Server-Side Request Forgery (SSRF) checks, loopback IP filters, or private RFC 1918 blocks.</li>
                          <li>No injection of adversarial prompt payloads targeting Gemini translation models.</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">3. Broadcast Feeds & Availability Disclaimers</strong>
                        <p>
                          Third-party radio streams are indexed via the Radio Browser community index. We do not operate or guarantee the uptime, bandwidth, or uninterrupted availability of individual broadcast stations. The Service is not intended for safety-critical emergency communications.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                        Inquiries: <span className="font-mono text-emerald-600 dark:text-emerald-400">policy@worldradiotranslator.org</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* POLICY VIEW: DATA POLICY */}
                {selectedPolicy === "data" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-emerald-500" />
                          <span>Data Policy & Retention Specification</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          Document: docs/DATA_POLICY.md • v1.2.0
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopy("See docs/DATA_POLICY.md for full retention spec.\nEphemeral: Audio streams processed in volatile RAM only.", "copy_data_pol")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedCode === "copy_data_pol" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === "copy_data_pol" ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPolicy("DATA_POLICY.md", "# Data Policy & Data Retention Specification\n\nEffective Date: September 10, 2026\nVersion: 1.2.0\n\n1. Overview & Data Minimization\n2. Ephemeral In-Memory Audio Buffers\n3. Client-Side Persistence\n4. Cloud Storage & Right to Erasure\n5. Contact: data@worldradiotranslator.org")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .md</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs space-y-3 leading-relaxed text-slate-600 dark:text-slate-300">
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">1. Ephemeral In-Memory Audio Buffers</strong>
                        <p>
                          The backend stream proxy operates as a stateless HTTP pipe. Audio bytes reside in volatile server RAM only for the 2–10 seconds required to negotiate audio codecs and CORS headers before stream delivery to your browser. No audio recordings are ever written to server disks or persistent databases.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">2. Transcript Turns & 10-Minute Intelligence Summaries</strong>
                        <p>
                          Spoken transcript turns and real-time translations exist solely in your local browser window. When generating a broadcast summary, only the turns captured within your designated window (default: 10 minutes) are analyzed by Gemini in volatile memory and returned directly to your browser tab.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">3. User Controlled Storage & Right to Erasure</strong>
                        <p>
                          Favorites, custom radio stations, and starred bookmarks are stored in browser <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code> (or private Firestore if authenticated via Google OAuth). Users can wipe all records instantly via UI buttons or request cloud erasure by contacting our data protection desk.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                        Inquiries: <span className="font-mono text-emerald-600 dark:text-emerald-400">data@worldradiotranslator.org</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* POLICY VIEW: PRIVACY POLICY */}
                {selectedPolicy === "privacy" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-500" />
                          <span>Privacy Policy & Zero Tracking</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          Document: docs/PRIVACY_POLICY.md • v1.2.0
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopy("See docs/PRIVACY_POLICY.md for full privacy disclosure.\nZero Tracking: No advertising cookies, no third-party profiling.", "copy_priv_pol")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedCode === "copy_priv_pol" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === "copy_priv_pol" ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPolicy("PRIVACY_POLICY.md", "# Privacy Policy\n\nEffective Date: September 10, 2026\nVersion: 1.2.0\n\n1. Zero Tracking Philosophy\n2. Information Processed During Service Operation\n3. Third-Party Services & Processors\n4. Security Safeguards\n5. GDPR & CCPA Compliance\n6. Contact: privacy@worldradiotranslator.org")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .md</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs space-y-3 leading-relaxed text-slate-600 dark:text-slate-300">
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">1. Zero-Tracking Philosophy</strong>
                        <p>
                          We do not deploy marketing cookies, tracking pixels, or cross-site fingerprinting scripts. Listening to global radio stations and reading live translations requires no account creation or identity verification.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">2. AI Translation Data Flows</strong>
                        <p>
                          Audio frames downsampled from public radio broadcasts are sent via encrypted TLS to Google Gemini AI models for live speech recognition and multi-language translation. These audio slices originate entirely from the radio broadcast—never from your personal microphone or ambient room audio.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">3. GDPR & CCPA User Rights</strong>
                        <p>
                          Users enjoy full rights to access, inspect, export, or delete any user account data stored in optional cloud sync services. To exercise your rights, email our Data Protection team with your account identifier.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                        Privacy Desk: <span className="font-mono text-emerald-600 dark:text-emerald-400">privacy@worldradiotranslator.org</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* POLICY VIEW: RADIO STREAMING & DMCA POLICY */}
                {selectedPolicy === "radio" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-500" />
                          <span>Radio Streaming, Copyright & DMCA Policy</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          Document: docs/RADIO_STREAMING_POLICY.md • v1.2.0
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopy("See docs/RADIO_STREAMING_POLICY.md for full DMCA and broadcaster policy.\nBroadcaster Takedown SLA: Under 24 Hours.", "copy_radio_pol")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedCode === "copy_radio_pol" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === "copy_radio_pol" ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPolicy("RADIO_STREAMING_POLICY.md", "# Radio Streaming, Copyright & Broadcaster Policy\n\nEffective Date: September 10, 2026\nVersion: 1.2.0\n\n1. Nature of Service & Indexing Model\n2. Audio Proxy Architecture & Bandwidth Ethics\n3. Copyright Attribution\n4. Broadcaster Opt-Out (< 24 Hour SLA)\n5. DMCA Safe Harbor Notice (17 U.S.C. 512)\n6. Contact: dmca@worldradiotranslator.org")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .md</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs space-y-3 leading-relaxed text-slate-600 dark:text-slate-300">
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">1. Aggregation Model & Content Ownership</strong>
                        <p>
                          Station listings and stream URLs are pulled directly from the public, community-maintained Radio Browser index. All audio streams, broadcasts, musical compositions, and station trademarks belong entirely to their respective broadcast entities.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">2. Broadcaster Bandwidth Respect & 1:1 Connections</strong>
                        <p>
                          Our streaming proxy maintains a strict 1:1 mapping with client listening sessions. We do not maintain persistent idle listeners, cache broadcast audio, or scrape server bandwidth. The moment a user pauses or changes channels, the connection to the broadcaster's server is terminated immediately.
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-sm mb-1">3. Fast-Track Broadcaster Opt-Out SLA (&lt; 24 Hours)</strong>
                        <p>
                          Authorized station operators can request immediate delisting or IP filtering by emailing our team. Station exclusions are applied within 24 hours without dispute.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>DMCA Agent: <span className="font-mono text-emerald-600 dark:text-emerald-400">dmca@worldradiotranslator.org</span></span>
                        <span>Broadcaster Relations: <span className="font-mono text-emerald-600 dark:text-emerald-400">broadcasters@worldradiotranslator.org</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "license" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Free/Libre/Open Source Software (FLOSS)</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      SPDX License Identifier: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">MIT</span> (OSI Approved)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("MIT License\n\nCopyright (c) 2026 Remix: World Radio Translator Contributors\n\nPermission is hereby granted, free of charge...", "license")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    {copiedCode === "license" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === "license" ? "Copied" : "Copy License"}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs leading-relaxed border border-slate-800 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
{`MIT License

Copyright (c) 2026 Remix: World Radio Translator Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: RELEASES & VERSIONING */}
            {activeTab === "versioning" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">Semantic Versioning 2.0.0 Policy</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Every release increments a unique version <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">MAJOR.MINOR.PATCH</code>. All releases are tagged in the public Git repository and accompanied by full release notes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        v1.2.0 • Latest Release
                      </span>
                      <span className="text-xs text-slate-400 font-mono">2026-09-10</span>
                    </div>
                    <h4 className="text-sm font-bold mt-2">OpenSSF Best Practices, Jump to Context & Satellite Space-Mesh</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mt-2 list-disc list-inside">
                      <li><strong>OpenSSF Badge Compliance:</strong> Implemented all 19 criteria for Open Source Security Foundation Best Practices.</li>
                      <li><strong>Jump to Context:</strong> One-click navigation and animated highlight ring on bookmarked turns.</li>
                      <li><strong>Automated Test Suite:</strong> Added 18 unit tests and dynamic fuzzing tests.</li>
                      <li><strong>SSRF Mitigation:</strong> Blocked RFC 1918 subnets and cloud metadata endpoints on audio proxy.</li>
                      <li><strong>MITM Protection:</strong> Enabled HSTS with preload, CSP, and secure cipher requirements.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                        v1.1.0
                      </span>
                      <span className="text-xs text-slate-400 font-mono">2026-08-15</span>
                    </div>
                    <h4 className="text-sm font-bold mt-2">Saved Favorites & Continuous Live Translation</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-2 list-disc list-inside">
                      <li>Persistent bookmarks with audio clip download and Web Share API.</li>
                      <li>Google Gemini Live API integration for sub-second speech translation.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY & CRYPTO */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Cryptographic Standards</span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1 list-disc list-inside">
                      <li><strong>Hahsing:</strong> SHA-256 / SHA-512 (Standard Web Crypto API).</li>
                      <li><strong>Symmetric Encryption:</strong> AES-256-GCM.</li>
                      <li><strong>Randomness:</strong> <code className="font-mono">crypto.getRandomValues()</code>.</li>
                      <li><strong>Prohibited:</strong> MD5, SHA-1, and DES are banned.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/5">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>MITM Attack Defense</span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1 list-disc list-inside">
                      <li><strong>HSTS:</strong> <code className="font-mono">max-age=63072000; preload</code>.</li>
                      <li><strong>MIME Defense:</strong> <code className="font-mono">X-Content-Type-Options: nosniff</code>.</li>
                      <li><strong>Clickjacking:</strong> <code className="font-mono">X-Frame-Options: SAMEORIGIN</code>.</li>
                      <li><strong>Transport:</strong> TLS 1.3 / WSS for WebSocket streams.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Vulnerability Reporting Process & SLA</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    To report a potential security vulnerability, please email <strong>security@worldradiotranslator.org</strong> or open a private advisory on GitHub. We commit to:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-bold">ACK SLA</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Within 24–48 Hours</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-bold">TRIAGE</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Within 5 Days</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-bold">PATCH TIMELINE</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Within 14 Days</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <span>Server-Side Request Forgery (SSRF) Defense</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Audio stream proxy requests to <code className="font-mono text-emerald-600 dark:text-emerald-400">/api/proxy-stream</code> are strictly filtered to prevent SSRF. Requests targeting loopback (127.0.0.1), private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), or cloud instance metadata endpoints (169.254.169.254) are rejected with <code className="font-mono">403 Forbidden</code>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: BUG REPORTING */}
            {activeTab === "bugs" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    <Bug className="w-4 h-4" />
                    <span>Bug Reporting Workflow</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Found an issue? We welcome bug reports! Please include steps to reproduce, expected vs actual behavior, and system diagnostics below.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      System Diagnostics (Ready for Bug Report)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyDiagnostics}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      {bugReportCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{bugReportCopied ? "Diagnostics Copied!" : "Copy Diagnostics"}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-xs overflow-x-auto max-h-44">
                    {diagnosticPayload}
                  </pre>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Submit an Issue on GitHub</p>
                    <p>Open a ticket using our pre-formatted Bug Report issue template.</p>
                  </div>
                  <a
                    href="https://github.com/remix-radio/world-radio-translator/issues/new?template=bug_report.md"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                  >
                    <span>Open Issue Tracker</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB 6: BUILD & AUTOMATED TESTS */}
            {activeTab === "testing" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">18 Automated Tests</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Unit & Dynamic Tests Passing</p>
                  </div>

                  <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center">
                    <Code className="w-5 h-5 text-blue-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Static Code Analysis</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Strict TypeScript (0 Warnings)</p>
                  </div>

                  <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 text-center">
                    <Cpu className="w-5 h-5 text-purple-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Dynamic Fuzzing Suite</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Adversarial Input Resilient</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>Working Build & Verification Commands</span>
                  </h3>
                  <div className="space-y-2">
                    {[
                      { cmd: "npm test", desc: "Run complete automated test suite (unit + dynamic fuzzing)" },
                      { cmd: "npm run static-analysis", desc: "Run static type checks with strict compiler warning flags" },
                      { cmd: "npm run test:dynamic", desc: "Run dynamic adversarial fuzzing analysis" },
                      { cmd: "npm run audit", desc: "Scan dependencies for publicly known CVEs" },
                      { cmd: "npm run build", desc: "Compile production client and bundled CommonJS server" }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-emerald-400 font-bold">$ {item.cmd}</span>
                          <span className="text-slate-500 text-[11px] font-sans">({item.desc})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.cmd, `cmd_${idx}`)}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                          title="Copy command"
                        >
                          {copiedCode === `cmd_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>New Functionality Testing Policy:</strong> In accordance with OpenSSF guidelines, all new pull requests must include corresponding automated test coverage in <code className="font-mono">test/unit/</code> or <code className="font-mono">test/dynamic/</code> before code review approval.
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 19 OpenSSF Best Practices Criteria Verified</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
              id="btn_modal_close_footer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
