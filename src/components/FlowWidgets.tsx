"use client";

import { useMemo } from "react";
import { useClawtownStore } from "@/store/simulation";
import type { ResourceFlow, MoneyFlow, PopulationFlow } from "@/types/tilemap";

export default function FlowWidgets() {
  const { economy, agents, population, simulation, governanceLogs } = useClawtownStore();
  
  // Calculate resource flows
  const resourceFlows = useMemo((): ResourceFlow[] => {
    const resources = economy.resourceDistribution;
    const activeAgents = agents.filter((a) => a.status === "ACTIVE");
    
    // Food flow
    const farmAgents = activeAgents.filter((a) => a.workplace);
    const foodProduced = (resources.food * 0.1) + (farmAgents.length * 10);
    const foodConsumed = activeAgents.length * 2;
    
    // Energy flow
    const energyProduced = resources.energy * 0.1;
    const energyConsumed = activeAgents.length * 1.5;
    
    // Materials flow
    const materialsProduced = resources.materials * 0.08;
    const materialsConsumed = activeAgents.length * 0.5;
    
    return [
      {
        type: "food",
        produced: Math.round(foodProduced),
        consumed: Math.round(foodConsumed),
        stored: Math.round(resources.food),
        delta: Math.round(foodProduced - foodConsumed),
      },
      {
        type: "energy",
        produced: Math.round(energyProduced),
        consumed: Math.round(energyConsumed),
        stored: Math.round(resources.energy),
        delta: Math.round(energyProduced - energyConsumed),
      },
      {
        type: "materials",
        produced: Math.round(materialsProduced),
        consumed: Math.round(materialsConsumed),
        stored: Math.round(resources.materials),
        delta: Math.round(materialsProduced - materialsConsumed),
      },
    ];
  }, [economy, agents]);
  
  // Calculate money flows
  const moneyFlow = useMemo((): MoneyFlow => {
    const activeAgents = agents.filter((a) => a.status === "ACTIVE");
    const totalAgentMoney = activeAgents.reduce((sum, a) => sum + a.money, 0);
    
    const taxes = totalAgentMoney * economy.taxationLevel * 0.01;
    const spending = economy.productionOutput * 0.3;
    const income = economy.productionOutput * 0.5;
    
    return {
      taxes: Math.round(taxes),
      treasury: Math.round(economy.currencySupply),
      spending: Math.round(spending),
      toHouseholds: Math.round(income), // Using as income
    };
  }, [economy, agents]);
  
  // Calculate population flows
  const populationFlow = useMemo((): PopulationFlow => {
    const recentLogs = governanceLogs.filter(
      (log) => log.tick > simulation.tick - 60
    );
    
    const births = recentLogs.filter(
      (log) => log.action === "AGENT_CREATED" && log.summary.includes("born")
    ).length;
    
    const deaths = recentLogs.filter(
      (log) => log.action === "AGENT_TERMINATED" || log.summary.includes("lifecycle")
    ).length;
    
    return {
      births,
      deaths,
      migration: 0, // No migration in current simulation
      netChange: births - deaths,
    };
  }, [governanceLogs, simulation.tick]);
  
  const formatNumber = (n: number) => {
    if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "food":
        return "🍗"; // Chicken leg for food
      case "energy":
        return "⚡";
      case "materials":
        return "🪵"; // Wood/log for materials
      default:
        return "📦";
    }
  };
  
  const getResourceColor = (type: string) => {
    switch (type) {
      case "food":
        return "#fbbf24"; // Yellow for energy/food
      case "energy":
        return "#94a3b8"; // Grey for energy
      case "materials":
        return "#94a3b8"; // Grey for materials
      default:
        return "#888";
    }
  };

  // Calculate progress bar percentages
  const getProgressBarWidth = (flow: ResourceFlow) => {
    const total = flow.produced + flow.consumed;
    if (total === 0) return { green: 0, red: 0 };
    const greenPercent = (flow.produced / total) * 100;
    const redPercent = (flow.consumed / total) * 100;
    return { green: greenPercent, red: redPercent };
  };
  
  return (
    <div className="space-y-3 p-3 bg-[var(--panel)] border-2 border-[var(--border)] rounded-[var(--radius)] shadow-[var(--pixel-shadow)] overflow-hidden">
      {/* Resource Flows */}
      <div className="min-w-0">
        <div className="text-[7px] text-[var(--muted)] tracking-wide mb-2 font-normal uppercase px-0.5">
          RESOURCE FLOWS / tick
        </div>
        <div className="space-y-2.5">
          {resourceFlows.map((flow, idx) => {
            const progress = getProgressBarWidth(flow);
            return (
              <div key={flow.type} className="flex items-center gap-2 animate-fade-in min-w-0" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="text-sm w-5 flex items-center justify-center shrink-0 flex-shrink-0">
                  {getResourceIcon(flow.type)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center text-[8px] gap-0.5 mb-0.5 flex-wrap">
                    <span className="text-[var(--economy)] font-mono truncate">
                      +{formatNumber(flow.produced)}
                    </span>
                    <span className="text-[var(--muted)] shrink-0">→</span>
                    <span className="text-[var(--critical)] font-mono truncate">
                      -{formatNumber(flow.consumed)}
                    </span>
                    <span className="text-[var(--muted)] shrink-0">→</span>
                    <span className="text-[var(--economy)] font-mono truncate">
                      {formatNumber(flow.stored)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--panel2)] rounded overflow-hidden relative">
                    <div
                      className="h-full bg-[var(--economy)] absolute left-0 transition-all duration-500 ease-out game-pulse"
                      style={{
                        width: `${progress.green}%`,
                        animationDelay: `${idx * 0.2}s`,
                      }}
                    />
                    <div
                      className="h-full bg-[var(--critical)] absolute transition-all duration-500 ease-out"
                      style={{
                        left: `${progress.green}%`,
                        width: `${progress.red}%`,
                      }}
                    />
                    <div className="absolute inset-0 game-shimmer" />
                  </div>
                </div>
                <span
                  className={`text-[8px] font-mono text-right animate-number shrink-0 flex-shrink-0 pl-1 min-w-[2.5rem] ${
                    flow.delta >= 0 ? "text-[var(--economy)]" : "text-[var(--critical)]"
                  }`}
                >
                  {flow.delta >= 0 ? "+" : ""}{formatNumber(flow.delta)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Money Flows */}
      <div className="min-w-0">
        <div className="text-[7px] text-[var(--muted)] tracking-wide mb-2 font-normal uppercase px-0.5">
          MONEY FLOWS
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="text-center animate-fade-in animate-float px-0.5" style={{ animationDelay: '0.1s' }}>
            <div className="text-[var(--alerts)] font-mono text-[9px] mb-0.5 animate-number game-pulse truncate" title={String(moneyFlow.taxes)}>
              {formatNumber(moneyFlow.taxes)}
            </div>
            <div className="text-[7px] text-[var(--muted)]">TAXES</div>
            <div className="h-0.5 bg-[var(--alerts)] mt-0.5 game-shimmer mx-auto max-w-full" />
          </div>
          <div className="text-center animate-fade-in animate-float px-0.5" style={{ animationDelay: '0.2s' }}>
            <div className="text-[var(--research)] font-mono text-[9px] mb-0.5 animate-number game-pulse truncate" title={String(moneyFlow.treasury)}>
              {formatNumber(moneyFlow.treasury)}
            </div>
            <div className="text-[7px] text-[var(--muted)]">TREASURY</div>
            <div className="h-0.5 bg-[var(--research)] mt-0.5 game-shimmer mx-auto max-w-full" />
          </div>
          <div className="text-center animate-fade-in animate-float px-0.5" style={{ animationDelay: '0.3s' }}>
            <div className="text-[var(--critical)] font-mono text-[9px] mb-0.5 animate-number game-pulse truncate" title={String(moneyFlow.spending)}>
              {formatNumber(moneyFlow.spending)}
            </div>
            <div className="text-[7px] text-[var(--muted)]">SPENDING</div>
            <div className="h-0.5 bg-[var(--critical)] mt-0.5 game-shimmer mx-auto max-w-full" />
          </div>
          <div className="text-center animate-fade-in animate-float px-0.5" style={{ animationDelay: '0.4s' }}>
            <div className="text-[var(--economy)] font-mono text-[9px] mb-0.5 animate-number game-pulse truncate" title={String(moneyFlow.toHouseholds)}>
              {formatNumber(moneyFlow.toHouseholds)}
            </div>
            <div className="text-[7px] text-[var(--muted)]">INCOME</div>
            <div className="h-0.5 bg-[var(--economy)] mt-0.5 game-shimmer mx-auto max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
