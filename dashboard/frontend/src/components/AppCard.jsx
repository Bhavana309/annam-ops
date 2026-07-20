import React from "react";
import { Link } from "react-router-dom";
import { appDisplayName, formatDate, passRateColor, passRateValue, statusBarColor } from "../App.jsx";

export default function AppCard({ app }) {
  const status = app.latest_status || app.overall_status;
  const rate = app.pass_rate ?? passRateValue(app.passed, app.total_checks);
  const rateColor = passRateColor(rate);
  const progressWidth = rate == null ? 0 : Math.max(0, Math.min(rate, 100));
  const passRate = rate == null ? "--" : `${rate}%`;

  return (
    <Link
      to={`/apps/${encodeURIComponent(app.app_name)}`}
      className="group flex min-h-40 cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]"
    >
      <div className="w-1.5 shrink-0 rounded-l-xl" style={{ backgroundColor: statusBarColor(status) }} />
      <div className="flex min-h-40 flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{appDisplayName(app.app_name)}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{status ? "Latest run" : "No runs yet"}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[28px] font-semibold leading-none" style={{ color: rateColor }}>
            {passRate}
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--nodata)]">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressWidth}%`, backgroundColor: rateColor }} />
          </div>
        </div>

        <div className="mt-auto pt-5 text-xs font-medium text-[var(--text-secondary)]">
          {(app.total_runs ?? 0)} total runs <span aria-hidden="true">&middot;</span> {formatDate(app.latest_run_at || app.timestamp)}
        </div>
      </div>
    </Link>
  );
}
