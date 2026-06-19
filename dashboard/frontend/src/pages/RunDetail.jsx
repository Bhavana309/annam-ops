import React from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, appDisplayName, formatDate, statusClasses } from "../App.jsx";
import TestCaseTable from "../components/TestCaseTable.jsx";

export default function RunDetail() {
  const { runId } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");
  const [expandedLayer, setExpandedLayer] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/runs/${runId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Run not found");
        return response.json();
      })
      .then(setRun)
      .catch((err) => setError(err.message));
  }, [runId]);

  if (error) return <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!run) return <div className="text-sm text-gray-600">Loading run...</div>;

  const visibleLayers = (run.layers || []).filter((layer) => layer.layer_name?.startsWith("Layer"));

  return (
    <section>
      <Link to={`/apps/${encodeURIComponent(run.app_name)}`} className="text-sm font-medium text-gray-600 hover:text-gray-950">
        Back to {appDisplayName(run.app_name)}
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Run #{run.id}</h1>
          <p className="mt-2 text-gray-600">{appDisplayName(run.app_name)} - {formatDate(run.timestamp)}</p>
        </div>
        <span className={`w-fit rounded px-3 py-1 text-sm font-semibold ${statusClasses(run.overall_status)}`}>
          {run.overall_status}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 rounded-lg border border-gray-200 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-gray-500">Git commit</dt>
          <dd className="mt-1 font-medium text-gray-950">{run.git_commit || "--"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Triggered by</dt>
          <dd className="mt-1 font-medium text-gray-950">{run.triggered_by || "--"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Passed/Total</dt>
          <dd className="mt-1 font-medium text-gray-950">{run.passed}/{run.total_checks}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Duration</dt>
          <dd className="mt-1 font-medium text-gray-950">{run.duration_seconds == null ? "--" : `${run.duration_seconds}s`}</dd>
        </div>
      </dl>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200">
        {visibleLayers.map((layer) => {
          const layerKey = layer.id || layer.layer_name;
          const testCases = layer.test_cases || [];

          return (
            <div key={layerKey} className="border-t border-gray-200 first:border-t-0">
              <button
                type="button"
                onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                aria-expanded={expandedLayer === layer.id}
                className="flex w-full cursor-pointer flex-col gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-center gap-3 font-medium text-gray-950">
                  <span className="w-4 text-gray-500">{expandedLayer === layer.id ? "v" : ">"}</span>
                  {layer.layer_name}
                </span>
                <span className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClasses(layer.status)}`}>{layer.status}</span>
                  <span className="text-gray-700">
                    {layer.passed}/{layer.total} passed
                  </span>
                </span>
              </button>

              {expandedLayer === layer.id && (
                <div className="border-t border-gray-100 bg-white p-4">
                  {testCases.length ? (
                    <TestCaseTable testCases={testCases} />
                  ) : (
                    <p className="text-sm text-gray-600">No test cases found.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!visibleLayers.length && <p className="p-4 text-sm text-gray-600">No layer details found.</p>}
      </div>
    </section>
  );
}
