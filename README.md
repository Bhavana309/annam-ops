# ACE Test Observability Dashboard

Full-stack dashboard for collecting and viewing test runs from ACE product repos.

## Structure

- `dashboard/backend` - FastAPI API with PostgreSQL persistence
- `dashboard/frontend` - React, Tailwind CSS, and Recharts UI
- `dashboard/docker-compose.yml` - PostgreSQL, backend, and frontend services
- `shared/report_results.py` - reusable reporter for posting product test results

## Run with Docker Compose

```powershell
cd C:\Users\HP\Dashboard\dashboard
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## Run Locally

Start PostgreSQL with credentials matching `.env.example`, then run the backend:

```powershell
cd C:\Users\HP\Dashboard\dashboard\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://annam:annam_secure_pass@localhost:5432/annam_qa"
uvicorn main:app --reload
```

Run the frontend:

```powershell
cd C:\Users\HP\Dashboard\dashboard\frontend
npm install
$env:VITE_API_BASE="http://localhost:8000"
npm run dev
```

## API

- `POST /api/runs` - create a run with layers and test cases
- `GET /api/apps` - latest status for AjraSakha, Reviewer System, Web App, Agents Call Centre, Outreach, and Questions Collection
- `GET /api/apps/{app_name}/runs` - last 10 runs for an app
- `GET /api/runs/{run_id}` - full run detail
- `GET /api/apps/{app_name}/trend` - pass rate trend for the last 30 runs

## Reporter

Install reporter dependencies in the product repo:

```powershell
pip install requests beautifulsoup4
```

Post AjraSakha combined results (all 4 layers):

```powershell
$env:DASHBOARD_URL="http://localhost:8000"
python "C:\Users\HP\Dashboard\shared\report_results.py" --type=ajrasakha-combined --html=path\to\stable_suite_report.html --eval=path\to\evaluation_report_live.csv
```

Post Reviewer System results:

```powershell
$env:DASHBOARD_URL="http://localhost:8000"
python "C:\Users\HP\Dashboard\shared\report_results.py" path\to\e2e-results.json --type=reviewer
```

## Report Types

- `--type=ajrasakha` - posts from HTML report (Layer 1, 2, 3, 4)
- `--type=ajrasakha-combined` - combines HTML + eval CSV (recommended)
- `--type=ajrasakha-eval` - posts Layer 3 only from eval CSV
- `--type=ajrasakha-whatsapp` - posts Layer 4 WhatsApp E2E from CSV
- `--type=reviewer` - posts from Vitest JSON output
