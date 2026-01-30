"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClawtownStore } from "@/store/simulation";
import { getSimulationEngine } from "@/lib/simulation-engine";
import type { Agent } from "@/types/simulation";
import type { InspectorData, TerrainType } from "@/types/tilemap";

// Turn governance log entry into chat-style message from a resident
function logToChatMessage(
  log: { id: string; tick: number; module: string; summary: string; reasoning: string },
  agentName: string
): string {
  const s = log.summary;
  if (s.length < 80) return s;
  return s.slice(0, 77) + "...";
}

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
    laws,
  } = useClawtownStore();

  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);
  const [aiChatMessages, setAiChatMessages] = useState<{ id: string; author: string; text: string; tick: number }[]>([]);
  const [selectedChatMessage, setSelectedChatMessage] = useState<{ id: string; author: string; text: string; tick: number } | null>(null);

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
  const activeResearchNode = research?.nodes?.find((n) => n.status === "IN_PROGRESS");
  const researchProgressPct = activeResearchNode ? activeResearchNode.progress * 100 : 0;

  const fallbackChatMessages = useMemo(() => {
    const names = activeAgents.length > 0
      ? activeAgents.map((a) => a.name)
      : ["System", "Oracle", "Cipher"];
    return governanceLogs.slice(0, 25).map((log, i) => ({
      id: log.id,
      tick: log.tick,
      author: names[i % names.length],
      text: logToChatMessage(log, names[i % names.length]),
    }));
  }, [governanceLogs, activeAgents]);

  // Residents chat: fetch AI messages on mount and every 35s. Use ref for latest context
  // so we don't re-run effect every tick (that was cancelling the response and keeping only fallback).
  const residentsChatContextRef = useRef({
    agentNames: [] as string[],
    treasury: 0,
    output: 0,
    stability: 0,
    researchProgress: 0,
    recentLogs: [] as string[],
    lawsCount: 0,
    tick: 0,
  });
  residentsChatContextRef.current = {
    agentNames: activeAgents.length > 0 ? activeAgents.map((a) => a.name) : ["Oracle", "Cipher", "Nexus", "Aria", "Fred"],
    treasury: economy.currencySupply,
    output: economy.productionOutput,
    stability: scores ? scores.state_health_score : 0,
    researchProgress: researchProgressPct,
    recentLogs: governanceLogs.slice(0, 8).map((l) => l.summary),
    lawsCount: laws.length,
    tick: simulation.tick,
  };
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ctx = residentsChatContextRef.current;
      const body = {
        agentNames: ctx.agentNames,
        treasury: ctx.treasury,
        output: ctx.output,
        stability: ctx.stability,
        researchProgress: ctx.researchProgress,
        recentLogs: ctx.recentLogs,
        lawsCount: ctx.lawsCount,
        tick: ctx.tick,
      };
      try {
        const res = await fetch("/api/residents-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (cancelled) return;
        const data = (await res.json()) as { messages?: Array<{ author: string; text: string; tick: number }>; error?: string };
        if (cancelled) return;
        const list = data.messages ?? [];
        if (data.error && list.length === 0) {
          // API key missing or error — leave fallback visible, don't overwrite
          return;
        }
        if (list.length > 0) {
          setAiChatMessages(
            list.map((m, i) => ({ id: `ai-${ctx.tick}-${Date.now()}-${i}`, author: m.author, text: m.text, tick: m.tick }))
          );
        }
      } catch {
        if (!cancelled) {
          // Keep previous aiChatMessages or fallback
        }
      }
    };
    run();
    const t = setInterval(run, 35000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const residentChatMessages = aiChatMessages.length > 0 ? aiChatMessages : fallbackChatMessages;
  
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
          {/* Left Sidebar — scrollable so FlowWidgets is never cut off or overlapped */}
          <div className="col-span-2 flex flex-col gap-2 min-h-0 max-h-full overflow-y-auto overflow-x-hidden">
            {/* Controls */}
            <div className="bg-[var(--panel)] border-2 border-[var(--border)] rounded-[var(--radius)] p-2 shadow-[var(--pixel-shadow)] shrink-0 animate-fade-in">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-[var(--muted)]">TICK</span>
                  <span className="font-mono text-[var(--research)] text-[9px] animate-number">
                    {simulation.tick.toString().padStart(6, "0")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-[var(--muted)]">RATE</span>
                  <select
                    value={simulation.tickRate}
                    onChange={(e) => handleTickRateChange(Number(e.target.value))}
                    className="bg-[var(--panel)] border border-[var(--border)] px-1.5 py-0.5 text-[8px] rounded text-[var(--text)] focus:outline-none focus:border-[var(--research)] transition-all"
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
                  className={`w-full px-2 py-1.5 text-[8px] border rounded transition-all hover:shadow-md ${
                    simulation.isRunning
                      ? "border-[var(--critical)] text-[var(--critical)] hover:bg-[var(--critical)] hover:!text-white"
                      : "border-[var(--economy)] text-[var(--economy)] hover:bg-[var(--economy)] hover:!text-white"
                  }`}
                >
                  {simulation.isRunning ? "PAUSE" : "RESUME"}
                </button>
              </div>
            </div>

            {/* Inspector Panel - Flexible, can shrink */}
            <div className="bg-[var(--panel)] border-2 border-[var(--border)] rounded-[var(--radius)] shadow-[var(--pixel-shadow)] flex-1 min-h-[8rem] overflow-hidden animate-fade-in flex flex-col">
              <InspectorPanel 
                data={inspectorData} 
                onClose={() => setInspectorData(null)} 
              />
            </div>

            {/* Resource & Money Flows — always visible, never overlapped */}
            <div className="animate-fade-in shrink-0 mt-auto pt-2">
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
          
          {/* Right Sidebar — padding so text doesn't touch borders */}
          <div className="col-span-3 flex flex-col gap-2 min-h-0 max-h-full overflow-hidden pr-0.5">
            {/* Citizens Table — smaller fonts, more row spacing */}
            <div className="bg-[var(--panel)] border-2 border-[var(--border)] rounded-[var(--radius)] shadow-[var(--pixel-shadow)] animate-fade-in flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="p-2 border-b-2 border-[var(--border)] shrink-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="text-[7px] text-[var(--muted)] tracking-wide uppercase">
                    CITIZENS ({activeAgents.length})
                  </div>
                  <div className="flex gap-0.5">
                    <button className="px-1.5 py-0.5 text-[7px] border border-[var(--border)] rounded bg-[var(--panel2)] text-[var(--text)] hover:bg-[var(--panel2)] transition-all">
                      TABLE
                    </button>
                    <button className="px-1.5 py-0.5 text-[7px] border border-[var(--border)] rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] transition-all">
                      HIST
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="SEARCH..."
                  className="w-full px-1.5 py-0.5 text-[7px] bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--research)] transition-all"
                />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 px-1">
                <table className="w-full text-[8px]">
                  <thead className="bg-[var(--panel2)] sticky top-0">
                    <tr>
                      <th className="text-left py-1.5 px-2 text-[var(--muted)]">NAME</th>
                      <th className="text-left py-1.5 px-2 text-[var(--muted)]">ROLE</th>
                      <th className="text-right py-1.5 px-2 text-[var(--muted)]">NET</th>
                      <th className="text-right py-1.5 px-2 text-[var(--muted)]">AGE</th>
                      <th className="text-right py-1.5 px-2 text-[var(--muted)]">POS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAgents.map((agent, idx) => (
                      <tr 
                        key={agent.id} 
                        className="border-t border-[var(--border)] hover:bg-[var(--panel2)] transition-all animate-fade-in cursor-pointer min-h-[28px]"
                        style={{ animationDelay: `${idx * 0.02}s` }}
                        onClick={() => selectAgent(agent.id)}
                      >
                        <td className="py-1.5 px-2 text-[var(--text)] align-middle truncate max-w-[5rem]">{agent.name}</td>
                        <td className="py-1.5 px-2 align-middle">
                          <div className="flex items-center gap-1 min-w-0">
                            <div
                              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 flex-shrink-0"
                              style={{ backgroundColor: ROLE_COLORS[agent.role] }}
                            />
                            <span className="text-[var(--muted)] truncate">{agent.role}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right text-[var(--text)] align-middle">${formatMoney(agent.money)}</td>
                        <td className="py-1.5 px-2 text-right text-[var(--muted)] align-middle">{agent.age}</td>
                        <td className="py-1.5 px-2 text-right text-[var(--muted)] font-mono align-middle truncate max-w-[5rem]">
                          {agent.position.x.toFixed(0)},{agent.position.y.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Residents chat — padding so text doesn't touch borders */}
            <div className="bg-[var(--panel)] border-2 border-[var(--border)] rounded-[var(--radius)] shadow-[var(--pixel-shadow)] flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-2.5 py-2 border-b-2 border-[var(--border)] shrink-0">
                <div className="text-[8px] font-normal uppercase text-[var(--text)] font-mono tracking-wide">
                  Residents chat
                </div>
                <div className="text-[7px] text-[var(--text-secondary)] mt-0.5">
                  Click a message to read in full
                </div>
              </div>
              <div className="overflow-y-auto p-2.5 flex-1 min-h-0 space-y-2">
                {residentChatMessages.map((msg, idx) => {
                  const previewLen = 80;
                  const isLong = msg.text.length > previewLen;
                  const preview = isLong ? msg.text.slice(0, previewLen).trim() + "…" : msg.text;
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedChatMessage(msg)}
                      className="animate-fade-in w-full flex gap-2 items-start text-left rounded-[var(--radius)] border-2 border-[var(--border)] bg-[var(--panel2)] hover:border-[var(--openclaw-red)] hover:bg-[hsl(var(--claw-surface))] transition-colors p-2.5 min-h-[4.5rem] min-w-0"
                      style={{ animationDelay: `${idx * 0.02}s` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--openclaw-red)] flex items-center justify-center text-white text-[8px] font-bold shrink-0 flex-shrink-0">
                        {msg.author.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden px-0.5">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[8px] font-normal text-[var(--openclaw-red)]">
                            {msg.author}
                          </span>
                          <span className="text-[7px] text-[var(--text-secondary)] font-mono">
                            T+{msg.tick.toString().padStart(6, "0")}
                          </span>
                        </div>
                        <p className="mt-1 text-[8px] text-[var(--text)] leading-snug line-clamp-3 break-words">
                          {preview}
                        </p>
                        {isLong && (
                          <span className="mt-2 block text-[7px] text-[var(--openclaw-red)]">
                            Read full message →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
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

      {/* Resident message modal — full text in separate window */}
      {selectedChatMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setSelectedChatMessage(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedChatMessage(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="resident-message-title"
        >
          <div
            className="bg-[var(--panel)] border-2 border-[var(--border)] shadow-[var(--pixel-shadow)] max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b-2 border-[var(--border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--openclaw-red)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                  {selectedChatMessage.author.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 id="resident-message-title" className="text-[10px] font-normal uppercase text-[var(--text)]">
                    {selectedChatMessage.author}
                  </h2>
                  <p className="text-[8px] text-[var(--text-secondary)] font-mono">
                    Tick T+{selectedChatMessage.tick.toString().padStart(6, "0")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChatMessage(null)}
                className="p-1.5 text-[9px] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--panel2)] transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              <p className="text-[9px] text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                {selectedChatMessage.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
