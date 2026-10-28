import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Building2,
  Calendar,
  Layers,
  Users,
  Briefcase,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Share2,
  Mail,
  Plus,
  Trash2,
  FileCode,
  SlidersHorizontal,
  AlertTriangle,
  FileText,
  Smartphone,
  Edit2,
  User,
  Save,
  X
} from 'lucide-react';
import { ParsedCrmData, ActionItem, getTagStyle, parseTagType, TagType } from '../types/crm';
import { buildBrmMarkdown } from '../utils/parser';

interface StructuredResultCardProps {
  data: ParsedCrmData;
  onUpdate: (updated: ParsedCrmData) => void;
  source?: string;
  onSendToPhone?: () => void;
}

export const StructuredResultCard: React.FC<StructuredResultCardProps> = ({
  data,
  onUpdate,
  source = 'gemini-3.8-flash',
  onSendToPhone,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | TagType>('ALL');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [newActionText, setNewActionText] = useState('');
  const [newActionTag, setNewActionTag] = useState('[Follow-Up]');
  const [isAddingAction, setIsAddingAction] = useState(false);

  // Metadata Editing State
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editOrg, setEditOrg] = useState(data.clientOrganization);
  const [editCustomerName, setEditCustomerName] = useState(data.customerName || '');
  const [editDate, setEditDate] = useState(data.meetingDate || new Date().toISOString().split('T')[0]);
  const [editContext, setEditContext] = useState(data.meetingContext);

  useEffect(() => {
    setEditOrg(data.clientOrganization);
    setEditCustomerName(data.customerName || (data.clientManagers.length > 0 ? data.clientManagers[0] : 'Sarah'));
    setEditDate(data.meetingDate || new Date().toISOString().split('T')[0]);
    setEditContext(data.meetingContext);
  }, [data]);

  const handleSaveMetadata = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedData: ParsedCrmData = {
      ...data,
      clientOrganization: editOrg.trim() || data.clientOrganization,
      customerName: editCustomerName.trim() || data.customerName || 'Sarah',
      meetingDate: editDate.trim() || data.meetingDate,
      meetingContext: editContext.trim() || data.meetingContext,
    };
    updatedData.rawMarkdown = buildBrmMarkdown(updatedData);
    onUpdate(updatedData);
    setIsEditingMetadata(false);
  };

  const handleCancelMetadata = () => {
    setEditOrg(data.clientOrganization);
    setEditCustomerName(data.customerName || '');
    setEditDate(data.meetingDate);
    setEditContext(data.meetingContext);
    setIsEditingMetadata(false);
  };

  // Toggle Action Item Checkbox
  const toggleItemDone = (itemId: string) => {
    const updatedItems = data.actionItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, isDone: !item.isDone };
      }
      return item;
    });

    const isAllDoneNow = updatedItems.length > 0 && updatedItems.every((i) => i.isDone);
    if (isAllDoneNow) {
      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#38bdf8', '#34d399', '#f59e0b', '#ec4899'],
        });
      } catch {}
    }

    const updatedData = { ...data, actionItems: updatedItems };
    updatedData.rawMarkdown = buildBrmMarkdown(updatedData);
    onUpdate(updatedData);
  };

  // Delete Action Item
  const deleteActionItem = (itemId: string) => {
    const updatedItems = data.actionItems.filter((i) => i.id !== itemId);
    const updatedData = { ...data, actionItems: updatedItems };
    updatedData.rawMarkdown = buildBrmMarkdown(updatedData);
    onUpdate(updatedData);
  };

  // Add Action Item
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    const newItem: ActionItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tag: newActionTag.replace(/[\[\]]/g, ''),
      task: newActionText.trim(),
      isDone: false,
      tagType: parseTagType(newActionTag),
    };

    const updatedItems = [...data.actionItems, newItem];
    const updatedData = { ...data, actionItems: updatedItems };
    updatedData.rawMarkdown = buildBrmMarkdown(updatedData);
    onUpdate(updatedData);

    setNewActionText('');
    setIsAddingAction(false);
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    const textToCopy = buildBrmMarkdown(data);
    navigator.clipboard.writeText(textToCopy);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  // Copy Slack Format
  const handleCopySlack = () => {
    const slackText = `*🏢 ${data.clientOrganization} - ${data.meetingContext}* (${data.meetingDate})\n\n` +
      `*Stakeholders:* ${data.clientManagers.join(', ')} | *Internal:* ${data.internalTeams.join(', ')}\n\n` +
      `*Action Items:*\n` +
      data.actionItems.map((item) => `${item.isDone ? '✅' : '⬜'} *[${item.tag}]* ${item.task}`).join('\n');
    navigator.clipboard.writeText(slackText);
    setCopiedSlack(true);
    setTimeout(() => setCopiedSlack(false), 2000);
  };

  // Share via Email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`[BRM Update] ${data.clientOrganization} - ${data.meetingContext}`);
    const body = encodeURIComponent(buildBrmMarkdown(data));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Native share if supported
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.clientOrganization} - ${data.meetingContext}`,
          text: buildBrmMarkdown(data),
        });
      } catch {}
    } else {
      handleCopyMarkdown();
    }
  };

  // Statistics
  const totalActions = data.actionItems.length;
  const completedActions = data.actionItems.filter((i) => i.isDone).length;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const filteredItems = data.actionItems.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.tagType === activeFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{data.clientOrganization}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Structured Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{data.meetingContext}</span>
                <span>•</span>
                <span>{data.meetingDate}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {onSendToPhone && (
              <button
                onClick={onSendToPhone}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                title="Send this meeting data to your Android phone"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Send to Phone</span>
              </button>
            )}

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              title="Copy exact BRM Markdown schema"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedMarkdown ? 'Copied' : 'Markdown'}</span>
            </button>

            <button
              onClick={handleCopySlack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              title="Copy formatted for Slack"
            >
              {copiedSlack ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
              <span>Slack</span>
            </button>

            <button
              onClick={handleEmailShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              title="Email this summary to teams"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Email</span>
            </button>

            <button
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className={`p-1.5 rounded-xl text-xs font-medium border transition-colors ${
                showRawMarkdown
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Raw Schema View"
            >
              <FileCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Raw Markdown view if toggled */}
        {showRawMarkdown && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono">Raw Structured Markdown (Target Schema)</span>
              <button
                onClick={handleCopyMarkdown}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed max-h-60">
              {buildBrmMarkdown(data)}
            </pre>
          </div>
        )}
      </div>

      {/* 1. Client & Meeting Metadata (Editable) */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏢</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client & Meeting Metadata</h3>
          </div>
          <button
            onClick={() => {
              if (isEditingMetadata) {
                handleSaveMetadata();
              } else {
                setIsEditingMetadata(true);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isEditingMetadata
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isEditingMetadata ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit Metadata</span>
              </>
            )}
          </button>
        </div>

        {isEditingMetadata ? (
          <form onSubmit={handleSaveMetadata} className="space-y-3 p-3 bg-slate-950/70 border border-cyan-500/30 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Client Organization */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Client Organization
                </label>
                <input
                  type="text"
                  value={editOrg}
                  onChange={(e) => setEditOrg(e.target.value)}
                  placeholder="e.g. Acme Corp, Apex Financial"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  Customer Name (Primary Contact)
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  placeholder="e.g. Sarah, Marcus Vance, Dr. Thorne"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Meeting Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Meeting Date
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Today
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        setEditDate(y.toISOString().split('T')[0]);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Meeting Context */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Meeting Context
                </label>
                <input
                  type="text"
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                  placeholder="e.g. Governance Review, Monthly Sync"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Quick Context Suggestion Chips */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Quick context presets:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  'Governance Review',
                  'Monthly Sync',
                  'Quarterly Business Review (QBR)',
                  'Requirement Gathering',
                  'Contract & SLA Renewal',
                  'Executive Meet & Greet'
                ].map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setEditContext(ctx)}
                    className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                      editContext === ctx
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {ctx}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelMetadata}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Metadata
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Client Organization */}
            <div
              onClick={() => setIsEditingMetadata(true)}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-3 cursor-pointer group transition-all"
              title="Click to edit"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400">Client Organization</span>
                <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                {data.clientOrganization}
              </span>
            </div>

            {/* Customer Name */}
            <div
              onClick={() => setIsEditingMetadata(true)}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3 cursor-pointer group transition-all"
              title="Click to edit"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400">Customer Name</span>
                <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                {data.customerName || (data.clientManagers.length > 0 ? data.clientManagers[0] : 'None identified')}
              </span>
            </div>

            {/* Meeting Date */}
            <div
              onClick={() => setIsEditingMetadata(true)}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-3 cursor-pointer group transition-all"
              title="Click to change date"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400">Meeting Date</span>
                <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                {data.meetingDate}
              </span>
            </div>

            {/* Meeting Context */}
            <div
              onClick={() => setIsEditingMetadata(true)}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 rounded-xl p-3 cursor-pointer group transition-all"
              title="Click to edit context"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400">Meeting Context</span>
                <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                {data.meetingContext}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Key Stakeholders Mentioned */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">👥</span>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Key Stakeholders Mentioned</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Managers */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Client Managers
              </span>
              <span className="text-[10px] text-slate-400">{data.clientManagers.length} identified</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.clientManagers.map((mgr, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/50 text-cyan-200 border border-cyan-500/30 text-xs font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {mgr}
                </div>
              ))}
              {data.clientManagers.length === 0 && (
                <span className="text-xs text-slate-500 italic">None identified</span>
              )}
            </div>
          </div>

          {/* Internal Teams */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Internal Associates & Teams
              </span>
              <span className="text-[10px] text-slate-400">{data.internalTeams.length} teams</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.internalTeams.map((team, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/50 text-emerald-200 border border-emerald-500/30 text-xs font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {team}
                </div>
              ))}
              {data.internalTeams.length === 0 && (
                <span className="text-xs text-slate-500 italic">None identified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Feedback & Requirements Log */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📥</span>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Feedback & Requirements Log</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Feedback */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5 mb-2.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Client Feedback
            </span>
            <ul className="space-y-2">
              {data.clientFeedback.map((fb, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                  <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>{fb}</span>
                </li>
              ))}
              {data.clientFeedback.length === 0 && (
                <li className="text-xs text-slate-500 italic">None identified.</li>
              )}
            </ul>
          </div>

          {/* New Requirements */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              New Requirements
            </span>
            <ul className="space-y-2">
              {data.newRequirements.map((req, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                  <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>{req}</span>
                </li>
              ))}
              {data.newRequirements.length === 0 && (
                <li className="text-xs text-slate-500 italic">None identified.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Action Items & To-Do List */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Action Items & To-Do List</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {completedActions}/{totalActions} done
            </span>
          </div>

          {/* Add Item trigger */}
          <button
            onClick={() => setIsAddingAction(!isAddingAction)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All ({data.actionItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
            }`}
          >
            CRITICAL ({data.actionItems.filter((i) => i.tagType === 'CRITICAL').length})
          </button>
          <button
            onClick={() => setActiveFilter('GOV')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'GOV'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            GOV ({data.actionItems.filter((i) => i.tagType === 'GOV').length})
          </button>
          <button
            onClick={() => setActiveFilter('REQ')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'REQ'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
            }`}
          >
            REQ ({data.actionItems.filter((i) => i.tagType === 'REQ').length})
          </button>
          <button
            onClick={() => setActiveFilter('FOLLOW_UP')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'FOLLOW_UP'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
          >
            Follow-Up ({data.actionItems.filter((i) => i.tagType === 'FOLLOW_UP').length})
          </button>
        </div>

        {/* Add action item form */}
        {isAddingAction && (
          <form onSubmit={handleAddAction} className="mb-3 p-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl flex flex-col sm:flex-row gap-2">
            <select
              value={newActionTag}
              onChange={(e) => setNewActionTag(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="[CRITICAL]">[CRITICAL]</option>
              <option value="[GOV]">[GOV]</option>
              <option value="[REQ]">[REQ]</option>
              <option value="[Follow-Up]">[Follow-Up]</option>
              <option value="[Follow-Up - Client]">[Follow-Up - Client]</option>
              <option value="[REQ - Engineering]">[REQ - Engineering]</option>
            </select>
            <input
              type="text"
              placeholder="Action item task description..."
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingAction(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Action Items List */}
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const style = getTagStyle(item.tagType);
            return (
              <div
                key={item.id}
                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  item.isDone
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Interactive Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleItemDone(item.id)}
                  className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                >
                  {item.isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${style.badgeBg}`}
                    >
                      [{item.tag}]
                    </span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed transition-all ${
                      item.isDone ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {item.task}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => deleteActionItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/40">
              No action items under this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
