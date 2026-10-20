import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditLog, CitizenReport, ReportStatusHistory
from ..schemas import (
    PublicReportStatusResponse,
    ReportCreate,
    ReportStatusLookupRequest,
)

router = APIRouter(prefix="/api/v1/reports", tags=["Anonymous Incident Reports"])

def generate_random_reference_token() -> str:
    # Non-sequential, cryptographically strong random token: HP-DW-XXXX-XXXX
    part1 = secrets.token_hex(2).upper()
    part2 = secrets.token_hex(2).upper()
    return f"HP-DW-{part1}-{part2}"

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_anonymous_report(payload: ReportCreate, db: Session = Depends(get_db)):
    """
    Submits an anonymous incident report.
    - No name, phone, email, or account is requested or stored.
    - Generates a cryptographically random, non-sequential reference code.
    - Automatically adds initial status history log.
    """
    ref_token = generate_random_reference_token()

    new_report = CitizenReport(
        reference_token=ref_token,
        incident_category=payload.incident_category,
        district=payload.district,
        approximate_location=payload.approximate_location,
        incident_date=payload.incident_date,
        description=payload.description,
        evidence_filename=payload.evidence_filename,
        evidence_file_size=payload.evidence_file_size,
        status="Pending",
        is_demo_submission=payload.is_demo_submission,
    )

    db.add(new_report)
    db.flush()

    # Initial status history record
    history = ReportStatusHistory(
        report_id=new_report.id,
        status="Pending",
        note="Anonymous report successfully registered. Initial review pending.",
        updated_by_role="System",
    )
    db.add(history)

    # Audit log (no personal identifying info)
    audit = AuditLog(
        user_email="anonymous@citizen.public",
        user_role="Citizen",
        action="CREATE_ANONYMOUS_REPORT",
        target_type="Report",
        target_id=new_report.id,
        details=f"Anonymous report filed for district {payload.district} ({payload.incident_category})",
        ip_address_masked="0.0.0.0",
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Incident report securely registered.",
        "referenceToken": ref_token,
        "district": payload.district,
        "submissionMode": "LIVE_API" if not payload.is_demo_submission else "LOCAL_DEMO",
        "instructions": "Save this reference token securely. You can use it anytime on the status lookup portal to check administrative review status. We do not store any contact info to recover lost tokens.",
        "emergencyNotice": "NOTICE: This system is for analytical monitoring and intelligence tips. It is NOT a real-time 112 emergency dispatch channel. In case of immediate threat or ongoing crime, contact Himachal Pradesh Police at 112 or Nasha Nivaran Helpline at 1908.",
    }

@router.post("/status-lookup", response_model=PublicReportStatusResponse)
def lookup_report_status(payload: ReportStatusLookupRequest, db: Session = Depends(get_db)):
    """
    Checks the status of an incident report using only the reference token.
    Crucially: NEVER exposes detailed private allegations, coordinates, or other users' reports.
    """
    token = payload.reference_token.strip().upper()
    report = db.query(CitizenReport).filter(CitizenReport.reference_token == token).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reference token not recognized. Please check the code for typos or verify whether the report was submitted in demonstration mode.",
        )

    # Public friendly explanations for each administrative status
    status_explanations = {
        "Pending": "Your report has been queued for verification by the designated analytical review team.",
        "Under Review": "Analytical review in progress. Checking correlation with documented transit corridors and local enforcement alerts.",
        "Verified": "Report details have been cross-verified with field logs and shared with relevant district nodal officers for preventive monitoring.",
        "Duplicate": "Report matched an existing active monitoring cluster in this geographic sector and has been merged with the primary case file.",
        "Rejected": "Review concluded. The submission lacked sufficient geographic specificity or did not fall under NDPS prevention scope.",
    }

    last_history = (
        db.query(ReportStatusHistory)
        .filter(ReportStatusHistory.report_id == report.id)
        .order_by(ReportStatusHistory.timestamp.desc())
        .first()
    )

    last_time = last_history.timestamp if last_history else report.created_at

    return PublicReportStatusResponse(
        reference_token=report.reference_token,
        created_at=report.created_at,
        status=report.status,
        incident_category=report.incident_category,
        district=report.district,
        last_updated=last_time,
        public_status_message=status_explanations.get(report.status, "Status update logged."),
        is_demo_submission=report.is_demo_submission,
    )
