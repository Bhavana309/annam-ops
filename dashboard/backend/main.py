import time
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import Base, engine, get_db
from models import Layer, Run, TestCase

APP_NAMES = ["AjraSakha", "Reviewer System", "Web App", "KCC Agent", "Outreach"]

app = FastAPI(title="ACE Test Observability Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TestCaseIn(BaseModel):
    name: str
    service: Optional[str] = None
    status: str
    status_code: Optional[int] = None
    latency_seconds: Optional[float] = None
    error_message: Optional[str] = ""
    failure_category: Optional[str] = None


class LayerIn(BaseModel):
    layer_name: str
    status: str
    passed: int = 0
    failed: int = 0
    total: int = 0
    test_cases: list[TestCaseIn] = []


class RunIn(BaseModel):
    app_name: str
    timestamp: datetime
    triggered_by: str = "manual"
    git_commit: Optional[str] = None
    overall_status: str
    total_checks: int = 0
    passed: int = 0
    failed: int = 0
    duration_seconds: Optional[float] = None
    layers: list[LayerIn] = []


def serialize_test_case(test_case: TestCase):
    return {
        "id": test_case.id,
        "name": test_case.name,
        "service": test_case.service,
        "status": test_case.status,
        "status_code": test_case.status_code,
        "latency_seconds": test_case.latency_seconds,
        "error_message": test_case.error_message,
        "failure_category": test_case.failure_category,
    }


def serialize_layer(layer: Layer, include_cases: bool = True):
    payload = {
        "id": layer.id,
        "layer_name": layer.layer_name,
        "status": layer.status,
        "passed": layer.passed,
        "failed": layer.failed,
        "total": layer.total,
    }
    if include_cases:
        payload["test_cases"] = [serialize_test_case(case) for case in layer.test_cases]
    return payload


def serialize_run(run: Run, include_cases: bool = True):
    return {
        "id": run.id,
        "app_name": run.app_name,
        "timestamp": run.timestamp.isoformat(),
        "triggered_by": run.triggered_by,
        "git_commit": run.git_commit,
        "overall_status": run.overall_status,
        "total_checks": run.total_checks,
        "passed": run.passed,
        "failed": run.failed,
        "duration_seconds": run.duration_seconds,
        "layers": [serialize_layer(layer, include_cases=include_cases) for layer in run.layers],
    }


def pass_rate(run: Optional[Run]):
    if not run or not run.total_checks:
        return None
    return round((run.passed / run.total_checks) * 100, 1)


@app.on_event("startup")
def create_tables():
    for attempt in range(12):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except Exception:
            if attempt == 11:
                raise
            time.sleep(5)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/runs")
def create_run(payload: RunIn, db: Session = Depends(get_db)):
    run = Run(
        app_name=payload.app_name,
        timestamp=payload.timestamp,
        triggered_by=payload.triggered_by,
        git_commit=payload.git_commit,
        overall_status=payload.overall_status,
        total_checks=payload.total_checks,
        passed=payload.passed,
        failed=payload.failed,
        duration_seconds=payload.duration_seconds,
    )
    for layer_payload in payload.layers:
        layer = Layer(
            layer_name=layer_payload.layer_name,
            status=layer_payload.status,
            passed=layer_payload.passed,
            failed=layer_payload.failed,
            total=layer_payload.total,
        )
        for case_payload in layer_payload.test_cases:
            layer.test_cases.append(TestCase(**case_payload.model_dump()))
        run.layers.append(layer)

    db.add(run)
    db.commit()
    db.refresh(run)
    return {"run_id": run.id, "status": "created"}


@app.get("/api/apps")
def get_apps(db: Session = Depends(get_db)):
    apps = []
    for app_name in APP_NAMES:
        latest = (
            db.query(Run)
            .options(joinedload(Run.layers).joinedload(Layer.test_cases))
            .filter(Run.app_name == app_name)
            .order_by(Run.timestamp.desc(), Run.id.desc())
            .first()
        )
        total_runs = db.query(Run).filter(Run.app_name == app_name).count()
        if latest:
            apps.append(
                {
                    "app_name": app_name,
                    "latest_status": latest.overall_status,
                    "latest_run_at": latest.timestamp.isoformat(),
                    "pass_rate": pass_rate(latest),
                    "total_runs": total_runs,
                    **serialize_run(latest),
                }
            )
        else:
            apps.append(
                {
                    "app_name": app_name,
                    "timestamp": None,
                    "triggered_by": None,
                    "git_commit": None,
                    "overall_status": None,
                    "latest_status": None,
                    "latest_run_at": None,
                    "total_checks": 0,
                    "passed": 0,
                    "failed": 0,
                    "duration_seconds": None,
                    "pass_rate": None,
                    "total_runs": 0,
                    "layers": [],
                }
            )
    return apps


@app.get("/api/apps/{app_name}/runs")
def get_app_runs(app_name: str, db: Session = Depends(get_db)):
    runs = (
        db.query(Run)
        .options(joinedload(Run.layers))
        .filter(Run.app_name == app_name)
        .order_by(Run.timestamp.desc(), Run.id.desc())
        .limit(10)
        .all()
    )
    return [serialize_run(run, include_cases=False) for run in runs]


@app.get("/api/runs/{run_id}")
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = (
        db.query(Run)
        .options(joinedload(Run.layers).joinedload(Layer.test_cases))
        .filter(Run.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return serialize_run(run)


@app.get("/api/apps/{app_name}/trend")
def get_trend(app_name: str, db: Session = Depends(get_db)):
    runs = (
        db.query(Run)
        .filter(Run.app_name == app_name)
        .order_by(Run.timestamp.desc(), Run.id.desc())
        .limit(30)
        .all()
    )
    return [
        {"timestamp": run.timestamp.isoformat(), "pass_rate": pass_rate(run)}
        for run in reversed(runs)
    ]
