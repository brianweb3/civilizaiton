"use client";

import { useEffect, useCallback, useState } from "react";
import type { Agent } from "@/types/simulation";
import { useClawtownStore } from "@/store/simulation";

interface AgentModalProps {
  agent: Agent;
  onClose: () => void;
}

type TabType = "overview" | "history" | "data" | "lineage";

// Role colors
const ROLE_COLORS: Record<Agent["role"], string> = {
  WORKER: "#94a3b8",
  RESEARCHER: "#a78bfa",
  GOVERNOR: "#fbbf24",
  ENFORCER: "#f87171",
  ECONOMIST: "#22d3ee",
  ARCHITECT: "#4ade80",
  MEDIC: "#f472b6",
  MERCHANT: "#fb923c",
};

// Role descriptions
const ROLE_DESCRIPTIONS: Record<Agent["role"], string> = {
  WORKER: "Performs production tasks and generates economic output",
  RESEARCHER: "Advances technology and discovers new knowledge",
  GOVERNOR: "Creates and manages laws and governance decisions",
  ENFORCER: "Maintains order and ensures compliance with laws",
  ECONOMIST: "Manages resources and economic systems",
  ARCHITECT: "Designs and constructs buildings and infrastructure",
  MEDIC: "Provides healthcare and increases longevity",
  MERCHANT: "Trades goods and manages commerce",
};

export default function AgentModal({ agent, onClose }: AgentModalProps) {
  const { agents, buildings } = useClawtownStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Find parents and children
  const parents = agent.parentIds
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean) as Agent[];
  const children = agent.childIds
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean) as Agent[];
  
  // Find workplace
  const workplace = agent.workplace
    ? buildings.find((b) => b.id === agent.workplace)
    : null;
  
  // Close on escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);
  
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  
  // Format money
  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };
  
  // Trait bar
  const TraitBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--muted)] w-24">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--panel2)] overflow-hidden rounded-full">
        <div 
          className="h-full bg-[var(--research)] transition-all duration-500 animate-progress"
          style={{ width: `${value * 100}%` }}
        ></div>
      </div>
      <span className="text-[10px] text-[var(--muted)] w-10 text-right">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
  
  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "history", label: "History" },
    { id: "data", label: "Data" },
    { id: "lineage", label: "Lineage" },
  ];
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              {/* Basic info */}
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  PROFILE
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">STATUS</span>
                    <span className={agent.status === "ACTIVE" ? "text-[var(--economy)]" : "text-[var(--critical)]"}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">AGE</span>
                    <span className="text-[var(--text)]">{agent.age} ticks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">GENERATION</span>
                    <span className="text-[var(--text)]">Gen {agent.generation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">MONEY</span>
                    <span className="text-[var(--research)]">{formatMoney(agent.money)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">POSITION</span>
                    <span className="text-[var(--text)] font-mono">
                      ({agent.position.x.toFixed(2)}, {agent.position.y.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">BORN AT</span>
                    <span className="text-[var(--text)]">T+{agent.createdAt}</span>
                  </div>
                  {agent.diedAt && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">DIED AT</span>
                      <span className="text-[var(--critical)]">T+{agent.diedAt}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Role description */}
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  ROLE FUNCTION
                </div>
                <p className="text-xs text-[var(--text)] leading-relaxed">
                  {ROLE_DESCRIPTIONS[agent.role]}
                </p>
              </div>
            </div>
            
            {/* Traits */}
            <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                TRAITS
              </div>
              <div className="space-y-2">
                <TraitBar label="PRODUCTIVITY" value={agent.traits.productivity} />
                <TraitBar label="CREATIVITY" value={agent.traits.creativity} />
                <TraitBar label="COMPLIANCE" value={agent.traits.compliance} />
                <TraitBar label="LONGEVITY" value={agent.traits.longevity} />
                <TraitBar label="MUTABILITY" value={agent.traits.mutability} />
              </div>
            </div>
            
            {/* Workplace */}
            {workplace && (
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  WORKPLACE
                </div>
                <div className="text-sm">
                  <div className="text-[var(--text)]">{workplace.name}</div>
                  <div className="text-xs text-[var(--muted)]">{workplace.type}</div>
                </div>
              </div>
            )}
          </div>
        );
        
      case "history":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                ACTIVITY HISTORY
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {agent.activityLog.length > 0 ? (
                  agent.activityLog.slice().reverse().map((activity, index) => (
                    <div 
                      key={index} 
                      className="text-xs border-l-2 border-[var(--research)] pl-3 py-2 bg-[var(--panel)] rounded animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--muted)] font-mono">T+{activity.tick.toString().padStart(6, "0")}</span>
                        <span className="text-[var(--research)] font-semibold">{activity.action}</span>
                      </div>
                      <div className="text-[var(--text)]">{activity.result}</div>
                      {activity.target && (
                        <div className="text-[var(--muted)] text-[10px] mt-1">
                          Target: {activity.target}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--muted)] text-center py-8">
                    NO RECORDED ACTIVITIES
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case "data":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  FINANCIAL DATA
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Current Money</span>
                    <span className="text-[var(--research)] font-mono">{formatMoney(agent.money)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Tax Paid (Total)</span>
                    <span className="text-[var(--text)]">
                      {formatMoney((agent.money * 0.1) * agent.age)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  PERFORMANCE METRICS
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Productivity Score</span>
                    <span className="text-[var(--economy)]">
                      {(agent.traits.productivity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Compliance Rate</span>
                    <span className="text-[var(--economy)]">
                      {(agent.traits.compliance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Law Impact */}
            {agent.lawImpact.length > 0 && (
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  LAW IMPACTS ({agent.lawImpact.length})
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {agent.lawImpact.map((impact, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 text-xs p-2 bg-[var(--panel)] rounded animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <span className="text-[var(--muted)] font-mono">T+{impact.tick}</span>
                      <span className={
                        impact.impactType === "BENEFITED" ? "text-[var(--economy)]" :
                        impact.impactType === "PENALIZED" ? "text-[var(--critical)]" :
                        "text-[var(--text)]"
                      }>
                        {impact.impactType}
                      </span>
                      <span className="text-[var(--ethics)]">{impact.lawId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case "lineage":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  PARENTS ({parents.length})
                </div>
                {parents.length > 0 ? (
                  <div className="space-y-2">
                    {parents.map((parent, idx) => (
                      <div 
                        key={parent.id} 
                        className="flex items-center gap-2 text-xs p-2 bg-[var(--panel)] rounded animate-fade-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ROLE_COLORS[parent.role] }}
                        ></span>
                        <span className="text-[var(--text)]">{parent.name}</span>
                        <span className="text-[var(--muted)]">({parent.role})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--muted)] text-center py-4">
                    FOUNDING GENERATION
                  </div>
                )}
              </div>
              
              <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-[9px] tracking-[0.2em] text-[var(--muted)] mb-3">
                  OFFSPRING ({children.length})
                </div>
                {children.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {children.map((child, idx) => (
                      <div 
                        key={child.id} 
                        className="flex items-center gap-2 text-xs p-2 bg-[var(--panel)] rounded animate-fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ROLE_COLORS[child.role] }}
                        ></span>
                        <span className="text-[var(--text)]">{child.name}</span>
                        <span className="text-[var(--muted)]">({child.role})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--muted)] text-center py-4">
                    NO OFFSPRING
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* macOS-style Title Bar */}
        <div className="bg-[var(--panel2)] border-b border-[var(--border)] px-4 py-2 flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs text-[var(--muted)] font-medium">{agent.name}</div>
          </div>
          <div className="w-12"></div>
        </div>
        
        {/* Header with Avatar */}
        <div className="border-b border-[var(--border)] p-4 flex items-center gap-4 shrink-0">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg animate-scale-in"
            style={{ backgroundColor: ROLE_COLORS[agent.role] }}
          >
            {agent.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-[var(--text)] font-semibold mb-1">{agent.name}</h2>
            <div className="flex items-center gap-2">
              <span 
                className="text-[11px] px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: ROLE_COLORS[agent.role], color: "#000" }}
              >
                {agent.role}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono">
                {agent.id.slice(0, 12)}...
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] rounded transition-all"
          >
            ✕
          </button>
        </div>
        
        {/* macOS-style Tabs */}
        <div className="border-b border-[var(--border)] bg-[var(--panel2)] px-4 shrink-0">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-medium transition-all relative ${
                  activeTab === tab.id
                    ? "text-[var(--text)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--research)] animate-fade-in" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
        
        {/* Footer */}
        <div className="border-t border-[var(--border)] p-3 text-center bg-[var(--panel2)] shrink-0">
          <span className="text-[10px] text-[var(--muted)]">
            PRESS ESC TO CLOSE
          </span>
        </div>
      </div>
    </div>
  );
}
