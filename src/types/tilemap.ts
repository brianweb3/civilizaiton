// NOCRACY TILE MAP TYPES
// Types for the pixel tile-map renderer

export const GRID_SIZE = 128; // 128x128 tile grid
export const TILE_SIZE = 4; // Each tile is 4x4 pixels at base zoom

// Terrain types
export type TerrainType = 
  | 'PLAINS'
  | 'WATER'
  | 'HILLS'
  | 'FOREST'
  | 'DESERT'
  | 'URBAN';

// District types (larger zones)
export type DistrictType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'RESEARCH'
  | 'GOVERNMENT'
  | 'AGRICULTURAL'
  | 'MIXED';

export interface District {
  id: string;
  name: string;
  type: DistrictType;
  centerX: number;
  centerY: number;
  radius: number;
  population: number;
  wealth: number;
  productivity: number;
  happiness: number;
  dissent: number;
  color: string;
}

export interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  districtId: string | null;
  buildingId: string | null;
  ownerId: string | null;
  // Heatmap values (0-1)
  population: number;
  wealth: number;
  conflict: number;
  productivity: number;
  happiness: number;
  research: number;
}

export type HeatmapType = 
  | 'POP' 
  | 'WEALTH' 
  | 'CONFLICT' 
  | 'PROD' 
  | 'HAPPINESS' 
  | 'RESEARCH'
  | 'NONE';

export interface TileMapState {
  tiles: Tile[][];
  districts: District[];
}

// Terrain colors (bright Civilization-inspired palette)
export const TERRAIN_COLORS: Record<TerrainType, number> = {
  PLAINS: 0x6fbf73,      // Light green (grass)
  WATER: 0x2A74B8,        // Blue (water)
  HILLS: 0x8A8F98,        // Gray (mountain)
  FOREST: 0x2F6B3A,       // Dark green (forest)
  DESERT: 0xD9B56C,       // Sand (desert)
  URBAN: 0x9CA3AF,        // Light gray (urban)
};

// District colors with low alpha
export const DISTRICT_COLORS: Record<DistrictType, number> = {
  RESIDENTIAL: 0x4ade80,   // Green
  COMMERCIAL: 0xfbbf24,    // Amber
  INDUSTRIAL: 0xf97316,    // Orange
  RESEARCH: 0x8b5cf6,      // Purple
  GOVERNMENT: 0xef4444,    // Red
  AGRICULTURAL: 0x84cc16,  // Lime
  MIXED: 0x6b7280,         // Gray
};

// Heatmap gradients (cold to hot) - bright theme
export const HEATMAP_COLORS: Record<HeatmapType, { cold: number; hot: number }> = {
  POP: { cold: 0xF4F1E8, hot: 0x2E8B57 },      // Parchment to emerald
  WEALTH: { cold: 0xF4F1E8, hot: 0xD9B56C },  // Parchment to gold
  CONFLICT: { cold: 0xF4F1E8, hot: 0xB42318 }, // Parchment to red
  PROD: { cold: 0xF4F1E8, hot: 0x2A74B8 },     // Parchment to blue
  HAPPINESS: { cold: 0xB42318, hot: 0x2E8B57 }, // Red to green
  RESEARCH: { cold: 0xF4F1E8, hot: 0x7C3AED }, // Parchment to violet
  NONE: { cold: 0xF4F1E8, hot: 0xF4F1E8 },
};

// Inspector types
export interface InspectorData {
  type: 'tile' | 'building' | 'citizen' | 'district';
  data: TileInspector | BuildingInspector | CitizenInspector | DistrictInspector | null;
}

export interface TileInspector {
  x: number;
  y: number;
  terrain: TerrainType;
  district: District | null;
  heatmapValues: Record<HeatmapType, number>;
}

export interface BuildingInspector {
  id: string;
  type: string;
  name: string;
  level: number;
  workers: number;
  productivity: number;
  impact: {
    population: number;
    economy: number;
    research: number;
  };
}

export interface CitizenInspector {
  id: string;
  name: string;
  role: string;
  age: number;
  money: number;
  productivity: number;
  happiness: number;
  impact: {
    taxPaid: number;
    lawsAffectedBy: number;
    buildingsBuilt: number;
  };
}

export interface DistrictInspector {
  id: string;
  name: string;
  type: DistrictType;
  stats: {
    population: number;
    buildings: number;
    avgWealth: number;
    avgHappiness: number;
    productivity: number;
    dissent: number;
  };
}

// Flow types
export interface ResourceFlow {
  type: 'food' | 'energy' | 'materials';
  produced: number;
  consumed: number;
  stored: number;
  delta: number;
}

export interface MoneyFlow {
  taxes: number;
  treasury: number;
  spending: number;
  toHouseholds: number;
}

export interface PopulationFlow {
  births: number;
  deaths: number;
  migration: number;
  netChange: number;
}

// Metric Driver (explainers)
export interface MetricDriver {
  metricId: string;
  metricName: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  causes: DriverCause[];
}

export interface DriverCause {
  type: 'event' | 'law' | 'economic' | 'population' | 'agent';
  description: string;
  contribution: number; // percentage
  entityId?: string;
}

// Timeline/Snapshot for replay
export interface HistoricalSnapshot {
  tick: number;
  timestamp: number;
  population: number;
  economy: {
    gdp: number;
    treasury: number;
    inflation: number;
  };
  stability: number;
  tiles: TileHeatmapSnapshot[];
  agents: AgentSnapshot[];
  buildings: BuildingSnapshot[];
  metrics: Record<string, number>;
}

export interface TileHeatmapSnapshot {
  x: number;
  y: number;
  pop: number;
  wealth: number;
  conflict: number;
}

export interface AgentSnapshot {
  id: string;
  x: number;
  y: number;
  role: string;
  money: number;
}

export interface BuildingSnapshot {
  id: string;
  x: number;
  y: number;
  type: string;
}

// Citizen distribution view types
export interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WealthBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface AgeBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface TopContributor {
  id: string;
  name: string;
  role: string;
  contribution: number;
  type: 'tax' | 'research' | 'productivity';
}
