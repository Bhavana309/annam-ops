import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "../App.jsx";

export default function TrendChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-600">
        No trend data yet
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg border border-gray-200 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            tick={{ fontSize: 12 }}
          />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => formatDate(value)}
            formatter={(value) => [`${value}%`, "Pass rate"]}
          />
          <Line type="monotone" dataKey="pass_rate" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
