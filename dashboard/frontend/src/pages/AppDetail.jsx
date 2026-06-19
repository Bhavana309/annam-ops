import React from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, appDisplayName, formatDate, statusClasses } from "../App.jsx";
import LayerRow from "../components/LayerRow.jsx";
import TrendChart from "../components/TrendChart.jsx";

export default function AppDetail() {
  const { appName } = useParams();
  const decodedName = decodeURIComponent(appName);
  const [apps, setApps] = useState([]);
  const [runs, setRuns] = useState([]);
  const [trend, setTrend] = useState([]);

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

  const app = apps.find((item) => item.app_name === decodedName);
  const status = app?.latest_status || app?.overall_status;

  return (
    <section>
      <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-950">Back to apps</Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{appDisplayName(decodedName)}</h1>
          <p className="mt-2 text-gray-600">{formatDate(app?.latest_run_at || app?.timestamp)}</p>
        </div>
        <span className={`w-fit rounded px-3 py-1 text-sm font-semibold ${statusClasses(status)}`}>{status || "No data"}</span>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Pass rate trend</h2>
        <TrendChart data={trend} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Last 10 runs</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Passed/Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((run) => (
                  <tr key={run.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link to={`/runs/${run.id}`} className="font-medium text-gray-950 hover:underline">
                        {formatDate(run.timestamp)}
                      </Link>
                      <div className="mt-3 rounded-lg border border-gray-200">
                        {run.layers.map((layer) => (
                          <LayerRow key={layer.id || layer.layer_name} layer={layer} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClasses(run.overall_status)}`}>
                        {run.overall_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{run.passed}/{run.total_checks}</td>
                    <td className="px-4 py-3 text-gray-700">{run.duration_seconds == null ? "--" : `${run.duration_seconds}s`}</td>
                  </tr>
                ))}
                {!runs.length && (
                  <tr>
                    <td className="px-4 py-6 text-gray-600" colSpan="4">No runs yet</td>
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
