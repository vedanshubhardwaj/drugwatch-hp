import csv
import io
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from ..analytics import find_duplicate_report_candidates
from ..database import get_db
from ..models import AdminUser, AuditLog, CitizenReport, OfficialCaseRecord, ReportStatusHistory
from ..schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminReportDetail,
    ReportHistoryItem,
    ReportStatusUpdateRequest,
)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Verification & Governance"])

# Helper dependency to authenticate admin token
def require_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in to administrative console.",
        )
    token = authorization.split(" ")[1]
    # In production JWT is decoded; here we look up active admin user
    user = db.query(AdminUser).filter(AdminUser.email == token).first()
    if not user:
        # Check standard demo credentials or token
        if token == "hp-admin-demo-token":
            return AdminUser(
                id="admin-master-001",
                email="directorate.analyst@hp.gov.in",
                role="Admin",
                full_name="Directorate Nodal Officer",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired administrative credentials.",
        )
    return user

@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates administrative personnel (Reviewer, Senior Analyst, Admin).
    """
    user = db.query(AdminUser).filter(AdminUser.email == payload.email).first()
    
    # Check credentials
    if not user or user.hashed_password != payload.password:
        # Check standard initial student/demo evaluation credentials
        if payload.email == "analyst@drugwatch.hp" and payload.password == "ShimlaWatch2026!":
            return AdminLoginResponse(
                access_token="hp-admin-demo-token",
                role="Admin",
                email="analyst@drugwatch.hp",
                full_name="Himachal Anti-Narcotics Task Force Reviewer",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative username or password.",
        )

    return AdminLoginResponse(
        access_token=user.email,
        role=user.role,
        email=user.email,
        full_name=user.full_name,
    )

@router.get("/reports", response_model=List[AdminReportDetail])
def list_reports_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    district: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(CitizenReport)
    if status_filter and status_filter != "All":
        query = query.filter(CitizenReport.status == status_filter)
    if district and district != "All":
        query = query.filter(CitizenReport.district == district)

    reports = query.order_by(CitizenReport.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for r in reports:
        history_items = [
            ReportHistoryItem(
                status=h.status,
                timestamp=h.timestamp,
                note=h.note,
                updated_by_role=h.updated_by_role,
            )
            for h in r.history
        ]
        result.append(
            AdminReportDetail(
                id=r.id,
                reference_token=r.reference_token,
                created_at=r.created_at,
                incident_category=r.incident_category,
                district=r.district,
                approximate_location=r.approximate_location,
                incident_date=r.incident_date,
                description=r.description,
                evidence_filename=r.evidence_filename,
                evidence_file_size=r.evidence_file_size,
                status=r.status,
                reviewer_notes=r.reviewer_notes,
                duplicate_of_id=r.duplicate_of_id,
                history=history_items,
                is_demo_submission=r.is_demo_submission,
            )
        )
    return result

@router.patch("/reports/{report_id}/status")
def update_report_status(
    report_id: str,
    payload: ReportStatusUpdateRequest,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    old_status = report.status
    report.status = payload.status
    if payload.reviewer_notes:
        report.reviewer_notes = payload.reviewer_notes
    if payload.duplicate_of_id:
        report.duplicate_of_id = payload.duplicate_of_id

    # Append to status history
    history = ReportStatusHistory(
        report_id=report.id,
        status=payload.status,
        note=payload.reviewer_notes or f"Status transitioned from {old_status} to {payload.status}.",
        updated_by_role=admin.role,
    )
    db.add(history)

    # Log audit event
    audit = AuditLog(
        user_email=admin.email,
        user_role=admin.role,
        action="UPDATE_REPORT_STATUS",
        target_type="Report",
        target_id=report.id,
        details=f"Status changed from '{old_status}' to '{payload.status}'. Notes: {payload.reviewer_notes or 'None'}",
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Report status updated to {payload.status}."}

@router.get("/reports/{report_id}/duplicate-suggestions")
def get_duplicate_suggestions(
    report_id: str,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    all_reports = db.query(CitizenReport).all()
    reports_dict = [
        {"id": r.id, "district": r.district, "approximate_location": r.approximate_location, "description": r.description}
        for r in all_reports
    ]
    target_dict = {
        "id": target.id,
        "district": target.district,
        "approximate_location": target.approximate_location,
        "description": target.description,
    }

    candidates = find_duplicate_report_candidates(target_dict, reports_dict)
    return {"reportId": report_id, "suggestions": candidates}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, le=100),
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

@router.post("/datasets/import")
async def import_csv_dataset(
    file: UploadFile,
    admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Validates CSV schema, reports invalid rows and duplicate keys, and previews import.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only standard CSV files (.csv) are accepted.")

    content = await file.read()
    decoded = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    required_columns = {"caseNumber", "year", "month", "district", "category", "quantityValue"}
    if not reader.fieldnames or not required_columns.issubset(set(reader.fieldnames)):
        missing = required_columns - set(reader.fieldnames or [])
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV schema. Missing required columns: {', '.join(missing)}",
        )

    valid_rows = []
    errors = []
    duplicate_count = 0
    row_index = 1

    for row in reader:
        row_index += 1
        case_no = row.get("caseNumber", "").strip()
        if not case_no:
            errors.append({"row": row_index, "column": "caseNumber", "message": "Case number is required."})
            continue

        # Check existing duplicates in database
        existing = db.query(OfficialCaseRecord).filter(OfficialCaseRecord.case_number == case_no).first()
        if existing:
            duplicate_count += 1
            errors.append({"row": row_index, "column": "caseNumber", "message": f"Duplicate caseNumber '{case_no}' already exists in database."})
            continue

        try:
            qty = float(row.get("quantityValue", 0))
            yr = int(row.get("year", 2024))
            mo = int(row.get("month", 1))
        except ValueError:
            errors.append({"row": row_index, "column": "numeric", "message": "Invalid numeric value for year, month, or quantityValue."})
            continue

        valid_rows.append({
            "caseNumber": case_no,
            "district": row.get("district", "Unknown"),
            "category": row.get("category", "Other"),
            "year": yr,
            "month": mo,
            "quantityValue": qty,
        })

    # Record audit log
    audit = AuditLog(
        user_email=admin.email,
        user_role=admin.role,
        action="IMPORT_DATASET_VALIDATION",
        target_type="Dataset",
        target_id=file.filename,
        details=f"CSV validation executed: {len(valid_rows)} valid, {len(errors)} errors, {duplicate_count} duplicates.",
    )
    db.add(audit)
    db.commit()

    return {
        "fileName": file.filename,
        "totalRowsChecked": row_index - 1,
        "validRowCount": len(valid_rows),
        "invalidRowCount": len(errors),
        "duplicateRowCount": duplicate_count,
        "errors": errors[:25],  # Cap error list to prevent overwhelming response
        "preview": valid_rows[:5],
    }
