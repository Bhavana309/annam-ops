import React from "react";
import { useState } from "react";
import { statusClasses } from "../App.jsx";
import TestCaseTable from "./TestCaseTable.jsx";

export default function LayerRow({ layer, showCases = false }) {
  const [open, setOpen] = useState(false);
  const testCases = layer.test_cases || [];

  return (
    <div className="border-t border-gray-200 first:border-t-0">
      <button
        type="button"
        onClick={() => showCases && setOpen((value) => !value)}
        aria-expanded={showCases ? open : undefined}
        className="flex w-full cursor-pointer flex-col gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-center gap-3 font-medium text-gray-950">
          {showCases && <span className="w-4 text-gray-500">{open ? "v" : ">"}</span>}
          {layer.layer_name}
        </span>
        <span className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClasses(layer.status)}`}>{layer.status}</span>
          <span className="text-gray-700">
            {layer.passed}/{layer.total} passed
          </span>
        </span>
      </button>
      {showCases && open && (
        <div className="border-t border-gray-100 bg-white p-4">
          {testCases.length ? <TestCaseTable testCases={testCases} /> : <p className="text-sm text-gray-600">No test cases found.</p>}
        </div>
      )}
    </div>
  );
}
