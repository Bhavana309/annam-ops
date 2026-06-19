import React from "react";
import { Link } from "react-router-dom";
import { appDisplayName, formatDate, statusDot } from "../App.jsx";

export default function AppCard({ app }) {
  const status = app.latest_status || app.overall_status;
  return (
    <Link
      to={`/apps/${encodeURIComponent(app.app_name)}`}
      className="block rounded-lg border border-gray-200 p-5 shadow-sm transition hover:border-gray-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">{appDisplayName(app.app_name)}</h2>
          <p className="mt-1 text-sm text-gray-600">{status ? "Latest run" : "No runs yet"}</p>
        </div>
        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${statusDot(status)}`} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Pass rate</dt>
          <dd className="mt-1 text-xl font-semibold">{app.pass_rate == null ? "--" : `${app.pass_rate}%`}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Total runs</dt>
          <dd className="mt-1 text-xl font-semibold">{app.total_runs ?? 0}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Last run</dt>
          <dd className="mt-1 font-medium text-gray-900">{formatDate(app.latest_run_at || app.timestamp)}</dd>
        </div>
      </dl>
    </Link>
  );
}
