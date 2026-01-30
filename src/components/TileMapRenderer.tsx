"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useClawtownStore } from "@/store/simulation";
import type { Agent, Building } from "@/types/simulation";
import {
  GRID_SIZE,
  TILE_SIZE,
  TERRAIN_COLORS,
  DISTRICT_COLORS,
  HEATMAP_COLORS,
  HeatmapType,
  TerrainType,
  InspectorData,
} from "@/types/tilemap";

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

// Building colors
const BUILDING_COLORS: Record<Building["type"], string> = {
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
};

// Convert hex number to CSS color
const hexToColor = (hex: number): string => {
  return `#${hex.toString(16).padStart(6, "0")}`;
};

interface TileMapRendererProps {
  width?: number;
  height?: number;
  onInspect?: (data: InspectorData) => void;
}

export default function TileMapRenderer({
  width = 500,
  height = 350,
  onInspect,
}: TileMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapType>("NONE");
  const [zoom, setZoom] = useState(1.45); // Initial zoom 145%
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // Rotation in radians
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotateStart, setRotateStart] = useState({ angle: 0, centerX: 0, centerY: 0 });
  const [mapControlsExpanded, setMapControlsExpanded] = useState(false);
  
  const { agents, buildings, districts } = useClawtownStore();
  
  // Generate terrain procedurally (original simple version)
  const getTerrainType = useCallback((x: number, y: number): TerrainType => {
    const seed = Math.sin(x * 0.1) * Math.cos(y * 0.1);
    const noise = Math.sin(x * 0.05 + y * 0.03) * 0.5 + 0.5;
    
    const distFromCenter = Math.sqrt((x - GRID_SIZE / 2) ** 2 + (y - GRID_SIZE / 2) ** 2);
    if (distFromCenter < GRID_SIZE * 0.15) return "URBAN";
    if (distFromCenter < GRID_SIZE * 0.27) return noise > 0.4 ? "URBAN" : "PLAINS";
    
    // Original water areas
    if (
      (x > GRID_SIZE * 0.625 && x < GRID_SIZE * 0.78 && y > GRID_SIZE * 0.16 && y < GRID_SIZE * 0.39) ||
      (x > GRID_SIZE * 0.08 && x < GRID_SIZE * 0.23 && y > GRID_SIZE * 0.70 && y < GRID_SIZE * 0.91)
    ) {
      return "WATER";
    }
    
    if (seed > 0.3) return "HILLS";
    if (seed < -0.3) return "FOREST";
    return "PLAINS";
  }, []);
  
  // Get heatmap value for a tile
  const getHeatmapValue = useCallback(
    (x: number, y: number, type: HeatmapType): number => {
      if (type === "NONE") return 0;
      
      let value = 0;
      const tileX = x * (3000 / GRID_SIZE);
      const tileY = y * (3000 / GRID_SIZE);
      
      agents.forEach((agent) => {
        if (agent.status !== "ACTIVE") return;
        const dist = Math.sqrt(
          (agent.position.x - tileX) ** 2 + (agent.position.y - tileY) ** 2
        );
        const influence = Math.max(0, 1 - dist / 100);
        
        switch (type) {
          case "POP":
            value += influence;
            break;
          case "WEALTH":
            value += influence * (agent.money / 5000);
            break;
          case "HAPPINESS":
            value += influence * (agent.traits?.compliance || 0.5);
            break;
          case "PROD":
            value += influence * (agent.traits?.productivity || 0.5);
            break;
          case "RESEARCH":
            value += influence * (agent.role === "RESEARCHER" ? 1 : 0.1);
            break;
          case "CONFLICT":
            value += influence * (1 - (agent.traits?.compliance || 0.5));
            break;
        }
      });
      
      return Math.min(1, value);
    },
    [agents]
  );
  
  // Interpolate color for heatmap
  const interpolateColor = (cold: number, hot: number, t: number): string => {
    const r1 = (cold >> 16) & 0xff;
    const g1 = (cold >> 8) & 0xff;
    const b1 = cold & 0xff;
    
    const r2 = (hot >> 16) & 0xff;
    const g2 = (hot >> 8) & 0xff;
    const b2 = hot & 0xff;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `rgb(${r},${g},${b})`;
  };
  
  // Render the map using Canvas 2D
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas with parchment background (Clawtown style)
    ctx.fillStyle = "#F4F1E8";
    ctx.fillRect(0, 0, width, height);
    
    // Save context state
    ctx.save();
    
    // Apply transformations: translate to center, rotate, scale, then pan
    // Fix: clamp pan to prevent drift
    const clampedPanX = Math.max(-width, Math.min(width, pan.x));
    const clampedPanY = Math.max(-height, Math.min(height, pan.y));
    ctx.translate(width / 2 + clampedPanX, height / 2 + clampedPanY);
    ctx.rotate(rotation);
    ctx.scale(zoom, zoom);
    
    const gridOffset = (GRID_SIZE * TILE_SIZE) / 2;
    
    // Draw tiles (grid-based terrain)
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const terrain = getTerrainType(x, y);
        let color = hexToColor(TERRAIN_COLORS[terrain]);
        
        // Apply heatmap overlay if active
        if (activeHeatmap !== "NONE") {
          const heatValue = getHeatmapValue(x, y, activeHeatmap);
          const { cold, hot } = HEATMAP_COLORS[activeHeatmap];
          color = interpolateColor(cold, hot, heatValue);
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(
          x * TILE_SIZE - gridOffset,
          y * TILE_SIZE - gridOffset,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }
    
    // Draw grid lines (subtle, light theme)
    ctx.strokeStyle = "rgba(40, 30, 20, 0.12)";
    ctx.lineWidth = 0.5 / zoom;
    
    for (let i = 0; i <= GRID_SIZE; i += 8) {
      const pos = i * TILE_SIZE - gridOffset;
      ctx.beginPath();
      ctx.moveTo(pos, -gridOffset);
      ctx.lineTo(pos, gridOffset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-gridOffset, pos);
      ctx.lineTo(gridOffset, pos);
      ctx.stroke();
    }
    
    // Draw districts as overlapping colored areas
    districts.forEach((district) => {
      const cx = (district.centerX / 3000) * GRID_SIZE * TILE_SIZE - gridOffset;
      const cy = (district.centerY / 3000) * GRID_SIZE * TILE_SIZE - gridOffset;
      const r = (district.radius / 3000) * GRID_SIZE * TILE_SIZE;
      
      const districtColor = hexToColor(DISTRICT_COLORS[district.type] || 0x333333);
      
      // Draw filled circle with transparency
      ctx.fillStyle = districtColor + "40"; // ~25% opacity for overlapping effect
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = districtColor + "AA"; // ~67% opacity
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();
    });
    
    // Draw buildings as small colored squares
    buildings.forEach((building) => {
      const bx = (building.position.x / 3000) * GRID_SIZE * TILE_SIZE - gridOffset;
      const by = (building.position.y / 3000) * GRID_SIZE * TILE_SIZE - gridOffset;
      const bw = Math.max(3, (building.size.width / 3000) * GRID_SIZE * TILE_SIZE);
      const bh = Math.max(3, (building.size.height / 3000) * GRID_SIZE * TILE_SIZE);
      
      ctx.fillStyle = BUILDING_COLORS[building.type] || "#444";
      ctx.fillRect(bx, by, bw, bh);
      
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 0.5 / zoom;
      ctx.strokeRect(bx, by, bw, bh);
    });
    
    // Draw agents as small colored dots
    agents.forEach((agent) => {
      if (agent.status !== "ACTIVE") return;
      
      const ax = (agent.position.x / 3000) * GRID_SIZE * TILE_SIZE - gridOffset;
      const ay = (agent.position.y / 3000) * GRID_SIZE * TILE_SIZE - gridOffset;
      
      ctx.fillStyle = ROLE_COLORS[agent.role] || "#fff";
      ctx.beginPath();
      ctx.arc(ax, ay, 2.5 / zoom, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Restore context state
    ctx.restore();
  }, [
    agents,
    buildings,
    districts,
    activeHeatmap,
    zoom,
    pan,
    rotation,
    width,
    height,
    getTerrainType,
    getHeatmapValue,
  ]);
  
  // Render when dependencies change (not infinite loop)
  useEffect(() => {
    // Use requestAnimationFrame to batch renders
    const rafId = requestAnimationFrame(() => {
      renderMap();
    });
    return () => cancelAnimationFrame(rafId);
  }, [renderMap]);
  
  // Mouse handlers for pan and rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    // Right click or Ctrl+click for rotation
    if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      setIsRotating(true);
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      setRotateStart({ angle, centerX, centerY });
    } else if (e.button === 0) {
      // Left click for pan
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (isRotating) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + width / 2;
      const centerY = rect.top + height / 2;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const deltaAngle = currentAngle - rotateStart.angle;
      setRotation((prev) => prev + deltaAngle);
      setRotateStart({ ...rotateStart, angle: currentAngle });
    } else if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu
  };
  
  // Handle zoom with buttons
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 4.0)); // Max zoom 4x
  };
  
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5)); // Min zoom 0.5x
  };
  
  // Disable zoom on wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Zoom disabled - only pan is allowed
  };
  
  // Click handler for inspection
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || isRotating) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to world coordinates (accounting for rotation)
    const dx = mouseX - width / 2 - pan.x;
    const dy = mouseY - height / 2 - pan.y;
    
    // Rotate back to get world coordinates
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const worldX = (dx * cos - dy * sin) / zoom;
    const worldY = (dx * sin + dy * cos) / zoom;
    
    const gridOffset = (GRID_SIZE * TILE_SIZE) / 2;
    const tileX = Math.floor((worldX + gridOffset) / TILE_SIZE);
    const tileY = Math.floor((worldY + gridOffset) / TILE_SIZE);
    
    if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
      return;
    }
    
    const worldPosX = (tileX / GRID_SIZE) * 3000;
    const worldPosY = (tileY / GRID_SIZE) * 3000;
    
    // Check for agent click
    const clickedAgent = agents.find((agent) => {
      if (agent.status !== "ACTIVE") return false;
      const dx = agent.position.x - worldPosX;
      const dy = agent.position.y - worldPosY;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });
    
    if (clickedAgent && onInspect) {
      onInspect({
        type: "citizen",
        data: {
          id: clickedAgent.id,
          name: clickedAgent.name,
          role: clickedAgent.role,
          age: clickedAgent.age,
          money: clickedAgent.money,
          productivity: clickedAgent.traits?.productivity || 0,
          happiness: clickedAgent.traits?.compliance || 0,
          impact: {
            taxPaid: clickedAgent.money * 0.1,
            lawsAffectedBy: clickedAgent.lawImpact?.length || 0,
            buildingsBuilt: clickedAgent.activityLog?.filter(
              (a) => a.action.includes("built")
            ).length || 0,
          },
        },
      });
      return;
    }
    
    // Check for building click
    const clickedBuilding = buildings.find((building) => {
      const bx = building.position.x;
      const by = building.position.y;
      const bw = building.size.width;
      const bh = building.size.height;
      return (
        worldPosX >= bx &&
        worldPosX <= bx + bw &&
        worldPosY >= by &&
        worldPosY <= by + bh
      );
    });
    
    if (clickedBuilding && onInspect) {
      onInspect({
        type: "building",
        data: {
          id: clickedBuilding.id,
          type: clickedBuilding.type,
          name: clickedBuilding.name,
          level: clickedBuilding.level,
          workers: clickedBuilding.workers?.length || 0,
          productivity: clickedBuilding.productivity,
          impact: {
            population: clickedBuilding.residents?.length || 0,
            economy: clickedBuilding.productivity * 100,
            research: clickedBuilding.type === "RESEARCH_LAB" ? 50 : 0,
          },
        },
      });
      return;
    }
    
    // Check for district click
    const clickedDistrict = districts.find((d) => {
      const dx = worldPosX - d.centerX;
      const dy = worldPosY - d.centerY;
      return Math.sqrt(dx * dx + dy * dy) < d.radius;
    });
    
    if (clickedDistrict && onInspect) {
      onInspect({
        type: "district",
        data: {
          id: clickedDistrict.id,
          name: clickedDistrict.name,
          type: clickedDistrict.type,
          stats: {
            population: clickedDistrict.population,
            buildings: buildings.filter((b) => {
              const dx = b.position.x - clickedDistrict.centerX;
              const dy = b.position.y - clickedDistrict.centerY;
              return Math.sqrt(dx * dx + dy * dy) < clickedDistrict.radius;
            }).length,
            avgWealth: clickedDistrict.wealth,
            avgHappiness: clickedDistrict.happiness,
            productivity: clickedDistrict.productivity,
            dissent: clickedDistrict.dissent,
          },
        },
      });
      return;
    }
    
    // Default to tile inspection
    if (onInspect) {
      const terrain = getTerrainType(tileX, tileY);
      onInspect({
        type: "tile",
        data: {
          x: tileX,
          y: tileY,
          terrain,
          district: null,
          heatmapValues: {
            POP: getHeatmapValue(tileX, tileY, "POP"),
            WEALTH: getHeatmapValue(tileX, tileY, "WEALTH"),
            CONFLICT: getHeatmapValue(tileX, tileY, "CONFLICT"),
            PROD: getHeatmapValue(tileX, tileY, "PROD"),
            HAPPINESS: getHeatmapValue(tileX, tileY, "HAPPINESS"),
            RESEARCH: getHeatmapValue(tileX, tileY, "RESEARCH"),
            NONE: 0,
          },
        },
      });
    }
  };
  
  const heatmapOptions: { value: HeatmapType; label: string; color: string }[] = [
    { value: "NONE", label: "OFF", color: "#666" },
    { value: "POP", label: "POP", color: "#00ff00" },
    { value: "WEALTH", label: "WEALTH", color: "#ffd700" },
    { value: "CONFLICT", label: "CONFLICT", color: "#ff0000" },
    { value: "PROD", label: "PROD", color: "#00ffff" },
    { value: "HAPPINESS", label: "HAPPY", color: "#ff00ff" },
    { value: "RESEARCH", label: "RESEARCH", color: "#8b5cf6" },
  ];
  
  return (
    <div className="relative" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Map controls - Collapsible */}
      <div className="absolute top-2 left-2 z-10">
        {/* Toggle Button */}
        <button
          onClick={() => setMapControlsExpanded(!mapControlsExpanded)}
          className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2 text-[var(--text)] hover:bg-[var(--panel2)] transition-all mb-2 animate-fade-in"
          title={mapControlsExpanded ? "Collapse controls" : "Expand controls"}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {mapControlsExpanded ? "▼" : "▶"}
          </div>
        </button>
        
        {/* Controls Panel - Collapsible */}
        {mapControlsExpanded && (
          <div className="flex flex-col gap-2 animate-fade-in">
            {/* Help hint */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2 text-[8px] text-[var(--muted)]">
              <div>LMB: Pan</div>
              <div>RMB/Ctrl+LMB: Rotate</div>
            </div>
            
            {/* Controls */}
            <div className="flex gap-1 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-1">
              <button
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  setRotation(0);
                }}
                className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-all"
                title="Reset view"
              >
                ⌂
              </button>
              <button
                onClick={() => setRotation((r) => r + Math.PI / 4)}
                className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-all"
                title="Rotate 45°"
              >
                ↻
              </button>
            </div>
            
            {/* Zoom controls */}
            <div className="flex gap-1 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-1 items-center">
              <div className="text-[8px] text-[var(--muted)] px-1">ZOOM:</div>
              <button
                onClick={handleZoomOut}
                className="w-6 h-6 text-xs font-bold border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-all"
                title="Zoom Out"
              >
                −
              </button>
              <div className="px-2 py-0.5 text-[8px] text-[var(--muted)] min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={handleZoomIn}
                className="w-6 h-6 text-xs font-bold border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-all"
                title="Zoom In"
              >
                +
              </button>
            </div>
            
            {/* Heatmap toggles */}
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2">
              <div className="text-[8px] text-[var(--muted)] mb-1 px-1">
                HEATMAP
              </div>
              <div className="grid grid-cols-4 gap-1">
                {heatmapOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActiveHeatmap(opt.value)}
                    className={`px-1 py-0.5 text-[8px] border rounded transition-all ${
                      activeHeatmap === opt.value
                        ? "border-[var(--research)] bg-[var(--panel2)]"
                        : "border-[var(--border)] hover:bg-[var(--panel2)]"
                    }`}
                    style={{
                      color: activeHeatmap === opt.value ? opt.color : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Minimap */}
      <div className="absolute bottom-2 right-2 z-10 w-20 h-20 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-1">
        <div className="w-full h-full relative bg-[#E9E2D0] rounded">
          {/* Minimap viewport indicator */}
          <div
            className="absolute border-2 border-[var(--research)]"
            style={{
              left: `${50 - pan.x / (GRID_SIZE * TILE_SIZE * zoom) * 50}%`,
              top: `${50 - pan.y / (GRID_SIZE * TILE_SIZE * zoom) * 50}%`,
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
          {/* Minimap dots for agents */}
          {agents.slice(0, 30).map((agent) =>
            agent.status === "ACTIVE" ? (
              <div
                key={agent.id}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${(agent.position.x / 1000) * 100}%`,
                  top: `${(agent.position.y / 1000) * 100}%`,
                  backgroundColor: ROLE_COLORS[agent.role],
                }}
              />
            ) : null
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 text-center text-[6px] text-[var(--muted)]">
          MINIMAP
        </div>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={Math.max(1, Math.floor(width))}
        height={Math.max(1, Math.floor(height))}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          objectFit: 'contain'
        }}
        className="cursor-crosshair border border-[var(--border)] rounded-lg shadow-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
