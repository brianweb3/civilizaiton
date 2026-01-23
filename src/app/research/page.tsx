"use client";

import { useState, useMemo } from "react";
import { useNocracyStore } from "@/store/simulation";
import type { ResearchStatus } from "@/types/simulation";

export default function ResearchPage() {
  const research = useNocracyStore((state) => state.research);
  const [statusFilter, setStatusFilter] = useState<ResearchStatus | "ALL">("ALL");
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const statusColors: Record<ResearchStatus, string> = {
    LOCKED: "#555555",
    AVAILABLE: "#22d3ee",
    IN_PROGRESS: "#fbbf24",
    COMPLETED: "#4ade80",
    FAILED: "#ef4444",
  };

  const filteredNodes = useMemo(() => {
    if (statusFilter === "ALL") return research.nodes;
    return research.nodes.filter((n) => n.status === statusFilter);
  }, [research.nodes, statusFilter]);

  const stats = useMemo(() => {
    const completed = research.nodes.filter((n) => n.status === "COMPLETED").length;
    const inProgress = research.nodes.filter((n) => n.status === "IN_PROGRESS").length;
    const available = research.nodes.filter((n) => n.status === "AVAILABLE").length;
    const failed = research.nodes.filter((n) => n.status === "FAILED").length;
    return { completed, inProgress, available, failed };
  }, [research.nodes]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-[var(--research)] tracking-wider mb-2 font-semibold">
          RESEARCH & DISCOVERY
        </h1>
        <p className="text-[var(--muted)] text-sm">
          AI-driven scientific advancement. All research is conducted
          autonomously by RESEARCHER agents and governed by the research
          allocation module.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="panel p-4">
          <div className="data-label mb-1">COMPLETED</div>
          <div className="text-2xl text-[var(--status-active)]">
            {stats.completed}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">IN PROGRESS</div>
          <div className="text-2xl text-[var(--status-warning)]">
            {stats.inProgress}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">AVAILABLE</div>
          <div className="text-2xl text-[var(--accent-cyan)]">
            {stats.available}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">FAILED</div>
          <div className="text-2xl text-[var(--status-critical)]">
            {stats.failed}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-4 mb-6">
        <div className="flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ResearchStatus | "ALL")
            }
            className="bg-[var(--bg-tertiary)] border border-[var(--grid-line)] px-3 py-2 text-sm"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="LOCKED">LOCKED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Research Tree Visual */}
      <div className="panel p-6 mb-8">
        <h2 className="text-xl text-[var(--text-primary)] mb-4 tracking-wider">
          RESEARCH TREE
        </h2>
        {research.nodes.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {research.nodes.map((node) => (
              <div
                key={node.id}
                className="p-3 border border-[var(--grid-line)] cursor-pointer hover:border-[var(--accent-cyan)]"
                style={{ borderLeftWidth: "3px", borderLeftColor: statusColors[node.status] }}
                onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
              >
                <div className="text-[10px] text-[var(--text-muted)]">{node.id}</div>
                <div className="text-sm text-[var(--text-primary)] font-bold mt-1">{node.name}</div>
                <div className="mt-2">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${node.progress * 100}%`,
                        backgroundColor: statusColors[node.status],
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: statusColors[node.status] }}>
                      {node.status}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {(node.progress * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)]">
            NO RESEARCH NODES INITIALIZED
          </div>
        )}
      </div>

      {/* Research List */}
      <div className="space-y-4">
        {filteredNodes.map((node) => (
          <div key={node.id} className="panel">
            <div
              className="p-4 cursor-pointer hover:bg-[var(--bg-tertiary)]"
              onClick={() =>
                setExpandedNode(expandedNode === node.id ? null : node.id)
              }
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-[var(--text-primary)]">
                      {node.name}
                    </span>
                  </div>
                  <div className="text-[var(--text-muted)] text-[10px] mt-1">
                    {node.id} | Origin: {node.originAI}
                    {node.discoveredAt && ` | Discovered: T+${node.discoveredAt}`}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="text-[10px] px-2 py-0.5"
                    style={{
                      backgroundColor: `${statusColors[node.status]}20`,
                      color: statusColors[node.status],
                    }}
                  >
                    {node.status}
                  </span>
                  <div className="mt-2 w-24">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${node.progress * 100}%`,
                          backgroundColor: statusColors[node.status],
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {expandedNode === node.id && (
              <div className="border-t border-[var(--grid-line)] p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="data-label mb-2">DESCRIPTION</div>
                    <div className="text-[var(--text-secondary)] text-sm">
                      {node.description}
                    </div>
                  </div>
                  <div>
                    <div className="data-label mb-2">LONG-TERM PROJECTION</div>
                    <div className="text-[var(--text-secondary)] text-sm">
                      {node.longTermProjection}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="data-label mb-1">ECONOMY EFFECT</div>
                    <div
                      className={
                        node.economyEffect > 0
                          ? "text-[var(--status-active)]"
                          : node.economyEffect < 0
                          ? "text-[var(--status-critical)]"
                          : "text-[var(--text-muted)]"
                      }
                    >
                      {node.economyEffect > 0 ? "+" : ""}
                      {(node.economyEffect * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="data-label mb-1">POPULATION EFFECT</div>
                    <div
                      className={
                        node.populationEffect > 0
                          ? "text-[var(--status-active)]"
                          : node.populationEffect < 0
                          ? "text-[var(--status-critical)]"
                          : "text-[var(--text-muted)]"
                      }
                    >
                      {node.populationEffect > 0 ? "+" : ""}
                      {(node.populationEffect * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="data-label mb-1">PRECONDITIONS</div>
                    <div className="text-[var(--text-secondary)] text-sm">
                      {node.preconditions.length > 0
                        ? node.preconditions.join(", ")
                        : "NONE"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredNodes.length === 0 && (
        <div className="panel p-8 text-center">
          <div className="text-[var(--text-muted)]">
            NO RESEARCH MATCHING FILTERS
          </div>
        </div>
      )}

      {/* Observer Notice */}
      <div className="observe-only mt-8">
        OBSERVER NOTICE: You cannot direct research priorities. All scientific
        advancement is determined by the research allocation AI.
      </div>
    </div>
  );
}
