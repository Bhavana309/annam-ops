import React from "react";

export default function TestCaseTable({ testCases }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Service</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Latency</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Error message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {testCases.map((testCase) => (
            <tr key={testCase.id || `${testCase.name}-${testCase.service}`}>
              <td className="px-3 py-3 font-medium text-gray-950">{testCase.name}</td>
              <td className="px-3 py-3 text-gray-700">{testCase.service || "--"}</td>
              <td className="px-3 py-3">
                <span className={testCase.status === "PASS" ? "font-semibold text-[#16a34a]" : "font-semibold text-[#dc2626]"}>
                  {testCase.status}
                </span>
              </td>
              <td className="px-3 py-3 text-gray-700">
                {testCase.latency_seconds == null ? "--" : `${testCase.latency_seconds}s`}
              </td>
              <td className="min-w-80 whitespace-pre-wrap px-3 py-3 text-gray-800">{testCase.error_message || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
