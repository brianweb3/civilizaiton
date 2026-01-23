"use client";

import { useEffect, useRef } from "react";
import { useNocracyStore } from "@/store/simulation";
import type { CameraState } from "@/hooks/useIsoCamera";

interface MiniMapProps {
  worldWidth: number;
  worldHeight: number;
  camera: CameraState;
  canvasWidth: number;
  canvasHeight: number;
  onTileClick?: (tileX: number, tileY: number) => void;
}

const MINIMAP_SIZE = 120;

export default function MiniMap({
  worldWidth,
  worldHeight,
  camera,
  canvasWidth,
  canvasHeight,
  onTileClick,
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { agents, buildings, districts } = useNocracyStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = "#E9E2D0";
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    
    const scaleX = MINIMAP_SIZE / worldWidth;
    const scaleY = MINIMAP_SIZE / worldHeight;
    
    // Draw terrain (simplified)
    for (let y = 0; y < worldHeight; y++) {
      for (let x = 0; x < worldWidth; x++) {
        const seed = Math.sin(x * 0.1) * Math.cos(y * 0.1);
        const noise = Math.sin(x * 0.05 + y * 0.03) * 0.5 + 0.5;
        const distFromCenter = Math.sqrt((x - worldWidth / 2) ** 2 + (y - worldHeight / 2) ** 2);
        
        let color = "#6fbf73"; // PLAINS
        if (distFromCenter < 10) color = "#9CA3AF"; // URBAN
        else if (distFromCenter < 20 && noise > 0.4) color = "#9CA3AF"; // URBAN
        else if ((x > 40 && x < 50 && y > 10 && y < 25) || (x > 5 && x < 15 && y > 45 && y < 58)) {
          color = "#2A74B8"; // WATER
        } else if (seed > 0.3) color = "#8A8F98"; // HILLS
        else if (seed < -0.3) color = "#2F6B3A"; // FOREST
        
        ctx.fillStyle = color;
        ctx.fillRect(x * scaleX, y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
      }
    }
    
    // Draw districts
    districts.forEach((district) => {
      const worldX = (district.centerX / 1000) * worldWidth;
      const worldY = (district.centerY / 1000) * worldHeight;
      const radius = (district.radius / 1000) * worldWidth;
      
      ctx.fillStyle = district.color + "60";
      ctx.beginPath();
      ctx.arc(worldX * scaleX, worldY * scaleY, radius * scaleX, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw buildings (small dots)
    buildings.forEach((building) => {
      const x = (building.position.x / 1000) * worldWidth * scaleX;
      const y = (building.position.y / 1000) * worldHeight * scaleY;
      ctx.fillStyle = "#7A4E2D";
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw agents (tiny dots)
    agents.slice(0, 50).forEach((agent) => {
      if (agent.status !== "ACTIVE") return;
      const x = (agent.position.x / 1000) * worldWidth * scaleX;
      const y = (agent.position.y / 1000) * worldHeight * scaleY;
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw viewport indicator
    // Calculate viewport bounds in tile space (simplified)
    const zoom = camera.zoom;
    const tileW = 48;
    const tileH = 24;
    
    // Approximate viewport in tile coordinates
    const viewportWidthTiles = (canvasWidth / (tileW * zoom)) * 2;
    const viewportHeightTiles = (canvasHeight / (tileH * zoom)) * 2;
    
    // Center of viewport in world coordinates (0-1000) mapped to tiles (0-64)
    const worldCenterX = (camera.x / canvasWidth) * worldWidth;
    const worldCenterY = (camera.y / canvasHeight) * worldHeight;
    
    ctx.strokeStyle = "rgba(42, 116, 184, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.max(0, (worldCenterX - viewportWidthTiles / 2) * scaleX),
      Math.max(0, (worldCenterY - viewportHeightTiles / 2) * scaleY),
      Math.min(MINIMAP_SIZE, viewportWidthTiles * scaleX),
      Math.min(MINIMAP_SIZE, viewportHeightTiles * scaleY)
    );
  }, [worldWidth, worldHeight, camera, canvasWidth, canvasHeight, districts, buildings, agents]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const tileX = Math.floor((x / MINIMAP_SIZE) * worldWidth);
    const tileY = Math.floor((y / MINIMAP_SIZE) * worldHeight);
    
    if (tileX >= 0 && tileX < worldWidth && tileY >= 0 && tileY < worldHeight) {
      onTileClick?.(tileX, tileY);
    }
  };

  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2">
      <div className="text-[8px] text-[var(--muted)] mb-1 text-center">MINIMAP</div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        className="cursor-pointer border border-[var(--border)] rounded"
        onClick={handleClick}
      />
    </div>
  );
}
