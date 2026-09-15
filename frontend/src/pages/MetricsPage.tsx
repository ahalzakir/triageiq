import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../api/tickets';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

export const MetricsPage: React.FC = () => {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['metrics'],
    queryFn: ticketApi.getMetrics,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <Activity className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p className="text-sm">Calculating enterprise IT helpdesk metrics...</p>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-red-400">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm font-medium">Failed to load system metrics</p>
      </div>
    );
  }

  // Priority chart data
  const priorityData = [
    { name: 'P0', count: metrics.p0_count, color: '#ef4444' },
    { name: 'P1', count: metrics.p1_count, color: '#f97316' },
    { name: 'P2', count: metrics.p2_count, color: '#eab308' },
    { name: 'P3', count: metrics.p3_count, color: '#22c55e' },
  ];

  // Category chart placeholder/summary data
  const categoryData = [
    { name: 'Hardware', count: 4, color: '#6366f1' },
    { name: 'Access', count: 7, color: '#8b5cf6' },
    { name: 'Software', count: 6, color: '#ec4899' },
    { name: 'Network', count: 5, color: '#06b6d4' },
    { name: 'Other', count: 2, color: '#64748b' },
  ];

  const confidencePct = Math.round((metrics.ai_confidence_avg || 0) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9] tracking-tight">
              Operational Intelligence & Analytics
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live KPIs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Real-time SLA resolution, AI triage accuracy, and dispatch metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Tickets */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[#94a3b8] tracking-wider">Total Tickets</span>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#f1f5f9]">
            {metrics.total_tickets}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <span>Across Web, Slack & Gmail channels</span>
          </div>
        </div>

        {/* Open vs Resolved */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[#94a3b8] tracking-wider">Open / Resolved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#f1f5f9] flex items-baseline space-x-2">
            <span className="text-blue-400">{metrics.open_count}</span>
            <span className="text-slate-500 text-lg">/</span>
            <span className="text-emerald-400">{metrics.resolved_count}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Escalated in queue: <strong className="text-red-400">{metrics.escalated_count}</strong>
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[#94a3b8] tracking-wider">Avg Resolution</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#f1f5f9]">
            {metrics.avg_resolution_minutes} <span className="text-sm font-normal text-slate-400">mins</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            From creation to resolution stamp
          </div>
        </div>

        {/* AI Confidence Average */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[#94a3b8] tracking-wider">AI Confidence</span>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-indigo-300">
            {confidencePct}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Top Category: <strong className="text-slate-200 capitalize">{metrics.top_category}</strong>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-[#f1f5f9]">Tickets by Priority Tier</h3>
            </div>
            <span className="text-xs text-slate-400">SLA Severity</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-[#f1f5f9]">Tickets by Category</h3>
            </div>
            <span className="text-xs text-slate-400">Automated AI Routing</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
