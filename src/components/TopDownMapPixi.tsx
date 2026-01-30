"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Application,
  Texture,
  Rectangle,
  Container,
  Sprite,
  Graphics,
  Text,
  TextureStyle,
} from "pixi.js";
import { useClawtownStore } from "@/store/simulation";
import { sliceTexture } from "@/lib/tilesetSlice";
import { TILE_SIZE, TILEMAP, getTileCoords } from "@/lib/pixelholeMap";
import { CUSTOM_SPRITES, getSpritePath, getSpritesByType } from "@/lib/customSpritesMap";
import type { TerrainType } from "@/types/tilemap";

const WORLD_WIDTH = 64;
const WORLD_HEIGHT = 64;

interface TopDownMapPixiProps {
  width: number;
  height: number;
  onTileClick?: (tileX: number, tileY: number) => void;
  onTileHover?: (tileX: number | null, tileY: number | null) => void;
  onCameraChange?: (camera: { x: number; y: number; zoom: number }) => void;
}

export default function TopDownMapPixi({
  width,
  height,
  onTileClick,
  onTileHover,
  onCameraChange,
}: TopDownMapPixiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const renderFnRef = useRef<(() => void) | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1.45 });
  
  const { agents, buildings, districts } = useClawtownStore();
  
  // Get terrain type for a tile (procedural generation with more variety)
  const getTerrainType = useCallback((x: number, y: number): TerrainType => {
    // Use multiple noise functions for more natural distribution
    const noise1 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
    const noise2 = Math.sin(x * 0.05 + y * 0.03) * 0.5 + 0.5;
    const noise3 = Math.sin(x * 0.08 - y * 0.06) * 0.5 + 0.5;
    const distFromCenter = Math.sqrt((x - WORLD_WIDTH / 2) ** 2 + (y - WORLD_HEIGHT / 2) ** 2);
    
    // Urban areas in center
    if (distFromCenter < 8) return "URBAN";
    if (distFromCenter < 15 && noise2 > 0.5) return "URBAN";
    
    // Water areas (rivers and lakes)
    const waterNoise = Math.sin(x * 0.15) * Math.cos(y * 0.12);
    if (waterNoise > 0.4 && noise3 < 0.3) return "WATER";
    if (
      (x > 35 && x < 55 && y > 8 && y < 28) ||
      (x > 3 && x < 18 && y > 42 && y < 60) ||
      (x > 50 && x < 62 && y > 35 && y < 50)
    ) {
      return "WATER";
    }
    
    // Hills and rocks
    if (noise1 > 0.35 && noise2 < 0.6) return "HILLS";
    
    // Forest areas
    if (noise1 < -0.25 && noise3 > 0.4) return "FOREST";
    if (distFromCenter > 25 && noise2 < 0.3) return "FOREST";
    
    // Desert/sand patches
    if (noise3 < 0.2 && distFromCenter > 20) return "DESERT";
    
    // Default to plains
    return "PLAINS";
  }, []);
  
  // Get tile sprite key from terrain type (using custom sprites)
  const getTileKey = useCallback((terrain: TerrainType, x: number, y: number): string => {
    switch (terrain) {
      case "PLAINS":
        // Randomly use different grass variants
        const grassVariant = (x * 7 + y * 11) % 3;
        if (grassVariant === 0) return "grass";
        if (grassVariant === 1) return "grass_edge";
        return "dirt_grass";
      case "WATER":
        return "water";
      case "FOREST":
        // Forest terrain uses grass base, objects added separately
        const grassVar = (x + y) % 2;
        return grassVar === 0 ? "grass" : "dirt_grass";
      case "HILLS":
        return "rocks";
      case "DESERT":
        return "sand";
      case "URBAN":
        // Urban uses grass/dirt base, buildings added separately
        const urbanGrass = (x + y) % 2;
        return urbanGrass === 0 ? "grass" : "dirt_grass";
      default:
        return "grass";
    }
  }, []);
  
  // Get object sprite for a tile (trees, houses, etc.)
  const getObjectSprite = useCallback((terrain: TerrainType, x: number, y: number): string | null => {
    const random = (x * 13 + y * 17) % 100;
    
    switch (terrain) {
      case "FOREST":
        // 30% chance of trees/bushes in forest
        if (random < 30) {
          const objType = (x + y) % 3;
          if (objType === 0) return "tree_cluster";
          if (objType === 1) return "bush_large";
          return "bush_small";
        }
        return null;
      case "URBAN":
        // 40% chance of houses in urban areas
        if (random < 40) {
          return "house_brown";
        }
        return null;
      case "HILLS":
        // 20% chance of extra rocks
        if (random < 20) {
          return "rocks";
        }
        return null;
      case "PLAINS":
        // 5% chance of small bushes in plains
        if (random < 5) {
          return "bush_small";
        }
        return null;
      default:
        return null;
    }
  }, []);
  
  // Initialize PIXI app
  useEffect(() => {
    if (!containerRef.current) return;
    
    const app = new Application();
    
    app.init({
      width,
      height,
      backgroundColor: 0xF4F1E8, // Parchment background
      antialias: false, // Pixel-perfect
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      if (!containerRef.current) return;
      
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;
      
      // Set up pixel-perfect scaling (v8 uses TextureStyle)
      TextureStyle.defaultOptions.scaleMode = 'nearest';
      
      // Create layers
      const terrainLayer = new Container();
      const objectsLayer = new Container();
      const citizensLayer = new Container();
      const highlightLayer = new Container();
      const debugLayer = new Container();
      
      app.stage.addChild(terrainLayer);
      app.stage.addChild(objectsLayer);
      app.stage.addChild(citizensLayer);
      app.stage.addChild(highlightLayer);
      app.stage.addChild(debugLayer);
      
      // Create sprite cache for custom sprites
      const spriteCache: Map<string, Texture> = new Map();
      
      // Function to get texture (synchronous, with fallback) - defined first
      const getTexture = (key: string): Texture | null => {
        // First try cached sprite
        if (spriteCache.has(key)) {
          const cached = spriteCache.get(key)!;
          if (cached) {
            return cached;
          }
        }
        
        // Try to load custom sprite synchronously (if already loaded by browser)
        const spriteInfo = CUSTOM_SPRITES[key];
        if (spriteInfo) {
          const spritePath = getSpritePath(key);
          if (spritePath) {
            try {
              // Try to get texture - this will work if image is already loaded
              const texture = Texture.from(spritePath);
              texture.source.scaleMode = 'nearest';
              spriteCache.set(key, texture);
              return texture;
            } catch (error) {
              // Texture not ready yet, will use fallback
            }
          }
        }
        
        // Fallback to pixelhole tileset
        try {
          const tilesetTexture = Texture.from("/tilesets/pixelhole/tiles.png");
          tilesetTexture.source.scaleMode = 'nearest';
          const [tx, ty] = getTileCoords(key);
          const texture = sliceTexture(tilesetTexture, tx, ty, TILE_SIZE, TILE_SIZE);
          texture.source.scaleMode = 'nearest';
          spriteCache.set(key, texture);
          return texture;
        } catch (error) {
          // Fallback tileset not available
        }
        
        // Last resort: create a colored rectangle
        try {
          const graphics = new Graphics();
          graphics.rect(0, 0, TILE_SIZE, TILE_SIZE);
          // Different colors for different keys
          const colors: Record<string, number> = {
            grass: 0x6fbf73,
            water: 0x4a90e2,
            sand: 0xf4e4bc,
            rocks: 0x8b8b8b,
            house_brown: 0x8b4513,
            tree_cluster: 0x2d5016,
            bush_small: 0x4a7c3a,
            bush_large: 0x4a7c3a,
          };
          graphics.fill(colors[key] || 0x6fbf73);
          const texture = app.renderer.generateTexture(graphics);
          spriteCache.set(key, texture);
          return texture;
        } catch (err) {
          return null;
        }
      };
      
      // Function to load custom sprite texture (async for preloading)
      const loadSpriteTexture = async (key: string): Promise<Texture | null> => {
        if (spriteCache.has(key)) {
          const cached = spriteCache.get(key)!;
          if (cached) {
            return cached;
          }
        }
        
        const spriteInfo = CUSTOM_SPRITES[key];
        if (!spriteInfo) {
          return null;
        }
        
        const spritePath = getSpritePath(key);
        if (!spritePath) return null;
        
        try {
          // Preload image first to ensure it's ready
          const img = new Image();
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => {
              console.error(`Failed to load image: ${spritePath}`, err);
              reject(err);
            };
            img.src = spritePath;
          });
          
          // Now create texture from loaded image
          const texture = Texture.from(img);
          texture.source.scaleMode = 'nearest';
          spriteCache.set(key, texture);
          console.log(`✓ Preloaded sprite: ${key} from ${spritePath}`);
          return texture;
        } catch (error) {
          console.warn(`✗ Failed to preload sprite: ${key} from ${spritePath}`, error);
          return null;
        }
      };
      
      // Preload all custom sprites BEFORE first render
      const preloadSprites = async () => {
        try {
          console.log('🔄 Preloading custom sprites...');
          const keys = Object.keys(CUSTOM_SPRITES);
          const results = await Promise.all(keys.map(key => loadSpriteTexture(key).catch(() => null)));
          const loaded = results.filter(r => r !== null).length;
          console.log(`✅ Preloaded ${loaded}/${keys.length} sprites`);
          
          // Re-render after preload to use loaded sprites
          if (renderFnRef.current) {
            renderFnRef.current();
          }
        } catch (error) {
          console.error('❌ Error preloading sprites:', error);
        }
      };
      
      // Render function - synchronous
      const render = (currentCamera = camera) => {
        try {
          // Clear layers
          terrainLayer.removeChildren();
          objectsLayer.removeChildren();
          citizensLayer.removeChildren();
          highlightLayer.removeChildren();
          debugLayer.removeChildren();
          
          // Calculate visible tile range
          const tileScreenSize = TILE_SIZE * currentCamera.zoom;
          const startX = Math.max(0, Math.floor(-currentCamera.x / tileScreenSize) - 1);
          const endX = Math.min(WORLD_WIDTH, Math.ceil((width - currentCamera.x) / tileScreenSize) + 1);
          const startY = Math.max(0, Math.floor(-currentCamera.y / tileScreenSize) - 1);
          const endY = Math.min(WORLD_HEIGHT, Math.ceil((height - currentCamera.y) / tileScreenSize) + 1);
          
          // Render terrain layer
          let tilesRendered = 0;
          for (let ty = startY; ty < endY; ty++) {
            for (let tx = startX; tx < endX; tx++) {
              const terrain = getTerrainType(tx, ty);
              const tileKey = getTileKey(terrain, tx, ty);
              
              const texture = getTexture(tileKey);
              if (texture) {
                const newSprite = new Sprite(texture);
                newSprite.x = tx * TILE_SIZE * currentCamera.zoom + currentCamera.x;
                newSprite.y = ty * TILE_SIZE * currentCamera.zoom + currentCamera.y;
                newSprite.scale.set(currentCamera.zoom);
                terrainLayer.addChild(newSprite);
                tilesRendered++;
              }
              
              // Add objects (trees, houses, rocks) based on terrain
              const objectKey = getObjectSprite(terrain, tx, ty);
              if (objectKey) {
                const objectTexture = getTexture(objectKey);
                if (objectTexture) {
                  const newObjectSprite = new Sprite(objectTexture);
                  newObjectSprite.x = tx * TILE_SIZE * currentCamera.zoom + currentCamera.x;
                  newObjectSprite.y = ty * TILE_SIZE * currentCamera.zoom + currentCamera.y;
                  newObjectSprite.scale.set(currentCamera.zoom);
                  objectsLayer.addChild(newObjectSprite);
                }
              }
            }
          }
          
          if (tilesRendered === 0) {
            console.warn('No tiles rendered! Check texture loading.');
          } else {
            console.log(`Rendered ${tilesRendered} tiles`);
          }
          
          // Render buildings from simulation data
          buildings.forEach((building) => {
            const tileX = Math.floor((building.position.x / 1000) * WORLD_WIDTH);
            const tileY = Math.floor((building.position.y / 1000) * WORLD_HEIGHT);
            
            if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return;
            
            const buildingKey = "house_brown";
            const buildingTexture = getTexture(buildingKey);
            if (buildingTexture) {
              const newBuildingSprite = new Sprite(buildingTexture);
              newBuildingSprite.x = tileX * TILE_SIZE * currentCamera.zoom + currentCamera.x;
              newBuildingSprite.y = tileY * TILE_SIZE * currentCamera.zoom + currentCamera.y;
              newBuildingSprite.scale.set(currentCamera.zoom);
              objectsLayer.addChild(newBuildingSprite);
            }
          });
        
        // Render citizens
        agents.forEach((agent) => {
          if (agent.status !== "ACTIVE") return;
          
          const tileX = Math.floor((agent.position.x / 1000) * WORLD_WIDTH);
          const tileY = Math.floor((agent.position.y / 1000) * WORLD_HEIGHT);
          
          if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return;
          
          // Draw citizen as a small colored dot
          const citizenDot = new Graphics();
          const roleColors: Record<string, number> = {
            WORKER: 0x94a3b8,
            RESEARCHER: 0xa78bfa,
            GOVERNOR: 0xfbbf24,
            ENFORCER: 0xf87171,
            ECONOMIST: 0x22d3ee,
            ARCHITECT: 0x4ade80,
            MEDIC: 0xf472b6,
            MERCHANT: 0xfb923c,
          };
          
          citizenDot.circle(0, 0, 2 * currentCamera.zoom);
          citizenDot.fill(roleColors[agent.role] || 0x888888);
          citizenDot.x = tileX * TILE_SIZE * currentCamera.zoom + currentCamera.x + (TILE_SIZE * currentCamera.zoom) / 2;
          citizenDot.y = tileY * TILE_SIZE * currentCamera.zoom + currentCamera.y + (TILE_SIZE * currentCamera.zoom) / 2;
          citizensLayer.addChild(citizenDot);
        });
        
        // Render hover highlight
        if (hoveredTile) {
          const highlight = new Graphics();
          highlight.rect(
            hoveredTile.x * TILE_SIZE * currentCamera.zoom + currentCamera.x,
            hoveredTile.y * TILE_SIZE * currentCamera.zoom + currentCamera.y,
            TILE_SIZE * currentCamera.zoom,
            TILE_SIZE * currentCamera.zoom
          );
          highlight.stroke({ width: 2 * currentCamera.zoom, color: 0x2A74B8, alpha: 0.8 });
          highlightLayer.addChild(highlight);
        }
        
        // Debug overlay
        if (debugMode && hoveredTile) {
          const debugText = new Text(
            `Tile: (${hoveredTile.x}, ${hoveredTile.y})\nTerrain: ${getTerrainType(hoveredTile.x, hoveredTile.y)}\nSprite: ${getTileKey(getTerrainType(hoveredTile.x, hoveredTile.y), hoveredTile.x, hoveredTile.y)}`,
            {
              fontSize: 12,
              fill: 0x000000,
            },
          );
          debugText.x = hoveredTile.x * TILE_SIZE * currentCamera.zoom + currentCamera.x;
          debugText.y = hoveredTile.y * TILE_SIZE * currentCamera.zoom + currentCamera.y - 40;
          debugLayer.addChild(debugText);
        }
        } catch (error) {
          console.error('Render error:', error);
        }
      };
      
      // Preload sprites first, then render
      preloadSprites().then(() => {
        // Render after sprites are loaded
        if (renderFnRef.current) {
          renderFnRef.current();
        }
      });
      
      // Render immediately with fallback textures (will be replaced when sprites load)
      render();
      
      // Handle mouse move
      const handleMouseMove = (e: MouseEvent) => {
        if (!app.canvas) return;
        
        const rect = app.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get current camera state from ref
        const currentCamera = cameraRef.current;
        // Convert screen to tile coordinates
        const tileX = Math.floor((mouseX - currentCamera.x) / (TILE_SIZE * currentCamera.zoom));
        const tileY = Math.floor((mouseY - currentCamera.y) / (TILE_SIZE * currentCamera.zoom));
        
        if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
          const newHovered = { x: tileX, y: tileY };
          setHoveredTile(newHovered);
          onTileHover?.(tileX, tileY);
        } else {
          setHoveredTile(null);
          onTileHover?.(null, null);
        }
      };
      
      // Handle mouse click
      const handleClick = (e: MouseEvent) => {
        if (!app.canvas) return;
        
        const rect = app.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const currentCamera = cameraRef.current;
        const tileX = Math.floor((mouseX - currentCamera.x) / (TILE_SIZE * currentCamera.zoom));
        const tileY = Math.floor((mouseY - currentCamera.y) / (TILE_SIZE * currentCamera.zoom));
        
        if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
          onTileClick?.(tileX, tileY);
        }
      };
      
      // Handle wheel for zoom
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setCamera((prev) => {
          const newZoom = Math.max(0.5, Math.min(3.0, prev.zoom + delta));
          return { ...prev, zoom: newZoom };
        });
      };
      
      // Handle drag for pan
      let isDragging = false;
      let dragStart = { x: 0, y: 0 };
      
      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
      };
      
      const handleMouseUp = () => {
        isDragging = false;
      };
      
      // Debounce render to prevent flickering
      let renderTimeout: NodeJS.Timeout | null = null;
      const debouncedRender = () => {
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {
          if (renderFnRef.current) {
            renderFnRef.current();
          }
        }, 16); // ~60fps
      };
      
      const handleMouseMoveDrag = (e: MouseEvent) => {
        if (isDragging) {
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          setCamera((prev) => {
            const newCamera = {
              ...prev,
              x: prev.x + dx,
              y: prev.y + dy,
            };
            // Use debounced render
            debouncedRender();
            return newCamera;
          });
          dragStart = { x: e.clientX, y: e.clientY };
        }
      };
      
      app.canvas.addEventListener("mousemove", handleMouseMove);
      app.canvas.addEventListener("click", handleClick);
      app.canvas.addEventListener("wheel", handleWheel);
      app.canvas.addEventListener("mousedown", handleMouseDown);
      app.canvas.addEventListener("mouseup", handleMouseUp);
      app.canvas.addEventListener("mousemove", handleMouseMoveDrag);
      
      return () => {
        app.canvas?.removeEventListener("mousemove", handleMouseMove);
        app.canvas?.removeEventListener("click", handleClick);
        app.canvas?.removeEventListener("wheel", handleWheel);
        app.canvas?.removeEventListener("mousedown", handleMouseDown);
        app.canvas?.removeEventListener("mouseup", handleMouseUp);
        app.canvas?.removeEventListener("mousemove", handleMouseMoveDrag);
        app.destroy(true, { children: true, texture: true });
      };
    });
    
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [width, height, getTerrainType, getTileKey, getObjectSprite]);
  
  // Re-render when camera, hover, or data changes
  useEffect(() => {
    if (renderFnRef.current) {
      // Use setTimeout to debounce rapid updates
      const timeoutId = setTimeout(() => {
        renderFnRef.current?.();
      }, 16); // ~60fps
      return () => clearTimeout(timeoutId);
    }
  }, [camera, hoveredTile, debugMode, agents, buildings]);
  
  // Also create a camera ref for mouse handlers
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  
  // Notify parent of camera changes
  useEffect(() => {
    onCameraChange?.(camera);
  }, [camera, onCameraChange]);
  
  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Debug toggle */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-2 py-1 text-[8px] border rounded transition-colors ${
            debugMode
              ? "border-[var(--research)] text-[var(--research)] bg-[rgba(42,116,184,0.08)]"
              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel2)]"
          }`}
        >
          DEBUG
        </button>
      </div>
      
      {/* Camera controls */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg p-2">
          <div className="text-[8px] text-[var(--muted)] mb-1">CAMERA</div>
          <div className="flex gap-1">
            <button
              onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.min(3.0, prev.zoom + 0.1) }))}
              className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-colors"
            >
              +
            </button>
            <span className="w-12 text-center text-xs leading-6">
              {(camera.zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))}
              className="w-6 h-6 text-xs border border-[var(--border)] rounded hover:bg-[var(--panel2)] transition-colors"
            >
              −
            </button>
            <button
              onClick={() => setCamera({ x: 0, y: 0, zoom: 1.45 })}
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
