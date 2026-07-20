import React from "react";
import { Radio, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "../App.jsx";

export default function TrendChart({ data, status }) {
  const lineColor = "#22c55e";

  if (!data.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-secondary)]">
        <Radio className="mb-3 h-8 w-8 text-[var(--text-secondary)]" />
        <span>No trend data yet</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
        <TrendingUp className="h-5 w-5 text-[var(--pass)]" />
        Pass rate trend
      </div>
      <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#334155" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            labelFormatter={(value) => formatDate(value)}
            formatter={(value) => [`${value}%`, "Pass rate"]}
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#f1f5f9" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area type="monotone" dataKey="pass_rate" stroke={lineColor} strokeWidth={2} fill="transparent" dot={{ r: 3, fill: lineColor, stroke: lineColor }} />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
