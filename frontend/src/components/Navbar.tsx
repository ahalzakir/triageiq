import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Send, BarChart2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const activeClass = "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30";
  const inactiveClass = "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60";

  return (
    <header className="bg-[#1e293b] border-b border-[#334155] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-[#f1f5f9] tracking-tight">TriageIQ</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  AI Triage
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] hidden sm:block">Autonomous IT Helpdesk Dispatcher</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink
              to="/submit"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? activeClass : inactiveClass
                }`
              }
            >
              <Send className="w-4 h-4" />
              <span>Submit Ticket</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? activeClass : inactiveClass
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Agent Queue</span>
            </NavLink>

            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? activeClass : inactiveClass
                }`
              }
            >
              <BarChart2 className="w-4 h-4" />
              <span>Metrics</span>
            </NavLink>
          </nav>

          {/* SLA Engine Status indicator */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded border border-[#334155]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Gemini 2.0 Flash: <strong className="text-slate-200">Active</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
