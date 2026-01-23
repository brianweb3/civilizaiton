"use client";

import { useMemo } from "react";
import { useNocracyStore } from "@/store/simulation";
import type { Agent } from "@/types/simulation";
import type { RoleDistribution, WealthBucket, AgeBucket, TopContributor } from "@/types/tilemap";

// Role colors for agents
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

export default function CitizenDistribution() {
  const { agents } = useNocracyStore();
  
  const activeAgents = useMemo(
    () => agents.filter((a) => a.status === "ACTIVE"),
    [agents]
  );
  
  // Role distribution
  const roleDistribution = useMemo((): RoleDistribution[] => {
    const counts: Record<string, number> = {};
    
    activeAgents.forEach((agent) => {
      counts[agent.role] = (counts[agent.role] || 0) + 1;
    });
    
    const total = activeAgents.length;
    
    return Object.entries(counts)
      .map(([role, count]) => ({
        role,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: ROLE_COLORS[role as Agent["role"]] || "#888",
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeAgents]);
  
  // Wealth distribution
  const wealthDistribution = useMemo((): WealthBucket[] => {
    const buckets = [
      { range: "0-500", min: 0, max: 500 },
      { range: "500-1K", min: 500, max: 1000 },
      { range: "1K-2K", min: 1000, max: 2000 },
      { range: "2K-5K", min: 2000, max: 5000 },
      { range: "5K-10K", min: 5000, max: 10000 },
      { range: "10K+", min: 10000, max: Infinity },
    ];
    
    const total = activeAgents.length;
    
    return buckets.map((bucket) => {
      const count = activeAgents.filter(
        (a) => a.money >= bucket.min && a.money < bucket.max
      ).length;
      
      return {
        range: bucket.range,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }, [activeAgents]);
  
  // Age distribution
  const ageDistribution = useMemo((): AgeBucket[] => {
    const buckets = [
      { range: "0-100", min: 0, max: 100 },
      { range: "100-200", min: 100, max: 200 },
      { range: "200-500", min: 200, max: 500 },
      { range: "500-1K", min: 500, max: 1000 },
      { range: "1K+", min: 1000, max: Infinity },
    ];
    
    const total = activeAgents.length;
    
    return buckets.map((bucket) => {
      const count = activeAgents.filter(
        (a) => a.age >= bucket.min && a.age < bucket.max
      ).length;
      
      return {
        range: bucket.range,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }, [activeAgents]);
  
  // Top contributors
  const topContributors = useMemo((): TopContributor[] => {
    const sorted = [...activeAgents].sort((a, b) => b.money - a.money);
    
    return sorted.slice(0, 5).map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      contribution: agent.money * 0.1, // Tax contribution estimate
      type: "tax" as const,
    }));
  }, [activeAgents]);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (activeAgents.length === 0) {
      return { avgWealth: 0, medianAge: 0, gini: 0 };
    }
    
    const totalWealth = activeAgents.reduce((sum, a) => sum + a.money, 0);
    const avgWealth = totalWealth / activeAgents.length;
    
    const sortedAges = [...activeAgents].map((a) => a.age).sort((a, b) => a - b);
    const medianAge = sortedAges[Math.floor(sortedAges.length / 2)];
    
    // Simple Gini calculation
    const sortedWealth = [...activeAgents].map((a) => a.money).sort((a, b) => a - b);
    let giniSum = 0;
    const n = sortedWealth.length;
    for (let i = 0; i < n; i++) {
      giniSum += (2 * (i + 1) - n - 1) * sortedWealth[i];
    }
    const gini = n > 1 ? giniSum / (n * totalWealth) : 0;
    
    return { avgWealth, medianAge, gini };
  }, [activeAgents]);
  
  const formatMoney = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[var(--bg-primary)] p-2 text-center">
          <div className="text-lg text-[var(--accent-cyan)] font-mono">
            {formatMoney(stats.avgWealth)}
          </div>
          <div className="text-[7px] text-[var(--text-muted)]">AVG WEALTH</div>
        </div>
        <div className="bg-[var(--bg-primary)] p-2 text-center">
          <div className="text-lg text-[var(--accent-magenta)] font-mono">
            {stats.medianAge}
          </div>
          <div className="text-[7px] text-[var(--text-muted)]">MEDIAN AGE</div>
        </div>
        <div className="bg-[var(--bg-primary)] p-2 text-center">
          <div className="text-lg text-[var(--status-warning)] font-mono">
            {stats.gini.toFixed(3)}
          </div>
          <div className="text-[7px] text-[var(--text-muted)]">GINI</div>
        </div>
      </div>
      
      {/* Role Distribution */}
      <div>
        <div className="text-[8px] text-[var(--text-muted)] tracking-[0.15em] mb-2">
          ROLE BREAKDOWN
        </div>
        <div className="h-4 flex overflow-hidden border border-[var(--grid-line)]">
          {roleDistribution.map((role) => (
            <div
              key={role.role}
              className="h-full relative group"
              style={{
                width: `${role.percentage}%`,
                backgroundColor: role.color,
                minWidth: role.count > 0 ? "4px" : 0,
              }}
              title={`${role.role}: ${role.count} (${role.percentage.toFixed(1)}%)`}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--grid-line)] px-1 py-0.5 text-[8px] whitespace-nowrap hidden group-hover:block z-10">
                {role.role}: {role.count}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {roleDistribution.map((role) => (
            <div key={role.role} className="flex items-center gap-1 text-[8px]">
              <span
                className="w-2 h-2"
                style={{ backgroundColor: role.color }}
              />
              <span className="text-[var(--text-secondary)]">{role.role}</span>
              <span className="text-[var(--text-muted)]">({role.count})</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Wealth Histogram */}
      <div>
        <div className="text-[8px] text-[var(--text-muted)] tracking-[0.15em] mb-2">
          WEALTH DISTRIBUTION
        </div>
        <div className="flex items-end gap-1 h-12">
          {wealthDistribution.map((bucket) => (
            <div
              key={bucket.range}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className="w-full bg-[var(--accent-cyan)] hover:bg-[var(--accent-magenta)] transition-colors"
                style={{
                  height: `${Math.max(2, bucket.percentage)}%`,
                }}
                title={`${bucket.range}: ${bucket.count} (${bucket.percentage.toFixed(1)}%)`}
              />
              <div className="text-[6px] text-[var(--text-muted)] mt-1 -rotate-45 origin-left w-8">
                {bucket.range}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Age Distribution */}
      <div>
        <div className="text-[8px] text-[var(--text-muted)] tracking-[0.15em] mb-2">
          AGE DISTRIBUTION
        </div>
        <div className="flex items-end gap-1 h-10">
          {ageDistribution.map((bucket) => (
            <div
              key={bucket.range}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className="w-full bg-[var(--status-active)] hover:bg-[var(--status-warning)] transition-colors"
                style={{
                  height: `${Math.max(2, bucket.percentage)}%`,
                }}
                title={`${bucket.range}: ${bucket.count} (${bucket.percentage.toFixed(1)}%)`}
              />
              <div className="text-[6px] text-[var(--text-muted)] mt-1 -rotate-45 origin-left w-8">
                {bucket.range}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Contributors */}
      <div>
        <div className="text-[8px] text-[var(--text-muted)] tracking-[0.15em] mb-2">
          TOP TAX CONTRIBUTORS
        </div>
        <div className="space-y-1">
          {topContributors.map((contributor, idx) => (
            <div
              key={contributor.id}
              className="flex items-center gap-2 text-[10px]"
            >
              <span className="text-[var(--text-muted)] w-4">
                #{idx + 1}
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    ROLE_COLORS[contributor.role as Agent["role"]] || "#888",
                }}
              />
              <span className="text-[var(--text-primary)] flex-1 truncate">
                {contributor.name}
              </span>
              <span className="text-[var(--accent-cyan)] font-mono">
                {formatMoney(contributor.contribution)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
