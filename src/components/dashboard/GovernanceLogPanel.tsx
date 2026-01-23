"use client";

import { useNocracyStore } from "@/store/simulation";
import { useState } from "react";

type LogFilter = "ALL" | "INFO" | "WARNING" | "CRITICAL";

export default function GovernanceLogPanel() {
  const logs = useNocracyStore((state) => state.governanceLogs);
  const [filter, setFilter] = useState<LogFilter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    return log.severity === filter;
  });

  const severityColors = {
    INFO: "text-[var(--text-secondary)]",
    WARNING: "text-[var(--status-warning)]",
    CRITICAL: "text-[var(--status-critical)]",
  };

  const severityIcons = {
    INFO: "◇",
    WARNING: "△",
    CRITICAL: "✕",
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex justify-between items-center">
        <span>AI GOVERNANCE LOG</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as LogFilter)}
          className="bg-[var(--bg-primary)] border border-[var(--grid-line)] px-2 py-0.5 text-[10px]"
        >
          <option value="ALL">ALL</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredLogs.slice(0, 50).map((log) => (
          <div
            key={log.id}
            className={`log-entry ${log.severity.toLowerCase()} cursor-pointer`}
            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
          >
            <div className="flex items-start gap-2">
              <span className={severityColors[log.severity]}>
                {severityIcons[log.severity]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="timestamp">T+{log.tick.toString().padStart(6, "0")}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">|</span>
                  <span className="text-[10px] text-[var(--accent-cyan)]">{log.module}</span>
                </div>
                <div className="text-[var(--text-primary)] text-[12px]">{log.summary}</div>
                
                {expanded === log.id && (
                  <div className="mt-2 pt-2 border-t border-[var(--grid-line)]">
                    <div className="text-[11px] text-[var(--text-secondary)] mb-1">
                      {log.reasoning}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Action: {log.action}
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-[9px] ${severityColors[log.severity]}`}>
                {log.severity}
              </span>
            </div>
          </div>
        ))}
        
        {filteredLogs.length === 0 && (
          <div className="p-4 text-center text-[var(--text-muted)] text-[11px]">
            NO LOGS MATCHING FILTER
          </div>
        )}
      </div>
      
      <div className="border-t border-[var(--grid-line)] p-2 flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>TOTAL: {logs.length}</span>
        <span>SHOWING: {Math.min(filteredLogs.length, 50)}</span>
      </div>
    </div>
  );
}
