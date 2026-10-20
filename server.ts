import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  DEMO_DATASET_METADATA,
  DISTRICT_AGGREGATE_STATISTICS,
  DISTRICT_HOTSPOT_METRICS,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_NETWORK_EDGES,
  INITIAL_NETWORK_NODES,
  INITIAL_OFFICIAL_CASES,
} from './src/data/hpData.ts';
import { HP_DISTRICT_METADATA } from './src/data/districtMeta.ts';
import { CitizenReport, OfficialCaseRecord, AuditLogEntry } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory data store for live dev server session
let officialCases: OfficialCaseRecord[] = [...INITIAL_OFFICIAL_CASES];
let citizenReports: CitizenReport[] = [...INITIAL_CITIZEN_REPORTS];
let auditLogs: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    userEmail: 'directorate.analyst@hp.gov.in',
    userRole: 'Admin',
    action: 'INITIALIZE_SYSTEM',
    targetType: 'Dataset',
    targetId: 'HP-NDPS-CORE-DEMO',
    details: 'System initialized with Himachal Pradesh administrative dataset structures.',
    ipAddressMasked: '10.24.x.x',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    userEmail: 'analyst@drugwatch.hp',
    userRole: 'Reviewer',
    action: 'UPDATE_REPORT_STATUS',
    targetType: 'Report',
    targetId: 'rep-demo-003',
    details: 'Verified pharmacy diversion report following drug inspectorate field verification.',
    ipAddressMasked: '10.24.x.x',
  },
];

// Helper to generate cryptographically random, non-sequential reference token
function generateRandomReferenceToken(): string {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `HP-DW-${p1}-${p2}`;
}

// -------------------------------------------------------------
// Health Check Endpoints
// -------------------------------------------------------------
app.get(['/health', '/api/v1/health'], (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'DrugWatch HP Full-Stack Engine',
    version: '1.0.0',
    jurisdiction: 'Himachal Pradesh, India',
    mode: 'dual-runtime (Express fullstack dev server + Python backend)',
    features: {
      officialDashboard: true,
      anonymousReporting: true,
      adminVerification: true,
      caseNetworkAnalysis: true,
      hotspotAnomalyPrediction: true,
      ethicalGovernanceGuards: true,
    },
  });
});

// -------------------------------------------------------------
// Dashboard & Analytics Endpoints
// -------------------------------------------------------------
app.get('/api/v1/dashboard/summary', (req: Request, res: Response) => {
  const verifiedCount = citizenReports.filter(r => r.status === 'Verified').length;
  const pendingCount = citizenReports.filter(r => r.status === 'Pending').length;

  res.json({
    total_official_cases: officialCases.length,
    total_verified_cases: verifiedCount,
    pending_citizen_reports: pendingCount,
    reporting_period: DEMO_DATASET_METADATA.reportingPeriod,
    source_attribution: DEMO_DATASET_METADATA.source,
    last_updated: DEMO_DATASET_METADATA.lastUpdated,
    is_synthetic_dataset: true,
    limitations: DEMO_DATASET_METADATA.limitations,
    disclaimer: DEMO_DATASET_METADATA.disclaimer,
  });
});

app.get('/api/v1/analytics/districts', (req: Request, res: Response) => {
  const yearFilter = req.query.year ? parseInt(req.query.year as string, 10) : null;
  const categoryFilter = req.query.category ? (req.query.category as string) : null;

  let filtered = [...officialCases];
  if (yearFilter) {
    filtered = filtered.filter(c => c.year === yearFilter);
  }
  if (categoryFilter && categoryFilter !== 'All') {
    filtered = filtered.filter(c => c.category === categoryFilter);
  }

  // Aggregate stats per district
  const districtMap: Record<string, any> = {};
  Object.keys(HP_DISTRICT_METADATA).forEach(d => {
    const historical = DISTRICT_AGGREGATE_STATISTICS[d] || {
      totalOfficialCases: 0,
      topCategory: 'Charas (Cannabis Resin)',
      seizuresCharasKg: 0,
      seizuresHeroinGrams: 0,
      seizuresPharmaUnits: 0,
      commercialPercentage: 20,
    };

    districtMap[d] = {
      district: d,
      caseCount: 0,
      categories: {} as Record<string, number>,
      commercialCount: 0,
      intermediateCount: 0,
      smallCount: 0,
      historicalAggregates: historical,
      metadata: HP_DISTRICT_METADATA[d as keyof typeof HP_DISTRICT_METADATA],
    };
  });

  filtered.forEach(c => {
    if (districtMap[c.district]) {
      districtMap[c.district].caseCount += 1;
      districtMap[c.district].categories[c.category] =
        (districtMap[c.district].categories[c.category] || 0) + 1;
      if (c.commercialClassification === 'Commercial') {
        districtMap[c.district].commercialCount += 1;
      } else if (c.commercialClassification === 'Intermediate') {
        districtMap[c.district].intermediateCount += 1;
      } else {
        districtMap[c.district].smallCount += 1;
      }
    }
  });

  res.json(Object.values(districtMap));
});

app.get('/api/v1/analytics/trends', (req: Request, res: Response) => {
  const districtFilter = req.query.district as string;
  let filtered = [...officialCases];
  if (districtFilter && districtFilter !== 'All') {
    filtered = filtered.filter(c => c.district === districtFilter);
  }

  const yearly: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  const categories: Record<string, number> = {};

  filtered.forEach(c => {
    yearly[c.year] = (yearly[c.year] || 0) + 1;
    const ym = `${c.year}-${String(c.month).padStart(2, '0')}`;
    monthly[ym] = (monthly[ym] || 0) + 1;
    categories[c.category] = (categories[c.category] || 0) + 1;
  });

  res.json({
    yearlyTrends: yearly,
    monthlyTrends: Object.fromEntries(Object.entries(monthly).sort()),
    categoryBreakdown: categories,
  });
});

app.get('/api/v1/analytics/network', (req: Request, res: Response) => {
  res.json({
    nodes: INITIAL_NETWORK_NODES,
    edges: INITIAL_NETWORK_EDGES,
    ethicalDisclaimer:
      'CRITICAL ETHICAL GOVERNANCE: Network relationships represent documented administrative checkpoints and transit corridors. They must NEVER be used to infer individual guilt, target communities, or construct unauthorized suspect lists.',
  });
});

app.get('/api/v1/analytics/hotspots', (req: Request, res: Response) => {
  res.json({
    title: 'Himachal Pradesh District Hotspot & Anomaly Baseline',
    metrics: DISTRICT_HOTSPOT_METRICS,
    methodology:
      'Deterministic Exponential Smoothing (alpha=0.3) benchmarked against 3-month rolling baseline with cross-validation MAE reporting.',
    disclaimer:
      'DEMO ONLY: Statistical activity hotspots reflect enforcement intensity and transit checkpoints, not proof of local community criminal culpability.',
  });
});

// -------------------------------------------------------------
// Citizen Anonymous Reporting Endpoints
// -------------------------------------------------------------
app.post('/api/v1/reports', (req: Request, res: Response) => {
  const {
    incident_category,
    district,
    approximate_location,
    incident_date,
    description,
    evidence_filename,
    evidence_file_size,
    is_demo_submission,
  } = req.body;

  if (!incident_category || !district || !approximate_location || !incident_date || !description) {
    res.status(400).json({ error: 'Missing mandatory report fields.' });
    return;
  }

  if (description.trim().length < 15) {
    res.status(400).json({ error: 'Description must be at least 15 characters to provide actionable context.' });
    return;
  }

  const token = generateRandomReferenceToken();
  const newReport: CitizenReport = {
    id: `rep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    referenceToken: token,
    createdAt: new Date().toISOString(),
    incidentCategory: incident_category,
    district: district,
    approximateLocation: approximate_location.replace(/<[^>]*>?/gm, '').trim(),
    incidentDate: incident_date,
    description: description.replace(/<[^>]*>?/gm, '').trim(),
    evidenceFileName: evidence_filename || undefined,
    evidenceFileSize: evidence_file_size || undefined,
    status: 'Pending',
    statusHistory: [
      {
        status: 'Pending',
        timestamp: new Date().toISOString(),
        note: 'Report registered securely in verification queue.',
        updatedByRole: 'System',
      },
    ],
    reviewerNotes: '',
    isDemoSubmission: Boolean(is_demo_submission),
  };

  citizenReports.unshift(newReport);

  // Log audit event
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userEmail: 'anonymous@citizen.public',
    userRole: 'Reviewer',
    action: 'CREATE_ANONYMOUS_REPORT',
    targetType: 'Report',
    targetId: newReport.id,
    details: `Anonymous incident registered for ${district} (${incident_category})`,
    ipAddressMasked: '0.0.0.0',
  });

  res.status(201).json({
    success: true,
    message: 'Incident report securely registered.',
    referenceToken: token,
    district: district,
    submissionMode: is_demo_submission ? 'LOCAL_DEMO' : 'LIVE_API',
    instructions:
      'Save this reference token securely. You can use it anytime on the status lookup portal to check administrative review status. We do not store any contact info to recover lost tokens.',
    emergencyNotice:
      'NOTICE: This system is for analytical monitoring and intelligence tips. It is NOT an emergency 112 police dispatch channel. In case of immediate threat, contact Himachal Pradesh Police at 112 or Nasha Nivaran Helpline at 1908.',
  });
});

app.post('/api/v1/reports/status-lookup', (req: Request, res: Response) => {
  const { reference_token } = req.body;
  if (!reference_token) {
    res.status(400).json({ error: 'Reference token is required.' });
    return;
  }

  const cleanToken = reference_token.trim().toUpperCase();
  const report = citizenReports.find(r => r.referenceToken === cleanToken);

  if (!report) {
    res.status(404).json({
      error: 'Reference token not recognized. Please check the code for typos or verify whether the report was submitted in demonstration mode.',
    });
    return;
  }

  const statusExplanations: Record<string, string> = {
    Pending: 'Your report has been queued for verification by the designated analytical review team.',
    'Under Review': 'Analytical review in progress. Checking correlation with documented transit corridors and local enforcement alerts.',
    Verified: 'Report details have been cross-verified with field logs and shared with relevant district nodal officers for preventive monitoring.',
    Duplicate: 'Report matched an existing active monitoring cluster in this geographic sector and has been merged with the primary case file.',
    Rejected: 'Review concluded. The submission lacked sufficient geographic specificity or did not fall under NDPS prevention scope.',
  };

  const lastHistory = report.statusHistory[report.statusHistory.length - 1];

  // Return public view WITHOUT exposing private address, text or coordinates
  res.json({
    reference_token: report.referenceToken,
    created_at: report.createdAt,
    status: report.status,
    incident_category: report.incidentCategory,
    district: report.district,
    last_updated: lastHistory ? lastHistory.timestamp : report.createdAt,
    public_status_message: statusExplanations[report.status] || 'Status update logged.',
    is_demo_submission: report.isDemoSubmission,
  });
});

// -------------------------------------------------------------
// Admin Authentication & Review Endpoints
// -------------------------------------------------------------
app.post('/api/v1/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email === 'analyst@drugwatch.hp' && password === 'ShimlaWatch2026!') {
    res.json({
      access_token: 'hp-admin-demo-token',
      token_type: 'bearer',
      role: 'Admin',
      email: 'analyst@drugwatch.hp',
      full_name: 'Himachal Anti-Narcotics Task Force Reviewer',
    });
    return;
  }

  res.status(401).json({ error: 'Invalid administrative credentials.' });
});

app.get('/api/v1/admin/reports', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const statusFilter = req.query.status as string;
  const districtFilter = req.query.district as string;

  let results = [...citizenReports];
  if (statusFilter && statusFilter !== 'All') {
    results = results.filter(r => r.status === statusFilter);
  }
  if (districtFilter && districtFilter !== 'All') {
    results = results.filter(r => r.district === districtFilter);
  }

  res.json(results);
});

app.patch('/api/v1/admin/reports/:report_id/status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const { report_id } = req.params;
  const { status, reviewer_notes, duplicate_of_id } = req.body;

  const report = citizenReports.find(r => r.id === report_id);
  if (!report) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  const oldStatus = report.status;
  report.status = status;
  if (reviewer_notes) report.reviewerNotes = reviewer_notes;
  if (duplicate_of_id) report.duplicateOfId = duplicate_of_id;

  report.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: reviewer_notes || `Status transitioned from ${oldStatus} to ${status}.`,
    updatedByRole: 'Admin',
  });

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userEmail: 'analyst@drugwatch.hp',
    userRole: 'Admin',
    action: 'UPDATE_REPORT_STATUS',
    targetType: 'Report',
    targetId: report.id,
    details: `Status transitioned from '${oldStatus}' to '${status}'. Note: ${reviewer_notes || 'None'}`,
    ipAddressMasked: '10.24.x.x',
  });

  res.json({ success: true, message: `Report status updated to ${status}.` });
});

app.get('/api/v1/admin/reports/:report_id/duplicate-suggestions', (req: Request, res: Response) => {
  const { report_id } = req.params;
  const target = citizenReports.find(r => r.id === report_id);
  if (!target) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  // Lexical overlap check
  const targetWords = new Set(
    `${target.approximateLocation} ${target.description}`.toLowerCase().split(/\s+/)
  );

  const suggestions = citizenReports
    .filter(r => r.id !== target.id && r.district === target.district)
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
        similarityScore: Math.min(1.0, Math.round(score * 100) / 100),
        reason: `Same district (${target.district}) with overlapping location keywords.`,
      };
    })
    .filter(s => s.similarityScore > 0.15)
    .sort((a, b) => b.similarityScore - a.similarityScore);

  res.json({ reportId: report_id, suggestions });
});

app.get('/api/v1/admin/audit-logs', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  res.json(auditLogs);
});

// CSV Import endpoint
app.post('/api/v1/admin/datasets/import', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const { rows, fileName } = req.body;
  if (!rows || !Array.isArray(rows)) {
    res.status(400).json({ error: 'Rows array required.' });
    return;
  }

  let valid = 0;
  let invalid = 0;
  let duplicates = 0;
  const errors: { row: number; column: string; message: string }[] = [];

  rows.forEach((r, idx) => {
    if (!r.caseNumber) {
      invalid++;
      errors.push({ row: idx + 1, column: 'caseNumber', message: 'Missing case number.' });
      return;
    }
    const exists = officialCases.some(c => c.caseNumber === r.caseNumber);
    if (exists) {
      duplicates++;
      errors.push({ row: idx + 1, column: 'caseNumber', message: `Duplicate case ${r.caseNumber}` });
      return;
    }
    valid++;
  });

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userEmail: 'analyst@drugwatch.hp',
    userRole: 'Admin',
    action: 'VALIDATE_DATASET_CSV',
    targetType: 'Dataset',
    targetId: fileName || 'Uploaded_CSV',
    details: `Validated ${rows.length} rows: ${valid} valid, ${invalid} invalid, ${duplicates} duplicates.`,
    ipAddressMasked: '10.24.x.x',
  });

  res.json({
    fileName: fileName || 'Uploaded_Data.csv',
    totalRowsChecked: rows.length,
    validRowCount: valid,
    invalidRowCount: invalid,
    duplicateRowCount: duplicates,
    errors: errors.slice(0, 20),
  });
});

// -------------------------------------------------------------
// Vite Middlewares in Dev / Static dist in Prod
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DrugWatch HP Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
