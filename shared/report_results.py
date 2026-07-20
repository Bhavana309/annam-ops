"""
report_results.py - shared reporter for the ACE test observability dashboard.

Copy this file into any product repo and call post_results() at the end of a test run.
"""

import os
import sys
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup

DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://localhost:8000")


def post_results(payload: dict):
    """Post test results to the dashboard. Failures are non-fatal for test suites."""
    try:
        response = requests.post(f"{DASHBOARD_URL}/api/runs", json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        print(f"[Dashboard] Results posted successfully: run_id={result.get('run_id')}")
        return result
    except Exception as exc:
        print(f"[Dashboard] Failed to post results (non-fatal): {exc}")
        return None


def parse_status_code(value: str):
    return int(value) if value and value.isdigit() else None


def parse_latency(value: str):
    if not value:
        return None
    cleaned = value.lower().replace("s", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def failure_category_for(status: str, status_code, error: str):
    if status != "FAIL":
        return None

    message = (error or "").lower()
    infrastructure_patterns = [
        "connecterror",
        "econnrefused",
        "winerror",
        "readtimeout",
        "readerror",
        "querysrv enotfound",
        "socket hang up",
    ]
    if any(pattern in message for pattern in infrastructure_patterns):
        return "infrastructure"
    if "disclaimer" in message:
        return "retrieval"
    if "timeout" in message:
        return "timeout"
    if "tools" in message:
        return "routing"
    if "connecterror" in message:
        return "mcp"
    if status_code in (404, 405):
        return "api"
    return "unknown"


def test_category_for(name: str, service: str = "") -> str:
    text = f"{name or ''} {service or ''}".lower()
    if "known bug" in text or "regression" in text:
        return "regression"
    if "concurrent" in text or "race" in text:
        return "concurrency"
    if "duplicate" in text or "guard" in text or "capacity" in text or "stf" in text or "autoallocate" in text:
        return "business_rule"
    if "status" in text or "transition" in text or "closed" in text or "open" in text or "in-review" in text or "queue_duplicate" in text:
        return "state_transition"
    if "routing" in text or "domain" in text or "plan" in text or "intent" in text or "planner" in text:
        return "routing"
    return "contract"


def ajrasakha_feature_group_for(name: str) -> str | None:
    prefix = (name or "").strip().split(" ", 1)[0].lower()
    feature_groups = {
        "weather_question_1": "Weather",
        "weather_question_2": "Weather",
        "weather_question_3": "Weather",
        "simple_weather_control": "Weather",
        "market_question_1": "Market",
        "market_question_2": "Market",
        "mandya_paddy_price": "Market",
        "scheme_question_1": "Schemes",
        "scheme_question_2": "Schemes",
        "gdb_question_1": "GDB",
        "soil_question_1": "Soil",
        "greeting_question": "Greetings",
        "no_tool_greeting_2": "Greetings",
        "multi_tool_question": "Multi-tool",
        "health_check": "System health",
    }
    return feature_groups.get(prefix)


def parse_ajrasakha_html_report(html_path: str, git_commit: str | None = None) -> dict:
    """Parse the AjraSakha stable suite HTML report and return a dashboard payload."""
    with open(html_path, "r", encoding="utf-8") as handle:
        soup = BeautifulSoup(handle.read(), "html.parser")

    summary = soup.find("div", class_="summary")
    if not summary:
        raise ValueError("Could not find summary block in HTML report")

    summary_paragraphs = summary.find_all("p")
    generated_at_text = summary_paragraphs[0].get_text(strip=True).replace("Generated at: ", "")
    counts_text = summary_paragraphs[1].get_text(" ", strip=True)
    parts = counts_text.split("|")

    total = int(parts[0].split(":")[1].strip())
    passed = int(parts[1].split(":")[1].strip())
    failed = int(parts[2].split(":")[1].strip())
    overall_status = "PASS" if failed == 0 else "FAIL"

    layers = []
    for section in soup.find_all("section"):
        h2 = section.find("h2")
        if not h2:
            continue

        h2_text = h2.get_text(" ", strip=True)
        if "Layer" not in h2_text:
            continue

        layer_name = h2_text.replace(" - PASS", "").replace(" - FAIL", "")
        layer_name = layer_name.replace(" — PASS", "").replace(" — FAIL", "").strip()
        status_span = h2.find("span")
        status_text = status_span.get_text(strip=True) if status_span else h2_text
        layer_status = "PASS" if "PASS" in status_text else "FAIL"

        counts_p = section.find("p")
        layer_counts = counts_p.get_text(" ", strip=True) if counts_p else "0/0 checks passed"
        layer_passed = int(layer_counts.split("/")[0].strip())
        layer_total = int(layer_counts.split("/")[1].split(" ")[0].strip())
        layer_failed = layer_total - layer_passed

        test_cases = []
        for row in section.find_all("tr")[1:]:
            cols = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
            if len(cols) == 6:
                service, name, status, status_code_text, latency_text, error = cols
            elif len(cols) == 5:
                service = ""
                name, status, status_code_text, latency_text, error = cols
            else:
                continue

            status_code = parse_status_code(status_code_text)
            test_case = {
                "name": name,
                "service": service,
                "status": status,
                "status_code": status_code,
                "latency_seconds": parse_latency(latency_text),
                "error_message": error,
                "failure_category": failure_category_for(status, status_code, error),
                "category": test_category_for(name, service),
            }

            test_cases.append(test_case)

        layers.append(
            {
                "layer_name": layer_name,
                "status": layer_status,
                "passed": layer_passed,
                "failed": layer_failed,
                "total": layer_total,
                "test_cases": test_cases,
            }
        )

    return {
        "app_name": "AjraSakha",
        "timestamp": generated_at_text or datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": overall_status,
        "total_checks": total,
        "passed": passed,
        "failed": failed,
        "layers": layers,
    }


def parse_ajrasakha_eval_csv(csv_path: str, git_commit: str | None = None) -> dict:
    """Parse the AjraSakha evaluation CSV report and return a dashboard payload."""
    import csv

    def is_true(value) -> bool:
        return str(value or "").strip().lower() in ("true", "1", "yes")

    def parse_float(value):
        if value in (None, ""):
            return None
        try:
            return float(value)
        except ValueError:
            return None

    test_cases = []
    passed_count = 0

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            category = (row.get("category") or "unknown").strip() or "unknown"
            name = (row.get("name") or "unknown").strip() or "unknown"
            latency_seconds = parse_float(row.get("latency_seconds"))
            passed = (
                is_true(row.get("technical_pass"))
                and is_true(row.get("routing_pass"))
                and is_true(row.get("tool_pass"))
                and is_true(row.get("plan_pass"))
            )
            status = "PASS" if passed else "FAIL"
            latency_flag = None
            if latency_seconds is not None and latency_seconds > 60:
                latency_flag = "very_slow"
            elif latency_seconds is not None and latency_seconds > 30:
                latency_flag = "slow"

            test_cases.append(
                {
                    "name": name,
                    "service": category,
                    "status": status,
                    "latency_seconds": latency_seconds,
                    "error_message": row.get("failure_reason") or "",
                    "failure_category": row.get("triage_category") or None,
                    "category": category,
                    "routing_pass": is_true(row.get("routing_pass")),
                    "source_attribution_pass": is_true(row.get("source_attribution_pass")),
                    "source_url_pass": is_true(row.get("source_url_pass")),
                    "disclaimer_pass": is_true(row.get("disclaimer_language_pass")),
                    "latency_flag": latency_flag,
                }
            )
            if passed:
                passed_count += 1

    total_checks = len(test_cases)
    total_passed = passed_count
    total_failed = total_checks - total_passed
    layers = [
        {
            "layer_name": "Layer 3 - Stable LangGraph Scenarios",
            "status": "PASS" if total_failed == 0 else "FAIL",
            "passed": total_passed,
            "failed": total_failed,
            "total": total_checks,
            "test_cases": test_cases,
        }
    ]

    return {
        "app_name": "AjraSakha",
        "timestamp": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": "PASS" if all(layer["status"] == "PASS" for layer in layers) else "FAIL",
        "total_checks": total_checks,
        "passed": total_passed,
        "failed": total_failed,
        "layers": layers,
    }


def parse_ajrasakha_whatsapp_e2e_csv(csv_path: str, git_commit: str | None = None) -> dict:
    """Parse the AjraSakha WhatsApp E2E CSV report and return a dashboard payload."""
    import csv

    def is_true(value) -> bool:
        return str(value or "").strip().lower() in ("true", "1", "yes")

    def parse_float(value):
        if value in (None, ""):
            return None
        try:
            return float(value)
        except ValueError:
            return None

    def category_for_name(name: str) -> str:
        text = (name or "").lower()
        if "weather" in text:
            return "dynamic_weather"
        if "market" in text or "mandi" in text or "price" in text:
            return "dynamic_market"
        if "scheme" in text:
            return "dynamic_schemes"
        if "soil" in text:
            return "gdb_semantic"
        if "gdb" in text or "paddy" in text or "wheat" in text or "crop" in text:
            return "gdb_semantic"
        if "greeting" in text or "hello" in text or "namaste" in text:
            return "general"
        return "general"

    test_cases = []
    passed_count = 0

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("name") or "unknown").strip() or "unknown"
            service = (row.get("service") or "").strip()
            passed = is_true(row.get("overall_pass"))
            status = "PASS" if passed else "FAIL"
            test_cases.append(
                {
                    "name": name,
                    "service": service,
                    "status": status,
                    "status_code": parse_status_code((row.get("status_code") or "").strip()),
                    "latency_seconds": parse_float(row.get("latency_seconds")),
                    "error_message": row.get("validation_reason") or "",
                    "category": category_for_name(name),
                }
            )
            if passed:
                passed_count += 1

    total_checks = len(test_cases)
    total_passed = passed_count
    total_failed = total_checks - total_passed
    layers = [
        {
            "layer_name": "Layer 4 - WhatsApp E2E Tests",
            "status": "PASS" if total_failed == 0 else "FAIL",
            "passed": total_passed,
            "failed": total_failed,
            "total": total_checks,
            "test_cases": test_cases,
        }
    ]

    return {
        "app_name": "AjraSakha",
        "timestamp": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": "PASS" if total_failed == 0 else "FAIL",
        "total_checks": total_checks,
        "passed": total_passed,
        "failed": total_failed,
        "layers": layers,
    }


def parse_ajrasakha_combined(html_path: str, eval_csv_path: str, git_commit: str | None = None) -> dict:
    """Combine stable suite HTML layers with rich AjraSakha eval CSV Layer 3."""
    html_payload = parse_ajrasakha_html_report(html_path, git_commit)
    eval_payload = parse_ajrasakha_eval_csv(eval_csv_path, git_commit)

    html_layers = html_payload.get("layers", [])
    layer_1 = [layer for layer in html_layers if layer.get("layer_name", "").startswith("Layer 1")]
    layer_2 = [layer for layer in html_layers if layer.get("layer_name", "").startswith("Layer 2")]
    layer_4 = [layer for layer in html_layers if layer.get("layer_name", "").startswith("Layer 4")]
    layer_3 = eval_payload.get("layers", [])

    layers = layer_1 + layer_2 + layer_3 + layer_4
    total_checks = sum(layer.get("total", 0) for layer in layers)
    total_passed = sum(layer.get("passed", 0) for layer in layers)
    total_failed = sum(layer.get("failed", 0) for layer in layers)

    return {
        "app_name": "AjraSakha",
        "timestamp": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": "PASS" if total_failed == 0 else "FAIL",
        "total_checks": total_checks,
        "passed": total_passed,
        "failed": total_failed,
        "layers": layers,
    }


def parse_reviewer_vitest_json(json_path: str, git_commit: str | None = None) -> dict:
    """Parse Vitest JSON reporter output and return a dashboard payload for Reviewer System."""
    import json

    with open(json_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)

    test_files = data.get("testResults", [])
    layer_map = {}

    def infer_layer_name(file_path: str) -> str:
        lower = file_path.lower()
        if "unit" in lower:
            return "Layer 1 - Unit Tests"
        if "integration" in lower:
            return "Layer 2 - Integration Tests"
        if "e2e" in lower:
            return "Layer 3 - E2E Tests"
        return "Other Tests"

    for file_result in test_files:
        file_path = file_result.get("name", "")
        layer_name = infer_layer_name(file_path)

        if layer_name not in layer_map:
            layer_map[layer_name] = {"passed": 0, "failed": 0, "total": 0, "test_cases": []}

        for assertion in file_result.get("assertionResults", []):
            status = "PASS" if assertion.get("status") == "passed" else "FAIL"
            error_message = ""
            if assertion.get("failureMessages"):
                error_message = "; ".join(assertion["failureMessages"])[:500]

            duration_ms = assertion.get("duration") or 0
            latency_seconds = round(duration_ms / 1000, 3) if duration_ms else None

            test_case = {
                "name": assertion.get("title", assertion.get("fullName", "unknown")),
                "service": file_path.split("/")[-1],
                "status": status,
                "status_code": None,
                "latency_seconds": latency_seconds,
                "error_message": error_message,
                "failure_category": failure_category_for(status, None, error_message),
                "category": test_category_for(assertion.get("title", assertion.get("fullName", "unknown")), file_path),
            }

            layer_map[layer_name]["test_cases"].append(test_case)
            layer_map[layer_name]["total"] += 1
            if status == "PASS":
                layer_map[layer_name]["passed"] += 1
            else:
                layer_map[layer_name]["failed"] += 1

    layers = []
    layer_order = {
        "Layer 1 - Unit Tests": 1,
        "Layer 2 - Integration Tests": 2,
        "Layer 3 - E2E Tests": 3,
        "Other Tests": 4,
    }
    for layer_name, layer_data in sorted(layer_map.items(), key=lambda item: layer_order.get(item[0], 99)):
        layers.append(
            {
                "layer_name": layer_name,
                "status": "PASS" if layer_data["failed"] == 0 else "FAIL",
                "passed": layer_data["passed"],
                "failed": layer_data["failed"],
                "total": layer_data["total"],
                "test_cases": layer_data["test_cases"],
            }
        )

    total_passed = sum(l["passed"] for l in layer_map.values())
    total_failed = sum(l["failed"] for l in layer_map.values())
    total_checks = total_passed + total_failed

    return {
        "app_name": "Reviewer System",
        "timestamp": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": "PASS" if total_failed == 0 else "FAIL",
        "total_checks": total_checks,
        "passed": total_passed,
        "failed": total_failed,
        "layers": layers,
    }


def parse_question_collection_vitest_json(json_path: str, git_commit: str | None = None) -> dict:
    """Parse Vitest JSON reporter output and return a dashboard payload for Question Collection Platform."""
    import json

    with open(json_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)

    test_files = data.get("testResults", [])
    layer_map = {}

    def infer_layer_name(file_path: str) -> str:
        lower = file_path.lower()
        if "questionsubmit" in lower:
            return "Layer 1 - Question Submit"
        if "aipipeline" in lower:
            return "Layer 2 - AI Pipeline"
        if "walletreward" in lower:
            return "Layer 3 - Wallet & Rewards"
        if "paymentdetail" in lower:
            return "Layer 4 - Payment Details"
        if "adminops" in lower:
            return "Layer 5 - Admin Operations"
        if "speechlgd" in lower:
            return "Layer 6 - Speech & LGD"
        return "Other Tests"

    for file_result in test_files:
        file_path = file_result.get("name", "")
        layer_name = infer_layer_name(file_path)

        if layer_name not in layer_map:
            layer_map[layer_name] = {"passed": 0, "failed": 0, "total": 0, "test_cases": []}

        for assertion in file_result.get("assertionResults", []):
            status = "PASS" if assertion.get("status") == "passed" else "FAIL"
            error_message = ""
            if assertion.get("failureMessages"):
                error_message = "; ".join(assertion["failureMessages"])[:500]

            duration_ms = assertion.get("duration") or 0
            latency_seconds = round(duration_ms / 1000, 3) if duration_ms else None

            test_case = {
                "name": assertion.get("title", assertion.get("fullName", "unknown")),
                "service": file_path.split("/")[-1],
                "status": status,
                "status_code": None,
                "latency_seconds": latency_seconds,
                "error_message": error_message,
                "failure_category": failure_category_for(status, None, error_message),
                "category": test_category_for(
                    assertion.get("title", assertion.get("fullName", "unknown")), file_path
                ),
            }

            layer_map[layer_name]["test_cases"].append(test_case)
            layer_map[layer_name]["total"] += 1
            if status == "PASS":
                layer_map[layer_name]["passed"] += 1
            else:
                layer_map[layer_name]["failed"] += 1

    layers = []
    layer_order = {
        "Layer 1 - Question Submit": 1,
        "Layer 2 - AI Pipeline": 2,
        "Layer 3 - Wallet & Rewards": 3,
        "Layer 4 - Payment Details": 4,
        "Layer 5 - Admin Operations": 5,
        "Layer 6 - Speech & LGD": 6,
        "Other Tests": 7,
    }
    for layer_name, layer_data in sorted(layer_map.items(), key=lambda item: layer_order.get(item[0], 99)):
        layers.append(
            {
                "layer_name": layer_name,
                "status": "PASS" if layer_data["failed"] == 0 else "FAIL",
                "passed": layer_data["passed"],
                "failed": layer_data["failed"],
                "total": layer_data["total"],
                "test_cases": layer_data["test_cases"],
            }
        )

    total_passed = sum(l["passed"] for l in layer_map.values())
    total_failed = sum(l["failed"] for l in layer_map.values())
    total_checks = total_passed + total_failed

    return {
        "app_name": "Questions Collection",
        "timestamp": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": "PASS" if total_failed == 0 else "FAIL",
        "total_checks": total_checks,
        "passed": total_passed,
        "failed": total_failed,
        "layers": layers,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python report_results.py <report_path> [git_commit] [--type=ajrasakha|reviewer|question-collection]")
        sys.exit(1)

    report_path = sys.argv[1]
    commit = next((arg for arg in sys.argv[2:] if not arg.startswith("--")), None)
    report_type = "ajrasakha"
    html_path = None
    eval_csv_path = None
    for arg in sys.argv:
        if arg.startswith("--type="):
            report_type = arg.split("=")[1]
        elif arg.startswith("--html="):
            html_path = arg.split("=", 1)[1]
        elif arg.startswith("--eval="):
            eval_csv_path = arg.split("=", 1)[1]

    if report_type == "ajrasakha-combined":
        if not html_path or not eval_csv_path:
            print("Usage: python report_results.py --type=ajrasakha-combined --html=<html_report_path> --eval=<eval_csv_path> [git_commit]")
            sys.exit(1)
        dashboard_payload = parse_ajrasakha_combined(html_path, eval_csv_path, commit)
    elif report_type == "ajrasakha-eval":
        dashboard_payload = parse_ajrasakha_eval_csv(report_path, commit)
    elif report_type == "ajrasakha-whatsapp":
        dashboard_payload = parse_ajrasakha_whatsapp_e2e_csv(report_path, commit)
    elif report_type == "reviewer":
        dashboard_payload = parse_reviewer_vitest_json(report_path, commit)
    elif report_type == "question-collection":
        dashboard_payload = parse_question_collection_vitest_json(report_path, commit)
    else:
        dashboard_payload = parse_ajrasakha_html_report(report_path, commit)

    print(
        f"[Dashboard] Parsed report: {dashboard_payload['app_name']} - "
        f"{dashboard_payload['overall_status']} "
        f"({dashboard_payload['passed']}/{dashboard_payload['total_checks']} passed)"
    )
    post_results(dashboard_payload)