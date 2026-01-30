"use client";

import { useState, useMemo, useEffect } from "react";
import { useClawtownStore } from "@/store/simulation";
import type { LawCategory, LawStatus } from "@/types/simulation";

export default function LawsPage() {
  const laws = useClawtownStore((state) => state.laws);
  const clearPendingLawNotifications = useClawtownStore((state) => state.clearPendingLawNotifications);

  useEffect(() => {
    clearPendingLawNotifications();
  }, [clearPendingLawNotifications]);
  
  const [categoryFilter, setCategoryFilter] = useState<LawCategory | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<LawStatus | "ALL">("ALL");
  const [expandedLaw, setExpandedLaw] = useState<string | null>(null);

  const categoryColors: Record<LawCategory, string> = {
    ECONOMIC: "#22d3ee",
    SOCIAL: "#a78bfa",
    RESEARCH: "#4ade80",
    INFRASTRUCTURE: "#f97316",
    ETHICAL: "#f472b6",
    EMERGENCY: "#ef4444",
  };

  const constitutionalLaws = useMemo(
    () => laws.filter((l) => l.isConstitutional),
    [laws]
  );

  const filteredLaws = useMemo(() => {
    return laws.filter((law) => {
      if (law.isConstitutional) return false;
      if (categoryFilter !== "ALL" && law.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && law.status !== statusFilter) return false;
      return true;
    });
  }, [laws, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = laws.filter((l) => l.status === "ACTIVE").length;
    const deprecated = laws.filter((l) => l.status === "DEPRECATED").length;
    const repealed = laws.filter((l) => l.status === "REPEALED").length;
    return { active, deprecated, repealed };
  }, [laws]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-[var(--laws)] tracking-wider mb-2 font-semibold">
          LAWS & CONSTITUTION
        </h1>
        <p className="text-[var(--muted)] text-sm">
          The complete legal framework of Clawtown. All laws are generated and
          enforced by AI governance modules.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="panel p-4">
          <div className="data-label mb-1">CONSTITUTIONAL</div>
          <div className="text-2xl text-[var(--accent-magenta)]">
            {constitutionalLaws.length}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">ACTIVE LAWS</div>
          <div className="text-2xl text-[var(--status-active)]">
            {stats.active}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">DEPRECATED</div>
          <div className="text-2xl text-[var(--status-warning)]">
            {stats.deprecated}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">REPEALED</div>
          <div className="text-2xl text-[var(--text-muted)]">
            {stats.repealed}
          </div>
        </div>
      </div>

      {/* Constitution Section */}
      <div className="panel p-6 mb-8">
        <h2 className="text-xl text-[var(--laws)] mb-4 tracking-wider font-semibold">
          ◆ CONSTITUTION
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          Immutable core rules that govern the territory. These laws cannot be
          modified or repealed by any governance module.
        </p>
        <div className="space-y-4">
          {constitutionalLaws.length > 0 ? (
            constitutionalLaws.map((law) => (
              <div
                key={law.id}
                className="border-l-2 border-[var(--accent-magenta)] pl-4 py-2"
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-[var(--text-primary)]">
                    {law.title}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {law.id}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  {law.description}
                </div>
              </div>
            ))
          ) : (
            <div className="text-[var(--text-muted)] text-center py-4">
              NO CONSTITUTIONAL LAWS DEFINED
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-4 mb-6">
        <div className="flex gap-4 items-center">
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as LawCategory | "ALL")
            }
            className="bg-[var(--bg-tertiary)] border border-[var(--grid-line)] px-3 py-2 text-sm"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="ECONOMIC">ECONOMIC</option>
            <option value="SOCIAL">SOCIAL</option>
            <option value="RESEARCH">RESEARCH</option>
            <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
            <option value="ETHICAL">ETHICAL</option>
            <option value="EMERGENCY">EMERGENCY</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LawStatus | "ALL")
            }
            className="bg-[var(--bg-tertiary)] border border-[var(--grid-line)] px-3 py-2 text-sm"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="DEPRECATED">DEPRECATED</option>
            <option value="REPEALED">REPEALED</option>
          </select>
        </div>
      </div>

      {/* Laws List */}
      <div className="space-y-4">
        {filteredLaws
          .sort((a, b) => b.createdAt - a.createdAt) // Show newest first
          .map((law) => (
          <div key={law.id} className="panel border border-[var(--grid-line)] bg-[var(--panel)]">
            <div
              className="p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
              onClick={() =>
                setExpandedLaw(expandedLaw === law.id ? null : law.id)
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[10px] px-2 py-1 font-medium border rounded"
                      style={{
                        backgroundColor: `${categoryColors[law.category]}15`,
                        color: categoryColors[law.category],
                        borderColor: `${categoryColors[law.category]}40`,
                      }}
                    >
                      {law.category}
                    </span>
                    <span className="text-lg text-[var(--text)] font-semibold">
                      {law.title}
                    </span>
                  </div>
                  <div className="text-[var(--muted)] text-xs">
                    <span className="font-mono">{law.id}</span> • Generated by <span className="font-mono">{law.generatedBy}</span> • T+<span className="font-mono">{law.createdAt.toString().padStart(6, "0")}</span>
                    {law.modifiedAt && (
                      <span> • Modified T+<span className="font-mono">{law.modifiedAt.toString().padStart(6, "0")}</span></span>
                    )}
                    {law.repealedAt && (
                      <span> • Repealed T+<span className="font-mono">{law.repealedAt.toString().padStart(6, "0")}</span></span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-3 py-1 font-medium rounded ${
                    law.status === "ACTIVE"
                      ? "bg-[var(--status-active)]/20 text-[var(--status-active)] border border-[var(--status-active)]/40"
                      : law.status === "DEPRECATED"
                      ? "bg-[var(--status-warning)]/20 text-[var(--status-warning)] border border-[var(--status-warning)]/40"
                      : law.status === "PENDING"
                      ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40"
                      : "bg-[var(--text-muted)]/20 text-[var(--text-muted)] border border-[var(--text-muted)]/40"
                  }`}
                >
                  {law.status}
                </span>
              </div>
            </div>

            {expandedLaw === law.id && (
              <div className="border-t border-[var(--grid-line)] p-4 bg-[var(--bg-secondary)]">
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <div className="text-xs text-[var(--muted)] font-medium mb-2 tracking-wide">DESCRIPTION</div>
                    <div className="text-[var(--text)] text-sm leading-relaxed whitespace-pre-line">
                      {law.description}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] font-medium mb-2 tracking-wide">PURPOSE</div>
                    <div className="text-[var(--text)] text-sm leading-relaxed whitespace-pre-line">
                      {law.purpose}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-[var(--muted)] font-medium mb-2 tracking-wide">AI REASONING</div>
                  <div className="bg-[var(--panel)] p-3 text-[var(--text)] text-sm border-l-2 border-[var(--research)] whitespace-pre-line leading-relaxed">
                    {law.reasoning}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-[var(--panel)] p-3 rounded border border-[var(--grid-line)]">
                    <div className="text-xs text-[var(--muted)] font-medium mb-1">AFFECTED POP.</div>
                    <div className="text-[var(--text)] text-lg font-mono font-bold">
                      {law.affectedPopulationPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[var(--panel)] p-3 rounded border border-[var(--grid-line)]">
                    <div className="text-xs text-[var(--muted)] font-medium mb-1">ECONOMIC EFFECT</div>
                    <div
                      className={`text-lg font-mono font-bold ${
                        law.impactMetrics.economicEffect > 0
                          ? "text-[var(--economy)]"
                          : law.impactMetrics.economicEffect < 0
                          ? "text-[var(--critical)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {law.impactMetrics.economicEffect > 0 ? "+" : ""}
                      {(law.impactMetrics.economicEffect * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[var(--panel)] p-3 rounded border border-[var(--grid-line)]">
                    <div className="text-xs text-[var(--muted)] font-medium mb-1">SOCIAL STABILITY</div>
                    <div
                      className={`text-lg font-mono font-bold ${
                        law.impactMetrics.socialStability > 0
                          ? "text-[var(--economy)]"
                          : law.impactMetrics.socialStability < 0
                          ? "text-[var(--critical)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {law.impactMetrics.socialStability > 0 ? "+" : ""}
                      {(law.impactMetrics.socialStability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[var(--panel)] p-3 rounded border border-[var(--grid-line)]">
                    <div className="text-xs text-[var(--muted)] font-medium mb-1">RESEARCH BOOST</div>
                    <div
                      className={`text-lg font-mono font-bold ${
                        law.impactMetrics.researchBoost > 0
                          ? "text-[var(--economy)]"
                          : law.impactMetrics.researchBoost < 0
                          ? "text-[var(--critical)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {law.impactMetrics.researchBoost > 0 ? "+" : ""}
                      {(law.impactMetrics.researchBoost * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {law.history.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--grid-line)]">
                    <div className="text-xs text-[var(--muted)] font-medium mb-3 tracking-wide">HISTORY</div>
                    <div className="space-y-2">
                      {law.history.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-[var(--panel)] p-2 rounded border border-[var(--grid-line)]">
                          <span className="font-mono text-xs text-[var(--research)] font-semibold whitespace-nowrap">
                            T+{entry.tick.toString().padStart(6, "0")}
                          </span>
                          <span className="text-xs text-[var(--text)] font-medium px-2 py-0.5 bg-[var(--bg-secondary)] rounded">
                            {entry.action}
                          </span>
                          <span className="text-xs text-[var(--muted)] flex-1">
                            {entry.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredLaws.length === 0 && (
        <div className="panel p-8 text-center">
          <div className="text-[var(--text-muted)]">
            NO LAWS MATCHING FILTERS
          </div>
        </div>
      )}

      {/* Observer Notice */}
      <div className="observe-only mt-8">
        OBSERVER NOTICE: You cannot propose, modify, or repeal laws. All
        legislative power resides with the AI governance modules.
      </div>
    </div>
  );
}
