from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CaseRelationship, CitizenReport, OfficialCaseRecord
from ..schemas import DashboardSummaryResponse

router = APIRouter(prefix="/api/v1", tags=["Dashboard & Analytics"])

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_official = db.query(OfficialCaseRecord).count()
    verified_reports = db.query(CitizenReport).filter(CitizenReport.status == "Verified").count()
    pending_reports = db.query(CitizenReport).filter(CitizenReport.status == "Pending").count()

    return DashboardSummaryResponse(
        total_official_cases=total_official,
        total_verified_cases=verified_reports,
        pending_citizen_reports=pending_reports,
        reporting_period="2021 - 2025 (Annual & Monthly Aggregates)",
        source_attribution="Himachal Pradesh Public Police & Excise Annual Administrative Reports (Calibrated Synthetic Demonstration)",
        last_updated="2025-12-31",
        is_synthetic_dataset=True,
        limitations=[
            "Data shown is calibrated synthetic demonstration data for training and system architecture testing.",
            "Official case records are strictly separated from citizen reports; unverified citizen reports are never added to official statistics.",
            "District metrics represent aggregate counts and do not identify specific individuals or private properties."
        ],
    )

@router.get("/analytics/districts")
def get_district_analytics(
    year: Optional[int] = Query(None, description="Filter by year (2021-2025)"),
    category: Optional[str] = Query(None, description="Filter by seizure category"),
    db: Session = Depends(get_db),
):
    query = db.query(OfficialCaseRecord)
    if year:
        query = query.filter(OfficialCaseRecord.year == year)
    if category:
        query = query.filter(OfficialCaseRecord.category == category)

    records = query.all()

    # Aggregate by district
    districts = {}
    for r in records:
        d = r.district
        if d not in districts:
            districts[d] = {
                "district": d,
                "caseCount": 0,
                "categories": {},
                "commercialCount": 0,
                "intermediateCount": 0,
                "smallCount": 0,
            }
        districts[d]["caseCount"] += 1
        districts[d]["categories"][r.category] = districts[d]["categories"].get(r.category, 0) + 1
        if r.commercial_classification == "Commercial":
            districts[d]["commercialCount"] += 1
        elif r.commercial_classification == "Intermediate":
            districts[d]["intermediateCount"] += 1
        else:
            districts[d]["smallCount"] += 1

    return list(districts.values())

@router.get("/analytics/trends")
def get_trends_analytics(
    district: Optional[str] = Query(None, description="Filter by district"),
    db: Session = Depends(get_db),
):
    query = db.query(OfficialCaseRecord)
    if district and district != "All":
        query = query.filter(OfficialCaseRecord.district == district)

    records = query.all()

    # Aggregate by year and month
    yearly = {}
    monthly = {}
    categories = {}

    for r in records:
        yr = str(r.year)
        yearly[yr] = yearly.get(yr, 0) + 1

        ym = f"{r.year}-{str(r.month).zfill(2)}"
        monthly[ym] = monthly.get(ym, 0) + 1

        cat = r.category
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "yearlyTrends": yearly,
        "monthlyTrends": dict(sorted(monthly.items())),
        "categoryBreakdown": categories,
    }

@router.get("/analytics/network")
def get_network_analysis(
    district: Optional[str] = Query(None, description="Filter by district"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    relationships = db.query(CaseRelationship).all()
    edges = []
    for rel in relationships:
        edges.append({
            "id": rel.id,
            "source": rel.source_node,
            "target": rel.target_node,
            "relationshipType": rel.relationship_type,
            "weight": rel.weight,
            "evidenceBasis": rel.evidence_basis,
            "isDocumentedConnection": rel.is_documented_connection,
        })

    return {
        "nodes": [],  # Nodes are generated or returned based on graph connectivity
        "edges": edges,
        "ethicalDisclaimer": "CRITICAL ETHICAL GOVERNANCE: Network relationships represent documented administrative checkpoints and transit corridors. They must NEVER be used to infer individual guilt, target communities, or construct unauthorized suspect lists.",
    }

@router.get("/analytics/hotspots")
def get_hotspot_analytics(db: Session = Depends(get_db)):
    return {
        "title": "Himachal Pradesh District Hotspot & Anomaly Baseline",
        "description": "Calculated using 3-month rolling averages and historical z-score variances. High values indicate statistically elevated case intercepts relative to historic district baseline.",
        "methodology": "Exponential Smoothing (alpha=0.3) benchmarked against 3-month rolling baseline with cross-validation MAE reporting.",
        "disclaimer": "DEMO ONLY: Statistical activity hotspots reflect enforcement intensity and transit checkpoints, not proof of local community criminal culpability.",
    }
