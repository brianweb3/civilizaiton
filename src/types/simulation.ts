// CLAWTOWN SIMULATION TYPES
// All data structures for the autonomous territory

export interface SimulationState {
  tick: number;
  timestamp: number;
  tickRate: number;
  stabilityIndex: number;
  governanceMode: GovernanceMode;
  ethicalIntegrity: number;
  isRunning: boolean;
}

export type GovernanceMode = 
  | 'STANDARD'
  | 'EMERGENCY'
  | 'TRANSITION'
  | 'ETHICAL_OVERRIDE';

export interface Population {
  total: number;
  birthRate: number;
  deathRate: number;
  mutationRate: number;
  history: PopulationSnapshot[];
}

export interface PopulationSnapshot {
  tick: number;
  total: number;
  births: number;
  deaths: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  age: number;
  money: number;
  position: { x: number; y: number };
  generation: number;
  parentIds: string[];
  childIds: string[];
  traits: AgentTraits;
  status: AgentStatus;
  createdAt: number;
  diedAt?: number;
  activityLog: AgentActivity[];
  lawImpact: LawImpact[];
  workplace?: string; // Building ID where agent works
  home?: string; // Building ID where agent lives
}

export type AgentRole = 
  | 'WORKER'
  | 'RESEARCHER'
  | 'GOVERNOR'
  | 'ENFORCER'
  | 'ECONOMIST'
  | 'ARCHITECT'
  | 'MEDIC'
  | 'MERCHANT';

export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';

export interface AgentTraits {
  productivity: number;
  creativity: number;
  compliance: number;
  longevity: number;
  mutability: number;
}

export interface AgentActivity {
  tick: number;
  action: string;
  target?: string;
  result: string;
}

export interface LawImpact {
  lawId: string;
  impactType: 'AFFECTED' | 'BENEFITED' | 'PENALIZED';
  tick: number;
}

// Buildings
export interface Building {
  id: string;
  type: BuildingType;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  builtAt: number;
  builtBy: string; // Agent ID
  workers: string[]; // Agent IDs
  residents: string[]; // Agent IDs (for residential)
  level: number;
  productivity: number;
}

export type BuildingType = 
  | 'HOUSE'
  | 'APARTMENT'
  | 'FACTORY'
  | 'OFFICE'
  | 'RESEARCH_LAB'
  | 'HOSPITAL'
  | 'GOVERNMENT'
  | 'SHOP'
  | 'WAREHOUSE'
  | 'FARM';

export interface Law {
  id: string;
  title: string;
  description: string;
  category: LawCategory;
  status: LawStatus;
  generatedBy: string;
  createdAt: number;
  modifiedAt?: number;
  repealedAt?: number;
  purpose: string;
  affectedPopulationPercent: number;
  impactMetrics: ImpactMetrics;
  isConstitutional: boolean;
  reasoning: string;
  history: LawHistoryEntry[];
}

export type LawCategory = 
  | 'ECONOMIC'
  | 'SOCIAL'
  | 'RESEARCH'
  | 'INFRASTRUCTURE'
  | 'ETHICAL'
  | 'EMERGENCY';

export type LawStatus = 'ACTIVE' | 'DEPRECATED' | 'REPEALED' | 'PENDING';

export interface ImpactMetrics {
  economicEffect: number;
  socialStability: number;
  researchBoost: number;
  populationGrowth: number;
}

export interface LawHistoryEntry {
  tick: number;
  action: 'CREATED' | 'MODIFIED' | 'REPEALED' | 'DEPRECATED';
  previousState?: Partial<Law>;
  reason: string;
}

export interface Economy {
  currencySupply: number;
  taxationLevel: number;
  productionOutput: number;
  resourceDistribution: ResourceDistribution;
  inequalityIndex: number;
  marketEvents: MarketEvent[];
  history: EconomySnapshot[];
}

export interface ResourceDistribution {
  food: number;
  energy: number;
  materials: number;
  technology: number;
}

export interface MarketEvent {
  id: string;
  tick: number;
  type: MarketEventType;
  description: string;
  impact: number;
}

export type MarketEventType = 
  | 'BOOM'
  | 'RECESSION'
  | 'INNOVATION'
  | 'SHORTAGE'
  | 'INTERVENTION';

export interface EconomySnapshot {
  tick: number;
  currencySupply: number;
  productionOutput: number;
  inequalityIndex: number;
}

export interface GovernanceLog {
  id: string;
  tick: number;
  timestamp: number;
  module: string;
  action: GovernanceAction;
  summary: string;
  reasoning: string;
  affectedEntities: string[];
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export type GovernanceAction = 
  | 'LAW_CREATED'
  | 'LAW_MODIFIED'
  | 'LAW_REPEALED'
  | 'ECONOMIC_INTERVENTION'
  | 'EMERGENCY_ACTION'
  | 'RESEARCH_COMPLETED'
  | 'ETHICAL_OVERRIDE'
  | 'RESOURCE_ALLOCATION'
  | 'AGENT_CREATED'
  | 'AGENT_TERMINATED'
  | 'BUILDING_CONSTRUCTED';

export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  buildingId?: string;
  ownerId?: string;
}

export type TileType = 
  | 'EMPTY'
  | 'ROAD'
  | 'BUILDING'
  | 'PARK'
  | 'WATER';

export interface Zone {
  id: string;
  name: string;
  type: TileType;
  tiles: { x: number; y: number }[];
  population: number;
  productivity: number;
}

export interface Research {
  id: string;
  name: string;
  description: string;
  status: ResearchStatus;
  originAI: string;
  preconditions: string[];
  economyEffect: number;
  populationEffect: number;
  longTermProjection: string;
  discoveredAt?: number;
  progress: number;
}

export type ResearchStatus = 
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';

export interface ResearchTree {
  nodes: Research[];
  connections: { from: string; to: string }[];
}

export interface EthicalFramework {
  name: string;
  principles: string[];
  interventionCount: number;
  blockedActions: BlockedAction[];
  selfCorrections: SelfCorrection[];
}

export interface BlockedAction {
  id: string;
  tick: number;
  attemptedAction: string;
  reason: string;
  violatedPrinciple: string;
}

export interface SelfCorrection {
  id: string;
  tick: number;
  originalDecision: string;
  correctedDecision: string;
  reason: string;
}

export interface SimulationSnapshot {
  id: string;
  tick: number;
  timestamp: number;
  state: SimulationState;
  population: Population;
  economy: Economy;
  agentCount: number;
  lawCount: number;
}
