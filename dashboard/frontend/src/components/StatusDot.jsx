import React from "react";

export default function StatusDot({ status }) {
  if (status === "PASS") {
    return <span className="h-2.5 w-2.5 rounded-full bg-[var(--pass)]" />;
  }

  if (status === "FAIL") {
    return <span className="h-2.5 w-2.5 rounded-full bg-[var(--fail)]" />;
  }

  return <span className="h-2.5 w-2.5 rounded-full bg-[var(--nodata)]" />;
}
