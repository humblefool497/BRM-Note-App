export type TagType = 'CRITICAL' | 'GOV' | 'REQ' | 'FOLLOW_UP' | 'OTHER';

export interface ActionItem {
  id: string;
  tag: string;
  task: string;
  isDone: boolean;
  tagType: TagType;
  assignee?: string;
  dueDate?: string;
}

export interface ParsedCrmData {
  id: string;
  timestamp: number;
  clientOrganization: string;
  customerName?: string;
  meetingDate: string;
  meetingContext: string;
  clientManagers: string[];
  internalTeams: string[];
  clientFeedback: string[];
  newRequirements: string[];
  actionItems: ActionItem[];
  rawNotes: string;
  rawMarkdown: string;
}

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  label: string;
}

export function parseTagType(tag: string): TagType {
  const upper = tag.toUpperCase();
  if (upper.includes('CRITICAL')) return 'CRITICAL';
  if (upper.includes('GOV')) return 'GOV';
  if (upper.includes('REQ')) return 'REQ';
  if (upper.includes('FOLLOW-UP') || upper.includes('FOLLOWUP') || upper.includes('FOLLOW UP')) return 'FOLLOW_UP';
  return 'OTHER';
}

export function getTagStyle(type: TagType): TagStyle {
  switch (type) {
    case 'CRITICAL':
      return {
        bg: 'bg-rose-950/60',
        text: 'text-rose-300',
        border: 'border-rose-500/40',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: 'CRITICAL',
      };
    case 'GOV':
      return {
        bg: 'bg-amber-950/60',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: 'GOV',
      };
    case 'REQ':
      return {
        bg: 'bg-sky-950/60',
        text: 'text-sky-300',
        border: 'border-sky-500/40',
        badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        label: 'REQ',
      };
    case 'FOLLOW_UP':
      return {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: 'FOLLOW-UP',
      };
    default:
      return {
        bg: 'bg-slate-800/60',
        text: 'text-slate-300',
        border: 'border-slate-700/60',
        badgeBg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
        label: 'ACTION',
      };
  }
}
