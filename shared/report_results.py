"""
report_results.py - shared reporter for the ACE test observability dashboard.

Copy this file into any product repo and call post_results() at the end of a test run.
"""

import os
import sys
from datetime import datetime

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
            test_cases.append(
                {
                    "name": name,
                    "service": service,
                    "status": status,
                    "status_code": status_code,
                    "latency_seconds": parse_latency(latency_text),
                    "error_message": error,
                    "failure_category": failure_category_for(status, status_code, error),
                }
            )

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
        "timestamp": generated_at_text or datetime.utcnow().isoformat(),
        "triggered_by": "manual",
        "git_commit": git_commit or "unknown",
        "overall_status": overall_status,
        "total_checks": total,
        "passed": passed,
        "failed": failed,
        "layers": layers,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python report_results.py <html_report_path> [git_commit]")
        sys.exit(1)

    html_report_path = sys.argv[1]
    commit = sys.argv[2] if len(sys.argv) > 2 else None
    dashboard_payload = parse_ajrasakha_html_report(html_report_path, commit)
    print(
        f"[Dashboard] Parsed report: {dashboard_payload['app_name']} - "
        f"{dashboard_payload['overall_status']} "
        f"({dashboard_payload['passed']}/{dashboard_payload['total_checks']} passed)"
    )
    post_results(dashboard_payload)
