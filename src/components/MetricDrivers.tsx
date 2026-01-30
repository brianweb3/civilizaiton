"use client";

import { useMemo } from "react";
import { useClawtownStore } from "@/store/simulation";
import type { MetricDriver, DriverCause } from "@/types/tilemap";

export default function MetricDrivers() {
  const { 
    simulation, 
    governanceLogs, 
    economy, 
    agents, 
    laws, 
    metrics,
    alerts 
  } = useClawtownStore();
  
  // Compute metric drivers based on recent events and changes
  const drivers = useMemo((): MetricDriver[] => {
    const result: MetricDriver[] = [];
    
    // Analyze recent logs for events
    const recentLogs = governanceLogs.filter(
      (log) => log.tick > simulation.tick - 100
    );
    
    // Stability driver
    const stabilityEvents = recentLogs.filter(
      (log) =>
        log.action === "ETHICAL_OVERRIDE" ||
        log.action === "EMERGENCY_ACTION" ||
        log.severity === "CRITICAL"
    );
    
    const deathEvents = recentLogs.filter(
      (log) => log.action === "AGENT_TERMINATED"
    );
    
    const stabilityDirection: "up" | "down" | "stable" =
      stabilityEvents.length > 3
        ? "down"
        : stabilityEvents.length > 0
        ? "stable"
        : "up";
    
    const stabilityCauses: DriverCause[] = [];
    
    if (stabilityEvents.length > 0) {
      stabilityCauses.push({
        type: "event",
        description: `${stabilityEvents.length} critical events in last 100 ticks`,
        contribution: 40,
      });
    }
    
    if (deathEvents.length > 2) {
      stabilityCauses.push({
        type: "population",
        description: `${deathEvents.length} citizen deaths`,
        contribution: 30,
      });
    }
    
    const newLaws = recentLogs.filter((log) => log.action === "LAW_CREATED");
    if (newLaws.length > 0) {
      stabilityCauses.push({
        type: "law",
        description: `${newLaws.length} new law(s) enacted`,
        contribution: newLaws.length > 3 ? 20 : 10,
        entityId: newLaws[0]?.affectedEntities[0],
      });
    }
    
    if (stabilityCauses.length > 0) {
      result.push({
        metricId: "stability_index",
        metricName: "Stability",
        direction: stabilityDirection,
        magnitude: stabilityEvents.length * 5,
        causes: stabilityCauses,
      });
    }
    
    // GDP driver
    const marketEvents = recentLogs.filter(
      (log) => log.action === "ECONOMIC_INTERVENTION"
    );
    const buildingEvents = recentLogs.filter(
      (log) => log.action === "BUILDING_CONSTRUCTED"
    );
    
    const gdpCauses: DriverCause[] = [];
    
    if (buildingEvents.length > 0) {
      gdpCauses.push({
        type: "event",
        description: `${buildingEvents.length} new building(s) constructed`,
        contribution: 35,
      });
    }
    
    const activeAgents = agents.filter((a) => a.status === "ACTIVE");
    const merchantCount = activeAgents.filter((a) => a.role === "MERCHANT").length;
    if (merchantCount > 5) {
      gdpCauses.push({
        type: "agent",
        description: `${merchantCount} active merchants`,
        contribution: 25,
      });
    }
    
    if (economy.inequalityIndex > 0.5) {
      gdpCauses.push({
        type: "economic",
        description: `High inequality (${(economy.inequalityIndex * 100).toFixed(0)}%)`,
        contribution: 15,
      });
    }
    
    if (gdpCauses.length > 0) {
      result.push({
        metricId: "gdp_per_capita",
        metricName: "GDP/Capita",
        direction: buildingEvents.length > marketEvents.length ? "up" : "stable",
        magnitude: (buildingEvents.length + merchantCount) * 2,
        causes: gdpCauses,
      });
    }
    
    // Population driver
    const birthEvents = recentLogs.filter((log) => 
      log.action === "AGENT_CREATED" && log.summary.includes("born")
    );
    
    const popCauses: DriverCause[] = [];
    
    if (deathEvents.length > birthEvents.length) {
      popCauses.push({
        type: "population",
        description: `${deathEvents.length} deaths vs ${birthEvents.length} births`,
        contribution: 50,
      });
    }
    
    const medicCount = activeAgents.filter((a) => a.role === "MEDIC").length;
    if (medicCount < activeAgents.length * 0.05) {
      popCauses.push({
        type: "agent",
        description: `Low medic ratio (${medicCount} of ${activeAgents.length})`,
        contribution: 30,
      });
    }
    
    if (popCauses.length > 0) {
      result.push({
        metricId: "population_total",
        metricName: "Population",
        direction: birthEvents.length > deathEvents.length ? "up" : "down",
        magnitude: Math.abs(birthEvents.length - deathEvents.length) * 10,
        causes: popCauses,
      });
    }
    
    // Research driver
    const researchLogs = recentLogs.filter(
      (log) => log.module === "RESEARCH" || log.summary.includes("research")
    );
    const researcherCount = activeAgents.filter(
      (a) => a.role === "RESEARCHER"
    ).length;
    
    const researchCauses: DriverCause[] = [];
    
    if (researcherCount > 0) {
      researchCauses.push({
        type: "agent",
        description: `${researcherCount} active researcher(s)`,
        contribution: 40,
      });
    }
    
    const labBuildings = buildingEvents.filter((e) =>
      e.summary.includes("RESEARCH")
    );
    if (labBuildings.length > 0) {
      researchCauses.push({
        type: "event",
        description: `${labBuildings.length} new research lab(s)`,
        contribution: 30,
      });
    }
    
    if (researchCauses.length > 0) {
      result.push({
        metricId: "research_throughput",
        metricName: "Research",
        direction: researcherCount > 3 ? "up" : "stable",
        magnitude: researcherCount * 5,
        causes: researchCauses,
      });
    }
    
    // Ethics driver from alerts
    const ethicsAlerts = alerts.filter(
      (a) => a.type === "ethics_override_triggered" && !a.resolved
    );
    
    if (ethicsAlerts.length > 0) {
      result.push({
        metricId: "ethics_blocks_triggered",
        metricName: "Ethics Blocks",
        direction: "up",
        magnitude: ethicsAlerts.length * 10,
        causes: [
          {
            type: "event",
            description: `${ethicsAlerts.length} ethical violation(s) blocked`,
            contribution: 100,
          },
        ],
      });
    }
    
    return result;
  }, [simulation.tick, governanceLogs, economy, agents, laws, metrics, alerts]);

  const getDirectionIcon = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return "↑";
      case "down":
        return "↓";
      default:
        return "→";
    }
  };

  const getDirectionColor = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return "var(--status-active)";
      case "down":
        return "var(--status-critical)";
      default:
        return "var(--status-warning)";
    }
  };

  if (drivers.length === 0) {
    return (
      <div className="text-center text-[var(--text-muted)] text-xs py-4">
        No significant changes detected in last 100 ticks
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[9px] text-[var(--text-muted)] tracking-[0.2em] mb-2">
        DRIVERS (LAST 100 TICKS)
      </div>
      
      <div className="space-y-3">
        {drivers.map((driver, driverIdx) => (
          <div
            key={driver.metricId}
            className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-2 shadow-sm animate-fade-in civ-hover"
            style={{ animationDelay: `${driverIdx * 0.1}s` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-lg font-mono animate-pulse"
                style={{ color: getDirectionColor(driver.direction) }}
              >
                {getDirectionIcon(driver.direction)}
              </span>
              <span className="text-xs text-[var(--text)]">
                {driver.metricName}
              </span>
              {driver.magnitude > 0 && (
                <span className="text-[9px] text-[var(--muted)] ml-auto animate-number">
                  Δ {driver.magnitude.toFixed(0)}
                </span>
              )}
            </div>
            
            <div className="space-y-1 ml-6">
              {driver.causes.map((cause, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[10px] animate-fade-in"
                  style={{ animationDelay: `${(driverIdx * 0.1) + (idx * 0.05)}s` }}
                >
                  <span className="text-[var(--muted)] w-4">•</span>
                  <span className="text-[var(--text)] flex-1">
                    {cause.description}
                  </span>
                  <span className="text-[var(--research)] w-10 text-right font-mono animate-number">
                    {cause.contribution}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
