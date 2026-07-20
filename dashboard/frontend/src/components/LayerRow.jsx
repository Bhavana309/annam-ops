import React from "react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { passRateColorClass, passRateValue, statusBarColor } from "../App.jsx";
import TestCaseTable from "./TestCaseTable.jsx";

export default function LayerRow({ layer, showCases = false, onDrillDown }) {
  const [open, setOpen] = useState(false);
  const testCases = layer.test_cases || [];
  const rate = passRateValue(layer.passed, layer.total);
  const canExpand = showCases && testCases.length > 0;

  function handleClick() {
    if (showCases) {
      setOpen((value) => !value);
      return;
    }
    if (onDrillDown) onDrillDown();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      className="min-h-14 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]"
      style={{
        boxShadow: `inset 5px 0 0 ${statusBarColor(layer.status)}`,
      }}
    >
      <div
        aria-expanded={showCases ? open : undefined}
        className="flex items-center justify-between gap-4"
      >
        <span>
          <span className="block text-sm font-semibold text-[var(--text-primary)]">{layer.layer_name}</span>
          <span className={`mt-1 block text-[13px] font-medium ${passRateColorClass(rate)}`}>
            {layer.passed}/{layer.total} passed
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <ChevronRight className={`h-4 w-4 text-[var(--text-secondary)] transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        </span>
      </div>
      {showCases && open && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          {canExpand ? <TestCaseTable testCases={testCases} /> : <p className="text-sm italic text-[var(--text-secondary)]">No test cases found.</p>}
        </div>
      )}
    </div>
  );
}
