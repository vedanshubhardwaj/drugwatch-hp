import {
  CitizenReport,
  DistrictHotspotAnalysis,
  OfficialCaseRecord,
  ReportStatus,
} from '../types';
import {
  DEMO_DATASET_METADATA,
  DISTRICT_AGGREGATE_STATISTICS,
  DISTRICT_HOTSPOT_METRICS,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_NETWORK_EDGES,
  INITIAL_NETWORK_NODES,
  INITIAL_OFFICIAL_CASES,
} from '../data/hpData';
import { HP_DISTRICT_METADATA } from '../data/districtMeta';

// Configurable API base url; default to relative /api/v1 for dev server proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export type AppMode = 'DEMO' | 'API';

const MODE_STORAGE_KEY = 'drugwatch_hp_mode';
const REPORTS_STORAGE_KEY = 'drugwatch_hp_local_reports';

export function getStoredMode(): AppMode {
  // Default to DEMO if on github.io or if explicitly saved
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) {
      return 'DEMO';
    }
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'DEMO' || saved === 'API') return saved;
  }
  return 'DEMO'; // Default to demo for safety & GitHub Pages compatibility
}

export function setStoredMode(mode: AppMode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
}

export function getLocalReports(): CitizenReport[] {
  if (typeof window === 'undefined') return INITIAL_CITIZEN_REPORTS;
  const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_CITIZEN_REPORTS));
    return INITIAL_CITIZEN_REPORTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CITIZEN_REPORTS;
  }
}

export function saveLocalReports(reports: CitizenReport[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  }
}

// Generate random non-sequential token
export function generateClientReferenceToken(): string {
  const chars = '0123456789ABCDEF';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `HP-DW-${p1}-${p2}`;
}

export const ApiService = {
  async getDashboardSummary(mode: AppMode) {
    if (mode === 'API') {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API unavailable, falling back to local dataset', e);
      }
    }
    const reports = getLocalReports();
    return {
      total_official_cases: INITIAL_OFFICIAL_CASES.length,
      total_verified_cases: reports.filter(r => r.status === 'Verified').length,
      pending_citizen_reports: reports.filter(r => r.status === 'Pending').length,
      reporting_period: DEMO_DATASET_METADATA.reportingPeriod,
      source_attribution: DEMO_DATASET_METADATA.source,
      last_updated: DEMO_DATASET_METADATA.lastUpdated,
      is_synthetic_dataset: true,
      limitations: DEMO_DATASET_METADATA.limitations,
      disclaimer: DEMO_DATASET_METADATA.disclaimer,
    };
  },

  async getDistrictAnalytics(mode: AppMode, year?: number, category?: string) {
    if (mode === 'API') {
      try {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (category && category !== 'All') params.append('category', category);
        const res = await fetch(`${API_BASE_URL}/analytics/districts?${params.toString()}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, returning local district aggregation', e);
      }
    }

    let cases = [...INITIAL_OFFICIAL_CASES];
    if (year) cases = cases.filter(c => c.year === year);
    if (category && category !== 'All') cases = cases.filter(c => c.category === category);

    const map: Record<string, any> = {};
    Object.keys(HP_DISTRICT_METADATA).forEach(d => {
      map[d] = {
        district: d,
        caseCount: 0,
        categories: {} as Record<string, number>,
        commercialCount: 0,
        intermediateCount: 0,
        smallCount: 0,
        historicalAggregates: DISTRICT_AGGREGATE_STATISTICS[d],
        metadata: HP_DISTRICT_METADATA[d as keyof typeof HP_DISTRICT_METADATA],
      };
    });

    cases.forEach(c => {
      if (map[c.district]) {
        map[c.district].caseCount += 1;
        map[c.district].categories[c.category] = (map[c.district].categories[c.category] || 0) + 1;
        if (c.commercialClassification === 'Commercial') map[c.district].commercialCount += 1;
        else if (c.commercialClassification === 'Intermediate') map[c.district].intermediateCount += 1;
        else map[c.district].smallCount += 1;
      }
    });

    return Object.values(map);
  },

  async getTrendsAnalytics(mode: AppMode, district?: string) {
    if (mode === 'API') {
      try {
        const params = new URLSearchParams();
        if (district && district !== 'All') params.append('district', district);
        const res = await fetch(`${API_BASE_URL}/analytics/trends?${params.toString()}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, computing local trends', e);
      }
    }

    let cases = [...INITIAL_OFFICIAL_CASES];
    if (district && district !== 'All') {
      cases = cases.filter(c => c.district === district);
    }

    const yearly: Record<string, number> = {};
    const monthly: Record<string, number> = {};
    const categories: Record<string, number> = {};

    cases.forEach(c => {
      yearly[c.year] = (yearly[c.year] || 0) + 1;
      const ym = `${c.year}-${String(c.month).padStart(2, '0')}`;
      monthly[ym] = (monthly[ym] || 0) + 1;
      categories[c.category] = (categories[c.category] || 0) + 1;
    });

    return {
      yearlyTrends: yearly,
      monthlyTrends: Object.fromEntries(Object.entries(monthly).sort()),
      categoryBreakdown: categories,
    };
  },

  async getNetworkData(mode: AppMode) {
    if (mode === 'API') {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/network`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API network fetch error', e);
      }
    }
    return {
      nodes: INITIAL_NETWORK_NODES,
      edges: INITIAL_NETWORK_EDGES,
      ethicalDisclaimer:
        'CRITICAL ETHICAL GOVERNANCE: Network relationships represent documented administrative checkpoints and transit corridors. They must NEVER be used to infer individual guilt, target communities, or construct unauthorized suspect lists.',
    };
  },

  async getHotspotMetrics(mode: AppMode): Promise<DistrictHotspotAnalysis[]> {
    if (mode === 'API') {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/hotspots`);
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) return data.metrics;
        }
      } catch (e) {
        console.warn('API hotspot error', e);
      }
    }
    return DISTRICT_HOTSPOT_METRICS;
  },

  async submitReport(
    mode: AppMode,
    reportData: {
      incidentCategory: any;
      district: any;
      approximateLocation: string;
      incidentDate: string;
      description: string;
      evidenceFileName?: string;
      evidenceFileSize?: number;
    }
  ) {
    if (mode === 'API') {
      try {
        const res = await fetch(`${API_BASE_URL}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incident_category: reportData.incidentCategory,
            district: reportData.district,
            approximate_location: reportData.approximateLocation,
            incident_date: reportData.incidentDate,
            description: reportData.description,
            evidence_filename: reportData.evidenceFileName,
            evidence_file_size: reportData.evidenceFileSize,
            is_demo_submission: false,
          }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('Backend submission failed, falling back to local demo storage', e);
      }
    }

    // Local Demonstration Mode (GitHub Pages)
    const token = generateClientReferenceToken();
    const newReport: CitizenReport = {
      id: `local-rep-${Date.now()}`,
      referenceToken: token,
      createdAt: new Date().toISOString(),
      incidentCategory: reportData.incidentCategory,
      district: reportData.district,
      approximateLocation: reportData.approximateLocation.replace(/<[^>]*>?/gm, '').trim(),
      incidentDate: reportData.incidentDate,
      description: reportData.description.replace(/<[^>]*>?/gm, '').trim(),
      evidenceFileName: reportData.evidenceFileName,
      evidenceFileSize: reportData.evidenceFileSize,
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          note: 'Report stored in local demonstration session.',
          updatedByRole: 'System',
        },
      ],
      reviewerNotes: '',
      isDemoSubmission: true,
    };

    const current = getLocalReports();
    current.unshift(newReport);
    saveLocalReports(current);

    return {
      success: true,
      message: 'Incident report registered in local demonstration session.',
      referenceToken: token,
      district: reportData.district,
      submissionMode: 'LOCAL_DEMO',
      instructions:
        'Save this reference token securely. You can use it in the Status Lookup tab to check administrative review status within this session.',
      emergencyNotice:
        'DEMO NOTICE: This report was saved to your browser session for demonstration only and has NOT been sent to law enforcement. For immediate emergencies, call Himachal Pradesh Police at 112.',
    };
  },

  async lookupReportStatus(mode: AppMode, token: string) {
    const cleanToken = token.trim().toUpperCase();
    if (mode === 'API') {
      try {
        const res = await fetch(`${API_BASE_URL}/reports/status-lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference_token: cleanToken }),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API lookup error, falling back to local store', e);
      }
    }

    // Local lookup
    const reports = getLocalReports();
    const found = reports.find(r => r.referenceToken === cleanToken);
    if (!found) {
      throw new Error(
        'Reference token not found. Please verify the code or check if you submitted in a different browser session.'
      );
    }

    const statusExplanations: Record<string, string> = {
      Pending: 'Your report is queued in the administrative review queue.',
      'Under Review': 'Review in progress. Checking correlation with active transit alerts.',
      Verified: 'Information verified with field logs and shared with district nodal desk.',
      Duplicate: 'Matched with existing sector cluster and linked to ongoing case file.',
      Rejected: 'Review concluded: Insufficient actionable context or out of NDPS scope.',
    };

    const lastHistory = found.statusHistory[found.statusHistory.length - 1];
    return {
      reference_token: found.referenceToken,
      created_at: found.createdAt,
      status: found.status,
      incident_category: found.incidentCategory,
      district: found.district,
      last_updated: lastHistory ? lastHistory.timestamp : found.createdAt,
      public_status_message: statusExplanations[found.status] || 'Status logged.',
      is_demo_submission: found.isDemoSubmission,
    };
  },

  async updateReportStatus(
    mode: AppMode,
    reportId: string,
    newStatus: ReportStatus,
    reviewerNotes?: string,
    token?: string
  ) {
    if (mode === 'API' && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            reviewer_notes: reviewerNotes,
          }),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API status update failed, updating local state', e);
      }
    }

    // Local update
    const reports = getLocalReports();
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      reports[idx].status = newStatus;
      if (reviewerNotes) reports[idx].reviewerNotes = reviewerNotes;
      reports[idx].statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: reviewerNotes || `Status updated to ${newStatus}`,
        updatedByRole: 'Admin',
      });
      saveLocalReports(reports);
      return { success: true, message: `Report status updated to ${newStatus}.` };
    }
    throw new Error('Report not found');
  },
};
