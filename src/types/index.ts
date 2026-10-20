export type DistrictName =
  | 'Bilaspur'
  | 'Chamba'
  | 'Hamirpur'
  | 'Kangra'
  | 'Kinnaur'
  | 'Kullu'
  | 'Lahaul and Spiti'
  | 'Mandi'
  | 'Shimla'
  | 'Sirmaur'
  | 'Solan'
  | 'Una';

export const HP_DISTRICTS: DistrictName[] = [
  'Bilaspur',
  'Chamba',
  'Hamirpur',
  'Kangra',
  'Kinnaur',
  'Kullu',
  'Lahaul and Spiti',
  'Mandi',
  'Shimla',
  'Sirmaur',
  'Solan',
  'Una',
];

export interface DistrictCoordinates {
  name: DistrictName;
  lat: number;
  lng: number;
  headquarters: string;
  populationApprox: number;
  areaSqKm: number;
  keyTransitCorridors: string[];
}

export type SeizureCategory =
  | 'Charas (Cannabis Resin)'
  | 'Heroin / Chitta'
  | 'Opium / Poppy Husk'
  | 'Synthetic Pharmaceuticals'
  | 'Injections / Ampoules'
  | 'Cannabis Plants (Cultivation)';

export type QuantityCategory = 'Commercial' | 'Intermediate' | 'Small';

export interface OfficialCaseRecord {
  id: string;
  caseNumber: string; // e.g. "FIR-DEMO-2024-KLU-082"
  year: number;
  month: number; // 1-12
  date: string; // YYYY-MM-DD
  district: DistrictName;
  policeStation: string;
  category: SeizureCategory;
  quantityValue: number;
  quantityUnit: 'kg' | 'grams' | 'tablets' | 'bottles' | 'plants';
  commercialClassification: QuantityCategory;
  transitRoute?: string;
  seizureLocationType: 'Highway Checkpoint' | 'Bus Stand' | 'Courier/Parcel' | 'Residential' | 'Field/Cultivation' | 'Industrial Area';
  isSyntheticDemo: boolean;
  sourceDataset: string;
  notes?: string;
}

export type IncidentCategory =
  | 'Suspicious Distribution Point'
  | 'Transit / Inter-State Movement'
  | 'Suspected Illicit Cultivation'
  | 'Pharmacy / Prescription Diversion'
  | 'Public Solicitation / Spot'
  | 'Other Suspicious Activity';

export type ReportStatus = 'Pending' | 'Under Review' | 'Verified' | 'Rejected' | 'Duplicate';

export interface ReportStatusHistoryItem {
  status: ReportStatus;
  timestamp: string;
  note?: string;
  updatedByRole?: 'Reviewer' | 'Senior Analyst' | 'Admin' | 'System';
}

export interface CitizenReport {
  id: string;
  referenceToken: string; // e.g. "HP-DW-98B2-4A7C"
  createdAt: string;
  incidentCategory: IncidentCategory;
  district: DistrictName;
  approximateLocation: string; // General area, e.g. "Near NH-21 bridge bypass"
  incidentDate: string;
  description: string;
  evidenceFileName?: string;
  evidenceFileSize?: number;
  status: ReportStatus;
  statusHistory: ReportStatusHistoryItem[];
  reviewerNotes?: string;
  duplicateOfId?: string;
  isDemoSubmission: boolean;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'District' | 'Transit Corridor' | 'Seizure Category' | 'Checkpoint Hub';
  size: number;
  district?: DistrictName;
  details?: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: 'Inter-District Route' | 'Common Seizure Profile' | 'Documented Supply Corridor' | 'Statistical Correlation';
  weight: number;
  evidenceBasis: string;
  isDocumentedConnection: boolean;
}

export interface DistrictHotspotAnalysis {
  district: DistrictName;
  historicalTotalCases: number;
  casesLast3Months: number;
  casesPrevious3Months: number;
  percentChange: number;
  rolling3MonthAvg: number;
  rolling6MonthAvg: number;
  zScoreAnomaly: number; // > 1.5 indicates statistically elevated activity
  activityLevel: 'Elevated' | 'Moderate' | 'Baseline';
  primarySeizureCategory: SeizureCategory;
  dominantTransitCorridor: string;
  forecastNextMonthCases: number;
  forecastLowerBound: number;
  forecastUpperBound: number;
  modelConfidenceNotes: string;
  evaluationMetric: string; // e.g. "Validation MAE: 1.4 cases on 2021-2024 time-split"
  isDemoData: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: 'Reviewer' | 'Senior Analyst' | 'Admin';
  action: string;
  targetType: 'Report' | 'Dataset' | 'CaseRecord' | 'Auth';
  targetId: string;
  details: string;
  ipAddressMasked: string;
}

export interface DatasetImportResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: { row: number; column: string; message: string }[];
  previewRows: Partial<OfficialCaseRecord>[];
}
