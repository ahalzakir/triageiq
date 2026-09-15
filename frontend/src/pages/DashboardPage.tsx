import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/tickets';
import { Ticket } from '../types/ticket';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { TicketDetailDrawer } from '../components/TicketDetailDrawer';
import {
  Search,
  RefreshCw,
  MessageSquare,
  Mail,
  Globe,
  Inbox,
  AlertCircle,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Fetch tickets query
  const {
    data: ticketData,
    isLoading: isTicketsLoading,
    isError: isTicketsError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, categoryFilter, teamFilter],
    queryFn: () =>
      ticketApi.getTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        team: teamFilter || undefined,
        size: 50,
      }),
    refetchInterval: 10000, // Background polling every 10s
  });

  // Fetch agents & teams query
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: ticketApi.getAgents,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: ticketApi.getTeams,
  });

  // Fetch selected ticket detail + events
  const { data: ticketDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['ticketDetail', selectedTicketId],
    queryFn: () => (selectedTicketId ? ticketApi.getTicketById(selectedTicketId) : null),
    enabled: !!selectedTicketId,
  });

  // Mutations for actions
  const reassignMutation = useMutation({
    mutationFn: ({ ticketId, agentId }: { ticketId: string; agentId: string }) =>
      ticketApi.assignTicket(ticketId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status, notes }: { ticketId: string; status: string; notes?: string }) =>
      ticketApi.updateStatus(ticketId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: ({ ticketId, notes }: { ticketId: string; notes?: string }) =>
      ticketApi.escalateTicket(ticketId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketId] });
    },
  });

  // Action handlers
  const handleReassign = async (agentId: string) => {
    if (selectedTicketId) {
      await reassignMutation.mutateAsync({ ticketId: selectedTicketId, agentId });
    }
  };

  const handleEscalate = async (notes: string) => {
    if (selectedTicketId) {
      await escalateMutation.mutateAsync({ ticketId: selectedTicketId, notes });
    }
  };

  const handleResolve = async (notes: string) => {
    if (selectedTicketId) {
      await statusMutation.mutateAsync({ ticketId: selectedTicketId, status: 'resolved', notes });
    }
  };

  const tickets: Ticket[] = ticketData?.content || [];

  // Client search filter (title or submitter)
  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.submitted_by || t.submittedBy || '').toLowerCase().includes(q) ||
      (t.assigned_agent || t.assignedAgent?.name || '').toLowerCase().includes(q)
    );
  });

  const resetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setTeamFilter('');
    setSearchQuery('');
  };

  const sourceIcon = (src?: string) => {
    switch (src?.toLowerCase()) {
      case 'slack':
        return (
          <span title="Slack Webhook">
            <MessageSquare className="w-4 h-4 text-pink-400" />
          </span>
        );
      case 'gmail':
        return (
          <span title="Gmail Pub/Sub">
            <Mail className="w-4 h-4 text-amber-400" />
          </span>
        );
      default:
        return (
          <span title="Web Portal">
            <Globe className="w-4 h-4 text-cyan-400" />
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9] tracking-tight">
              IT Support Agent Queue
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {filteredTickets.length} active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Real-time automated ticket classification with live SLA countdown monitoring.
          </p>
        </div>

        <button
          onClick={() => refetchTickets()}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-[#334155] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Layout: Sidebar Filters + Ticket Table */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Filter Panel */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-[#f1f5f9] uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Queue Filters</span>
            </div>
            {(statusFilter || priorityFilter || categoryFilter || teamFilter || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase mb-1.5">
              Quick Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, user, agent..."
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg pl-8 pr-3 py-2 text-xs text-[#f1f5f9] placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase mb-1.5">
              Ticket Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase mb-1.5">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="P0">P0 — Critical Breach / Outage</option>
              <option value="P1">P1 — Major Feature Impairment</option>
              <option value="P2">P2 — Standard Single User Issue</option>
              <option value="P3">P3 — Low / Informational</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase mb-1.5">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="">All Categories</option>
              <option value="hardware">Hardware</option>
              <option value="access">Access & Identity</option>
              <option value="software">Software</option>
              <option value="network">Network Operations</option>
              <option value="hr_adjacent">HR Adjacent</option>
              <option value="other">Other / General</option>
            </select>
          </div>

          {/* Team Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase mb-1.5">
              Assigned Team
            </label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="lg:col-span-3">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
            {isTicketsLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-sm">Loading ticket queue...</p>
              </div>
            ) : isTicketsError ? (
              <div className="p-8 text-center text-red-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="text-sm font-medium">Failed to load tickets from backend</p>
                <p className="text-xs text-slate-400">Ensure the Spring Boot backend is running on port 8080</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-semibold text-slate-300">No tickets found in queue</h4>
                <p className="text-xs text-[#94a3b8]">
                  Submit a new ticket or adjust filter parameters to view items.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-[#334155] text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-3">Submitted By</th>
                      <th className="py-3.5 px-3 text-center">Src</th>
                      <th className="py-3.5 px-3">Priority</th>
                      <th className="py-3.5 px-3">Category</th>
                      <th className="py-3.5 px-3">Agent</th>
                      <th className="py-3.5 px-4">SLA Countdown</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60 text-xs text-slate-300">
                    {filteredTickets.map((ticket) => {
                      const agentName =
                        ticket.assigned_agent || ticket.assignedAgent?.name || 'Unassigned';

                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        >
                          {/* ID */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {ticket.id.substring(0, 8)}
                          </td>

                          {/* Title */}
                          <td className="py-3.5 px-4 max-w-xs truncate font-medium text-[#f1f5f9]">
                            {ticket.title}
                          </td>

                          {/* Submitted By */}
                          <td className="py-3.5 px-3 truncate max-w-[130px] text-slate-300">
                            {ticket.submitted_by || ticket.submittedBy}
                          </td>

                          {/* Source */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex justify-center">
                              {sourceIcon(ticket.source)}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-3">
                            <PriorityBadge priority={ticket.priority} size="sm" />
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-3 capitalize text-slate-300">
                            {ticket.category}
                          </td>

                          {/* Agent */}
                          <td className="py-3.5 px-3 truncate max-w-[120px] text-slate-200">
                            {agentName}
                          </td>

                          {/* SLA Timer */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <SlaCountdown
                              deadlineIso={ticket.sla_deadline || ticket.slaDeadline}
                              isResolved={ticket.status === 'resolved'}
                            />
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <StatusBadge status={ticket.status} />
                          </td>

                          {/* Drawer Arrow */}
                          <td className="py-3.5 px-2 text-right text-slate-500 group-hover:text-indigo-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer
        ticket={ticketDetail?.ticket || null}
        events={ticketDetail?.events || []}
        agents={agents}
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onReassign={handleReassign}
        onEscalate={handleEscalate}
        onResolve={handleResolve}
        isLoadingEvents={isDetailLoading}
      />
    </div>
  );
};
