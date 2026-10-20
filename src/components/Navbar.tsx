import React from 'react';
import { Shield, PhoneCall, AlertTriangle, Database, Activity } from 'lucide-react';
import { AppMode } from '../services/api';

export type ActiveTab =
  | 'dashboard'
  | 'report'
  | 'network'
  | 'hotspots'
  | 'data'
  | 'admin'
  | 'about';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  appMode,
  setAppMode,
  isAdminLoggedIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm">
      {/* Emergency Helpline Strip */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800 text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Official Emergency Channels:
          </span>
          <span>Himachal Pradesh Police: <strong className="text-white font-mono">112</strong></span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span>Nasha Mukt Bharat Toll-Free: <strong className="text-white font-mono">1908</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Mode:</span>
          <button
            onClick={() => setAppMode(appMode === 'DEMO' ? 'API' : 'DEMO')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              appMode === 'DEMO'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
            title="Toggle between GitHub Pages Offline Demo and Live API mode"
          >
            {appMode === 'DEMO' ? 'Demo Mode (Offline)' : 'Live API Mode'}
          </button>
        </div>
      </div>

      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (4-5 single-line links) - Zone 3 (1 primary action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            HP
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">DrugWatch HP</span>
            <span className="text-[10px] font-normal text-slate-400 leading-none">Prevention & Analysis</span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard' ? 'text-white border-b-2 border-blue-500 pb-0.5' : ''
            }`}
          >
            Official Dashboard
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'report' ? 'text-white border-b-2 border-blue-500 pb-0.5' : ''
            }`}
          >
            Report Incident
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'network' ? 'text-white border-b-2 border-blue-500 pb-0.5' : ''
            }`}
          >
            Case Analysis
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'hotspots' ? 'text-white border-b-2 border-blue-500 pb-0.5' : ''
            }`}
          >
            Hotspot Analysis
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'data' ? 'text-white border-b-2 border-blue-500 pb-0.5' : ''
            }`}
          >
            Data Tools
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'about' ? 'text-white border-b-2 border-blue-500 pb-0.5' : ''
            }`}
          >
            About & Ethics
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isAdminLoggedIn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : activeTab === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isAdminLoggedIn ? 'Admin Active' : 'Admin Console'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-900 border-t border-slate-800 gap-4 text-xs font-medium text-slate-300 no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`whitespace-nowrap ${activeTab === 'dashboard' ? 'text-white font-bold' : ''}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`whitespace-nowrap ${activeTab === 'report' ? 'text-white font-bold' : ''}`}
        >
          Report Incident
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`whitespace-nowrap ${activeTab === 'network' ? 'text-white font-bold' : ''}`}
        >
          Case Analysis
        </button>
        <button
          onClick={() => setActiveTab('hotspots')}
          className={`whitespace-nowrap ${activeTab === 'hotspots' ? 'text-white font-bold' : ''}`}
        >
          Hotspot Analysis
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`whitespace-nowrap ${activeTab === 'data' ? 'text-white font-bold' : ''}`}
        >
          Data Tools
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`whitespace-nowrap ${activeTab === 'about' ? 'text-white font-bold' : ''}`}
        >
          About & Ethics
        </button>
      </div>
    </header>
  );
};
