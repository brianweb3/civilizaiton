"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNocracyStore } from "@/store/simulation";
import Link from "next/link";
import type { AgentRole } from "@/types/simulation";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const agent = useNocracyStore((state) =>
    state.agents.find((a) => a.id === agentId)
  );
  const allAgents = useNocracyStore((state) => state.agents);

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

  const roleDescriptions: Record<AgentRole, string> = {
    WORKER: "Performs labor tasks, contributes to production and resource gathering.",
    RESEARCHER: "Conducts scientific inquiry, develops new technologies and knowledge.",
    GOVERNOR: "Oversees governance processes, proposes and evaluates laws.",
    ENFORCER: "Maintains order and ensures compliance with laws.",
    ECONOMIST: "Manages economic policies, resource distribution, and trade.",
    ARCHITECT: "Designs and constructs new buildings and infrastructure.",
    MEDIC: "Provides healthcare and manages population wellbeing.",
    MERCHANT: "Facilitates trade and resource exchange within the territory.",
  };

  if (!agent) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="panel p-8 text-center">
          <div className="text-[var(--status-critical)] text-xl mb-4">
            AGENT NOT FOUND
          </div>
          <div className="text-[var(--text-muted)] mb-6">
            Agent {agentId} does not exist in the current simulation state.
          </div>
          <button onClick={() => router.back()} className="btn">
            ← RETURN
          </button>
        </div>
      </div>
    );
  }

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const getTraitColor = (value: number) => {
    if (value > 0.8) return "var(--status-active)";
    if (value > 0.5) return "var(--status-warning)";
    return "var(--status-critical)";
  };

  const parents = agent.parentIds.map((id) =>
    allAgents.find((a) => a.id === id)
  );
  const children = agent.childIds.map((id) =>
    allAgents.find((a) => a.id === id)
  );

  // Calculate earnings statistics
  const SALARY_BASE = 50;
  const estimatedTotalEarnings = agent.age * SALARY_BASE * agent.traits.productivity;
  const estimatedLifetimeEarnings = agent.status === 'DECEASED' && agent.diedAt 
    ? (agent.diedAt - agent.createdAt) * SALARY_BASE * agent.traits.productivity
    : estimatedTotalEarnings;
  const initialMoney = agent.money - estimatedTotalEarnings;
  
  // Analyze activity log
  const activityStats = useMemo(() => {
    const built = agent.activityLog.filter(a => a.action === 'BUILT').length;
    const createdLaws = agent.activityLog.filter(a => a.action === 'CREATED_LAW').length;
    const discovered = agent.activityLog.filter(a => a.action === 'DISCOVERED' || a.action === 'COMPLETED_RESEARCH').length;
    const born = agent.activityLog.filter(a => a.action === 'BORN').length;
    
    return { built, createdLaws, discovered, born };
  }, [agent.activityLog]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href="/agents"
        className="text-[var(--muted)] hover:text-[var(--research)] text-xs mb-4 inline-block"
      >
        ← BACK TO AGENTS
      </Link>

      {/* Header - Minimalist */}
      <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1
              className="text-2xl font-semibold tracking-wide mb-1"
              style={{ color: roleColors[agent.role] }}
            >
              {agent.name}
            </h1>
            <div className="text-[var(--muted)] text-xs font-mono">
              {agent.id}
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 border rounded ${
              agent.status === "ACTIVE"
                ? "border-[var(--status-active)]/40 text-[var(--status-active)] bg-[var(--status-active)]/15"
                : agent.status === "DECEASED"
                ? "border-[var(--critical)]/40 text-[var(--critical)] bg-[var(--critical)]/15"
                : "border-[var(--muted)]/40 text-[var(--muted)] bg-[var(--muted)]/15"
            }`}
          >
            {agent.status}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span
            className="px-2 py-1 border rounded"
            style={{
              color: roleColors[agent.role],
              borderColor: `${roleColors[agent.role]}40`,
              backgroundColor: `${roleColors[agent.role]}15`,
            }}
          >
            {agent.role}
          </span>
          <span className="text-[var(--muted)]">•</span>
          <span className="text-[var(--muted)]">{roleDescriptions[agent.role]}</span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">AGE</div>
          <div className="text-lg text-[var(--text)] font-mono font-semibold">
            {agent.age}
          </div>
          <div className="text-xs text-[var(--muted)]">ticks</div>
        </div>
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">MONEY</div>
          <div className="text-lg text-[var(--economy)] font-mono font-semibold">
            {formatMoney(agent.money)}
          </div>
          <div className="text-xs text-[var(--muted)]">current</div>
        </div>
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">EST. EARNINGS</div>
          <div className="text-lg text-[var(--economy)] font-mono font-semibold">
            {formatMoney(estimatedLifetimeEarnings)}
          </div>
          <div className="text-xs text-[var(--muted)]">lifetime</div>
        </div>
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-3">
          <div className="text-xs text-[var(--muted)] mb-1">GENERATION</div>
          <div className="text-lg text-[var(--text)] font-mono font-semibold">
            {agent.generation}
          </div>
          <div className="text-xs text-[var(--muted)]">gen</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Profile & Life */}
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">PROFILE & LIFE</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">BORN</span>
              <span className="text-[var(--text)] font-mono">T+{agent.createdAt.toString().padStart(6, "0")}</span>
            </div>
            {agent.diedAt && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">DIED</span>
                <span className="text-[var(--critical)] font-mono">T+{agent.diedAt.toString().padStart(6, "0")}</span>
              </div>
            )}
            {agent.diedAt && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">LIFESPAN</span>
                <span className="text-[var(--text)] font-mono">{agent.diedAt - agent.createdAt} ticks</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">POSITION</span>
              <span className="text-[var(--text)] font-mono">
                ({agent.position.x.toFixed(0)}, {agent.position.y.toFixed(0)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">INITIAL MONEY</span>
              <span className="text-[var(--text)] font-mono">
                {formatMoney(Math.max(0, initialMoney))}
              </span>
            </div>
          </div>
        </div>

        {/* Traits & Earnings */}
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">TRAITS & EARNINGS</h2>
          <div className="space-y-3 text-xs mb-4">
            {Object.entries(agent.traits).map(([trait, value]) => (
              <div key={trait}>
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--muted)]">{trait.toUpperCase()}</span>
                  <span style={{ color: getTraitColor(value) }} className="font-mono">
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 bg-[var(--bg-secondary)] rounded overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${value * 100}%`,
                      backgroundColor: getTraitColor(value),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[var(--grid-line)] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted)]">SALARY/TICK</span>
              <span className="text-[var(--economy)] font-mono">
                {formatMoney(SALARY_BASE * agent.traits.productivity)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted)]">PRODUCTIVITY</span>
              <span className="text-[var(--text)] font-mono">
                {(agent.traits.productivity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">ACTIVITY SUMMARY</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">TOTAL ACTIVITIES</span>
              <span className="text-[var(--text)] font-mono">{agent.activityLog.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">BUILDINGS BUILT</span>
              <span className="text-[var(--text)] font-mono">{activityStats.built}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">LAWS CREATED</span>
              <span className="text-[var(--text)] font-mono">{activityStats.createdLaws}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">RESEARCH DISCOVERED</span>
              <span className="text-[var(--text)] font-mono">{activityStats.discovered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">CHILDREN</span>
              <span className="text-[var(--text)] font-mono">{children.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">LAW IMPACTS</span>
              <span className="text-[var(--text)] font-mono">{agent.lawImpact.length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Lineage & Associations */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">LINEAGE</h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[var(--muted)] mb-2">PARENTS</div>
              {parents.length > 0 ? (
                <div className="space-y-1">
                  {parents.map((parent) =>
                    parent ? (
                      <Link
                        key={parent.id}
                        href={`/agents/${parent.id}`}
                        className="block text-[var(--research)] hover:underline font-mono"
                      >
                        {parent.name} ({parent.id})
                      </Link>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="text-[var(--muted)]">FOUNDING GENERATION</div>
              )}
            </div>
            <div>
              <div className="text-[var(--muted)] mb-2">OFFSPRING ({children.length})</div>
              {children.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {children.map((child) =>
                    child ? (
                      <Link
                        key={child.id}
                        href={`/agents/${child.id}`}
                        className="block text-[var(--research)] hover:underline font-mono"
                      >
                        {child.name} ({child.id})
                      </Link>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="text-[var(--muted)]">NONE</div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">ASSOCIATIONS</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">HOME</span>
              <span className="text-[var(--text)] font-mono">
                {agent.home || "NONE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">WORKPLACE</span>
              <span className="text-[var(--text)] font-mono">
                {agent.workplace || "NONE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log - Detailed */}
      <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4 mb-4">
        <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">ACTIVITY HISTORY</h2>
        {agent.activityLog.length > 0 ? (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {agent.activityLog
              .slice()
              .reverse()
              .map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-xs py-2 border-b border-[var(--grid-line)] last:border-0"
                >
                  <span className="text-[var(--research)] font-mono shrink-0">
                    T+{activity.tick.toString().padStart(6, "0")}
                  </span>
                  <span className="text-[var(--text)] font-medium px-2 py-0.5 bg-[var(--bg-secondary)] rounded">
                    {activity.action}
                  </span>
                  {activity.target && (
                    <span className="text-[var(--muted)] font-mono text-[10px]">
                      {activity.target}
                    </span>
                  )}
                  <span className="text-[var(--muted)] flex-1">
                    {activity.result}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-[var(--muted)] text-xs text-center py-4">
            NO RECORDED ACTIVITIES
          </div>
        )}
      </div>

      {/* Law Impact */}
      {agent.lawImpact.length > 0 && (
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">LAW IMPACT HISTORY</h2>
          <div className="space-y-1">
            {agent.lawImpact.map((impact, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-xs py-2 border-b border-[var(--grid-line)] last:border-0"
              >
                <span className="text-[var(--research)] font-mono shrink-0">
                  T+{impact.tick.toString().padStart(6, "0")}
                </span>
                <span className="text-[var(--laws)] font-mono">{impact.lawId}</span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    impact.impactType === "BENEFITED"
                      ? "border-[var(--status-active)]/40 text-[var(--status-active)] bg-[var(--status-active)]/15"
                      : impact.impactType === "PENALIZED"
                      ? "border-[var(--critical)]/40 text-[var(--critical)] bg-[var(--critical)]/15"
                      : "border-[var(--muted)]/40 text-[var(--muted)] bg-[var(--muted)]/15"
                  }`}
                >
                  {impact.impactType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
