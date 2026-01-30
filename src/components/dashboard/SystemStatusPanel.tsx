"use client";

import { useClawtownStore } from "@/store/simulation";
import { getSimulationEngine } from "@/lib/simulation-engine";

export default function SystemStatusPanel() {
  const simulation = useClawtownStore((state) => state.simulation);

  const formatTime = (tick: number) => {
    const hours = Math.floor(tick / 3600);
    const minutes = Math.floor((tick % 3600) / 60);
    const seconds = tick % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTickRateChange = (rate: number) => {
    const engine = getSimulationEngine();
    engine.setTickRate(rate);
  };

  const toggleSimulation = () => {
    const engine = getSimulationEngine();
    if (simulation.isRunning) {
      engine.stop();
    } else {
      engine.start();
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">SYSTEM STATUS</div>
      <div className="p-4 space-y-4">
        {/* Time */}
        <div className="flex justify-between items-center">
          <span className="data-label">SIMULATION TIME</span>
          <div className="text-right">
            <div className="text-[var(--accent-cyan)] text-lg font-mono">
              {formatTime(simulation.tick)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              TICK #{simulation.tick}
            </div>
          </div>
        </div>

        {/* Tick Rate */}
        <div className="flex justify-between items-center">
          <span className="data-label">TICK RATE</span>
          <select
            value={simulation.tickRate}
            onChange={(e) => handleTickRateChange(Number(e.target.value))}
            className="bg-[var(--bg-tertiary)] border border-[var(--grid-line)] px-2 py-1 text-sm"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>

        {/* Stability */}
        <div className="flex justify-between items-center">
          <span className="data-label">STABILITY INDEX</span>
          <span
            className={`text-lg ${
              simulation.stabilityIndex > 0.7
                ? "text-[var(--status-active)]"
                : simulation.stabilityIndex > 0.4
                ? "text-[var(--status-warning)]"
                : "text-[var(--status-critical)]"
            }`}
          >
            {(simulation.stabilityIndex * 100).toFixed(1)}%
          </span>
        </div>

        {/* Governance Mode */}
        <div className="flex justify-between items-center">
          <span className="data-label">GOVERNANCE MODE</span>
          <span
            className={`text-sm ${
              simulation.governanceMode === "STANDARD"
                ? "text-[var(--text-primary)]"
                : simulation.governanceMode === "EMERGENCY"
                ? "text-[var(--status-critical)]"
                : "text-[var(--status-warning)]"
            }`}
          >
            {simulation.governanceMode}
          </span>
        </div>

        {/* Ethical Integrity */}
        <div className="flex justify-between items-center">
          <span className="data-label">ETHICAL INTEGRITY</span>
          <span
            className={`text-lg ${
              simulation.ethicalIntegrity > 0.9
                ? "text-[var(--status-active)]"
                : "text-[var(--status-warning)]"
            }`}
          >
            {(simulation.ethicalIntegrity * 100).toFixed(0)}%
          </span>
        </div>

        {/* Controls */}
        <div className="pt-4 border-t border-[var(--grid-line)]">
          <button
            onClick={toggleSimulation}
            className={`btn w-full ${simulation.isRunning ? "" : "btn-primary"}`}
          >
            {simulation.isRunning ? "PAUSE SIMULATION" : "RESUME SIMULATION"}
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div
            className={`status-dot ${
              simulation.isRunning ? "active" : "inactive"
            }`}
          />
          <span className="text-[11px] text-[var(--text-muted)]">
            {simulation.isRunning ? "OPERATIONAL" : "SUSPENDED"}
          </span>
        </div>
      </div>
    </div>
  );
}
