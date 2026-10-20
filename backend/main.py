import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from .models import AdminUser, CaseRelationship, CitizenReport, OfficialCaseRecord
from .routers import admin, dashboard, reports

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DrugWatch HP API",
    description="Himachal Pradesh Drug Trafficking Prevention and Analysis System REST API. Dedicated to public-interest analytical monitoring, responsible citizen reporting, verified case pattern analysis, and ethical hotspot prediction.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(admin.router)

@app.get("/health", tags=["System Health"])
@app.get("/api/v1/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "DrugWatch HP Backend API",
        "version": "1.0.0",
        "jurisdiction": "Himachal Pradesh, India",
        "databaseEngine": engine.name,
        "features": {
            "officialDashboard": True,
            "anonymousReporting": True,
            "adminVerification": True,
            "caseNetworkAnalysis": True,
            "hotspotAnomalyPrediction": True,
            "ethicalGovernanceGuards": True,
        },
    }

@app.on_event("startup")
def startup_populate():
    """
    Ensure the initial administrator and demonstration data are seeded if database is fresh.
    """
    db = SessionLocal()
    try:
        admin_count = db.query(AdminUser).count()
        if admin_count == 0:
            # Create default administrator for student evaluation
            master_admin = AdminUser(
                email="analyst@drugwatch.hp",
                hashed_password="ShimlaWatch2026!",  # Secure student demo credential
                role="Admin",
                full_name="Himachal Anti-Narcotics Task Force Reviewer",
            )
            db.add(master_admin)
            db.commit()
    finally:
        db.close()
