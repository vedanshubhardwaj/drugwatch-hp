import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base, get_db
from backend.main import app
from backend.analytics import calculate_district_anomalies, compute_model_evaluation_metrics, find_duplicate_report_candidates

# In-memory test SQLite engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["jurisdiction"] == "Himachal Pradesh, India"

def test_anonymous_report_submission_and_token_generation():
    payload = {
        "incident_category": "Suspicious Distribution Point",
        "district": "Solan",
        "approximate_location": "Baddi industrial bypass outer lane",
        "incident_date": "2025-10-14",
        "description": "Observed repeated unmarked van exchanges near cargo logistics perimeter.",
        "is_demo_submission": False,
    }
    response = client.post("/api/v1/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "referenceToken" in data
    token = data["referenceToken"]
    # Check token pattern
    assert token.startswith("HP-DW-")
    assert len(token) >= 12

    # Verify lookup using this token
    lookup_response = client.post("/api/v1/reports/status-lookup", json={"reference_token": token})
    assert lookup_response.status_code == 200
    lookup_data = lookup_response.json()
    assert lookup_data["status"] == "Pending"
    assert lookup_data["district"] == "Solan"
    assert "public_status_message" in lookup_data
    # Verify private coordinates or description are NOT exposed in public lookup
    assert "approximate_location" not in lookup_data
    assert "description" not in lookup_data

def test_admin_authentication_and_unauthorized_rejection():
    # Attempt unauthorized access to report queue
    unauth_resp = client.get("/api/v1/admin/reports")
    assert unauth_resp.status_code == 401

    # Login with valid credentials
    login_resp = client.post(
        "/api/v1/admin/login",
        json={"email": "analyst@drugwatch.hp", "password": "ShimlaWatch2026!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Access authorized queue
    auth_resp = client.get(
        "/api/v1/admin/reports",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert auth_resp.status_code == 200
    assert isinstance(auth_resp.json(), list)

def test_analytics_anomaly_and_time_split_evaluation():
    # Test deterministic historical anomaly calculation
    counts = {
        "Kangra": [8, 9, 10, 8, 9, 11, 10, 12, 11, 15, 18, 22], # Elevated recent surge
        "Chamba": [3, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 2],       # Low flat baseline
    }
    results = calculate_district_anomalies(counts)
    assert "Kangra" in results
    assert results["Kangra"]["activity_level"] == "Elevated"
    assert results["Kangra"]["z_score"] > 1.5
    assert results["Chamba"]["activity_level"] == "Baseline"

    # Test time-split evaluation metric calculation
    train = [10, 12, 11, 13, 12, 14, 15, 13, 14, 16]
    test = [15, 17, 16, 18]
    metrics = compute_model_evaluation_metrics(train, test)
    assert "mae" in metrics
    assert "rmse" in metrics
    assert metrics["mae"] >= 0

def test_duplicate_suggestion_engine():
    new_report = {
        "id": "new-1",
        "district": "Solan",
        "approximate_location": "Baddi Housing Board park gate",
        "description": "Suspicious night vehicles exchanging packages near warehouse edge.",
    }
    existing_reports = [
        {
            "id": "old-1",
            "district": "Solan",
            "approximate_location": "Housing Board perimeter warehouse lane Baddi",
            "description": "Vehicles exchanging packages late night at warehouse corner.",
        },
        {
            "id": "old-2",
            "district": "Kullu",
            "approximate_location": "Kasol bus terminal",
            "description": "Unattended bag found near terminal stairs.",
        },
    ]
    candidates = find_duplicate_report_candidates(new_report, existing_reports)
    assert len(candidates) >= 1
    top_match = candidates[0]
    assert top_match[0] == "old-1"  # Matched the correct Solan report
    assert top_match[1] > 0.3      # Jaccard overlap
