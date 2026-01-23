/**
 * Isometric coordinate transformations
 * Based on diamond grid (Civ-style)
 */

export interface IsoPoint {
  x: number;
  y: number;
}

export interface TileCoord {
  x: number;
  y: number;
}

// Tile dimensions in screen space
export const TILE_WIDTH = 48;
export const TILE_HEIGHT = 24;

/**
 * Convert tile coordinates to screen pixel coordinates
 * @param tileX - Tile X coordinate
 * @param tileY - Tile Y coordinate
 * @param originX - Screen origin X (camera offset)
 * @param originY - Screen origin Y (camera offset)
 * @param zoom - Zoom level (1.0 = normal)
 * @returns Screen pixel coordinates
 */
export function tileToScreen(
  tileX: number,
  tileY: number,
  originX: number = 0,
  originY: number = 0,
  zoom: number = 1.0
): IsoPoint {
  // Isometric projection: diamond shape
  // Each tile is offset by half width horizontally
  const screenX = (tileX - tileY) * (TILE_WIDTH / 2) * zoom + originX;
  const screenY = (tileX + tileY) * (TILE_HEIGHT / 2) * zoom + originY;
  
  return { x: screenX, y: screenY };
}

/**
 * Convert screen pixel coordinates to tile coordinates
 * @param screenX - Screen X pixel
 * @param screenY - Screen Y pixel
 * @param originX - Screen origin X (camera offset)
 * @param originY - Screen origin Y (camera offset)
 * @param zoom - Zoom level (1.0 = normal)
 * @returns Tile coordinates (may be fractional)
 */
export function screenToTile(
  screenX: number,
  screenY: number,
  originX: number = 0,
  originY: number = 0,
  zoom: number = 1.0
): TileCoord {
  // Inverse isometric projection
  const adjustedX = (screenX - originX) / zoom;
  const adjustedY = (screenY - originY) / zoom;
  
  const tileX = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
  const tileY = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;
  
  return { x: tileX, y: tileY };
}

/**
 * Get the tile coordinates from screen click (rounded to nearest tile)
 */
export function screenToTileRounded(
  screenX: number,
  screenY: number,
  originX: number = 0,
  originY: number = 0,
  zoom: number = 1.0
): TileCoord {
  const tile = screenToTile(screenX, screenY, originX, originY, zoom);
  return {
    x: Math.round(tile.x),
    y: Math.round(tile.y),
  };
}

/**
 * Get bounding box for a tile in screen coordinates
 */
export function getTileBounds(
  tileX: number,
  tileY: number,
  originX: number = 0,
  originY: number = 0,
  zoom: number = 1.0
): { x: number; y: number; width: number; height: number } {
  const center = tileToScreen(tileX, tileY, originX, originY, zoom);
  return {
    x: center.x - (TILE_WIDTH * zoom) / 2,
    y: center.y - (TILE_HEIGHT * zoom) / 2,
    width: TILE_WIDTH * zoom,
    height: TILE_HEIGHT * zoom,
  };
}

/**
 * Check if a point is inside a diamond tile
 */
export function isPointInTile(
  pointX: number,
  pointY: number,
  tileX: number,
  tileY: number,
  originX: number = 0,
  originY: number = 0,
  zoom: number = 1.0
): boolean {
  const center = tileToScreen(tileX, tileY, originX, originY, zoom);
  const dx = Math.abs(pointX - center.x);
  const dy = Math.abs(pointY - center.y);
  
  // Diamond shape: |dx|/w + |dy|/h <= 1
  const w = (TILE_WIDTH * zoom) / 2;
  const h = (TILE_HEIGHT * zoom) / 2;
  
  return dx / w + dy / h <= 1;
}
