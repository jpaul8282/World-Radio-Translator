import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileEdit,
  Inbox,
  Lock
} from "lucide-react";
import {
  fetchGmailProfile,
  sendGmailMessage,
  createGmailDraft,
  listRecentGmailMessages,
  deleteGmailMessage,
  formatBroadcastDigestHtml,
  GmailProfile,
  GmailMessageSummary,
} from "../services/gmailService";
import { RadioStation } from "../types";
import { LiveTranslateTurn } from "../services/liveTranslateClient";
import { getCachedAccessToken, loginWithGoogle, logoutFirebase, GMAIL_SCOPES } from "../lib/firebase";

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStation: RadioStation | null;
  activeTargetLanguage: string;
  transcriptTurns: LiveTranslateTurn[];
  latestSummary?: string | null;
}

type TabType = "compose" | "inbox" | "scopes";

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  activeStation,
  activeTargetLanguage,
  transcriptTurns,
  latestSummary,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("compose");
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compose State
  const [recipient, setRecipient] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [bodyHtml, setBodyHtml] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Inbox & Messages State
  const [searchQuery, setSearchQuery] = useState<string>("World Radio");
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  // Mandatory Confirmation Dialog State (Per Google Workspace Skill)
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: "send" | "delete";
    title: string;
    description: string;
    itemDetails?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Sync token from memory
  useEffect(() => {
    if (isOpen) {
      const currentToken = getCachedAccessToken();
      setAccessToken(currentToken);
      if (currentToken) {
        loadProfile(currentToken);
      }
    }
  }, [isOpen]);

  // Prepopulate compose form whenever opened or active station changes
  useEffect(() => {
    if (isOpen) {
      const stationName = activeStation?.name || "Global Live Broadcast";
      const initialSubject = `[Radio Digest] ${stationName} - Translation (${activeTargetLanguage})`;
      setSubject(initialSubject);

      const html = formatBroadcastDigestHtml({
        stationName,
        stationCountry: activeStation?.country,
        stationLanguage: activeStation?.language,
        streamUrl: activeStation?.urlResolved || activeStation?.url,
        targetLanguage: activeTargetLanguage,
        turns: transcriptTurns,
        summary: latestSummary,
      });
      setBodyHtml(html);
    }
  }, [isOpen, activeStation, activeTargetLanguage, transcriptTurns, latestSummary]);

  const loadProfile = async (token: string) => {
    setIsLoadingProfile(true);
    setErrorMessage(null);
    try {
      const userProfile = await fetchGmailProfile(token);
      setProfile(userProfile);
      if (!recipient) {
        setRecipient(userProfile.emailAddress);
      }
    } catch (err: any) {
      console.warn("Could not load Gmail profile (token may need refresh):", err);
      setErrorMessage("Could not load Gmail profile. Please connect your Google account with Gmail permissions.");
      setAccessToken(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await loginWithGoogle();
      if (result.accessToken) {
        setAccessToken(result.accessToken);
        await loadProfile(result.accessToken);
        setSuccessMessage("Gmail connected successfully!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in with Google.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFetchMessages = async () => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    setErrorMessage(null);
    try {
      const list = await listRecentGmailMessages(accessToken, searchQuery, 10);
      setMessages(list);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to retrieve messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inbox" && accessToken) {
      handleFetchMessages();
    }
  }, [activeTab, accessToken]);

  // Save Draft (non-destructive creation)
  const handleSaveDraft = async () => {
    if (!accessToken) {
      setErrorMessage("Please sign in with Google to create a Gmail draft.");
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage("Please specify a recipient email address.");
      return;
    }
    setIsDrafting(true);
    setErrorMessage(null);
    try {
      const res = await createGmailDraft(accessToken, {
        to: recipient.trim(),
        subject: subject.trim(),
        bodyHtml,
      });
      setSuccessMessage(`Draft created successfully in Gmail (ID: ${res.id})`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create draft.");
    } finally {
      setIsDrafting(false);
    }
  };

  // Request Explicit Confirmation for Sending Email (Mandatory Skill Constraint)
  const requestSendEmail = () => {
    if (!accessToken) {
      setErrorMessage("Please sign in with Google to send emails.");
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage("Please specify a recipient email address.");
      return;
    }

    setPendingConfirmation({
      action: "send",
      title: "Confirm Sending Email via Gmail",
      description: `You are about to send a live broadcast digest email from your Gmail account (${profile?.emailAddress || "Google Account"}).`,
      itemDetails: `To: ${recipient}\nSubject: ${subject}\nTurns Included: ${transcriptTurns.length}`,
      onConfirm: async () => {
        setIsSending(true);
        setErrorMessage(null);
        try {
          await sendGmailMessage(accessToken, {
            to: recipient.trim(),
            subject: subject.trim(),
            bodyHtml,
          });
          setSuccessMessage(`Email sent successfully via Gmail to ${recipient}!`);
          setPendingConfirmation(null);
        } catch (err: any) {
          setErrorMessage(err.message || "Failed to send email.");
        } finally {
          setIsSending(false);
        }
      },
    });
  };

  // Request Explicit Confirmation for Deleting Message (Mandatory Skill Constraint)
  const requestDeleteMessage = (msg: GmailMessageSummary) => {
    if (!accessToken) return;

    setPendingConfirmation({
      action: "delete",
      title: "Permanently Delete Gmail Message?",
      description: "This action will delete this message from your Gmail account. This operation cannot be undone.",
      itemDetails: `Subject: "${msg.subject}"\nFrom: ${msg.from}\nDate: ${msg.date}`,
      onConfirm: async () => {
        try {
          await deleteGmailMessage(accessToken, msg.id);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          setSuccessMessage("Message deleted from Gmail.");
          setPendingConfirmation(null);
        } catch (err: any) {
          setErrorMessage(err.message || "Failed to delete message.");
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100"
        id="gmail-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Gmail Integration Hub
                </h2>
                {accessToken && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Email broadcast digests, live transcripts, and summaries directly through your Gmail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            id="btn_close_gmail_modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:underline text-[10px]">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:underline text-[10px]">
              Dismiss
            </button>
          </div>
        )}

        {/* User Account Bar */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          {accessToken && profile ? (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {profile.emailAddress}
              </span>
              <span className="text-[10px] text-slate-400">&bull;</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {profile.messagesTotal?.toLocaleString()} messages in mailbox
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Connect your Google account with Gmail permissions to enable email features</span>
            </div>
          )}

          <div>
            {!accessToken ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                id="btn_gmail_signin"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                <span>Authorize Gmail</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Refresh OAuth token or change account"
              >
                Switch / Refresh Token
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("compose")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "compose"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Compose Broadcast Digest</span>
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "inbox"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Search &amp; History</span>
          </button>
          <button
            onClick={() => setActiveTab("scopes")}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "scopes"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OAuth Scopes ({GMAIL_SCOPES.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "compose" && (
            <div className="flex flex-col gap-4">
              {/* Station Context Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {activeStation?.name || "Global Radio Station"}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">
                      ({activeStation?.country || "World"} &bull; Native: {activeStation?.language || "Unknown"}) &rarr; Target:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">{activeTargetLanguage}</strong>
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {transcriptTurns.length} turns ready
                </span>
              </div>

              {/* To field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Recipient (To):</span>
                  {profile?.emailAddress && (
                    <button
                      type="button"
                      onClick={() => setRecipient(profile.emailAddress)}
                      className="text-[10px] text-red-500 hover:underline cursor-pointer"
                    >
                      Send to my email ({profile.emailAddress})
                    </button>
                  )}
                </label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  id="input_gmail_to"
                />
              </div>

              {/* Subject field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Subject:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  id="input_gmail_subject"
                />
              </div>

              {/* Body / Preview Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Message Content:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {previewMode ? "Edit HTML / Text" : "Preview Rendered Email"}
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div
                  className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white overflow-y-auto text-slate-900 text-xs shadow-inner"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : (
                <textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-y"
                  id="textarea_gmail_body"
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isDrafting || !accessToken}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  id="btn_save_gmail_draft"
                >
                  {isDrafting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>Save as Gmail Draft</span>
                </button>

                <button
                  type="button"
                  onClick={requestSendEmail}
                  disabled={isSending || !accessToken}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  id="btn_send_gmail_email"
                >
                  {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Email via Gmail</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "inbox" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchMessages()}
                    placeholder="Search Gmail messages (e.g. World Radio, translation)..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchMessages}
                  disabled={isLoadingMessages || !accessToken}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? "animate-spin" : ""}`} />
                  <span>Search</span>
                </button>
              </div>

              {isLoadingMessages ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                  <span className="text-xs">Searching messages from your Gmail mailbox...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No messages matched your query in Gmail.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {msg.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {msg.date ? new Date(msg.date).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                          From: {msg.from}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {msg.snippet}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => requestDeleteMessage(msg)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete message from Gmail (requires confirmation)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "scopes" && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-bold">Authorized Google Workspace Scopes</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    This application is configured with the approved Gmail scopes in Google Cloud Project <code>xerotic-link-2w1xt</code>.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {GMAIL_SCOPES.map((scope, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                        {scope}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Configured
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <span>Client-side OAuth via Google Identity Services &amp; Firebase SDK</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY per Google Workspace Skill) */}
      <AnimatePresence>
        {pendingConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 text-slate-900 dark:text-slate-100"
              id="dialog_gmail_confirm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    pendingConfirmation.action === "delete"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {pendingConfirmation.action === "delete" ? (
                    <Trash2 className="w-5 h-5" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{pendingConfirmation.title}</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Explicit User Confirmation Required
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {pendingConfirmation.description}
              </p>

              {pendingConfirmation.itemDetails && (
                <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                  {pendingConfirmation.itemDetails}
                </pre>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  id="btn_cancel_gmail_action"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => pendingConfirmation.onConfirm()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                    pendingConfirmation.action === "delete"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  id="btn_confirm_gmail_action"
                >
                  {pendingConfirmation.action === "delete" ? "Confirm Delete" : "Confirm & Send Email"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
