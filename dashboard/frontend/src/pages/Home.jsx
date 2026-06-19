import React from "react";
import { useEffect, useState } from "react";
import { API_BASE } from "../App.jsx";
import AppCard from "../components/AppCard.jsx";

export default function Home() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/apps`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load apps");
        return response.json();
      })
      .then(setApps)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.app_name} app={app} />
        ))}
      </div>
    </section>
  );
}
