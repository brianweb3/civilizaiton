import { create } from 'zustand';
import type {
  SimulationState,
  Population,
  Economy,
  Agent,
  Building,
  Law,
  GovernanceLog,
  ResearchTree,
  EthicalFramework,
} from '@/types/simulation';
import type { TickData } from '@/lib/simulation-engine';
import type { MetricsState, Top10Metrics, Alert, CompositeScores } from '@/types/metrics';
import type { District, Tile, HistoricalSnapshot } from '@/types/tilemap';

interface NocracyStore {
  // Simulation State
  simulation: SimulationState;
  population: Population;
  economy: Economy;
  agents: Agent[];
  buildings: Building[];
  laws: Law[];
  governanceLogs: GovernanceLog[];
  research: ResearchTree;
  ethics: EthicalFramework;
  
  // Map State
  districts: District[];
  tiles: Tile[][];
  
  // Historical data for replay
  historicalSnapshots: HistoricalSnapshot[];
  
  // Metrics State
  metrics: MetricsState | null;
  top10: Top10Metrics | null;
  alerts: Alert[];
  scores: CompositeScores | null;
  
  // UI State
  selectedAgentId: string | null;
  selectedBuildingId: string | null;
  manifestAccepted: boolean;
  
  // Actions
  setSimulation: (state: Partial<SimulationState>) => void;
  setPopulation: (pop: Partial<Population>) => void;
  setEconomy: (eco: Partial<Economy>) => void;
  setAgents: (agents: Agent[]) => void;
  setBuildings: (buildings: Building[]) => void;
  addLaw: (law: Law) => void;
  addGovernanceLog: (log: GovernanceLog) => void;
  updateResearch: (research: Partial<ResearchTree>) => void;
  updateEthics: (ethics: Partial<EthicalFramework>) => void;
  selectAgent: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  acceptManifest: () => void;
  setMetrics: (metrics: MetricsState) => void;
  setTop10: (top10: Top10Metrics) => void;
  setAlerts: (alerts: Alert[]) => void;
  setDistricts: (districts: District[]) => void;
  addHistoricalSnapshot: (snapshot: HistoricalSnapshot) => void;
  
  // Bulk updates from simulation
  applyTick: (data: TickData) => void;
}

// Initial state
const initialSimulation: SimulationState = {
  tick: 0,
  timestamp: Date.now(),
  tickRate: 1,
  stabilityIndex: 0.95,
  governanceMode: 'STANDARD',
  ethicalIntegrity: 1.0,
  isRunning: false,
};

const initialPopulation: Population = {
  total: 0,
  birthRate: 0.01,
  deathRate: 0.005,
  mutationRate: 0.05,
  history: [],
};

const initialEconomy: Economy = {
  currencySupply: 100000,
  taxationLevel: 0.15,
  productionOutput: 1000,
  resourceDistribution: {
    food: 10000,
    energy: 8000,
    materials: 6000,
    technology: 2000,
  },
  inequalityIndex: 0.25,
  marketEvents: [],
  history: [],
};

const initialResearch: ResearchTree = {
  nodes: [],
  connections: [],
};

const initialEthics: EthicalFramework = {
  name: 'LOVE EQUATION',
  principles: [
    'Maximize collective wellbeing',
    'Preserve individual autonomy within system constraints',
    'Prevent irreversible harm',
    'Maintain transparency in all decisions',
    'Ensure fair resource distribution',
  ],
  interventionCount: 0,
  blockedActions: [],
  selfCorrections: [],
};

// Generate initial districts
const initialDistricts: District[] = [
  {
    id: 'district-central',
    name: 'Central District',
    type: 'GOVERNMENT',
    centerX: 500,
    centerY: 500,
    radius: 120,
    population: 0,
    wealth: 5000,
    productivity: 0.8,
    happiness: 0.7,
    dissent: 0.1,
    color: '#ef4444',
  },
  {
    id: 'district-north',
    name: 'Northern Industrial',
    type: 'INDUSTRIAL',
    centerX: 500,
    centerY: 200,
    radius: 150,
    population: 0,
    wealth: 3000,
    productivity: 0.9,
    happiness: 0.5,
    dissent: 0.2,
    color: '#f97316',
  },
  {
    id: 'district-east',
    name: 'Eastern Research',
    type: 'RESEARCH',
    centerX: 800,
    centerY: 500,
    radius: 130,
    population: 0,
    wealth: 6000,
    productivity: 0.7,
    happiness: 0.8,
    dissent: 0.05,
    color: '#8b5cf6',
  },
  {
    id: 'district-south',
    name: 'Southern Residential',
    type: 'RESIDENTIAL',
    centerX: 500,
    centerY: 800,
    radius: 180,
    population: 0,
    wealth: 2500,
    productivity: 0.5,
    happiness: 0.75,
    dissent: 0.15,
    color: '#4ade80',
  },
  {
    id: 'district-west',
    name: 'Western Commercial',
    type: 'COMMERCIAL',
    centerX: 200,
    centerY: 500,
    radius: 140,
    population: 0,
    wealth: 4500,
    productivity: 0.85,
    happiness: 0.65,
    dissent: 0.12,
    color: '#fbbf24',
  },
  {
    id: 'district-northwest',
    name: 'Northwest Agricultural',
    type: 'AGRICULTURAL',
    centerX: 200,
    centerY: 200,
    radius: 120,
    population: 0,
    wealth: 1500,
    productivity: 0.6,
    happiness: 0.8,
    dissent: 0.08,
    color: '#84cc16',
  },
];

export const useNocracyStore = create<NocracyStore>((set) => ({
  // Initial state
  simulation: initialSimulation,
  population: initialPopulation,
  economy: initialEconomy,
  agents: [],
  buildings: [],
  laws: [],
  governanceLogs: [],
  research: initialResearch,
  ethics: initialEthics,
  
  // Map State
  districts: initialDistricts,
  tiles: [], // Will be generated on demand
  
  // Historical data
  historicalSnapshots: [],
  
  // Metrics State
  metrics: null,
  top10: null,
  alerts: [],
  scores: null,
  
  // UI State
  selectedAgentId: null,
  selectedBuildingId: null,
  manifestAccepted: false,
  
  // Actions
  setSimulation: (state) =>
    set((s) => ({ simulation: { ...s.simulation, ...state } })),
    
  setPopulation: (pop) =>
    set((s) => ({ population: { ...s.population, ...pop } })),
    
  setEconomy: (eco) =>
    set((s) => ({ economy: { ...s.economy, ...eco } })),
    
  setAgents: (agents) =>
    set(() => ({ agents })),
    
  setBuildings: (buildings) =>
    set(() => ({ buildings })),
    
  addLaw: (law) =>
    set((s) => ({ laws: [...s.laws, law] })),
    
  addGovernanceLog: (log) =>
    set((s) => ({
      governanceLogs: [log, ...s.governanceLogs].slice(0, 500),
    })),
    
  updateResearch: (research) =>
    set((s) => ({ research: { ...s.research, ...research } })),
    
  updateEthics: (ethics) =>
    set((s) => ({ ethics: { ...s.ethics, ...ethics } })),
    
  selectAgent: (id) => set(() => ({ selectedAgentId: id })),
  selectBuilding: (id) => set(() => ({ selectedBuildingId: id })),
  acceptManifest: () => set(() => ({ manifestAccepted: true })),
  setMetrics: (metrics) => set(() => ({ metrics, scores: metrics.scores })),
  setTop10: (top10) => set(() => ({ top10 })),
  setAlerts: (alerts) => set(() => ({ alerts })),
  setDistricts: (districts) => set(() => ({ districts })),
  addHistoricalSnapshot: (snapshot) =>
    set((s) => ({
      historicalSnapshots: [...s.historicalSnapshots, snapshot].slice(-1000), // Keep last 1000 snapshots
    })),
  
  // Bulk update from simulation tick
  applyTick: (data) =>
    set((s) => {
      const newState: Partial<NocracyStore> = {};
      
      if (data.simulation) {
        newState.simulation = { ...s.simulation, ...data.simulation };
      }
      
      if (data.population) {
        newState.population = { ...s.population, ...data.population };
      }
      
      if (data.economy) {
        newState.economy = { ...s.economy, ...data.economy };
      }
      
      if (data.agents) {
        newState.agents = data.agents;
        
        // Update district populations
        const updatedDistricts = s.districts.map((district) => {
          const districtAgents = data.agents!.filter((agent) => {
            if (agent.status !== 'ACTIVE') return false;
            const dx = agent.position.x - district.centerX;
            const dy = agent.position.y - district.centerY;
            return Math.sqrt(dx * dx + dy * dy) < district.radius;
          });
          
          const avgWealth = districtAgents.length > 0
            ? districtAgents.reduce((sum, a) => sum + a.money, 0) / districtAgents.length
            : district.wealth;
          
          const avgHappiness = districtAgents.length > 0
            ? districtAgents.reduce((sum, a) => sum + (a.traits?.compliance || 0.5), 0) / districtAgents.length
            : district.happiness;
          
          return {
            ...district,
            population: districtAgents.length,
            wealth: avgWealth,
            happiness: avgHappiness,
          };
        });
        newState.districts = updatedDistricts;
      }
      
      if (data.buildings) {
        newState.buildings = data.buildings;
      }
      
      if (data.newLaws) {
        newState.laws = data.newLaws;
      }
      
      if (data.newLogs) {
        newState.governanceLogs = [...data.newLogs, ...s.governanceLogs].slice(0, 500);
      }
      
      if (data.research) {
        newState.research = { ...s.research, ...data.research };
      }
      
      if (data.ethics) {
        newState.ethics = { ...s.ethics, ...data.ethics };
      }
      
      // Metrics updates
      if (data.metrics) {
        newState.metrics = data.metrics;
        newState.scores = data.metrics.scores;
      }
      
      if (data.top10) {
        newState.top10 = data.top10;
      }
      
      if (data.alerts) {
        newState.alerts = data.alerts;
      }
      
      // Create historical snapshot every 50 ticks
      const currentTick = data.simulation?.tick || s.simulation.tick;
      if (currentTick % 50 === 0 && data.agents) {
        const snapshot: HistoricalSnapshot = {
          tick: currentTick,
          timestamp: Date.now(),
          population: data.agents.filter((a) => a.status === 'ACTIVE').length,
          economy: {
            gdp: data.economy?.productionOutput || s.economy.productionOutput,
            treasury: data.economy?.currencySupply || s.economy.currencySupply,
            inflation: (data.economy?.inequalityIndex || s.economy.inequalityIndex) * 0.1,
          },
          stability: data.simulation?.stabilityIndex || s.simulation.stabilityIndex,
          tiles: [], // Not storing full tile data for performance
          agents: data.agents
            .filter((a) => a.status === 'ACTIVE')
            .slice(0, 100)
            .map((a) => ({
              id: a.id,
              x: a.position.x,
              y: a.position.y,
              role: a.role,
              money: a.money,
            })),
          buildings: (data.buildings || s.buildings).slice(0, 50).map((b) => ({
            id: b.id,
            x: b.position.x,
            y: b.position.y,
            type: b.type,
          })),
          metrics: {},
        };
        newState.historicalSnapshots = [...s.historicalSnapshots, snapshot].slice(-1000);
      }
      
      return newState as NocracyStore;
    }),
}));
