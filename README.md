# DrugWatch HP
## Himachal Pradesh Drug Trafficking Prevention and Analysis System

DrugWatch HP is a full-stack, data-driven web application designed to support drug trafficking prevention, responsible anonymous incident reporting, verified case pattern analysis, and ethical district-level monitoring in Himachal Pradesh, India.

---

### Core System Modules
1. **Official Data Dashboard:**
   - Aggregated official case counts across all 12 districts of Himachal Pradesh (Bilaspur, Chamba, Hamirpur, Kangra, Kinnaur, Kullu, Lahaul & Spiti, Mandi, Shimla, Sirmaur, Solan, Una).
   - Year-wise (2021–2025) and month-wise enforcement trendlines.
   - Interactive Leaflet district map displaying case densities and transit corridors.
   - NDPS seizure breakdowns (Charas, Heroin/Chitta, Synthetic Pharmaceuticals, Opium, Cannabis Cultivation).
   - Commercial vs. Intermediate vs. Small statutory quantity proportions.
   - Strict labeling: Demonstrates calibrated synthetic datasets separate from citizen tips.

2. **Anonymous Incident Reporting:**
   - Dedicated portal for citizens to submit non-emergency intelligence tips.
   - **No PII Required:** Does not require names, phone numbers, email addresses, or user accounts.
   - Cryptographically random, non-sequential reference tokens (e.g. `HP-DW-8A2F-91K2`).
   - Secure Status Lookup tool allowing submitters to track administrative review without exposing other users' reports or private allegations publicly.
   - Clear emergency disclaimer directing urgent threats to Himachal Police **112** and Nasha Mukt Helpline **1908**.

3. **Admin Review and Verification:**
   - Role-based access control (Reviewer, Senior Analyst, Admin).
   - Review queue for pending citizen reports with district and status filters.
   - Status transitions (`Pending` → `Under Review` → `Verified` / `Duplicate` / `Rejected`).
   - Automated duplicate suggestion engine based on lexical and geographic proximity.
   - Immutable audit trail recording administrative decisions and timestamps.

4. **Case Pattern and Network Analysis:**
   - Interactive node-link topology modeling inter-district routes, highway checkpoints (Bajoura, Kandwal, Swarghat, BBN, Paonta Sahib), and seizure profiles.
   - Relationship inspection drawer showing the exact evidentiary basis for each connection.
   - Strict distinction between confirmed documented connections and statistical correlations.
   - Anti-guilt guarantee: Network proximity is never used to infer personal culpability.

5. **District-Level Hotspot Analysis and Prediction:**
   - Rolling 3-month and 6-month averages and period-over-period percentage changes.
   - Anomaly detection index (Z-score based on historical district baseline).
   - Deterministic 1-month risk estimates with upper/lower confidence bounds.
   - Time-split model validation (2021–2024 train, 2025 test) reporting Mean Absolute Error (MAE).
   - Safe degradation: Predictive forecasting is disabled for sparse low-count districts (Kinnaur, Lahaul & Spiti).

6. **Data Import, Schema Validation, and Export:**
   - CSV validator for standardized crime record ingestion (verifies required headers, numeric types, and duplicate FIRs).
   - CSV export for official records and demonstration research datasets.

---

### Technology Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Leaflet & OpenStreetMap, Chart.js & react-chartjs-2.
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, Pandas, SQLAlchemy, SQLite (local dev/tests) & PostgreSQL (production).
- **Dual-Mode Engine:** 
  - **Demo Mode (GitHub Pages compatible):** Runs fully client-side with bundled synthetic datasets and localStorage.
  - **Live API Mode:** Connects to versioned REST endpoints (`/api/v1/*`) with server-side validation and database persistence.

---

### Terminal Commands (Windows & Linux)

#### 1. Running Frontend in Development (Port 3000)
```bash
# Install node dependencies
npm install

# Start full-stack development server
npm run dev
```

#### 2. Running Standalone Python FastAPI Backend (Port 8000)
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

#### 3. Executing Backend Automated Tests
```bash
# Inside backend directory
pytest tests/ -v
```

#### 4. Building for GitHub Pages Deployment
```bash
npm run build
```

---

### Evaluation Credentials (Demo Admin)
- **Email:** `analyst@drugwatch.hp`
- **Password:** `ShimlaWatch2026!`
