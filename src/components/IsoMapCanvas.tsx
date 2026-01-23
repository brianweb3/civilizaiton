"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useNocracyStore } from "@/store/simulation";
import { useIsoCamera } from "@/hooks/useIsoCamera";
import {
  tileToScreen,
  screenToTileRounded,
  getTileBounds,
  isPointInTile,
  TILE_WIDTH,
  TILE_HEIGHT,
} from "@/lib/isoMath";
import type { TerrainType } from "@/types/tilemap";

interface IsoMapCanvasProps {
  width: number;
  height: number;
  onTileClick?: (tileX: number, tileY: number) => void;
  onTileHover?: (tileX: number | null, tileY: number | null) => void;
  onCameraChange?: (camera: { x: number; y: number; zoom: number }) => void;
}

// Terrain colors (bright Civilization-inspired)
const TERRAIN_COLORS: Record<TerrainType, string> = {
  PLAINS: "#6fbf73",      // Light green (grass)
  WATER: "#2A74B8",       // Blue (water)
  HILLS: "#8A8F98",       // Gray (mountain)
  FOREST: "#2F6B3A",      // Dark green (forest)
  DESERT: "#D9B56C",      // Sand (desert)
  URBAN: "#9CA3AF",       // Light gray (urban)
};

// World size
const WORLD_WIDTH = 64;
const WORLD_HEIGHT = 64;

// Generate terrain procedurally
function getTerrainType(x: number, y: number): TerrainType {
  const seed = Math.sin(x * 0.1) * Math.cos(y * 0.1);
  const noise = Math.sin(x * 0.05 + y * 0.03) * 0.5 + 0.5;
  
  const distFromCenter = Math.sqrt((x - WORLD_WIDTH / 2) ** 2 + (y - WORLD_HEIGHT / 2) ** 2);
  if (distFromCenter < 10) return "URBAN";
  if (distFromCenter < 20) return noise > 0.4 ? "URBAN" : "PLAINS";
  
  if (
    (x > 40 && x < 50 && y > 10 && y < 25) ||
    (x > 5 && x < 15 && y > 45 && y < 58)
  ) {
    return "WATER";
  }
  
  if (seed > 0.3) return "HILLS";
  if (seed < -0.3) return "FOREST";
  return "PLAINS";
}

export default function IsoMapCanvas({
  width,
  height,
  onTileClick,
  onTileHover,
  onCameraChange,
}: IsoMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [mapMode, setMapMode] = useState<"terrain" | "population" | "economy">("terrain");
  
  const { agents, buildings, districts } = useNocracyStore();
  const camera = useIsoCamera(width / 2, height / 2, 1.0);
  
  // Notify parent of camera changes
  useEffect(() => {
    onCameraChange?.(camera.camera);
  }, [camera.camera, onCameraChange]);

  // Render the isometric map
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = "#F4F1E8";
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    
    // Calculate visible tile range
    const zoom = camera.camera.zoom;
    const padding = 5; // Extra tiles to render outside viewport
    
    // Draw tiles
    for (let ty = 0; ty < WORLD_HEIGHT; ty++) {
      for (let tx = 0; tx < WORLD_WIDTH; tx++) {
        const terrain = getTerrainType(tx, ty);
        const color = TERRAIN_COLORS[terrain];
        
        // Get screen position
        const screenPos = tileToScreen(
          tx,
          ty,
          camera.camera.x,
          camera.camera.y,
          camera.camera.zoom
        );
        
        // Skip if outside viewport (with padding)
        if (
          screenPos.x < -TILE_WIDTH * zoom - padding ||
          screenPos.x > width + TILE_WIDTH * zoom + padding ||
          screenPos.y < -TILE_HEIGHT * zoom - padding ||
          screenPos.y > height + TILE_HEIGHT * zoom + padding
        ) {
          continue;
        }
        
        // Apply map mode overlay
        let finalColor = color;
        if (mapMode === "population") {
          const tileAgents = agents.filter((a) => {
            if (a.status !== "ACTIVE") return false;
            const ax = Math.floor((a.position.x / 1000) * 64);
            const ay = Math.floor((a.position.y / 1000) * 64);
            return ax === tx && ay === ty;
          });
          const intensity = Math.min(1, tileAgents.length / 5);
          // Blend with emerald green
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          const blendR = Math.round(r + (46 - r) * intensity * 0.5);
          const blendG = Math.round(g + (139 - g) * intensity * 0.5);
          const blendB = Math.round(b + (87 - b) * intensity * 0.5);
          finalColor = `rgb(${blendR}, ${blendG}, ${blendB})`;
        } else if (mapMode === "economy") {
          const tileAgents = agents.filter((a) => {
            if (a.status !== "ACTIVE") return false;
            const ax = Math.floor((a.position.x / 1000) * 64);
            const ay = Math.floor((a.position.y / 1000) * 64);
            return ax === tx && ay === ty;
          });
          const totalWealth = tileAgents.reduce((sum, a) => sum + a.money, 0);
          const intensity = Math.min(1, totalWealth / 50000);
          // Blend with gold/yellow
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          const blendR = Math.round(r + (217 - r) * intensity * 0.5);
          const blendG = Math.round(g + (181 - g) * intensity * 0.5);
          const blendB = Math.round(b + (108 - b) * intensity * 0.5);
          finalColor = `rgb(${blendR}, ${blendG}, ${blendB})`;
        }
        
        // Draw diamond tile
        ctx.fillStyle = finalColor;
        ctx.strokeStyle = "rgba(40, 30, 20, 0.15)";
        ctx.lineWidth = 1 / zoom;
        
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y - (TILE_HEIGHT * zoom) / 2); // Top
        ctx.lineTo(screenPos.x + (TILE_WIDTH * zoom) / 2, screenPos.y); // Right
        ctx.lineTo(screenPos.x, screenPos.y + (TILE_HEIGHT * zoom) / 2); // Bottom
        ctx.lineTo(screenPos.x - (TILE_WIDTH * zoom) / 2, screenPos.y); // Left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Highlight hovered tile
        if (hoveredTile && hoveredTile.x === tx && hoveredTile.y === ty) {
          ctx.strokeStyle = "rgba(42, 116, 184, 0.8)";
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        }
        
        // Highlight selected tile
        if (selectedTile && selectedTile.x === tx && selectedTile.y === ty) {
          ctx.strokeStyle = "rgba(42, 116, 184, 1.0)";
          ctx.lineWidth = 3 / zoom;
          ctx.stroke();
        }
      }
    }
    
    // Draw districts (semi-transparent overlay)
    districts.forEach((district) => {
      // Find tiles in district
      for (let ty = 0; ty < WORLD_HEIGHT; ty++) {
        for (let tx = 0; tx < WORLD_WIDTH; tx++) {
          const worldX = (tx / WORLD_WIDTH) * 1000;
          const worldY = (ty / WORLD_HEIGHT) * 1000;
          const dx = worldX - district.centerX;
          const dy = worldY - district.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < district.radius) {
            const screenPos = tileToScreen(
              tx,
              ty,
              camera.camera.x,
              camera.camera.y,
              camera.camera.zoom
            );
            
            ctx.fillStyle = district.color + "40"; // 40 = 25% opacity
            ctx.beginPath();
            ctx.moveTo(screenPos.x, screenPos.y - (TILE_HEIGHT * camera.camera.zoom) / 2);
            ctx.lineTo(screenPos.x + (TILE_WIDTH * camera.camera.zoom) / 2, screenPos.y);
            ctx.lineTo(screenPos.x, screenPos.y + (TILE_HEIGHT * camera.camera.zoom) / 2);
            ctx.lineTo(screenPos.x - (TILE_WIDTH * camera.camera.zoom) / 2, screenPos.y);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    });
    
    // Draw buildings
    buildings.forEach((building) => {
      const tileX = Math.floor((building.position.x / 1000) * WORLD_WIDTH);
      const tileY = Math.floor((building.position.y / 1000) * WORLD_HEIGHT);
      
      if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return;
      
      const screenPos = tileToScreen(
        tileX,
        tileY,
        camera.camera.x,
        camera.camera.y,
        camera.camera.zoom
      );
      
      // Draw building marker
      ctx.fillStyle = "#7A4E2D"; // Bronze/brown for buildings
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 4 * camera.camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw citizens (small dots)
    agents.forEach((agent) => {
      if (agent.status !== "ACTIVE") return;
      
      const tileX = Math.floor((agent.position.x / 1000) * WORLD_WIDTH);
      const tileY = Math.floor((agent.position.y / 1000) * WORLD_HEIGHT);
      
      if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return;
      
      const screenPos = tileToScreen(
        tileX,
        tileY,
        camera.camera.x,
        camera.camera.y,
        camera.camera.zoom
      );
      
      // Role colors
      const roleColors: Record<string, string> = {
        WORKER: "#94a3b8",
        RESEARCHER: "#a78bfa",
        GOVERNOR: "#fbbf24",
        ENFORCER: "#f87171",
        ECONOMIST: "#22d3ee",
        ARCHITECT: "#4ade80",
        MEDIC: "#f472b6",
        MERCHANT: "#fb923c",
      };
      
      ctx.fillStyle = roleColors[agent.role] || "#888";
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 2 * camera.camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }, [width, height, camera.camera, hoveredTile, selectedTile, districts, buildings, agents, mapMode]);

  // Handle mouse move for hover
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (camera.isDragging) {
      camera.updateDrag(e.clientX, e.clientY);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Find hovered tile
    const tile = screenToTileRounded(
      mouseX,
      mouseY,
      camera.camera.x,
      camera.camera.y,
      camera.camera.zoom
    );
    
    // Check if tile is valid and point is inside
    if (
      tile.x >= 0 &&
      tile.x < WORLD_WIDTH &&
      tile.y >= 0 &&
      tile.y < WORLD_HEIGHT &&
      isPointInTile(mouseX, mouseY, tile.x, tile.y, camera.camera.x, camera.camera.y, camera.camera.zoom)
    ) {
      if (!hoveredTile || hoveredTile.x !== tile.x || hoveredTile.y !== tile.y) {
        setHoveredTile(tile);
        onTileHover?.(tile.x, tile.y);
      }
    } else {
      if (hoveredTile) {
        setHoveredTile(null);
        onTileHover?.(null, null);
      }
    }
  }, [camera, hoveredTile, onTileHover]);

  // Handle mouse down for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click - start pan
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      camera.startDrag(e.clientX - rect.left, e.clientY - rect.top);
    }
  }, [camera]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    camera.endDrag();
  }, [camera]);

  // Handle click for selection
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (camera.isDragging) {
      camera.endDrag();
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const tile = screenToTileRounded(
      mouseX,
      mouseY,
      camera.camera.x,
      camera.camera.y,
      camera.camera.zoom
    );
    
    if (
      tile.x >= 0 &&
      tile.x < WORLD_WIDTH &&
      tile.y >= 0 &&
      tile.y < WORLD_HEIGHT &&
      isPointInTile(mouseX, mouseY, tile.x, tile.y, camera.camera.x, camera.camera.y, camera.camera.zoom)
    ) {
      setSelectedTile(tile);
      onTileClick?.(tile.x, tile.y);
    }
  }, [camera, onTileClick]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    camera.handleWheel(e, rect);
  }, [camera]);

  // Render on changes
  useEffect(() => {
    renderMap();
  }, [renderMap]);

  return (
    <div className="relative w-full h-full" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* Tooltip for hovered tile */}
      {hoveredTile && (
        <div
          className="absolute pointer-events-none bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2 text-xs z-50"
          style={{
            left: `${Math.min(width - 200, 10)}px`,
            top: `${10}px`,
            maxWidth: '200px',
          }}
        >
          <div className="font-mono text-[var(--text)]">
            Tile ({hoveredTile.x}, {hoveredTile.y})
          </div>
          <div className="text-[var(--muted)] text-[10px] mt-1">
            Terrain: {getTerrainType(hoveredTile.x, hoveredTile.y)}
          </div>
          {(() => {
            const tileBuildings = buildings.filter((b) => {
              const tx = Math.floor((b.position.x / 1000) * WORLD_WIDTH);
              const ty = Math.floor((b.position.y / 1000) * WORLD_HEIGHT);
              return tx === hoveredTile.x && ty === hoveredTile.y;
            });
            const tileAgents = agents.filter((a) => {
              if (a.status !== "ACTIVE") return false;
              const tx = Math.floor((a.position.x / 1000) * WORLD_WIDTH);
              const ty = Math.floor((a.position.y / 1000) * WORLD_HEIGHT);
              return tx === hoveredTile.x && ty === hoveredTile.y;
            });
            return (
              <>
                {tileBuildings.length > 0 && (
                  <div className="text-[var(--muted)] text-[10px] mt-1">
                    Buildings: {tileBuildings.length}
                  </div>
                )}
                {tileAgents.length > 0 && (
                  <div className="text-[var(--muted)] text-[10px] mt-1">
                    Citizens: {tileAgents.length}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      
      {/* Map Mode Toggle */}
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2">
          <div className="text-[8px] text-[var(--muted)] mb-1">MAP MODE</div>
          <div className="flex flex-col gap-1">
            {(["terrain", "population", "economy"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`px-2 py-1 text-[8px] border rounded transition-colors ${
                  mapMode === mode
                    ? "border-[var(--research)] text-[var(--research)] bg-[rgba(42,116,184,0.08)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel2)]"
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Camera controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2">
          <div className="text-[8px] text-[var(--muted)] mb-1">CAMERA</div>
          <div className="flex gap-1">
            <button
              onClick={() => camera.zoom(0.1)}
              className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-colors"
            >
              +
            </button>
            <span className="w-12 text-center text-xs leading-6">
              {(camera.camera.zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => camera.zoom(-0.1)}
              className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-colors"
            >
              −
            </button>
            <button
              onClick={camera.reset}
              className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-colors"
              title="Reset view"
            >
              ⌂
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
