import React, { useState } from 'react';
import { Ticket, TicketEvent, Agent } from '../types/ticket';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import { AgentPickerModal } from './AgentPickerModal';
import {
  X,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  UserPlus,
  Calendar,
  History,
  Mail,
  MessageSquare,
  Globe,
} from 'lucide-react';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  events: TicketEvent[];
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
  onReassign: (agentId: string) => Promise<void>;
  onEscalate: (notes: string) => Promise<void>;
  onResolve: (notes: string) => Promise<void>;
  isLoadingEvents?: boolean;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  events,
  agents,
  isOpen,
  onClose,
  onReassign,
  onEscalate,
  onResolve,
  isLoadingEvents,
}) => {
  const [isAgentPickerOpen, setIsAgentPickerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen || !ticket) return null;

  const confidencePct = Math.round((ticket.ai_confidence ?? ticket.aiConfidence ?? 0) * 100);
  const agentName = ticket.assigned_agent || ticket.assignedAgent?.name || 'Unassigned';
  const teamName = ticket.assigned_team || ticket.assignedTeam?.name || 'Unassigned';
  const isResolved = ticket.status === 'resolved';

  const handleEscalateClick = async () => {
    if (confirm(`Escalate priority of ticket "${ticket.title}"?`)) {
      setIsActionLoading(true);
      try {
        await onEscalate('Manual escalation requested by agent from detail panel');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleResolveClick = async () => {
    const notes = prompt('Enter resolution notes (optional):', 'Issue verified and resolved successfully.');
    if (notes !== null) {
      setIsActionLoading(true);
      try {
        await onResolve(notes);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleSelectAgent = async (agentId: string) => {
    setIsActionLoading(true);
    try {
      await onReassign(agentId);
      setIsAgentPickerOpen(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  const sourceIcon = (src?: string) => {
    switch (src?.toLowerCase()) {
      case 'slack':
        return <MessageSquare className="w-3.5 h-3.5 text-pink-400" />;
      case 'gmail':
        return <Mail className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#0f172a] border-l border-[#334155] shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out">
        {/* Top bar */}
        <div className="p-5 border-b border-[#334155] bg-[#1e293b] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">
              {ticket.id.substring(0, 8)}...
            </span>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        {!isResolved && (
          <div className="px-5 py-3 bg-[#1e293b]/70 border-b border-[#334155] flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                disabled={isActionLoading}
                onClick={() => setIsAgentPickerOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reassign Agent</span>
              </button>

              <button
                disabled={isActionLoading || ticket.priority === 'P0'}
                onClick={handleEscalateClick}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors disabled:opacity-50"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Escalate Priority</span>
              </button>
            </div>

            <button
              disabled={isActionLoading}
              onClick={handleResolveClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-100 bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Resolved</span>
            </button>
          </div>
        )}

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Body */}
          <div>
            <h2 className="text-xl font-bold text-[#f1f5f9] leading-snug">{ticket.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#94a3b8]">
              <span className="flex items-center space-x-1">
                {sourceIcon(ticket.source)}
                <span className="capitalize">{ticket.source}</span>
              </span>
              <span>•</span>
              <span>Submitted by <strong className="text-slate-200">{ticket.submitted_by || ticket.submittedBy}</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(ticket.created_at || ticket.createdAt || '').toLocaleString()}</span>
              </span>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-[#1e293b] border border-[#334155] text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {ticket.body}
            </div>
          </div>

          {/* AI Triage Card */}
          <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Gemini AI Autonomous Triage
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/40">
                {confidencePct}% Confidence
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${confidencePct}%` }}
              />
            </div>

            <div className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded border border-slate-800">
              "{ticket.ai_reasoning || ticket.aiReasoning || 'Auto-classified based on ticket symptoms and system impact.'}"
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
              <span className="text-[11px] text-[#94a3b8] uppercase font-semibold">Category</span>
              <div className="mt-1 text-sm font-medium text-[#f1f5f9] capitalize">{ticket.category}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
              <span className="text-[11px] text-[#94a3b8] uppercase font-semibold">Assigned Team</span>
              <div className="mt-1 text-sm font-medium text-[#f1f5f9]">{teamName}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
              <span className="text-[11px] text-[#94a3b8] uppercase font-semibold">Assigned Agent</span>
              <div className="mt-1 text-sm font-medium text-[#f1f5f9]">{agentName}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
              <span className="text-[11px] text-[#94a3b8] uppercase font-semibold">SLA Status</span>
              <div className="mt-1">
                <SlaCountdown
                  deadlineIso={ticket.sla_deadline || ticket.slaDeadline}
                  isResolved={isResolved}
                />
              </div>
            </div>
          </div>

          {/* Event Timeline */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Audit Trail & History
              </h3>
            </div>

            {isLoadingEvents ? (
              <div className="text-xs text-slate-500 py-4 text-center">Loading audit log...</div>
            ) : events.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No logged events yet</div>
            ) : (
              <div className="relative border-l-2 border-slate-700 ml-3 space-y-4 pl-4 py-1">
                {events.map((evt) => (
                  <div key={evt.id} className="relative group">
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-slate-800 border-2 border-indigo-400" />
                    <div className="p-3 rounded-md bg-[#1e293b] border border-[#334155] text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-slate-200 capitalize">
                          {evt.event_type}
                        </span>
                        <span>{new Date(evt.created_at || evt.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-300">{evt.notes}</p>
                      <div className="text-[10px] text-slate-500">By: {evt.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Agent Picker Modal */}
      <AgentPickerModal
        isOpen={isAgentPickerOpen}
        onClose={() => setIsAgentPickerOpen(false)}
        agents={agents}
        currentAgentId={ticket.assigned_agent_id || ticket.assignedAgent?.id}
        onSelectAgent={handleSelectAgent}
        isLoading={isActionLoading}
      />
    </>
  );
};
