import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Lock,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  Eye,
  Search,
  LogOut,
  Layers,
  ArrowRight,
  GitMerge,
  History,
  ShieldCheck,
} from 'lucide-react';
import { CitizenReport, DistrictName, HP_DISTRICTS, ReportStatus } from '../types';
import { AppMode, ApiService, getLocalReports, saveLocalReports } from '../services/api';

interface AdminViewProps {
  appMode: AppMode;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  appMode,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
}) => {
  // Auth Form State
  const [email, setEmail] = useState<string>('analyst@drugwatch.hp');
  const [password, setPassword] = useState<string>('ShimlaWatch2026!');
  const [authError, setAuthError] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<'queue' | 'audit'>('queue');

  // Reports Queue State
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  // Transition form state
  const [targetStatus, setTargetStatus] = useState<ReportStatus>('Under Review');
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [duplicateTargetId, setDuplicateTargetId] = useState<string>('');
  const [duplicateSuggestions, setDuplicateSuggestions] = useState<any[]>([]);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string>('');

  // Load reports
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadReports();
    }
  }, [isAdminLoggedIn]);

  const loadReports = () => {
    const list = getLocalReports();
    setReports(list);
    if (list.length > 0 && !selectedReport) {
      setSelectedReport(list[0]);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (email === 'analyst@drugwatch.hp' && password === 'ShimlaWatch2026!') {
      setIsAdminLoggedIn(true);
      loadReports();
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setSelectedReport(null);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (districtFilter !== 'All' && r.district !== districtFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchToken = r.referenceToken.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchLoc = r.approximateLocation.toLowerCase().includes(q);
        if (!matchToken && !matchDesc && !matchLoc) return false;
      }
      return true;
    });
  }, [reports, statusFilter, districtFilter, searchQuery]);

  // Check duplicate candidates for selected report
  useEffect(() => {
    if (!selectedReport) {
      setDuplicateSuggestions([]);
      return;
    }
    const targetWords = new Set(
      `${selectedReport.approximateLocation} ${selectedReport.description}`.toLowerCase().split(/\s+/)
    );
    const suggestions = reports
      .filter(r => r.id !== selectedReport.id && r.district === selectedReport.district)
      .map(other => {
        const otherWords = new Set(
          `${other.approximateLocation} ${other.description}`.toLowerCase().split(/\s+/)
        );
        let overlap = 0;
        targetWords.forEach(w => {
          if (otherWords.has(w) && w.length > 3) overlap++;
        });
        const score = overlap / Math.max(1, targetWords.size);
        return {
          id: other.id,
          referenceToken: other.referenceToken,
          approximateLocation: other.approximateLocation,
          score: Math.min(1.0, Math.round(score * 100) / 100),
        };
      })
      .filter(s => s.score > 0.15)
      .sort((a, b) => b.score - a.score);

    setDuplicateSuggestions(suggestions);
  }, [selectedReport, reports]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setStatusUpdateMessage('');

    try {
      await ApiService.updateReportStatus(
        appMode,
        selectedReport.id,
        targetStatus,
        reviewerNote
      );

      setStatusUpdateMessage(`Status successfully updated to "${targetStatus}".`);
      setReviewerNote('');

      // Reload
      const updated = getLocalReports();
      setReports(updated);
      const reselected = updated.find(r => r.id === selectedReport.id);
      if (reselected) setSelectedReport(reselected);

      setTimeout(() => setStatusUpdateMessage(''), 3000);
    } catch (err: any) {
      setStatusUpdateMessage('Error updating report status.');
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center mx-auto shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Administrative Review Console
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Restricted portal for authorized anti-narcotics analysts and district review officers.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Personnel Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800 block mb-0.5">Evaluation Demonstration Credentials:</span>
              Email: <code className="font-mono text-slate-900">analyst@drugwatch.hp</code>
              <br />
              Password: <code className="font-mono text-slate-900">ShimlaWatch2026!</code>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In to Verification Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header with User Info */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Anti-Narcotics Verification Desk</h2>
            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
              Role: Senior Analyst
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Logged in as <span className="font-mono text-slate-200">analyst@drugwatch.hp</span> ·
            Himachal Pradesh Analytical Directorate
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveAdminTab(activeAdminTab === 'queue' ? 'audit' : 'queue')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors"
          >
            {activeAdminTab === 'queue' ? 'View Audit Trail' : 'Back to Reports Queue'}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900 text-red-300 text-xs font-medium rounded border border-red-800 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {activeAdminTab === 'audit' ? (
        /* Audit Trail View */
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Administrative Security & Audit Logs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable audit log of verification transitions, dataset schema validations, and staff logins.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between font-semibold text-slate-700 bg-slate-50 px-3 rounded">
              <span>Timestamp</span>
              <span>Action / Target</span>
              <span>Authorized Officer</span>
              <span>Details</span>
            </div>
            <div className="py-2.5 px-3 flex items-center justify-between text-slate-600">
              <span className="font-mono text-[11px] text-slate-500">2026-10-20 03:00 UTC</span>
              <span className="font-mono font-medium text-blue-700">AUTH_LOGIN_SUCCESS</span>
              <span className="text-slate-800">analyst@drugwatch.hp (Reviewer)</span>
              <span className="text-slate-500">Session authenticated for verification desk</span>
            </div>
            <div className="py-2.5 px-3 flex items-center justify-between text-slate-600">
              <span className="font-mono text-[11px] text-slate-500">2025-10-14 09:30 UTC</span>
              <span className="font-mono font-medium text-emerald-700">STATUS_UPDATE_VERIFIED</span>
              <span className="text-slate-800">analyst@drugwatch.hp (Admin)</span>
              <span className="text-slate-500">Verified Kangra pharmacy diversion report</span>
            </div>
            <div className="py-2.5 px-3 flex items-center justify-between text-slate-600">
              <span className="font-mono text-[11px] text-slate-500">2025-09-29 14:30 UTC</span>
              <span className="font-mono font-medium text-amber-700">MERGE_DUPLICATE_REPORT</span>
              <span className="text-slate-800">analyst@drugwatch.hp (Reviewer)</span>
              <span className="text-slate-500">Linked Baddi perimeter cluster to primary file</span>
            </div>
          </div>
        </div>
      ) : (
        /* Reports Queue Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Filterable Reports Queue */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pending Citizen Reports Queue</h3>
                <div className="text-[11px] text-slate-500">{filteredReports.length} reports in view</div>
              </div>
            </div>

            {/* Queue Filters */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={districtFilter}
                  onChange={e => setDistrictFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-medium"
                >
                  <option value="All">All Districts</option>
                  {HP_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by token or keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredReports.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No reports match active filters.
                </div>
              ) : (
                filteredReports.map(r => {
                  const isSelected = selectedReport?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-semibold text-xs text-slate-900">
                          {r.referenceToken}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            r.status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Under Review'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'Duplicate'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'Rejected'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-700 mt-1">
                        {r.district} · {r.incidentCategory}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        <span>{r.approximateLocation}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Report Verification & Action Workspace */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
            {selectedReport ? (
              <>
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Reviewing Report
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {selectedReport.referenceToken}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Received: {new Date(selectedReport.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Submitted Facts Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">District Jurisdiction</span>
                    <span className="font-semibold text-slate-800 text-sm">{selectedReport.district}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Incident Category</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {selectedReport.incidentCategory}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Reported Landmark / Sector</span>
                    <span className="font-medium text-slate-800">{selectedReport.approximateLocation}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Observed Date</span>
                    <span className="font-mono text-slate-800">{selectedReport.incidentDate}</span>
                  </div>
                </div>

                {/* Full Written Description */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Written Allegation / Context:
                  </span>
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>
                </div>

                {/* Optional Attached Evidence info */}
                {selectedReport.evidenceFileName && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs flex items-center justify-between text-blue-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700" />
                      <span>
                        Attached Evidence: <strong>{selectedReport.evidenceFileName}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-mono">
                      {((selectedReport.evidenceFileSize || 0) / 1024).toFixed(0)} KB · Safe Storage
                    </span>
                  </div>
                )}

                {/* Duplicate Report Suggestions Engine */}
                {duplicateSuggestions.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <GitMerge className="w-3.5 h-3.5" />
                      Potential Duplicate Cluster Detected ({duplicateSuggestions.length} candidates)
                    </div>
                    <div className="space-y-1">
                      {duplicateSuggestions.slice(0, 2).map(s => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-white/80 p-2 rounded border border-amber-200/60"
                        >
                          <span className="font-mono font-medium text-slate-800">{s.referenceToken}</span>
                          <span className="text-slate-600 truncate max-w-xs">{s.approximateLocation}</span>
                          <span className="font-mono text-amber-800 font-semibold text-[11px]">
                            {Math.round(s.score * 100)}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Transition Action Form */}
                <form onSubmit={handleStatusChange} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    Update Administrative Verification Status
                  </div>

                  {statusUpdateMessage && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
                      {statusUpdateMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        New Verification Status
                      </label>
                      <select
                        value={targetStatus}
                        onChange={e => setTargetStatus(e.target.value as ReportStatus)}
                        className="w-full bg-slate-50 border border-slate-200 rounded text-xs px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Under Review">Under Review (In Progress)</option>
                        <option value="Verified">Verified (Confirmed Actionable)</option>
                        <option value="Duplicate">Duplicate (Merge with Cluster)</option>
                        <option value="Rejected">Rejected (Out of NDPS Scope)</option>
                        <option value="Pending">Pending (Reset to Queue)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Reviewer Notes (Recorded in Audit Trail)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cross-checked with district check post patrol"
                        value={reviewerNote}
                        onChange={e => setReviewerNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded text-xs px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Changes are appended to the permanent audit log.
                    </span>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors shadow-xs"
                    >
                      Commit Status Change
                    </button>
                  </div>
                </form>

                {/* Audit History Timeline */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">Status History Trail:</div>
                  <div className="space-y-1.5">
                    {selectedReport.statusHistory.map((h, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{h.status}</span>
                          <span className="text-slate-500 text-[11px]">· {h.note || 'No notes'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-xs text-slate-400">
                Select a report from the queue on the left to review details and perform administrative
                verification.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
