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
- `GET /api/apps` - latest status for AjraSakha, Reviewer System, Web App, KCC Agent, and Outreach
- `GET /api/apps/{app_name}/runs` - last 10 runs for an app
- `GET /api/runs/{run_id}` - full run detail
- `GET /api/apps/{app_name}/trend` - pass rate trend for the last 30 runs

## Reporter

Install reporter dependencies in the product repo:

```powershell
pip install requests beautifulsoup4
```

Post an AjraSakha HTML report:

```powershell
$env:DASHBOARD_URL="http://localhost:8000"
python C:\Users\HP\Dashboard\shared\report_results.py path\to\report.html abc123
```
