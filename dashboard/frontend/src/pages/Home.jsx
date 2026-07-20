import React from "react";
import { useEffect, useState } from "react";
import { API_BASE } from "../App.jsx";
import AppCard from "../components/AppCard.jsx";

export default function Home() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState("");
  const [activeEnvironment, setActiveEnvironment] = useState("staging");

  useEffect(() => {
    fetch(`${API_BASE}/api/apps`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load apps");
        return response.json();
      })
      .then(setApps)
      .catch((err) => setError(err.message));
  }, []);

  const visibleApps = apps.filter((app) => {
    const environment = (app.environment || app.latest_environment || app.env || "staging").toLowerCase();
    return environment === activeEnvironment;
  });
  const totalRuns = visibleApps.reduce((sum, app) => sum + (app.total_runs || 0), 0);
  const openFailures = visibleApps.reduce((sum, app) => sum + (app.failed || 0), 0);
  const passingTests = visibleApps.reduce((sum, app) => sum + (app.passed || 0), 0);
  const appsWithData = visibleApps.filter((app) => (app.total_runs || 0) > 0).length;

  return (
    <section>
      <div className="mb-6 inline-flex rounded-full bg-[#0f172a] p-[3px]">
        {["staging", "production"].map((environment) => (
          <button
            key={environment}
            type="button"
            onClick={() => setActiveEnvironment(environment)}
            className={`min-w-24 rounded-full px-5 py-1.5 text-center text-sm capitalize transition-[background,color] duration-150 ease-in-out ${
              activeEnvironment === environment ? "bg-[var(--bg-card)] font-semibold text-[var(--text-primary)]" : "bg-transparent font-normal text-[var(--text-muted)]"
            }`}
          >
            {environment}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visibleApps.map((app) => (
          <AppCard key={app.app_name} app={app} />
        ))}
        {!visibleApps.length && (
          <div className="col-span-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center text-sm text-[var(--text-secondary)]">
            No {activeEnvironment} runs yet.
          </div>
        )}
      </div>
      <div className="mt-6 grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Total runs</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{totalRuns}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Open failures</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--fail)]">{openFailures}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Passing tests</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--pass)]">{passingTests}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Apps with data</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{appsWithData}</div>
        </div>
      </div>
    </section>
  );
}
