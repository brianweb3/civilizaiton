"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNocracyStore } from "@/store/simulation";
import { getSimulationEngine } from "@/lib/simulation-engine";
import type { Agent } from "@/types/simulation";
import type { InspectorData, TerrainType } from "@/types/tilemap";

// Components
import AgentModal from "@/components/AgentModal";
import TileMapRenderer from "@/components/TileMapRenderer";
import FlowWidgets from "@/components/FlowWidgets";
import InspectorPanel from "@/components/InspectorPanel";

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

export default function SimulationPage() {
  const router = useRouter();
  
  const {
    manifestAccepted,
    simulation,
    agents,
    buildings,
    districts,
    economy,
    governanceLogs,
    selectedAgentId,
    selectAgent,
    scores,
    research,
  } = useNocracyStore();
  
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);
  
  // Redirect if manifest not accepted
  useEffect(() => {
    if (!manifestAccepted) {
      router.push("/");
    }
  }, [manifestAccepted, router]);
  
  // Toggle simulation
  const toggleSimulation = () => {
    const engine = getSimulationEngine();
    if (simulation.isRunning) {
      engine.stop();
    } else {
      engine.start();
    }
  };
  
  // Change tick rate
  const handleTickRateChange = (rate: number) => {
    const engine = getSimulationEngine();
    engine.setTickRate(rate);
  };
  
  // Handle inspection from tile map
  const handleInspect = useCallback((data: InspectorData) => {
    setInspectorData(data);
    // Also select agent if it's a citizen
    if (data.type === "citizen" && data.data) {
      const citizenData = data.data as any;
      if (citizenData.id) {
        selectAgent(citizenData.id);
      }
    }
  }, [selectAgent]);
  
  
  // Filter active agents
  const activeAgents = agents.filter((a) => a.status === "ACTIVE");
  
  // Selected agent for modal
  const selectedAgent = selectedAgentId
    ? agents.find((a) => a.id === selectedAgentId)
    : null;
  
  // Format money
  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };
  
  // Calculate research progress
  const activeResearch = research?.nodes?.find(n => n.status === 'IN_PROGRESS');
  const researchProgress = activeResearch ? (activeResearch.progress * 100) : 0;
  
  // Calculate map size (70% of viewport)
  const [mapSize, setMapSize] = useState({ width: 800, height: 600 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const updateMapSize = () => {
      if (!mapContainerRef.current) return;
      
      const container = mapContainerRef.current;
      const containerWidth = Math.floor(container.clientWidth);
      const containerHeight = Math.floor(container.clientHeight);
      
      // Only update if size actually changed significantly (prevent infinite loops)
      const threshold = 5; // Only update if change is more than 5px
      if (
        Math.abs(containerWidth - lastSizeRef.current.width) > threshold ||
        Math.abs(containerHeight - lastSizeRef.current.height) > threshold ||
        lastSizeRef.current.width === 0 // Initial load
      ) {
        lastSizeRef.current = { width: containerWidth, height: containerHeight };
        setMapSize({ 
          width: containerWidth, 
          height: containerHeight 
        });
      }
    };
    
    // Initial size with delay to ensure container is rendered
    const initTimeout = setTimeout(updateMapSize, 100);
    
    // Debounce resize events (longer delay to prevent rapid updates)
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateMapSize, 250);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver with debounce
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateMapSize, 250);
    });
    
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    
    return () => {
      clearTimeout(initTimeout);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main Content: Left Sidebar + Map + Right Sidebar */}
      <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden min-h-0">
        <div className="flex-1 grid grid-cols-12 gap-2 min-h-0 max-h-full">
          {/* Left Sidebar */}
          <div className="col-span-2 flex flex-col gap-2 min-h-0 max-h-full overflow-hidden">
            {/* Controls */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-3 shadow-sm shrink-0 animate-fade-in">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--muted)]">TICK</span>
                  <span className="font-mono text-[var(--research)] text-sm animate-number">
                    {simulation.tick.toString().padStart(6, "0")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--muted)]">RATE</span>
                  <select
                    value={simulation.tickRate}
                    onChange={(e) => handleTickRateChange(Number(e.target.value))}
                    className="bg-[var(--panel)] border border-[var(--border)] px-2 py-1 text-xs rounded text-[var(--text)] focus:outline-none focus:border-[var(--research)] transition-all"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                    <option value={10}>10x</option>
                  </select>
                </div>
                <button
                  onClick={toggleSimulation}
                  className={`w-full px-3 py-2 text-xs border rounded transition-all hover:shadow-md ${
                    simulation.isRunning
                      ? "border-[var(--critical)] text-[var(--critical)] hover:bg-[var(--critical)] hover:text-white"
                      : "border-[var(--economy)] text-[var(--economy)] hover:bg-[var(--economy)] hover:text-white"
                  }`}
                >
                  {simulation.isRunning ? "PAUSE" : "RESUME"}
                </button>
              </div>
            </div>

            {/* Inspector Panel - Full height */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-sm flex-1 min-h-0 max-h-full overflow-hidden animate-fade-in">
              <InspectorPanel 
                data={inspectorData} 
                onClose={() => setInspectorData(null)} 
              />
            </div>

            {/* Resource & Money Flows */}
            <div className="animate-fade-in shrink-0">
              <FlowWidgets />
            </div>
          </div>

          {/* Center: Map */}
          <div 
            ref={mapContainerRef}
            className="col-span-7 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden min-h-0 max-h-full"
            style={{ position: 'relative', minWidth: 0, minHeight: 0, width: '100%', height: '100%' }}
          >
          {mapSize.width > 0 && mapSize.height > 0 && (
            <div style={{ width: '100%', height: '100%' }}>
              <TileMapRenderer
                key={`map-${mapSize.width}-${mapSize.height}`}
                width={mapSize.width}
                height={mapSize.height}
                onInspect={handleInspect}
              />
            </div>
          )}
          </div>
          
          {/* Right Sidebar */}
          <div className="col-span-3 flex flex-col gap-2 min-h-0 max-h-full overflow-hidden">
            {/* Citizens Table */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-sm animate-fade-in flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] text-[var(--muted)] tracking-[0.1em]">
                    CITIZENS ({activeAgents.length})
                  </div>
                  <div className="flex gap-1">
                    <button className="px-2 py-0.5 text-[8px] border border-[var(--border)] rounded bg-[var(--panel2)] text-[var(--text)] hover:bg-[var(--panel2)] transition-all">
                      TABLE
                    </button>
                    <button className="px-2 py-0.5 text-[8px] border border-[var(--border)] rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] transition-all">
                      HIST
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="SEARCH..."
                  className="w-full px-2 py-1 text-[8px] bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--research)] transition-all"
                />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <table className="w-full text-[8px]">
                  <thead className="bg-[var(--panel2)] sticky top-0">
                    <tr>
                      <th className="text-left p-1 text-[var(--muted)]">NAME</th>
                      <th className="text-left p-1 text-[var(--muted)]">ROLE</th>
                      <th className="text-right p-1 text-[var(--muted)]">NET</th>
                      <th className="text-right p-1 text-[var(--muted)]">AGE</th>
                      <th className="text-right p-1 text-[var(--muted)]">POS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAgents.map((agent, idx) => (
                      <tr 
                        key={agent.id} 
                        className="border-t border-[var(--border)] hover:bg-[var(--panel2)] transition-all animate-fade-in cursor-pointer"
                        style={{ animationDelay: `${idx * 0.02}s` }}
                        onClick={() => selectAgent(agent.id)}
                      >
                        <td className="p-1 text-[var(--text)]">{agent.name}</td>
                        <td className="p-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full animate-pulse shrink-0 flex-shrink-0"
                              style={{ backgroundColor: ROLE_COLORS[agent.role] }}
                            />
                            <span className="text-[var(--muted)] whitespace-nowrap">{agent.role}</span>
                          </div>
                        </td>
                        <td className="p-1 text-right text-[var(--text)]">
                          ${formatMoney(agent.money)}
                        </td>
                        <td className="p-1 text-right text-[var(--muted)]">{agent.age}</td>
                        <td className="p-1 text-right text-[var(--muted)] font-mono">
                          {agent.position.x.toFixed(2)}, {agent.position.y.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Governance Log */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-2 border-b border-[var(--border)] shrink-0">
                <div className="text-[9px] text-[var(--muted)] tracking-[0.1em]">
                  GOVERNANCE LOG
                </div>
              </div>
              <div className="overflow-y-auto p-2 flex-1 min-h-0">
                {governanceLogs.slice(0, 15).map((log, idx) => (
                  <div 
                    key={log.id} 
                    className="mb-2 text-[8px] text-[var(--text)] animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start gap-1">
                      <span className="text-[var(--muted)] font-mono">
                        T+{log.tick.toString().padStart(6, "0")}
                      </span>
                      <span className="text-[var(--muted)]">-</span>
                      <span className="text-[var(--research)]">{log.module}</span>
                      <span className="text-[var(--muted)]">-</span>
                      <span className="text-[var(--text)] flex-1">{log.summary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      {/* Agent Modal */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          onClose={() => selectAgent(null)}
        />
      )}
    </div>
  );
}
