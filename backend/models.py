import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Reviewer")  # Reviewer, Senior Analyst, Admin
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OfficialCaseRecord(Base):
    __tablename__ = "official_case_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_number = Column(String(100), unique=True, index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    month = Column(Integer, nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    district = Column(String(100), index=True, nullable=False)
    police_station = Column(String(150), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    quantity_value = Column(Float, nullable=False)
    quantity_unit = Column(String(20), nullable=False)
    commercial_classification = Column(String(50), nullable=False)  # Commercial, Intermediate, Small
    transit_route = Column(String(255), nullable=True)
    seizure_location_type = Column(String(100), nullable=False)
    is_synthetic_demo = Column(Boolean, default=True, nullable=False)
    source_dataset = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference_token = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    incident_category = Column(String(100), nullable=False)
    district = Column(String(100), index=True, nullable=False)
    approximate_location = Column(String(255), nullable=False)
    incident_date = Column(String(10), nullable=False)
    description = Column(Text, nullable=False)
    evidence_filename = Column(String(255), nullable=True)
    evidence_file_size = Column(Integer, nullable=True)
    status = Column(String(50), default="Pending", index=True, nullable=False)  # Pending, Under Review, Verified, Rejected, Duplicate
    reviewer_notes = Column(Text, nullable=True)
    duplicate_of_id = Column(String(36), ForeignKey("citizen_reports.id"), nullable=True)
    is_demo_submission = Column(Boolean, default=False)

    history = relationship("ReportStatusHistory", back_populates="report", cascade="all, delete-orphan")

class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("citizen_reports.id"), nullable=False)
    status = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    note = Column(Text, nullable=True)
    updated_by_role = Column(String(50), default="System")

    report = relationship("CitizenReport", back_populates="history")

class CaseRelationship(Base):
    __tablename__ = "case_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_node = Column(String(100), nullable=False)
    target_node = Column(String(100), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    weight = Column(Integer, default=1)
    evidence_basis = Column(Text, nullable=False)
    is_documented_connection = Column(Boolean, default=True)  # True = confirmed factual connection, False = statistical similarity

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_email = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address_masked = Column(String(50), default="127.0.0.x")
