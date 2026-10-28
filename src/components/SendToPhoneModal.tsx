import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Mail,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { ParsedCrmData } from '../types/crm';
import { buildBrmMarkdown } from '../utils/parser';

interface SendToPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
  userEmail?: string;
  data?: ParsedCrmData | null;
}

export const SendToPhoneModal: React.FC<SendToPhoneModalProps> = ({
  isOpen,
  onClose,
  appUrl,
  userEmail = 'linux.debasish@gmail.com',
  data,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'share' | 'pwa' | 'apk'>('qr');
  const [qrMode, setQrMode] = useState<'web' | 'rawText'>('web');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTasks, setCopiedTasks] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Compute final app URL to open on Android phone
  const baseAppUrl =
    appUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-lzl3ue7oenpiqfbeto6uow-526561661959.us-west1.run.app');

  // Build task summary text for messages & WhatsApp
  const buildTaskSummaryText = () => {
    if (!data) return 'No meeting data available.';
    const actionLines = data.actionItems
      .map((i) => `${i.isDone ? '✅' : '⬜'} [${i.tag}] ${i.task}`)
      .join('\n');

    return `🏢 *${data.clientOrganization}* - ${data.meetingContext}
👤 Contact: ${data.customerName || data.clientManagers[0] || 'Client Lead'}
📅 Date: ${data.meetingDate}

📋 *Action Items & To-Do:*
${actionLines}

${data.clientFeedback.length > 0 ? `\n💬 *Feedback:* ${data.clientFeedback.join('; ')}` : ''}
${data.newRequirements.length > 0 && data.newRequirements[0] !== 'None identified.' ? `\n🚀 *Requirements:* ${data.newRequirements.join('; ')}` : ''}`;
  };

  // Generate target share URL (opens mobile dispatch view)
  const getShareUrl = () => {
    if (!data) return baseAppUrl;
    try {
      const minimalPayload = {
        id: data.id,
        org: data.clientOrganization,
        cust: data.customerName || data.clientManagers[0] || 'Client Lead',
        date: data.meetingDate,
        ctx: data.meetingContext,
        mgrs: data.clientManagers,
        teams: data.internalTeams,
        fb: data.clientFeedback,
        req: data.newRequirements,
        act: data.actionItems.map((a) => ({
          id: a.id,
          tag: a.tag,
          task: a.task,
          isDone: a.isDone,
          tagType: a.tagType,
        })),
      };
      return `${baseAppUrl}/#share?payload=${encodeURIComponent(JSON.stringify(minimalPayload))}`;
    } catch {
      return baseAppUrl;
    }
  };

  const shareUrl = getShareUrl();

  // Generate QR Code based on chosen mode
  useEffect(() => {
    if (isOpen) {
      const textToEncode = qrMode === 'web' ? shareUrl : (data ? buildBrmMarkdown(data) : shareUrl);

      QRCode.toDataURL(
        textToEncode,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0369a1',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeDataUrl(url);
          }
        }
      );
    }
  }, [isOpen, shareUrl, qrMode, data]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTasks = () => {
    navigator.clipboard.writeText(buildTaskSummaryText());
    setCopiedTasks(true);
    setTimeout(() => setCopiedTasks(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildTaskSummaryText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareSMS = () => {
    const body = encodeURIComponent(buildTaskSummaryText());
    window.location.href = `sms:?&body=${body}`;
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      data ? `[BRM Tasks] ${data.clientOrganization} - ${data.meetingContext}` : 'BRM Meeting Tasks'
    );
    const body = encodeURIComponent(data ? buildBrmMarkdown(data) : shareUrl);
    window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
  };

  const handleDownloadAndroidZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      zip.file(
        'settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "BRMAssistant"
include(":app")
`
      );

      zip.file(
        'README.md',
        `# BRM Intelligence Android Application
Open in Android Studio and hit Run to build APK directly onto your phone!
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'BRM_Intelligence_Android_Studio_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create Android ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Send Tasks & Report to Phone</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan QR to open task format or forward directly via WhatsApp, SMS & Email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'qr'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Task QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'share'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp / SMS / Email</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'pwa'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install on Android</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'apk'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Android Studio ZIP</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* QR Mode Switcher */}
              <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setQrMode('web')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    qrMode === 'web'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Opens Mobile Task & Share Dispatcher
                </button>
                <button
                  onClick={() => setQrMode('rawText')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    qrMode === 'rawText'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Markdown Text QR
                </button>
              </div>

              {/* QR Image */}
              <div className="p-3 bg-white rounded-2xl shadow-xl ring-4 ring-cyan-500/20 inline-block">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to open task report on phone"
                    className="w-56 h-56 rounded-lg block"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR code...
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Point your Android camera at this code
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {qrMode === 'web'
                    ? 'Scanning opens this exact meeting task report on your phone with 1-tap WhatsApp, SMS, and Email forwarding buttons!'
                    : 'Encodes the raw Markdown report directly into the QR code for barcode scanner apps.'}
                </p>
              </div>

              {/* Quick actions right below QR */}
              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  onClick={handleShareSMS}
                  className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via SMS</span>
                </button>
              </div>

              {/* URL bar with copy */}
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-300 truncate text-[11px] text-left">
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-medium">
                Instantly forward this meeting's tasks & governance items to team members or clients:
              </div>

              {/* 1-Tap Share Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center gap-3 shadow-lg shadow-emerald-500/20 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold">Share to WhatsApp</span>
                    <span className="text-[11px] text-emerald-100 font-normal">Pre-fills tasks & metadata</span>
                  </div>
                </button>

                {/* SMS / Text Messages */}
                <button
                  onClick={handleShareSMS}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-3 shadow-lg shadow-cyan-500/20 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold">Send via SMS Messages</span>
                    <span className="text-[11px] text-cyan-100 font-normal">Opens phone messaging app</span>
                  </div>
                </button>

                {/* Email */}
                <button
                  onClick={handleSendEmail}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-3 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold">Email Full Report</span>
                    <span className="text-[11px] text-slate-400 font-normal">To {userEmail} or colleagues</span>
                  </div>
                </button>

                {/* Copy Formatted Tasks */}
                <button
                  onClick={handleCopyTasks}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-3 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    {copiedTasks ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="block font-bold">{copiedTasks ? 'Copied Tasks!' : 'Copy To-Do List'}</span>
                    <span className="text-[11px] text-slate-400 font-normal">Formatted for Slack or Teams</span>
                  </div>
                </button>
              </div>

              {/* Message Preview Box */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Preview of dispatched task format:
                </span>
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  {buildTaskSummaryText()}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300">
                Install as a full standalone Android App with home screen icon:
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Open in Chrome on Android</h5>
                    <p className="text-[11px] text-slate-400">
                      Scan the QR code or open <span className="text-cyan-400 font-mono">{baseAppUrl}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Tap Chrome Menu (⋮)</h5>
                    <p className="text-[11px] text-slate-400">
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Launch anytime from your App Drawer</h5>
                    <p className="text-[11px] text-slate-400">
                      Runs full-screen with offline caching, camera voice dictation, and immediate task sharing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Complete Android Studio Project (.zip)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Contains all Kotlin files (`MainActivity.kt`, `BrmParserEngine.kt`, `CrmModels.kt`), Jetpack Compose UI, Gradle scripts, and Manifest ready to compile into a native APK.
                </p>

                <button
                  onClick={handleDownloadAndroidZip}
                  disabled={isZipping}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isZipping ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Packaging ZIP...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Downloaded Project ZIP!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Android Project (.zip)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Works with WhatsApp, SMS, Gmail, Slack & Android Native Share</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
