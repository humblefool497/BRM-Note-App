import React, { useState } from 'react';
import {
  Share2,
  MessageSquare,
  Mail,
  Copy,
  Check,
  Building2,
  Calendar,
  Layers,
  User,
  CheckCircle2,
  Circle,
  FileText,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { ParsedCrmData, getTagStyle } from '../types/crm';
import { buildBrmMarkdown } from '../utils/parser';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download } from 'lucide-react';

interface MobileReportViewProps {
  data: ParsedCrmData;
  onBackToApp: () => void;
  onUpdateData?: (updated: ParsedCrmData) => void;
}

export const MobileReportView: React.FC<MobileReportViewProps> = ({
  data,
  onBackToApp,
  onUpdateData,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedTasks, setCopiedTasks] = useState(false);
  const [items, setItems] = useState(data.actionItems);

  const toggleTask = (id: string) => {
    const updated = items.map((i) => (i.id === id ? { ...i, isDone: !i.isDone } : i));
    setItems(updated);
    if (onUpdateData) {
      const updatedData = { ...data, actionItems: updated };
      updatedData.rawMarkdown = buildBrmMarkdown(updatedData);
      onUpdateData(updatedData);
    }
  };

  // Build punchy task string for WhatsApp / SMS
  const buildTaskSummaryText = () => {
    const actionLines = items
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

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildTaskSummaryText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareSMS = () => {
    const body = encodeURIComponent(buildTaskSummaryText());
    window.location.href = `sms:?&body=${body}`;
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`[BRM Update] ${data.clientOrganization} - ${data.meetingContext}`);
    const body = encodeURIComponent(buildBrmMarkdown({ ...data, actionItems: items }));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    const text = buildTaskSummaryText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.clientOrganization} - Tasks & Report`,
          text,
        });
      } catch {}
    } else {
      handleCopyTasks();
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(buildBrmMarkdown({ ...data, actionItems: items }));
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyTasks = () => {
    navigator.clipboard.writeText(buildTaskSummaryText());
    setCopiedTasks(true);
    setTimeout(() => setCopiedTasks(false), 2000);
  };

  const doneCount = items.filter((i) => i.isDone).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 sm:p-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pt-2">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Full App</span>
        </button>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={() => install()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold">
            Mobile Task Dispatch
          </span>
        </div>
      </div>

      {/* Main Metadata Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl mb-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{data.clientOrganization}</h1>
            <p className="text-xs text-slate-400">{data.meetingContext}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Customer Name</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              {data.customerName || (data.clientManagers.length > 0 ? data.clientManagers[0] : 'Sarah')}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Meeting Date</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {data.meetingDate}
            </span>
          </div>
        </div>
      </div>

      {/* Primary 1-Tap Share Actions (WhatsApp, Messages, Email) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-cyan-400" />
            1-Tap Share to Teams
          </span>
          <span className="text-[10px] text-slate-500">Instant forwarding</span>
        </div>

        {/* WhatsApp Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Share via WhatsApp</span>
        </button>

        {/* SMS / Message Button */}
        <button
          onClick={handleShareSMS}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Send via SMS / Messages</span>
        </button>

        {/* Email & System Share */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleShareEmail}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Email Report</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>More Apps...</span>
          </button>
        </div>
      </div>

      {/* Action Items List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Action Items</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {doneCount}/{items.length} done
            </span>
          </div>

          <button
            onClick={handleCopyTasks}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            {copiedTasks ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedTasks ? 'Copied' : 'Copy Tasks'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const style = getTagStyle(item.tagType);
            return (
              <div
                key={item.id}
                onClick={() => toggleTask(item.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  item.isDone
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border mb-1 ${style.badgeBg}`}
                  >
                    [{item.tag}]
                  </span>
                  <p
                    className={`text-xs leading-relaxed ${
                      item.isDone ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {item.task}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Markdown Report Accordion */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Markdown Report Format
          </span>
          <button
            onClick={handleCopyMarkdown}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            {copiedMd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedMd ? 'Copied Markdown' : 'Copy'}</span>
          </button>
        </div>
        <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed max-h-56">
          {buildBrmMarkdown({ ...data, actionItems: items })}
        </pre>
      </div>
    </div>
  );
};
