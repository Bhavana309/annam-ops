import React from "react";
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
  if (status === "PASS") return "bg-[#16a34a] text-white";
  if (status === "FAIL") return "bg-[#dc2626] text-white";
  return "bg-[#6b7280] text-white";
}

export function statusDot(status) {
  if (status === "PASS") return "bg-[#16a34a]";
  if (status === "FAIL") return "bg-[#dc2626]";
  return "bg-[#6b7280]";
}

export function appDisplayName(appName) {
  return appName === "AjraSakha" ? "WhatsApp Chatbot" : appName;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="text-2xl font-semibold tracking-normal">
            Test run results
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
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
