import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

const categoryBadgeClasses = {
  dynamic_weather: "bg-blue-100 text-blue-700",
  dynamic_market: "bg-yellow-100 text-yellow-700",
  dynamic_schemes: "bg-purple-100 text-purple-700",
  gdb_semantic: "bg-green-100 text-green-700",
  general: "bg-gray-100 text-gray-600",
  business_rule: "bg-orange-100 text-orange-700",
  state_transition: "bg-pink-100 text-pink-700",
  concurrency: "bg-red-100 text-red-700",
  regression: "bg-red-200 text-red-800",
  contract: "bg-gray-100 text-gray-500",
};

function ValidationIndicator({ value, label }) {
  return (
    <span className={value ? "text-xs font-medium text-green-600" : "text-xs font-medium text-red-600"}>
      {value ? "✓" : "✗"} {label}
    </span>
  );
}

export default function TestCaseTable({ testCases }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <thead className="bg-[var(--bg-page)]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Test Name</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">File</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Duration</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {testCases.map((testCase) => {
            const rowKey = testCase.id || `${testCase.name}-${testCase.service}`;
            const isPass = testCase.status === "PASS";
            const category = testCase.category;
            const showLayer3Indicators = testCase.routing_pass !== undefined && testCase.routing_pass !== null;

            return (
              <tr key={rowKey} className={isPass ? "border-l-4 border-[var(--pass)] bg-[var(--pass-bg)]/40" : "border-l-4 border-[var(--fail)] bg-[var(--fail-bg)]/40"}>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap items-center gap-2 font-medium text-[var(--text-primary)]">
                    <span>{testCase.name}</span>
                    {category ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadgeClasses[category] || "bg-gray-100 text-gray-500"}`}>
                        {category}
                      </span>
                    ) : null}
                    {showLayer3Indicators ? (
                      <>
                        <ValidationIndicator value={testCase.routing_pass} label="Routing" />
                        {testCase.source_attribution_pass !== undefined && testCase.source_attribution_pass !== null ? (
                          <ValidationIndicator value={testCase.source_attribution_pass} label="Source" />
                        ) : null}
                        {testCase.source_url_pass !== undefined && testCase.source_url_pass !== null ? (
                          <ValidationIndicator value={testCase.source_url_pass} label="URL" />
                        ) : null}
                        {testCase.disclaimer_pass !== undefined && testCase.disclaimer_pass !== null ? (
                          <ValidationIndicator value={testCase.disclaimer_pass} label="Disclaimer" />
                        ) : null}
                        {testCase.latency_flag === "slow" ? (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Slow</span>
                        ) : null}
                        {testCase.latency_flag === "very_slow" ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Very Slow</span>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-[var(--text-secondary)]">{testCase.service || "--"}</td>
                <td className="px-4 py-4 align-top">
                  <span className={isPass ? "inline-flex items-center gap-1 font-semibold text-[var(--pass)]" : "inline-flex items-center gap-1 font-semibold text-[var(--fail)]"}>
                    {isPass ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testCase.status}
                  </span>
                </td>
                <td className="px-4 py-4 align-top font-medium text-[var(--text-secondary)]">
                  {testCase.latency_seconds == null ? "--" : `${testCase.latency_seconds}s`}
                </td>
                <td className="min-w-96 px-4 py-4 align-top">
                  {!isPass && testCase.error_message ? (
                    <div className="whitespace-pre-wrap rounded-lg border border-[var(--fail-bg)] bg-[var(--bg-card)] p-3 text-xs text-[var(--fail)]">
                      {testCase.error_message}
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
