from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

HP_VALID_DISTRICTS = [
    "Bilaspur",
    "Chamba",
    "Hamirpur",
    "Kangra",
    "Kinnaur",
    "Kullu",
    "Lahaul and Spiti",
    "Mandi",
    "Shimla",
    "Sirmaur",
    "Solan",
    "Una",
]

class ReportCreate(BaseModel):
    incident_category: str = Field(..., min_length=3, max_length=100)
    district: str = Field(..., min_length=3, max_length=100)
    approximate_location: str = Field(..., min_length=3, max_length=200)
    incident_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    description: str = Field(..., min_length=15, max_length=4000)
    evidence_filename: Optional[str] = None
    evidence_file_size: Optional[int] = Field(None, le=10 * 1024 * 1024) # 10MB max limit
    is_demo_submission: bool = False

    @field_validator("district")
    def validate_district(cls, v):
        if v not in HP_VALID_DISTRICTS:
            raise ValueError(f"District must be one of official 12 Himachal Pradesh districts: {', '.join(HP_VALID_DISTRICTS)}")
        return v

    @field_validator("description", "approximate_location")
    def sanitize_strings(cls, v):
        # Prevent HTML/script injection
        cleaned = v.replace("<", "&lt;").replace(">", "&gt;").strip()
        return cleaned

class ReportStatusLookupRequest(BaseModel):
    reference_token: str = Field(..., min_length=10, max_length=30)

class PublicReportStatusResponse(BaseModel):
    reference_token: str
    created_at: datetime
    status: str
    incident_category: str
    district: str
    last_updated: datetime
    public_status_message: str
    is_demo_submission: bool

class ReportHistoryItem(BaseModel):
    status: str
    timestamp: datetime
    note: Optional[str]
    updated_by_role: str

class AdminReportDetail(BaseModel):
    id: str
    reference_token: str
    created_at: datetime
    incident_category: str
    district: str
    approximate_location: str
    incident_date: str
    description: str
    evidence_filename: Optional[str]
    evidence_file_size: Optional[int]
    status: str
    reviewer_notes: Optional[str]
    duplicate_of_id: Optional[str]
    history: List[ReportHistoryItem]
    is_demo_submission: bool

class ReportStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern=r"^(Pending|Under Review|Verified|Rejected|Duplicate)$")
    reviewer_notes: Optional[str] = None
    duplicate_of_id: Optional[str] = None

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    full_name: str

class DashboardSummaryResponse(BaseModel):
    total_official_cases: int
    total_verified_cases: int
    pending_citizen_reports: int
    reporting_period: str
    source_attribution: str
    last_updated: str
    is_synthetic_dataset: bool
    limitations: List[str]

class DistrictComparisonItem(BaseModel):
    district: str
    total_cases: int
    top_category: str
    seizures_charas_kg: float
    seizures_heroin_grams: float
    seizures_pharma_units: int
    commercial_percentage: float

class HotspotAnalysisItem(BaseModel):
    district: str
    historical_total_cases: int
    cases_last_3_months: int
    cases_previous_3_months: int
    percent_change: float
    rolling_3_month_avg: float
    rolling_6_month_avg: float
    z_score_anomaly: float
    activity_level: str
    primary_seizure_category: str
    dominant_transit_corridor: str
    forecast_next_month_cases: int
    forecast_lower_bound: int
    forecast_upper_bound: int
    model_confidence_notes: str
    evaluation_metric: str
    is_demo_data: bool
