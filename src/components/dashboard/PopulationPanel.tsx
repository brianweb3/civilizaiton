"use client";

import { useNocracyStore } from "@/store/simulation";
import { useMemo } from "react";

export default function PopulationPanel() {
  const population = useNocracyStore((state) => state.population);
  const agents = useNocracyStore((state) => state.agents);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status === "ACTIVE").length;
    const deceased = agents.filter((a) => a.status === "DECEASED").length;
    
    const roleDistribution = agents
      .filter((a) => a.status === "ACTIVE")
      .reduce((acc, agent) => {
        acc[agent.role] = (acc[agent.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return { active, deceased, roleDistribution };
  }, [agents]);

  const roleColors: Record<string, string> = {
    WORKER: "#00ff88",
    RESEARCHER: "#00ffff",
    GOVERNOR: "#ff00ff",
    ENFORCER: "#ff3333",
    ECONOMIST: "#ffaa00",
    ARCHITECT: "#888888",
    MEDIC: "#00ff88",
    MERCHANT: "#ff8800",
  };

  return (
    <div className="panel">
      <div className="panel-header">POPULATION</div>
      <div className="p-4 space-y-4">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="data-label">TOTAL AGENTS</span>
          <span className="text-2xl text-[var(--accent-cyan)]">
            {stats.active}
          </span>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="data-label mb-1">BIRTH RATE</div>
            <div className="text-[var(--status-active)]">
              {(population.birthRate * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="data-label mb-1">DEATH RATE</div>
            <div className="text-[var(--status-critical)]">
              {(population.deathRate * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Mutation Rate */}
        <div className="flex justify-between items-center">
          <span className="data-label">MUTATION RATE</span>
          <span className="text-[var(--accent-magenta)]">
            {(population.mutationRate * 100).toFixed(1)}%
          </span>
        </div>

        {/* Role Distribution */}
        <div className="pt-4 border-t border-[var(--grid-line)]">
          <div className="data-label mb-2">ROLE DISTRIBUTION</div>
          <div className="space-y-1">
            {Object.entries(stats.roleDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span
                    className="text-[11px]"
                    style={{ color: roleColors[role] || "#888" }}
                  >
                    {role}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Deceased */}
        <div className="pt-4 border-t border-[var(--grid-line)] flex justify-between items-center">
          <span className="data-label">DECEASED</span>
          <span className="text-[var(--text-muted)]">{stats.deceased}</span>
        </div>
      </div>
    </div>
  );
}
