import React, { useState } from 'react';
import { X, Search, Clock, Building2, ChevronRight, Trash2, Calendar, FileText } from 'lucide-react';
import { ParsedCrmData } from '../types/crm';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ParsedCrmData[];
  onSelect: (item: ParsedCrmData) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.clientOrganization.toLowerCase().includes(q) ||
      item.meetingContext.toLowerCase().includes(q) ||
      item.clientManagers.some((m) => m.toLowerCase().includes(q)) ||
      item.rawNotes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Meeting Archive</h3>
              <p className="text-[11px] text-slate-400">{history.length} structured meetings saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/30">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client, context, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="group relative bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 cursor-pointer transition-all"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {item.clientOrganization}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {item.meetingDate}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-2 truncate">
                {item.meetingContext}
              </p>

              <div className="flex items-center justify-between text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                  {item.actionItems.length} actions ({item.actionItems.filter(i => i.isDone).length} done)
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-500 italic">
              {searchTerm ? 'No matching meetings found.' : 'No meeting logs saved yet.'}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-[11px] text-rose-400 hover:underline"
            >
              Clear All History
            </button>
            <span className="text-[10px] text-slate-500">Stored in browser local storage</span>
          </div>
        )}
      </div>
    </div>
  );
};
