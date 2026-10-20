import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Search,
  Lock,
  Upload,
  Clock,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { DistrictName, HP_DISTRICTS, IncidentCategory } from '../types';
import { AppMode, ApiService } from '../services/api';

interface ReportIncidentViewProps {
  appMode: AppMode;
}

export const ReportIncidentView: React.FC<ReportIncidentViewProps> = ({ appMode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'submit' | 'lookup'>('submit');

  // Form State
  const [incidentCategory, setIncidentCategory] = useState<IncidentCategory>(
    'Suspicious Distribution Point'
  );
  const [district, setDistrict] = useState<DistrictName>('Solan');
  const [approximateLocation, setApproximateLocation] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Submission Result State
  const [submissionResult, setSubmissionResult] = useState<{
    referenceToken: string;
    district: string;
    submissionMode: string;
    message: string;
    emergencyNotice: string;
  } | null>(null);
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);

  // Status Lookup State
  const [lookupToken, setLookupToken] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);

  // File validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (!e.target.files || e.target.files.length === 0) {
      setEvidenceFile(null);
      return;
    }
    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setFileError('Invalid file format. Only JPEG, PNG, WEBP, or PDF files are accepted.');
      setEvidenceFile(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      setFileError('File exceeds the 10 MB size safety threshold.');
      setEvidenceFile(null);
      return;
    }

    setEvidenceFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (description.trim().length < 15) {
      setSubmitError('Description must be at least 15 characters to provide sufficient context.');
      return;
    }

    if (!approximateLocation.trim()) {
      setSubmitError('Please specify an approximate landmark or sector.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiService.submitReport(appMode, {
        incidentCategory,
        district,
        approximateLocation,
        incidentDate,
        description,
        evidenceFileName: evidenceFile ? evidenceFile.name : undefined,
        evidenceFileSize: evidenceFile ? evidenceFile.size : undefined,
      });

      setSubmissionResult(res);
      // Reset form
      setApproximateLocation('');
      setDescription('');
      setEvidenceFile(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);

    if (!lookupToken.trim()) {
      setLookupError('Please enter your reference token.');
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await ApiService.lookupReportStatus(appMode, lookupToken.trim());
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(err.message || 'Unable to find report status with this reference token.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCopyToken = () => {
    if (!submissionResult?.referenceToken) return;
    navigator.clipboard.writeText(submissionResult.referenceToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Emergency Alert Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-900 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-red-950 text-sm">
            Not an Emergency Police Dispatch Channel
          </div>
          <p className="leading-relaxed text-red-800">
            This portal is an analytical reporting channel for non-emergency intelligence tips and
            prevention analysis. If you are witnessing an active crime in progress, violence, or an
            immediate threat to human life, contact the Himachal Pradesh Police Emergency Control Room
            immediately at <strong className="font-mono text-red-950 font-bold">112</strong> or call the
            Nasha Mukt Bharat helpline at <strong className="font-mono text-red-950 font-bold">1908</strong>.
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveSubTab('submit');
            setSubmissionResult(null);
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
            activeSubTab === 'submit'
              ? 'bg-white border-t-2 border-blue-600 text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Submit Anonymous Report
        </button>
        <button
          onClick={() => setActiveSubTab('lookup')}
          className={`px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
            activeSubTab === 'lookup'
              ? 'bg-white border-t-2 border-blue-600 text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Check Report Status by Token
        </button>
      </div>

      {activeSubTab === 'submit' ? (
        submissionResult ? (
          /* Confirmation Screen */
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-xs text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Incident Report Registered</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
                Your tip has been securely assigned a non-sequential reference code. No personal
                identifying metadata or accounts were created or recorded.
              </p>
            </div>

            {/* Reference Token Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-[11px] text-slate-500 font-medium mb-1">
                Your Secret Reference Token:
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-bold tracking-wider text-slate-900 select-all">
                  {submissionResult.referenceToken}
                </span>
                <button
                  onClick={handleCopyToken}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copy token to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {tokenCopied && (
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  Reference token copied to clipboard!
                </div>
              )}
            </div>

            {/* Mode & Storage Notice */}
            <div className="text-xs text-slate-600 max-w-lg mx-auto bg-blue-50 border border-blue-100 p-3 rounded text-left space-y-1">
              <div className="font-semibold text-blue-900">Transmission Confirmation:</div>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                {submissionResult.submissionMode === 'LIVE_API'
                  ? 'Transmitted securely to the DrugWatch HP verification API queue.'
                  : 'Saved to local browser demonstration session (GitHub Pages mode). In a production deployment connected to a verified backend, reports are queued directly to district analysts.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setLookupToken(submissionResult.referenceToken);
                  setActiveSubTab('lookup');
                  setSubmissionResult(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
              >
                Track Status in Lookup Portal
              </button>
              <button
                onClick={() => setSubmissionResult(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded transition-colors"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          /* Report Form */
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Anonymous Incident & Intelligence Submission
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit observations regarding illicit distribution, diversion, or trafficking
                movements in Himachal Pradesh. No login, name, phone, or email is required.
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Incident Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Incident Category *
                  </label>
                  <select
                    value={incidentCategory}
                    onChange={e => setIncidentCategory(e.target.value as IncidentCategory)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Suspicious Distribution Point">
                      Suspicious Distribution Point / Spot
                    </option>
                    <option value="Transit / Inter-State Movement">
                      Transit / Inter-State Movement (Borders/Highways)
                    </option>
                    <option value="Suspected Illicit Cultivation">
                      Suspected Illicit Cultivation (Forest/High Altitude)
                    </option>
                    <option value="Pharmacy / Prescription Diversion">
                      Pharmacy / Scheduled Prescription Diversion
                    </option>
                    <option value="Public Solicitation / Spot">Public Solicitation / Gathering</option>
                    <option value="Other Suspicious Activity">Other Suspicious Activity</option>
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Himachal Pradesh District *
                  </label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value as DistrictName)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {HP_DISTRICTS.map(d => (
                      <option key={d} value={d}>
                        {d} District
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Approximate Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Approximate Location or Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near NH-21 bypass crossing, Baddi industrial edge"
                    value={approximateLocation}
                    onChange={e => setApproximateLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Do not provide private residential door numbers or individual names.
                  </span>
                </div>

                {/* Incident Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observed Date or Approximate Window *
                  </label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setIncidentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Written Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Written Description & Context *
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={15}
                  maxLength={4000}
                  placeholder="Describe observed activity (e.g., recurring time of day, vehicle types, general modus operandi). Do not include personal identity details of uninvolved parties."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Minimum 15 characters. Max 4,000 characters.</span>
                  <span className="font-mono">{description.length} / 4000</span>
                </div>
              </div>

              {/* Optional Evidence Attachment */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Optional Supporting Evidence (Image / Document)
                  </label>
                  <span className="text-[10px] text-slate-400">Max 10 MB · JPG, PNG, PDF</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                />
                {fileError && <div className="text-[11px] text-red-600 font-medium">{fileError}</div>}
                {evidenceFile && !fileError && (
                  <div className="text-[11px] text-emerald-600 font-medium">
                    Attached: {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
                <div className="text-[10px] text-slate-500 leading-tight">
                  Evidence files are stored securely outside public asset folders and are accessible
                  only to authorized verification personnel.
                </div>
              </div>

              {/* Privacy Limitations Disclosure */}
              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded leading-relaxed">
                <div className="font-semibold text-slate-700 mb-0.5">Privacy & Anonymity Limitations:</div>
                We do not collect names, email addresses, phone numbers, or account credentials.
                However, standard technical server logs (such as IP addresses and request timestamps) may
                be processed by cloud hosting infrastructure. For maximum anonymity, consider utilizing
                a privacy-conscious browser or network.
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setApproximateLocation('');
                    setDescription('');
                    setEvidenceFile(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Anonymous Report'}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        /* Status Lookup Tab */
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Report Status Lookup
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enter your reference code to view verification status. For privacy, detailed allegations,
              exact coordinates, and other reports are strictly protected and never displayed.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="e.g. HP-DW-8A2F-91K2"
              value={lookupToken}
              onChange={e => setLookupToken(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded px-3 py-2 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLookingUp}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              {isLookingUp ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {lookupError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[11px] text-slate-500">Report Reference</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {lookupResult.reference_token}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Current Status:</span>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      lookupResult.status === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lookupResult.status === 'Under Review'
                        ? 'bg-blue-100 text-blue-800'
                        : lookupResult.status === 'Duplicate'
                        ? 'bg-amber-100 text-amber-800'
                        : lookupResult.status === 'Rejected'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {lookupResult.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">District</span>
                  <span className="font-semibold text-slate-800">{lookupResult.district}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Category</span>
                  <span className="font-semibold text-slate-800">
                    {lookupResult.incident_category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Last Updated</span>
                  <span className="font-mono text-slate-700">
                    {new Date(lookupResult.last_updated).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded p-3 text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900 block mb-1">
                  Administrative Note / Verification Message:
                </span>
                {lookupResult.public_status_message}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Status updates are logged directly by district analytical desk personnel during routine
                verification cycles.
              </div>
            </div>
          )}

          {/* Demonstration Sample Tokens for Quick Testing */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Sample Demonstration Tokens (for evaluation testing):
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLookupToken('HP-DW-8A2F-91K2')}
                className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded transition-colors text-[11px]"
              >
                HP-DW-8A2F-91K2 (Pending)
              </button>
              <button
                type="button"
                onClick={() => setLookupToken('HP-DW-4C7X-20M9')}
                className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded transition-colors text-[11px]"
              >
                HP-DW-4C7X-20M9 (Under Review)
              </button>
              <button
                type="button"
                onClick={() => setLookupToken('HP-DW-3E9Q-77L1')}
                className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded transition-colors text-[11px]"
              >
                HP-DW-3E9Q-77L1 (Verified)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
