"use client";

import { useState, useMemo } from "react";
import { useClawtownStore } from "@/store/simulation";
import Link from "next/link";
import type { AgentRole, AgentStatus } from "@/types/simulation";

export default function AgentsPage() {
  const agents = useClawtownStore((state) => state.agents);
  const selectAgent = useClawtownStore((state) => state.selectAgent);
  
  const [roleFilter, setRoleFilter] = useState<AgentRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "age" | "money">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const roleColors: Record<AgentRole, string> = {
    WORKER: "#94a3b8",
    RESEARCHER: "#a78bfa",
    GOVERNOR: "#fbbf24",
    ENFORCER: "#f87171",
    ECONOMIST: "#22d3ee",
    ARCHITECT: "#4ade80",
    MEDIC: "#f472b6",
    MERCHANT: "#fb923c",
  };

  const filteredAgents = useMemo(() => {
    let filtered = agents.filter((agent) => {
      if (roleFilter !== "ALL" && agent.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && agent.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          agent.name.toLowerCase().includes(query) ||
          agent.id.toLowerCase().includes(query)
        );
      }
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "age":
          return b.age - a.age;
        case "money":
          return b.money - a.money;
        default:
          return 0;
      }
    });

    return filtered;
  }, [agents, roleFilter, statusFilter, sortBy, searchQuery]);

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

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-[var(--text)] tracking-wider mb-1 font-semibold">
          AGENTS
        </h1>
        <p className="text-[var(--muted)] text-xs">
          Citizen registry and activity logs
        </p>
      </div>

      {/* Stats Bar - Minimalist */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">ACTIVE</div>
          <div className="text-xl text-[var(--text)] font-mono font-semibold">
            {stats.active}
          </div>
        </div>
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">DECEASED</div>
          <div className="text-xl text-[var(--text)] font-mono font-semibold">
            {stats.deceased}
          </div>
        </div>
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">TOTAL</div>
          <div className="text-xl text-[var(--text)] font-mono font-semibold">
            {agents.length}
          </div>
        </div>
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">ROLES</div>
          <div className="text-xl text-[var(--text)] font-mono font-semibold">
            {Object.keys(stats.roleDistribution).length}
          </div>
        </div>
      </div>

      {/* Filters - Compact */}
      <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="SEARCH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm flex-1 min-w-[200px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AgentRole | "ALL")}
            className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm"
          >
            <option value="ALL">ALL ROLES</option>
            <option value="WORKER">WORKER</option>
            <option value="RESEARCHER">RESEARCHER</option>
            <option value="GOVERNOR">GOVERNOR</option>
            <option value="ENFORCER">ENFORCER</option>
            <option value="ECONOMIST">ECONOMIST</option>
            <option value="ARCHITECT">ARCHITECT</option>
            <option value="MEDIC">MEDIC</option>
            <option value="MERCHANT">MERCHANT</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AgentStatus | "ALL")
            }
            className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="DECEASED">DECEASED</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "age" | "money")
            }
            className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm"
          >
            <option value="name">SORT: NAME</option>
            <option value="age">SORT: AGE</option>
            <option value="money">SORT: MONEY</option>
          </select>
        </div>
      </div>

      {/* Agents List - Minimalist Table Style */}
      <div className="border border-[var(--grid-line)] bg-[var(--panel)]">
        <div className="divide-y divide-[var(--grid-line)]">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <div
                className="p-3 cursor-pointer"
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-32">
                      <div className="text-sm text-[var(--text)] font-medium">
                        {agent.name}
                      </div>
                      <div className="text-xs text-[var(--muted)] font-mono">
                        {agent.id}
                      </div>
                    </div>
                    <div className="w-24">
                      <span
                        className="text-xs px-2 py-0.5 border rounded"
                        style={{
                          color: roleColors[agent.role],
                          borderColor: `${roleColors[agent.role]}40`,
                          backgroundColor: `${roleColors[agent.role]}15`,
                        }}
                      >
                        {agent.role}
                      </span>
                    </div>
                    <div className="w-20 text-xs text-[var(--muted)]">
                      Age: <span className="text-[var(--text)] font-mono">{agent.age}</span>
                    </div>
                    <div className="w-24 text-xs text-[var(--muted)]">
                      Money: <span className="text-[var(--economy)] font-mono">{formatMoney(agent.money)}</span>
                    </div>
                    <div className="w-20 text-xs text-[var(--muted)]">
                      Gen: <span className="text-[var(--text)] font-mono">{agent.generation}</span>
                    </div>
                    <div className="w-32 text-xs text-[var(--muted)] font-mono">
                      T+{agent.createdAt.toString().padStart(6, "0")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 border rounded ${
                        agent.status === "ACTIVE"
                          ? "border-[var(--status-active)]/40 text-[var(--status-active)] bg-[var(--status-active)]/15"
                          : agent.status === "DECEASED"
                          ? "border-[var(--critical)]/40 text-[var(--critical)] bg-[var(--critical)]/15"
                          : "border-[var(--muted)]/40 text-[var(--muted)] bg-[var(--muted)]/15"
                      }`}
                    >
                      {agent.status}
                    </span>
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-xs text-[var(--research)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      VIEW →
                    </Link>
                  </div>
                </div>
              </div>
              
              {expandedAgent === agent.id && (
                <div className="px-3 pb-3 border-t border-[var(--grid-line)] bg-[var(--bg-secondary)]">
                  <div className="pt-3 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-[var(--muted)] mb-1">POSITION</div>
                      <div className="text-[var(--text)] font-mono">
                        ({agent.position.x.toFixed(0)}, {agent.position.y.toFixed(0)})
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--muted)] mb-1">ACTIVITIES</div>
                      <div className="text-[var(--text)] font-mono">
                        {agent.activityLog.length} events
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--muted)] mb-1">LAW IMPACTS</div>
                      <div className="text-[var(--text)] font-mono">
                        {agent.lawImpact.length} impacts
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {filteredAgents.length === 0 && (
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-8 text-center">
          <div className="text-[var(--muted)] text-sm">
            NO AGENTS MATCHING FILTERS
          </div>
        </div>
      )}
    </div>
  );
}
