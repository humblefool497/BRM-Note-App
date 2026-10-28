import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Smartphone,
  LayoutDashboard,
  Clock,
  Code2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  RotateCcw,
  Send,
  HelpCircle,
  BookOpen,
  QrCode,
  Share2,
  FileText,
  ListTodo,
  Users,
  Mic
} from 'lucide-react';
import { ParsedCrmData } from './types/crm';
import { parseBrmMarkdown, buildBrmMarkdown } from './utils/parser';
import { SAMPLE_NOTES, SampleNote } from './utils/sampleNotes';
import { StructuredResultCard } from './components/StructuredResultCard';
import { AndroidDeviceFrame } from './components/AndroidDeviceFrame';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VoiceInputButton } from './components/VoiceInputButton';
import { SendToPhoneModal } from './components/SendToPhoneModal';
import { MobileReportView } from './components/MobileReportView';
import { InstallAndroidModal } from './components/InstallAndroidModal';
import { usePWAInstall } from './utils/usePWAInstall';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'brm_crm_history_v1';
const SHARED_APP_URL = 'https://ais-pre-lzl3ue7oenpiqfbeto6uow-526561661959.us-west1.run.app';
const USER_EMAIL = 'linux.debasish@gmail.com';

export default function App() {
  const [rawNotes, setRawNotes] = useState(SAMPLE_NOTES[0].rawText);
  const [currentResult, setCurrentResult] = useState<ParsedCrmData | null>(null);
  const [history, setHistory] = useState<ParsedCrmData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [sourceTag, setSourceTag] = useState<string>('gemini-3.8-flash');
  const [mobileActiveNav, setMobileActiveNav] = useState<'notes' | 'result' | 'actions'>('notes');
  const [isSharedReportView, setIsSharedReportView] = useState(false);

  const { isInstallable, install } = usePWAInstall();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load history or shared payload on startup
  useEffect(() => {
    // Check if URL hash has #share?payload=...
    if (typeof window !== 'undefined' && window.location.hash.includes('share')) {
      try {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
          const params = new URLSearchParams(hash.substring(queryIndex));
          const payloadStr = params.get('payload');
          if (payloadStr) {
            const raw = JSON.parse(decodeURIComponent(payloadStr));
            const sharedItem: ParsedCrmData = {
              id: raw.id || `crm_${Date.now()}`,
              timestamp: Date.now(),
              clientOrganization: raw.org || 'Client Organization',
              customerName: raw.cust || 'Sarah',
              meetingDate: raw.date || new Date().toISOString().split('T')[0],
              meetingContext: raw.ctx || 'Governance Review',
              clientManagers: raw.mgrs || [],
              internalTeams: raw.teams || [],
              clientFeedback: raw.fb || [],
              newRequirements: raw.req || [],
              actionItems: raw.act || [],
              rawNotes: '',
              rawMarkdown: '',
            };
            sharedItem.rawMarkdown = buildBrmMarkdown(sharedItem);
            setCurrentResult(sharedItem);
            setIsSharedReportView(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to parse shared payload from URL hash:', err);
      }
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setCurrentResult(parsed[0]);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
    }

    // Default: auto-parse initial sample note for instant gratification
    const initialParsed = parseBrmMarkdown(
      `## 🏢 Client & Meeting Metadata
* **Client Organization:** Acme Corp
* **Date:** ${new Date().toISOString().split('T')[0]}
* **Meeting Context:** Monthly Sync / Governance

## 👥 Key Stakeholders Mentioned
* **Client Managers:** Sarah
* **Internal Associates/Teams:** John's Team

## 📥 Feedback & Requirements Log
* **Client Feedback:** Happy with current sprint performance. Experienced some latency issues.
* **New Requirements:** Requires a new analytics dashboard delivered by Q3.

## 📋 Action Items & To-Do List
* - [ ] **[REQ - John's Team]** Investigate and resolve the reported latency issues.
* - [ ] **[GOV - Follow-Up - Sarah]** Reach out next week to secure contract renewal signatures.`,
      SAMPLE_NOTES[0].rawText
    );
    setCurrentResult(initialParsed);
    setHistory([initialParsed]);
  }, []);

  // Save history to localStorage
  const saveToHistory = (newEntry: ParsedCrmData) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== newEntry.id);
      const updated = [newEntry, ...filtered].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save history to localStorage:', e);
      }
      return updated;
    });
  };

  // Process raw notes via backend Gemini API
  const handleProcessNotes = async () => {
    if (!rawNotes.trim()) {
      setErrorMessage('Please type or dictate your meeting notes first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/structure-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      setSourceTag(data.source || 'gemini-3.8-flash');

      const parsed = parseBrmMarkdown(data.rawMarkdown, rawNotes);
      setCurrentResult(parsed);
      saveToHistory(parsed);
      setMobileActiveNav('result');
    } catch (err: any) {
      console.warn('API call failed, falling back to local extractor:', err);
      try {
        const fallback = parseBrmMarkdown(rawNotes, rawNotes);
        setCurrentResult(fallback);
        saveToHistory(fallback);
        setSourceTag('local-parser');
        setMobileActiveNav('result');
      } catch {
        setErrorMessage(err.message || 'Failed to structure notes. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill sample
  const handleLoadSample = (sample: SampleNote) => {
    setRawNotes(sample.rawText);
    setErrorMessage(null);
  };

  // Update current result in place (e.g. checkbox toggles)
  const handleUpdateResult = (updated: ParsedCrmData) => {
    setCurrentResult(updated);
    saveToHistory(updated);
  };

  // Delete from history
  const handleDeleteFromHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    if (currentResult?.id === id) {
      setCurrentResult(updated[0] || null);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setCurrentResult(null);
  };

  // Main UI Body Content (used both in Android frame and Desktop layout)
  const renderAppContent = (isMobileView: boolean) => (
    <div className={`space-y-4 ${isMobileView ? 'p-3 pb-20' : 'p-0'}`}>
      {/* Mobile Top Navigation Chips */}
      {isMobileView && (
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setMobileActiveNav('notes')}
            className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileActiveNav === 'notes'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setMobileActiveNav('result')}
            className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileActiveNav === 'result'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>CRM Data</span>
          </button>
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex-1 py-1.5 rounded-xl font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>To Phone</span>
          </button>
        </div>
      )}

      {/* Input Card (Always visible on desktop, or when mobileActiveNav is 'notes' or on top) */}
      {(!isMobileView || mobileActiveNav === 'notes') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Raw Meeting Notes / Transcript
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <VoiceInputButton
                onTranscript={(txt) => setRawNotes((prev) => (prev ? `${prev} ${txt}` : txt))}
                isProcessing={isLoading}
              />

              {rawNotes && (
                <button
                  type="button"
                  onClick={() => setRawNotes('')}
                  className="text-xs text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
                  title="Clear input"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Type or dictate messy meeting notes, stakeholder names, feedback, or follow-ups... e.g. Met with Sarah from Acme Corp today..."
              className="w-full h-32 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 leading-relaxed resize-none transition-all"
            />
            <div className="absolute right-2.5 bottom-2 text-[10px] text-slate-500 font-mono">
              {rawNotes.length} chars
            </div>
          </div>

          {/* Sample Notes Chips */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>Load Quick BRM Scenarios:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_NOTES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition-all text-left truncate max-w-[200px]"
                  title={sample.rawText}
                >
                  {sample.client}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            <button
              onClick={handleProcessNotes}
              disabled={isLoading || !rawNotes.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Structuring with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Structure into CRM Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result Display (Always on desktop, or when mobileActiveNav is 'result' on mobile) */}
      {(!isMobileView || mobileActiveNav === 'result') && (
        <>
          {currentResult ? (
            <StructuredResultCard
              data={currentResult}
              onUpdate={handleUpdateResult}
              source={sourceTag}
              onSendToPhone={() => setIsSendModalOpen(true)}
            />
          ) : (
            <div className="text-center py-10 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">Ready to Structure CRM Notes</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Choose a quick sample above or type notes, then tap Structure into CRM Data.
              </p>
            </div>
          )}
        </>
      )}

      {/* Material 3 Bottom App Floating Navigation for Mobile Simulator */}
      {isMobileView && (
        <div className="fixed bottom-3 left-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center justify-around text-[10px] z-30 ring-1 ring-cyan-500/20">
          <button
            onClick={() => setMobileActiveNav('notes')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              mobileActiveNav === 'notes' ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5" />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setMobileActiveNav('result')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              mobileActiveNav === 'result' ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4 mb-0.5" />
            <span>CRM Data</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span>Archive</span>
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex flex-col items-center py-1 px-3 rounded-xl text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 transition-all shadow-sm"
          >
            <Smartphone className="w-4 h-4 mb-0.5" />
            <span>To Phone</span>
          </button>
        </div>
      )}
    </div>
  );

  if (isSharedReportView && currentResult) {
    return (
      <MobileReportView
        data={currentResult}
        onBackToApp={() => {
          setIsSharedReportView(false);
          window.location.hash = '';
        }}
        onUpdateData={handleUpdateResult}
      />
    );
  }

  const isInAppBrowser =
    typeof window !== 'undefined' &&
    /FBAN|FBAV|Instagram|WhatsApp|Line|GSA|wv|WebView/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* In-App Browser Warning Banner */}
      {isInAppBrowser && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2 z-50">
          <span>
            ⚠️ To install on Android: Tap the <strong>three dots (⋮)</strong> at top right and select <strong>"Open in Chrome"</strong>!
          </span>
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="underline text-amber-400 font-bold shrink-0"
          >
            Instructions
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-extrabold text-sm ring-1 ring-white/20">
              BRM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm lg:text-base font-bold text-white tracking-tight">
                  BRM Intelligence
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  Android & Web
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Automated CRM note structuring, stakeholder mapping & governance action engine
              </p>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-2">
            {/* Direct "Install on Android" Highlight Button */}
            <button
              onClick={() => {
                if (isInstallable) {
                  install();
                } else {
                  setIsInstallModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/40 transition-all active:scale-95"
              title="Install this app onto your Android phone as a native WebAPK"
            >
              <Download className="w-4 h-4" />
              <span>Install Android App</span>
            </button>

            {/* Direct "Send to Phone" Highlight Button */}
            <button
              onClick={() => setIsSendModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40 transition-all active:scale-95 animate-pulse"
              title="Open or forward tasks to your Android phone"
            >
              <Smartphone className="w-4 h-4" />
              <span>Send Tasks</span>
              <QrCode className="w-3.5 h-3.5 opacity-80 hidden sm:inline" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'mobile'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Android Phone View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phone View</span>
              </button>

              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Executive Workspace View"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portal View</span>
              </button>
            </div>

            {/* History Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="View saved meeting notes history"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Archive</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                  {history.length}
                </span>
              )}
            </button>

            {/* Android Native Code Modal Trigger */}
            <button
              onClick={() => setIsCodeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="View Kotlin & Jetpack Compose Android source code"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Kotlin Source</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-8">
        {viewMode === 'mobile' ? (
          <div className="flex flex-col items-center justify-center">
            {/* Banner with direct QR trigger */}
            <div className="flex items-center gap-3 mb-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl shadow-sm text-xs">
              <span className="text-slate-300">
                Interactive Android 15 Simulator • Material 3 UI
              </span>
              <button
                onClick={() => setIsSendModalOpen(true)}
                className="text-emerald-400 hover:underline font-bold flex items-center gap-1 ml-2"
              >
                <QrCode className="w-3.5 h-3.5" /> Scan QR to open on your phone &rarr;
              </button>
            </div>

            <AndroidDeviceFrame>
              {renderAppContent(true)}
            </AndroidDeviceFrame>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Input & Controls */}
            <div className="lg:col-span-5 sticky top-24">
              {renderAppContent(false)}
            </div>

            {/* Right Column: Structured Output Display */}
            <div className="lg:col-span-7">
              {currentResult ? (
                <StructuredResultCard
                  data={currentResult}
                  onUpdate={handleUpdateResult}
                  source={sourceTag}
                  onSendToPhone={() => setIsSendModalOpen(true)}
                />
              ) : (
                <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                  <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-200">No Structured Data Loaded</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Select a sample scenario from the left or type your meeting transcript, then click Structure into CRM Data.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <InstallAndroidModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        appUrl={SHARED_APP_URL}
        userEmail={USER_EMAIL}
      />

      <SendToPhoneModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        appUrl={SHARED_APP_URL}
        userEmail={USER_EMAIL}
        data={currentResult}
      />

      <AndroidCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => setCurrentResult(item)}
        onDelete={handleDeleteFromHistory}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
}
