import React from 'react';
import { Agent } from '../types/ticket';
import { X, User, CheckCircle2 } from 'lucide-react';

interface AgentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  currentAgentId?: string;
  onSelectAgent: (agentId: string) => void;
  isLoading?: boolean;
}

export const AgentPickerModal: React.FC<AgentPickerModalProps> = ({
  isOpen,
  onClose,
  agents,
  currentAgentId,
  onSelectAgent,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334155]">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-[#f1f5f9]">Reassign Ticket to Agent</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agent List */}
        <div className="max-h-80 overflow-y-auto p-4 space-y-2">
          {agents.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No agents found</div>
          ) : (
            agents.map((agent) => {
              const isSelected = agent.id === currentAgentId;
              const load = agent.current_load ?? agent.currentLoad ?? 0;
              const teamName = agent.team?.name || 'General IT';

              return (
                <button
                  key={agent.id}
                  disabled={isSelected || isLoading}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`w-full text-left p-3 rounded-md border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/40 cursor-default opacity-75'
                      : 'bg-slate-900/50 border-[#334155] hover:border-indigo-500/50 hover:bg-slate-800/80 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-indigo-300 border border-slate-700">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#f1f5f9] flex items-center space-x-1.5">
                        <span>{agent.name}</span>
                        {isSelected && (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/20 px-1.5 py-0.2 rounded">Current</span>
                        )}
                      </div>
                      <div className="text-xs text-[#94a3b8]">{teamName}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">
                      Load: <strong className={load === 0 ? 'text-emerald-400' : 'text-slate-200'}>{load}</strong>
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/50 border-t border-[#334155] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
