/**
 * PixelHole-style 16x16 top-down tileset mapping
 * Coordinates are in pixels (x, y) for 16x16 tiles
 */

export const TILE_SIZE = 16;

/**
 * Tile mapping: key -> [x, y] coordinates in the spritesheet
 * Based on the tileset description:
 * - Grass tiles at top-left
 * - Water tiles below grass
 * - Coast transitions
 * - Sand/brown earth
 * - Trees, rocks, buildings, docks
 */
export const TILEMAP: Record<string, [number, number]> = {
  // Terrain - Grass variants
  grass: [0, 0],
  grass_1: [16, 0],
  grass_2: [32, 0],
  grass_3: [48, 0],
  grass_4: [64, 0],
  
  // Terrain - Water variants
  water: [32, 16],
  water_1: [48, 16],
  water_2: [64, 16],
  water_3: [0, 32],
  water_4: [16, 32],
  
  // Coast transitions (land to water)
  coast_grass_water_bottom: [0, 16], // Grass-to-Water (bottom edge)
  coast_grass_water_top: [16, 16], // Grass-to-Water (top edge)
  coast_water_grass_bottom: [32, 32], // Water-to-Grass (bottom edge)
  coast_water_grass_top: [48, 32], // Water-to-Grass (top edge)
  coast_sand_water_bottom: [32, 48], // Sand-to-Water (bottom edge)
  coast_sand_water_top: [48, 48], // Sand-to-Water (top edge)
  coast_water_sand_bottom: [48, 64], // Water-to-Sand (bottom edge)
  coast_water_sand_top: [64, 64], // Water-to-Sand (top edge)
  
  // Terrain - Sand/Brown Earth
  sand: [0, 48],
  sand_1: [16, 48],
  sand_2: [0, 64],
  sand_3: [16, 64],
  
  // Objects - Trees
  tree_forest_1: [80, 0],
  tree_forest_2: [96, 0],
  tree_forest_3: [80, 16],
  
  // Objects - Rocks
  rock_small_1: [96, 16],
  rock_small_2: [112, 16],
  rock_boulder: [80, 32],
  
  // Objects - Buildings/Houses
  house_shack_1: [112, 0],
  house_shack_2: [128, 0],
  house_blue_roof: [144, 0],
  house_red_roof: [160, 0],
  // TODO: house_large at [176, 64] - may need special handling if >16px
  
  // Objects - Docks/Water structures
  dock_pier: [144, 16],
  boat: [80, 64],
  
  // Objects - Other structures
  well: [128, 16],
  door_gate: [128, 32],
  fence: [144, 48],
  bridge: [144, 64],
  
  // Paths/Roads
  path_wood_1: [176, 0],
  path_wood_2: [176, 16],
  path_dirt_1: [144, 32],
  path_dirt_2: [128, 48],
  
  // Resources/Items
  resource_gold: [112, 32],
  crate: [96, 64],
  coins: [112, 64],
  
  // Placeholders for unknown tiles (will be replaced via debug overlay)
  // TODO: Add more coast corner tiles
  // TODO: Add more terrain variants
};

/**
 * Get tile coordinates by key, with fallback to grass
 */
export function getTileCoords(key: string): [number, number] {
  return TILEMAP[key] || TILEMAP.grass;
}

/**
 * Get all available tile keys
 */
export function getTileKeys(): string[] {
  return Object.keys(TILEMAP);
}
