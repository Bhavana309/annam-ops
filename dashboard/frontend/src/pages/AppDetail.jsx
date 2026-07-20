import React from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Inbox, Info } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE, appDisplayName, formatDate, passRateColorClass, passRateValue, statusBadgeClasses } from "../App.jsx";
import LayerRow from "../components/LayerRow.jsx";
import StatusDot from "../components/StatusDot.jsx";

export default function AppDetail() {
  const { appName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(appName);
  const [apps, setApps] = useState([]);
  const [runs, setRuns] = useState([]);
  const [trend, setTrend] = useState([]);
  const [expandedRuns, setExpandedRuns] = useState({});

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/apps`).then((response) => response.json()),
      fetch(`${API_BASE}/api/apps/${encodeURIComponent(decodedName)}/runs`).then((response) => response.json()),
      fetch(`${API_BASE}/api/apps/${encodeURIComponent(decodedName)}/trend`).then((response) => response.json())
    ]).then(([appsPayload, runsPayload, trendPayload]) => {
      setApps(appsPayload);
      setRuns(runsPayload);
      setTrend(trendPayload);
    });
  }, [decodedName]);

  const dateParts = (value) => {
    if (!value) return { date: "No runs yet", time: "" };
    const date = new Date(value);
    return {
      date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date),
      time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date),
    };
  };
  const toggleRun = (runId) => setExpandedRuns((prev) => ({ ...prev, [runId]: !prev[runId] }));

  return (
    <section className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pass)] transition-colors duration-200 hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-4 w-4" />
        Back to apps
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{appDisplayName(decodedName)}</h1>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Run status</h2>
        <div className="mb-6 flex items-center gap-1">
          {runs.slice(0, 20).reverse().map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => toggleRun(run.id)}
              title={`${formatDate(run.timestamp)} - ${run.passed}/${run.total_checks}`}
              className={`h-2.5 w-2.5 rounded-full border transition-transform duration-150 hover:scale-125 ${
                run.overall_status === "PASS"
                  ? "border-[var(--pass)] bg-[var(--pass)]"
                  : run.overall_status === "FAIL"
                    ? "border-[var(--fail)] bg-[var(--fail)]"
                    : "border-[var(--text-muted)] bg-transparent"
              }`}
              aria-label={`${formatDate(run.timestamp)} - ${run.passed}/${run.total_checks}`}
            />
          ))}
          {!runs.length && <span className="text-sm text-[var(--text-secondary)]">No runs yet</span>}
        </div>

        <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Last 10 runs</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--bg-page)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Passed/Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Duration</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--text-secondary)]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                {runs.map((run, index) => {
                  const previousRun = runs[index + 1];
                  const visibleLayers = (run.layers || []).filter((layer) => layer.layer_name && layer.layer_name !== "Command Execution Logs");
                  const runRate = passRateValue(run.passed, run.total_checks);
                  const canCompareTotals = Boolean(
                    previousRun &&
                      run.total_checks &&
                      previousRun.total_checks &&
                      Math.abs(run.total_checks - previousRun.total_checks) / Math.max(run.total_checks, previousRun.total_checks) <= 0.2
                  );
                  const deltaPassed = canCompareTotals ? run.passed - previousRun.passed : null;
                  const timestamp = dateParts(run.timestamp);

                  return (
                    <React.Fragment key={run.id}>
                      <tr
                        onClick={() => toggleRun(run.id)}
                        className={`cursor-pointer align-top transition-colors duration-150 hover:bg-[var(--bg-card-hover)] ${index % 2 === 0 ? "bg-[var(--bg-card)]" : "bg-[var(--bg-page)]/40"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--text-primary)]">{timestamp.date}</div>
                          <div className="mt-0.5 text-sm text-[var(--text-muted)]">{timestamp.time}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex w-fit items-center gap-2 ${statusBadgeClasses(run.overall_status)}`}>
                            <StatusDot status={run.overall_status} />
                            {run.overall_status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${passRateColorClass(runRate)}`}>
                          {run.passed}/{run.total_checks}
                          {deltaPassed != null && deltaPassed < 0 && (
                            <span className="ml-2 rounded-full bg-[var(--warn-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--warn)]">{"\u25BC"} {deltaPassed}</span>
                          )}
                          {deltaPassed != null && deltaPassed > 0 && (
                            <span className="ml-2 rounded-full bg-[var(--pass-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--pass)]">{"\u25B2"} +{deltaPassed}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{run.duration_seconds == null ? "--" : `${run.duration_seconds}s`}</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronDown className={`ml-auto h-5 w-5 text-[var(--text-secondary)] transition-transform duration-200 ${expandedRuns[run.id] ? "rotate-180" : ""}`} />
                        </td>
                      </tr>
                      {expandedRuns[run.id] && (
                        <tr>
                          <td className="bg-[var(--bg-page)] px-4 py-4" colSpan="5">
                            {visibleLayers.length ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                {visibleLayers.map((layer) => (
                                  <LayerRow
                                    key={layer.id || layer.layer_name}
                                    layer={layer}
                                    onDrillDown={() => navigate(`/runs/${run.id}`)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[13px] italic text-[var(--text-secondary)]">
                                <Info className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                                Layer details not available for this run
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {!runs.length && (
                  <tr>
                    <td className="px-4 py-12 text-center" colSpan="5">
                      <Inbox className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]" />
                      <div className="text-sm text-[var(--text-secondary)]">No runs yet</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
