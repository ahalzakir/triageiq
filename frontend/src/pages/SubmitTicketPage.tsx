import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketApi } from '../api/tickets';
import { Ticket } from '../types/ticket';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const SubmitTicketPage: React.FC = () => {
  const navigate = useNavigate();

  const [nameOrEmail, setNameOrEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState('web');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triagedTicket, setTriagedTicket] = useState<Ticket | null>(null);

  const charCount = body.trim().length;
  const isBodyValid = charCount >= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOrEmail.trim()) {
      setError('Please enter your name or email.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an issue title.');
      return;
    }
    if (!isBodyValid) {
      setError(`Description is too brief (${charCount}/50 chars). Please provide at least 50 characters so the AI can triage effectively.`);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const ticket = await ticketApi.createTicket({
        title: title.trim(),
        body: body.trim(),
        submitted_by: nameOrEmail.trim(),
        source,
      });
      setTriagedTicket(ticket);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit ticket. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setNameOrEmail('');
    setTitle('');
    setBody('');
    setTriagedTicket(null);
    setError(null);
  };

  const formatDeadline = (iso?: string) => {
    if (!iso) return 'Not calculated';
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini AI Auto-Triage</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#f1f5f9] tracking-tight sm:text-4xl">
          Submit IT Support Request
        </h1>
        <p className="mt-2 text-sm text-[#94a3b8] max-w-xl mx-auto">
          Our autonomous AI triage engine classifies your request severity, assigns an SLA deadline, and dispatches to the right engineer queue in under 3 seconds.
        </p>
      </div>

      {/* Loading Modal / Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-indigo-500/50 rounded-xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl space-y-4 animate-pulse">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-ping"></div>
              <div className="w-16 h-16 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-indigo-500 border-l-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400 animate-bounce" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f1f5f9]">AI is triaging your ticket...</h3>
              <p className="text-xs text-[#94a3b8]">Analyzing symptom impact & assigning SLA...</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Card — Money Demo Moment */}
      {triagedTicket ? (
        <div className="bg-[#1e293b] border-2 border-indigo-500/60 rounded-xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">
                  Ticket Triaged & Dispatched
                </span>
                <h3 className="text-lg font-bold text-[#f1f5f9]">
                  Ticket #{triagedTicket.id.substring(0, 8)}
                </h3>
              </div>
            </div>
            <PriorityBadge priority={triagedTicket.priority} size="md" />
          </div>

          {/* AI Reasoning Banner */}
          <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Reasoning & Classification</span>
              </div>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                {Math.round((triagedTicket.ai_confidence ?? triagedTicket.aiConfidence ?? 0) * 100)}% Confidence
              </span>
            </div>
            <p className="text-sm text-indigo-100 italic bg-slate-900/50 p-3 rounded border border-slate-800">
              "{triagedTicket.ai_reasoning || triagedTicket.aiReasoning}"
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-900/60 rounded-lg border border-[#334155]">
              <span className="text-[11px] uppercase font-semibold text-[#94a3b8] block">Category</span>
              <span className="text-[#f1f5f9] font-medium capitalize mt-1 block">
                {triagedTicket.category}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-[#334155]">
              <span className="text-[11px] uppercase font-semibold text-[#94a3b8] block">Assigned Team</span>
              <span className="text-[#f1f5f9] font-medium mt-1 block">
                {triagedTicket.assigned_team || triagedTicket.assignedTeam?.name || 'General IT'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-[#334155]">
              <span className="text-[11px] uppercase font-semibold text-[#94a3b8] block">Assigned Agent</span>
              <span className="text-[#f1f5f9] font-medium mt-1 block">
                {triagedTicket.assigned_agent || triagedTicket.assignedAgent?.name || 'Assigned via load queue'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-[#334155] col-span-2 sm:col-span-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-semibold text-[#94a3b8] block">SLA Target Deadline</span>
                <span className="text-amber-300 font-semibold mt-0.5 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatDeadline(triagedTicket.sla_deadline || triagedTicket.slaDeadline)}</span>
                </span>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                Auto-monitored
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/30"
            >
              <span>View in Agent Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-[#334155] transition-colors"
            >
              Submit Another Ticket
            </button>
          </div>
        </div>
      ) : (
        /* Ticket Intake Form */
        <form
          onSubmit={handleSubmit}
          className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submitter & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2">
                Your Name or Email <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nameOrEmail}
                onChange={(e) => setNameOrEmail(e.target.value)}
                placeholder="e.g. alex.chen@enterprise.com"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2">
                Intake Channel
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors capitalize"
              >
                <option value="web">🌐 Web Portal</option>
                <option value="slack">💬 Slack</option>
                <option value="gmail">📧 Gmail</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#f1f5f9] uppercase tracking-wider mb-2">
              Issue Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue (e.g. Cannot access production PostgreSQL database)"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Description (min 50 chars) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#f1f5f9] uppercase tracking-wider">
                Describe the Issue <span className="text-red-400">*</span>
              </label>
              <span
                className={`text-xs ${
                  isBodyValid ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {charCount}/50 characters minimum
              </span>
            </div>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Please provide specific details, error messages, and business impact so the AI triage engine can accurately classify priority and assign the right specialist..."
              className={`w-full bg-[#0f172a] border rounded-lg px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                body.length > 0 && !isBodyValid
                  ? 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500'
                  : 'border-[#334155] focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
            {!isBodyValid && body.length > 0 && (
              <p className="mt-1 text-xs text-amber-400">
                Please add {50 - charCount} more character(s) to enable AI auto-classification.
              </p>
            )}
          </div>

          {/* Quick Examples Helper */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-[#334155] text-xs text-[#94a3b8] space-y-1.5">
            <span className="font-semibold text-slate-300 block">💡 Quick Sample Scenarios:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTitle('Entire production payment gateway throwing 500 error');
                  setBody('Customers across Europe and US are completely unable to complete checkout. All payment transactions are failing with internal server error 500 since 10 minutes ago.');
                }}
                className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-[11px] text-red-300 border border-red-500/30 transition-colors"
              >
                Load P0 Sample (Production Down)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('Need Okta access provisioned for new billing team member');
                  setBody('Please grant standard financial dashboard read-only access to our newly onboarded team member starting next Monday morning.');
                }}
                className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-[11px] text-yellow-300 border border-yellow-500/30 transition-colors"
              >
                Load P2 Sample (Access Request)
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={!isBodyValid || !title.trim() || !nameOrEmail.trim()}
            className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Submit Ticket & Trigger AI Triage</span>
          </button>
        </form>
      )}
    </div>
  );
};
