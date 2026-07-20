import React from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, ChevronRight, Clock, Inbox, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, appDisplayName, formatDate, passRateColorClass, passRateValue, statusBadgeClasses, statusBarColor } from "../App.jsx";
import StatusDot from "../components/StatusDot.jsx";
import TestCaseTable from "../components/TestCaseTable.jsx";

export default function RunDetail() {
  const { runId } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");
  const [expandedLayers, setExpandedLayers] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/runs/${runId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Run not found");
        return response.json();
      })
      .then(setRun)
      .catch((err) => setError(err.message));
  }, [runId]);

  if (error) return <div className="rounded-xl border border-[var(--fail-bg)] bg-[var(--bg-card)] p-4 text-sm text-[var(--fail)]">{error}</div>;
  if (!run) return <div className="text-sm text-[var(--text-secondary)]">Loading run...</div>;

  const visibleLayers = (run.layers || []).filter((layer) => layer.layer_name && layer.layer_name !== "Command Execution Logs");
  const runRate = passRateValue(run.passed, run.total_checks);

  return (
    <section className="space-y-6">
      <Link to={`/apps/${encodeURIComponent(run.app_name)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pass)] transition-colors duration-200 hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-4 w-4" />
        Back to {appDisplayName(run.app_name)}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Run #{run.id}</h1>
          <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{appDisplayName(run.app_name)} - {formatDate(run.timestamp)}</p>
        </div>
        <span className={`flex w-fit items-center gap-2 ${statusBadgeClasses(run.overall_status)}`}>
          <StatusDot status={run.overall_status} />
          {run.overall_status}
        </span>
      </div>

      <dl className="grid gap-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Git commit</dt>
          <dd className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{run.git_commit || "--"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Triggered by</dt>
          <dd className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{run.triggered_by || "--"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Passed/Total</dt>
          <dd className={`mt-2 flex items-center gap-2 text-xl font-semibold ${passRateColorClass(runRate)}`}>
            {run.overall_status === "PASS" ? <CheckCircle className="h-5 w-5 text-[var(--pass)]" /> : <XCircle className="h-5 w-5 text-[var(--fail)]" />}
            {run.passed}/{run.total_checks}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Duration</dt>
          <dd className="mt-2 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
            <Clock className="h-5 w-5 text-[var(--text-secondary)]" />
            {run.duration_seconds == null ? "--" : `${run.duration_seconds}s`}
          </dd>
        </div>
      </dl>

      <div className="space-y-4">
        {visibleLayers.map((layer) => {
          const layerKey = layer.id || layer.layer_name;
          const testCases = layer.test_cases || [];

          return (
            <div
              key={layerKey}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-200 hover:border-[var(--border-strong)]"
              style={{
                boxShadow: `inset 5px 0 0 ${statusBarColor(layer.status)}`,
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
                  }
                }}
                aria-expanded={Boolean(expandedLayers[layerKey])}
                className="flex w-full cursor-pointer flex-col gap-4 p-6 transition-colors duration-200 hover:bg-[var(--bg-card-hover)] sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  <ChevronRight className={`h-5 w-5 text-[var(--text-secondary)] transition-transform duration-200 ${expandedLayers[layerKey] ? "rotate-90" : ""}`} />
                  {layer.layer_name}
                </span>
                <span className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`flex items-center gap-2 ${statusBadgeClasses(layer.status)}`}>
                    <StatusDot status={layer.status} />
                    {layer.status}
                  </span>
                  <span className="font-medium text-[var(--text-secondary)]">
                    {layer.passed}/{layer.total} passed
                  </span>
                </span>
              </div>

              {expandedLayers[layerKey] && (
                <div className="border-t border-[var(--border)] bg-[var(--bg-page)] p-6">
                  {testCases.length ? (
                    <TestCaseTable testCases={testCases} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Inbox className="mb-3 h-8 w-8 text-[var(--text-secondary)]" />
                      <p className="text-sm text-[var(--text-secondary)]">No test cases found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!visibleLayers.length && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
            <Inbox className="mb-3 h-8 w-8 text-[var(--text-secondary)]" />
            <p className="text-sm text-[var(--text-secondary)]">No layer details found.</p>
          </div>
        )}
      </div>
    </section>
  );
}
