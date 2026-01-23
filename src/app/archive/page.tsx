"use client";

import { useState } from "react";
import { useNocracyStore } from "@/store/simulation";

export default function ArchivePage() {
  const simulation = useNocracyStore((state) => state.simulation);
  const population = useNocracyStore((state) => state.population);
  const economy = useNocracyStore((state) => state.economy);
  const agents = useNocracyStore((state) => state.agents);
  const buildings = useNocracyStore((state) => state.buildings);
  const laws = useNocracyStore((state) => state.laws);
  const governanceLogs = useNocracyStore((state) => state.governanceLogs);
  const research = useNocracyStore((state) => state.research);
  const ethics = useNocracyStore((state) => state.ethics);

  const [activeTab, setActiveTab] = useState<"logs" | "snapshots" | "exports">("logs");

  const generateExport = (type: string) => {
    let data: unknown;
    let filename: string;

    switch (type) {
      case "full":
        data = {
          simulation,
          population,
          economy,
          agents,
          buildings,
          laws,
          governanceLogs,
          research,
          ethics,
          exportedAt: Date.now(),
        };
        filename = `nocracy-full-export-T${simulation.tick}.json`;
        break;
      case "agents":
        data = { agents, exportedAt: Date.now() };
        filename = `nocracy-agents-T${simulation.tick}.json`;
        break;
      case "laws":
        data = { laws, exportedAt: Date.now() };
        filename = `nocracy-laws-T${simulation.tick}.json`;
        break;
      case "logs":
        data = { governanceLogs, exportedAt: Date.now() };
        filename = `nocracy-logs-T${simulation.tick}.json`;
        break;
      case "economy":
        data = { economy, exportedAt: Date.now() };
        filename = `nocracy-economy-T${simulation.tick}.json`;
        break;
      default:
        return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-[var(--accent-cyan)] tracking-wider mb-2">
          ARCHIVE / LOGS
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Complete transparency. Everything is public. Download any data from
          the simulation in JSON format.
        </p>
      </div>

      {/* Export Section */}
      <div className="panel p-6 mb-8">
        <h2 className="text-xl text-[var(--text-primary)] mb-4 tracking-wider">
          DATA EXPORTS
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          Download simulation data as JSON files. All data is unprocessed and
          complete.
        </p>
        <div className="grid grid-cols-5 gap-4">
          <button
            onClick={() => generateExport("full")}
            className="btn btn-primary"
          >
            FULL EXPORT
          </button>
          <button onClick={() => generateExport("agents")} className="btn">
            AGENTS DATA
          </button>
          <button onClick={() => generateExport("laws")} className="btn">
            LAWS DATA
          </button>
          <button onClick={() => generateExport("logs")} className="btn">
            GOV. LOGS
          </button>
          <button onClick={() => generateExport("economy")} className="btn">
            ECONOMY DATA
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["logs", "snapshots", "exports"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "logs" | "snapshots" | "exports")}
            className={`px-4 py-2 text-sm uppercase tracking-wider ${
              activeTab === tab
                ? "bg-[var(--accent-cyan)] text-black"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="panel p-6">
          <h2 className="text-xl text-[var(--text-primary)] mb-4 tracking-wider">
            GOVERNANCE LOG HISTORY
          </h2>
          <div className="text-[var(--text-muted)] text-sm mb-4">
            Complete record of all governance decisions. Showing most recent
            100 entries.
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {governanceLogs.slice(0, 100).map((log) => (
              <div
                key={log.id}
                className="flex gap-4 text-sm border-b border-[var(--grid-line)] pb-2"
              >
                <span className="timestamp shrink-0">
                  T+{log.tick.toString().padStart(6, "0")}
                </span>
                <span
                  className={`shrink-0 text-[10px] px-2 py-0.5 ${
                    log.severity === "CRITICAL"
                      ? "text-[var(--status-critical)]"
                      : log.severity === "WARNING"
                      ? "text-[var(--status-warning)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {log.severity}
                </span>
                <span className="text-[var(--accent-cyan)] shrink-0">
                  {log.module}
                </span>
                <span className="text-[var(--text-primary)] flex-1">
                  {log.summary}
                </span>
              </div>
            ))}
            {governanceLogs.length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)]">
                NO LOGS RECORDED
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snapshots Tab */}
      {activeTab === "snapshots" && (
        <div className="panel p-6">
          <h2 className="text-xl text-[var(--text-primary)] mb-4 tracking-wider">
            SIMULATION SNAPSHOTS
          </h2>
          <div className="text-[var(--text-muted)] text-sm mb-4">
            Periodic state captures of the entire simulation. Useful for
            historical analysis and debugging.
          </div>
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="text-4xl mb-4">◇</div>
            <div>SNAPSHOT SYSTEM INITIALIZING</div>
            <div className="text-[10px] mt-2">
              Snapshots are taken every 1000 ticks
            </div>
            <div className="text-[10px] mt-1">
              Current tick: {simulation.tick}
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "exports" && (
        <div className="panel p-6">
          <h2 className="text-xl text-[var(--text-primary)] mb-4 tracking-wider">
            CURRENT STATE SUMMARY
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="data-label mb-2">SIMULATION</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Tick</span>
                  <span className="text-[var(--text-primary)]">
                    {simulation.tick}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Stability</span>
                  <span className="text-[var(--text-primary)]">
                    {(simulation.stabilityIndex * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Integrity</span>
                  <span className="text-[var(--text-primary)]">
                    {(simulation.ethicalIntegrity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="data-label mb-2">ENTITIES</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Agents</span>
                  <span className="text-[var(--text-primary)]">
                    {agents.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Buildings</span>
                  <span className="text-[var(--text-primary)]">
                    {buildings.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Laws</span>
                  <span className="text-[var(--text-primary)]">
                    {laws.length}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="data-label mb-2">RECORDS</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Gov. Logs</span>
                  <span className="text-[var(--text-primary)]">
                    {governanceLogs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Research Nodes</span>
                  <span className="text-[var(--text-primary)]">
                    {research.nodes.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">
                    Ethical Actions
                  </span>
                  <span className="text-[var(--text-primary)]">
                    {ethics.blockedActions.length + ethics.selfCorrections.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Observer Notice */}
      <div className="observe-only mt-8">
        OBSERVER NOTICE: Full data transparency. All exports are unmodified
        simulation data.
      </div>
    </div>
  );
}
