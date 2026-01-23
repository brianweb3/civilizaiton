"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useNocracyStore } from "@/store/simulation";
import { BuildingType, AgentRole } from "@/types/simulation";

const CANVAS_SIZE = 256;
const MAP_SIZE = 1000;
const SCALE = CANVAS_SIZE / MAP_SIZE;

export default function MapPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agents = useNocracyStore((state) => state.agents);
  const buildings = useNocracyStore((state) => state.buildings);
  const tick = useNocracyStore((state) => state.simulation.tick);

  const buildingColors: Record<BuildingType, string> = useMemo(() => ({
    HOUSE: "#4ade80",
    APARTMENT: "#22c55e",
    FACTORY: "#f97316",
    OFFICE: "#3b82f6",
    RESEARCH_LAB: "#8b5cf6",
    HOSPITAL: "#ef4444",
    GOVERNMENT: "#eab308",
    SHOP: "#ec4899",
    WAREHOUSE: "#78716c",
    FARM: "#84cc16",
  }), []);

  const roleColors: Record<AgentRole, string> = useMemo(() => ({
    WORKER: "#94a3b8",
    RESEARCHER: "#a78bfa",
    GOVERNOR: "#fbbf24",
    ENFORCER: "#f87171",
    ECONOMIST: "#22d3ee",
    ARCHITECT: "#4ade80",
    MEDIC: "#f472b6",
    MERCHANT: "#fb923c",
  }), []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const pos = (i / 10) * CANVAS_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_SIZE, pos);
      ctx.stroke();
    }

    // Buildings
    buildings.forEach((building) => {
      const x = building.position.x * SCALE;
      const y = building.position.y * SCALE;
      const w = Math.max(2, building.size.width * SCALE);
      const h = Math.max(2, building.size.height * SCALE);

      ctx.fillStyle = buildingColors[building.type] || "#444";
      ctx.fillRect(x, y, w, h);
    });

    // Agents
    agents.forEach((agent) => {
      if (agent.status !== "ACTIVE") return;

      const x = agent.position.x * SCALE;
      const y = agent.position.y * SCALE;

      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = roleColors[agent.role] || "#fff";
      ctx.fill();
    });
  }, [agents, buildings, buildingColors, roleColors]);

  useEffect(() => {
    draw();
  }, [draw, tick]);

  const zoneStats = useMemo(() => buildings.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [buildings]);

  return (
    <div className="panel">
      <div className="panel-header flex justify-between">
        <span>TERRITORY MAP</span>
        <span className="text-[var(--text-muted)]">1000×1000</span>
      </div>
      <div className="p-4">
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border border-[var(--grid-line)]"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Legend */}
        <div className="border-t border-[var(--grid-line)] pt-4">
          <div className="data-label mb-2">ZONES</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(buildingColors).map(([type, color]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 block"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[9px] text-[var(--text-muted)]">
                    {type}
                  </span>
                </div>
                <span className="text-[9px] text-[var(--text-secondary)]">
                  {zoneStats[type] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
