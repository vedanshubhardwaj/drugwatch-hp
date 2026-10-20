/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardView } from './views/DashboardView';
import { ReportIncidentView } from './views/ReportIncidentView';
import { CaseNetworkView } from './views/CaseNetworkView';
import { HotspotAnalysisView } from './views/HotspotAnalysisView';
import { DataToolsView } from './views/DataToolsView';
import { AdminView } from './views/AdminView';
import { AboutView } from './views/AboutView';
import { AppMode, getStoredMode, setStoredMode } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [appMode, setAppModeState] = useState<AppMode>('DEMO');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const initialMode = getStoredMode();
    setAppModeState(initialMode);
  }, []);

  const handleSetAppMode = (mode: AppMode) => {
    setAppModeState(mode);
    setStoredMode(mode);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-800 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appMode={appMode}
        setAppMode={handleSetAppMode}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            appMode={appMode}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}
        {activeTab === 'report' && <ReportIncidentView appMode={appMode} />}
        {activeTab === 'network' && <CaseNetworkView appMode={appMode} />}
        {activeTab === 'hotspots' && <HotspotAnalysisView appMode={appMode} />}
        {activeTab === 'data' && (
          <DataToolsView
            appMode={appMode}
            isAdminLoggedIn={isAdminLoggedIn}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView
            appMode={appMode}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
          />
        )}
        {activeTab === 'about' && <AboutView />}
      </main>

      {/* Public Interest Footer */}
      <Footer />
    </div>
  );
}
