import React from "react";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Link, Route, Routes } from "react-router-dom";
import AppDetail from "./pages/AppDetail.jsx";
import Home from "./pages/Home.jsx";
import RunDetail from "./pages/RunDetail.jsx";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function formatDate(value) {
  if (!value) return "No runs yet";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function statusClasses(status) {
  if (status === "PASS") return "text-[var(--pass)]";
  if (status === "FAIL") return "text-[var(--fail)]";
  return "text-[var(--text-muted)]";
}

export function statusBadgeClasses(status) {
  if (status === "PASS") return "rounded-full bg-[var(--pass-bg)] px-3 py-1 text-sm font-medium text-[var(--pass)]";
  if (status === "FAIL") return "rounded-full bg-[var(--fail-bg)] px-3 py-1 text-sm font-medium text-[var(--fail)]";
  return "rounded-full bg-[var(--bg-card)] px-3 py-1 text-sm font-medium text-[var(--text-muted)]";
}

export function statusBorderClasses(status) {
  if (status === "PASS") return "border-t-[var(--pass)]";
  if (status === "FAIL") return "border-t-[var(--fail)]";
  return "border-t-[var(--nodata)]";
}

export function statusLineColor(status) {
  if (status === "FAIL") return "var(--fail)";
  if (status === "PASS") return "var(--pass)";
  return "var(--nodata)";
}

export function statusDot(status) {
  if (status === "PASS") return "bg-[var(--pass)]";
  if (status === "FAIL") return "bg-[var(--fail)]";
  return "bg-[var(--nodata)]";
}

export function passRateValue(passed, total) {
  if (!total) return null;
  return Math.round((passed / total) * 1000) / 10;
}

export function passRateColor(rate) {
  if (rate == null) return "var(--text-muted)";
  if (rate >= 95) return "var(--pass)";
  if (rate >= 80) return "var(--warn)";
  return "var(--fail)";
}

export function passRateColorClass(rate) {
  if (rate == null) return "text-[var(--text-muted)]";
  if (rate >= 95) return "text-[var(--pass)]";
  if (rate >= 80) return "text-[var(--warn)]";
  return "text-[var(--fail)]";
}

export function passRateAccentClass(rate) {
  if (rate == null) return "border-l-[var(--nodata)]";
  if (rate >= 95) return "border-l-[var(--pass)]";
  if (rate >= 80) return "border-l-[var(--warn)]";
  return "border-l-[var(--fail)]";
}

export function statusBarColor(status) {
  if (status === "FAIL") return "var(--fail)";
  if (status === "PASS") return "var(--pass)";
  return "var(--nodata)";
}

export function appDisplayName(appName) {
  if (appName === "AjraSakha") return "WhatsApp Chatbot";
  if (appName === "KCC" + " Agent" || appName === "ACC" + " Agent") return "Agents Call Centre";
  if (appName === "questions_collection") return "Questions Collection";
  return appName;
}

function Layout({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-200 hover:text-[var(--pass)]">
            Test run results
          </Link>
          <button
            type="button"
            onClick={() => setIsDark((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apps/:appName" element={<AppDetail />} />
        <Route path="/runs/:runId" element={<RunDetail />} />
      </Routes>
    </Layout>
  );
}
