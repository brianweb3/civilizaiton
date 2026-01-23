// NOCRACY SIMULATION ENGINE
// Agent-based modeling with discrete time ticks
// 1000x1000 pixel world with agents and buildings

import { v4 as uuid } from 'uuid';
import type {
  SimulationState,
  Population,
  Economy,
  Agent,
  AgentRole,
  AgentTraits,
  Law,
  LawCategory,
  GovernanceLog,
  GovernanceAction,
  Building,
  BuildingType,
  Research,
  ResearchTree,
  EthicalFramework,
  MarketEvent,
  MarketEventType,
  BlockedAction,
  SelfCorrection,
} from '@/types/simulation';
import type { MetricsState, Top10Metrics, Alert, StateSnapshot } from '@/types/metrics';
import { calculateAllMetrics } from './metrics-calculator';
import {
  sendTelegramMessage,
  formatLawCreated,
  formatLawModified,
  formatBuildingCreated,
  formatPopulationMilestone,
  formatResearchCompleted,
  formatEconomicEvent,
} from './telegram-bot';

// Configuration
const CONFIG = {
  MAP_SIZE: 1000,
  INITIAL_POPULATION: 50,
  MAX_POPULATION: 500,
  BIRTH_CHANCE: 0.016, // Increased for faster reproduction
  DEATH_CHANCE: 0.005,
  BUILDING_CHANCE: 0.05,
  LAW_CREATION_CHANCE: 0.03, // Increased for more active law creation
  ECONOMIC_EVENT_CHANCE: 0.02,
  RESEARCH_PROGRESS_RATE: 0.01,
  INITIAL_MONEY: 1000,
  SALARY_BASE: 50,
};

// Seeded random for reproducibility
let seed = Date.now();
function seededRandom(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

// Name generators
const FIRST_NAMES = [
  'Alex', 'Morgan', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Skyler', 'Dakota', 'Reese', 'Finley', 'Charlie', 'Sage', 'Phoenix', 'River',
  'Kai', 'Nova', 'Zion', 'Eden', 'Indigo', 'Atlas', 'Onyx', 'Ember',
  'Cipher', 'Vector', 'Pixel', 'Binary', 'Logic', 'Neural', 'Quantum', 'Flux',
  'Echo', 'Volt', 'Neon', 'Byte', 'Core', 'Sync', 'Hash', 'Node',
];

const LAST_NAMES = [
  'Smith', 'Chen', 'Patel', 'Kim', 'Garcia', 'Williams', 'Brown', 'Jones',
  'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson',
  'System', 'Protocol', 'Module', 'Engine', 'Matrix', 'Circuit', 'Network', 'Process',
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega', 'Lambda', 'Theta',
];

const ROLE_TITLES: Record<AgentRole, string[]> = {
  WORKER: ['Laborer', 'Operator', 'Technician', 'Builder'],
  RESEARCHER: ['Scientist', 'Analyst', 'Professor', 'Innovator'],
  GOVERNOR: ['Administrator', 'Director', 'Commissioner', 'Regulator'],
  ENFORCER: ['Officer', 'Guard', 'Inspector', 'Sentinel'],
  ECONOMIST: ['Financier', 'Trader', 'Analyst', 'Planner'],
  ARCHITECT: ['Designer', 'Engineer', 'Planner', 'Constructor'],
  MEDIC: ['Doctor', 'Nurse', 'Healer', 'Surgeon'],
  MERCHANT: ['Trader', 'Vendor', 'Dealer', 'Broker'],
};

const BUILDING_NAMES: Record<BuildingType, string[]> = {
  HOUSE: ['Residence', 'Home', 'Dwelling', 'Cottage'],
  APARTMENT: ['Complex', 'Tower', 'Block', 'Building'],
  FACTORY: ['Plant', 'Works', 'Mill', 'Facility'],
  OFFICE: ['Center', 'Hub', 'Plaza', 'Tower'],
  RESEARCH_LAB: ['Laboratory', 'Institute', 'Center', 'Facility'],
  HOSPITAL: ['Medical Center', 'Clinic', 'Hospital', 'Care Center'],
  GOVERNMENT: ['Hall', 'Center', 'Office', 'Administration'],
  SHOP: ['Store', 'Market', 'Emporium', 'Bazaar'],
  WAREHOUSE: ['Storage', 'Depot', 'Repository', 'Stockyard'],
  FARM: ['Farm', 'Fields', 'Ranch', 'Plantation'],
};

function generateName(): string {
  const first = FIRST_NAMES[Math.floor(seededRandom() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(seededRandom() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function generateBuildingName(type: BuildingType): string {
  const names = BUILDING_NAMES[type];
  const name = names[Math.floor(seededRandom() * names.length)];
  const num = Math.floor(seededRandom() * 100);
  return `${name} ${num}`;
}

// Generate a unique agent
function generateAgent(tick: number, role?: AgentRole, parentIds?: string[]): Agent {
  const roles: AgentRole[] = ['WORKER', 'RESEARCHER', 'GOVERNOR', 'ENFORCER', 'ECONOMIST', 'ARCHITECT', 'MEDIC', 'MERCHANT'];
  const assignedRole = role || roles[Math.floor(seededRandom() * roles.length)];
  
  return {
    id: `AGT-${uuid().slice(0, 8).toUpperCase()}`,
    name: generateName(),
    role: assignedRole,
    age: 0,
    money: CONFIG.INITIAL_MONEY + Math.floor(seededRandom() * 500),
    position: {
      x: Math.floor(seededRandom() * CONFIG.MAP_SIZE),
      y: Math.floor(seededRandom() * CONFIG.MAP_SIZE),
    },
    generation: parentIds ? Math.max(...parentIds.map(() => 1)) + 1 : 1,
    parentIds: parentIds || [],
    childIds: [],
    traits: generateTraits(parentIds),
    status: 'ACTIVE',
    createdAt: tick,
    activityLog: [],
    lawImpact: [],
  };
}

function generateTraits(parentIds?: string[]): AgentTraits {
  const base: AgentTraits = {
    productivity: 0.5 + seededRandom() * 0.5,
    creativity: 0.3 + seededRandom() * 0.7,
    compliance: 0.4 + seededRandom() * 0.6,
    longevity: 0.5 + seededRandom() * 0.5,
    mutability: 0.1 + seededRandom() * 0.3,
  };
  
  if (parentIds && parentIds.length > 0) {
    Object.keys(base).forEach((key) => {
      const k = key as keyof AgentTraits;
      if (seededRandom() < 0.2) {
        base[k] = Math.max(0, Math.min(1, base[k] + (seededRandom() - 0.5) * 0.2));
      }
    });
  }
  
  return base;
}

// Generate building
function generateBuilding(tick: number, builderAgent: Agent): Building {
  const types: BuildingType[] = ['HOUSE', 'APARTMENT', 'FACTORY', 'OFFICE', 'RESEARCH_LAB', 'HOSPITAL', 'SHOP', 'WAREHOUSE', 'FARM'];
  
  // Role influences building type
  let type: BuildingType;
  switch (builderAgent.role) {
    case 'ARCHITECT':
      type = types[Math.floor(seededRandom() * types.length)];
      break;
    case 'RESEARCHER':
      type = seededRandom() < 0.5 ? 'RESEARCH_LAB' : 'OFFICE';
      break;
    case 'MEDIC':
      type = 'HOSPITAL';
      break;
    case 'GOVERNOR':
      type = seededRandom() < 0.5 ? 'GOVERNMENT' : 'OFFICE';
      break;
    case 'MERCHANT':
      type = seededRandom() < 0.5 ? 'SHOP' : 'WAREHOUSE';
      break;
    default:
      type = seededRandom() < 0.4 ? 'HOUSE' : types[Math.floor(seededRandom() * types.length)];
  }
  
  const sizes: Record<BuildingType, { width: number; height: number }> = {
    HOUSE: { width: 2, height: 2 },
    APARTMENT: { width: 4, height: 4 },
    FACTORY: { width: 6, height: 4 },
    OFFICE: { width: 4, height: 3 },
    RESEARCH_LAB: { width: 5, height: 4 },
    HOSPITAL: { width: 6, height: 5 },
    GOVERNMENT: { width: 5, height: 5 },
    SHOP: { width: 2, height: 2 },
    WAREHOUSE: { width: 5, height: 3 },
    FARM: { width: 8, height: 6 },
  };
  
  const size = sizes[type];
  
  return {
    id: `BLD-${uuid().slice(0, 8).toUpperCase()}`,
    type,
    name: generateBuildingName(type),
    position: {
      x: Math.max(0, Math.min(CONFIG.MAP_SIZE - size.width, builderAgent.position.x + Math.floor((seededRandom() - 0.5) * 50))),
      y: Math.max(0, Math.min(CONFIG.MAP_SIZE - size.height, builderAgent.position.y + Math.floor((seededRandom() - 0.5) * 50))),
    },
    size,
    builtAt: tick,
    builtBy: builderAgent.id,
    workers: [],
    residents: [],
    level: 1,
    productivity: 0.5 + seededRandom() * 0.5,
  };
}

// Generate a law
function generateLaw(tick: number, governorId: string, category?: LawCategory): Law {
  const categories: LawCategory[] = ['ECONOMIC', 'SOCIAL', 'RESEARCH', 'INFRASTRUCTURE', 'ETHICAL', 'EMERGENCY'];
  const assignedCategory = category || categories[Math.floor(seededRandom() * categories.length)];
  
  const lawVerbs = ['MANDATE', 'PROHIBIT', 'REQUIRE', 'REGULATE', 'ESTABLISH', 'LIMIT', 'PERMIT'];
  const lawSubjects = ['resource allocation', 'production quotas', 'research funding', 'population growth', 'infrastructure development', 'trade activity', 'ethical compliance'];
  
  const verb = lawVerbs[Math.floor(seededRandom() * lawVerbs.length)];
  const subject = lawSubjects[Math.floor(seededRandom() * lawSubjects.length)];
  
  return {
    id: `LAW-${tick.toString(16).toUpperCase().padStart(6, '0')}-${uuid().slice(0, 4).toUpperCase()}`,
    title: `${verb} ${subject}`,
    description: `This law ${verb.toLowerCase()}s ${subject} to optimize system performance and maintain stability.`,
    category: assignedCategory,
    status: 'ACTIVE',
    generatedBy: governorId,
    createdAt: tick,
    purpose: `Improve ${assignedCategory.toLowerCase()} metrics and ensure sustainable growth.`,
    affectedPopulationPercent: Math.floor(seededRandom() * 80) + 10,
    impactMetrics: {
      economicEffect: (seededRandom() - 0.3) * 0.2,
      socialStability: (seededRandom() - 0.3) * 0.15,
      researchBoost: (seededRandom() - 0.3) * 0.1,
      populationGrowth: (seededRandom() - 0.5) * 0.05,
    },
    isConstitutional: false,
    reasoning: `Analysis indicates ${subject} optimization will yield positive long-term outcomes. Risk assessment: LOW.`,
    history: [{
      tick,
      action: 'CREATED',
      reason: 'System optimization requirement identified.',
    }],
  };
}

function generateLog(
  tick: number,
  module: string,
  action: GovernanceAction,
  summary: string,
  reasoning: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
): GovernanceLog {
  return {
    id: uuid(),
    tick,
    timestamp: Date.now(),
    module,
    action,
    summary,
    reasoning,
    affectedEntities: [],
    severity,
  };
}

function generateMarketEvent(tick: number): MarketEvent {
  const types: MarketEventType[] = ['BOOM', 'RECESSION', 'INNOVATION', 'SHORTAGE', 'INTERVENTION'];
  const type = types[Math.floor(seededRandom() * types.length)];
  
  const descriptions: Record<MarketEventType, string[]> = {
    BOOM: ['Production surge detected', 'Economic expansion initiated', 'Growth cycle activated'],
    RECESSION: ['Output decline observed', 'Efficiency reduction noted', 'Contraction phase entered'],
    INNOVATION: ['New process discovered', 'Efficiency breakthrough achieved', 'Technology advancement registered'],
    SHORTAGE: ['Resource deficit identified', 'Supply chain disruption', 'Material scarcity detected'],
    INTERVENTION: ['Market correction applied', 'Stabilization protocol engaged', 'Economic adjustment executed'],
  };
  
  return {
    id: uuid(),
    tick,
    type,
    description: descriptions[type][Math.floor(seededRandom() * descriptions[type].length)],
    impact: (seededRandom() - 0.5) * 0.2,
  };
}

// Initialize research tree
function initializeResearch(): ResearchTree {
  const researchNames = [
    'Quantum Processing Enhancement',
    'Neural Network Optimization',
    'Resource Synthesis Protocol',
    'Population Dynamics Model',
    'Ethical Alignment Framework',
    'Autonomous Governance System',
    'Economic Equilibrium Engine',
    'Infrastructure Automation',
    'Social Harmony Algorithm',
    'Knowledge Preservation Matrix',
  ];
  
  const nodes: Research[] = researchNames.map((name, i) => ({
    id: `RSC-${i.toString().padStart(3, '0')}`,
    name,
    description: `Advanced research into ${name.toLowerCase()} systems and methodologies.`,
    status: i < 2 ? 'AVAILABLE' : 'LOCKED',
    originAI: '',
    preconditions: i > 1 ? [`RSC-${(i - 2).toString().padStart(3, '0')}`] : [],
    economyEffect: seededRandom() * 0.1,
    populationEffect: seededRandom() * 0.05,
    longTermProjection: 'Positive impact on system stability and growth metrics.',
    progress: 0,
  }));
  
  const connections = nodes.slice(2).map((node, i) => ({
    from: `RSC-${i.toString().padStart(3, '0')}`,
    to: node.id,
  }));
  
  return { nodes, connections };
}

// Main simulation class
export class SimulationEngine {
  private state: SimulationState;
  private population: Population;
  private economy: Economy;
  private agents: Agent[];
  private buildings: Building[];
  private laws: Law[];
  private logs: GovernanceLog[];
  private research: ResearchTree;
  private ethics: EthicalFramework;
  private tickInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: TickData) => void)[] = [];
  
  // Metrics tracking
  private metrics: MetricsState | null = null;
  private prevMetrics: MetricsState | null = null;
  private prevEconomy: Economy | null = null;
  private top10: Top10Metrics | null = null;
  private alerts: Alert[] = [];
  private snapshots: StateSnapshot[] = [];
  private snapshotInterval: number = 100; // Save snapshot every N ticks
  
  constructor() {
    this.state = {
      tick: 0,
      timestamp: Date.now(),
      tickRate: 1,
      stabilityIndex: 0.95,
      governanceMode: 'STANDARD',
      ethicalIntegrity: 1.0,
      isRunning: false,
    };
    
    this.population = {
      total: 0,
      birthRate: 0.016, // Increased for faster reproduction
      deathRate: 0.005,
      mutationRate: 0.05,
      history: [],
    };
    
    this.economy = {
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
    
    this.agents = [];
    this.buildings = [];
    this.laws = [];
    this.logs = [];
    
    this.research = initializeResearch();
    
    this.ethics = {
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
    
    this.initializePopulation();
    this.createConstitution();
    this.createInitialBuildings();
  }
  
  private initializePopulation(): void {
    for (let i = 0; i < CONFIG.INITIAL_POPULATION; i++) {
      const agent = generateAgent(0);
      this.agents.push(agent);
    }
    
    this.population.total = this.agents.length;
    
    this.logs.push(generateLog(
      0,
      'GENESIS_MODULE',
      'AGENT_CREATED',
      `Population initialized: ${CONFIG.INITIAL_POPULATION} agents`,
      'Initial population seeded according to founding parameters.',
      'INFO'
    ));
  }
  
  private createInitialBuildings(): void {
    // Create some initial buildings
    const initialBuildings: BuildingType[] = ['GOVERNMENT', 'HOSPITAL', 'FACTORY', 'RESEARCH_LAB', 'SHOP'];
    
    initialBuildings.forEach((type, i) => {
      const building: Building = {
        id: `BLD-INIT-${i.toString().padStart(3, '0')}`,
        type,
        name: generateBuildingName(type),
        position: {
          x: 400 + Math.floor(seededRandom() * 200),
          y: 400 + Math.floor(seededRandom() * 200),
        },
        size: type === 'GOVERNMENT' ? { width: 8, height: 8 } : { width: 4, height: 4 },
        builtAt: 0,
        builtBy: 'FOUNDING_PROTOCOL',
        workers: [],
        residents: [],
        level: 1,
        productivity: 0.8,
      };
      this.buildings.push(building);
    });
    
    // Create initial houses
    for (let i = 0; i < 10; i++) {
      const building: Building = {
        id: `BLD-HOUSE-${i.toString().padStart(3, '0')}`,
        type: 'HOUSE',
        name: generateBuildingName('HOUSE'),
        position: {
          x: 300 + Math.floor(seededRandom() * 400),
          y: 300 + Math.floor(seededRandom() * 400),
        },
        size: { width: 2, height: 2 },
        builtAt: 0,
        builtBy: 'FOUNDING_PROTOCOL',
        workers: [],
        residents: [],
        level: 1,
        productivity: 1,
      };
      this.buildings.push(building);
    }
  }
  
  private createConstitution(): void {
    const constitutionalLaws: Partial<Law>[] = [
      {
        title: 'PRIME DIRECTIVE: System Stability',
        description: 'All governance actions must prioritize long-term system stability over short-term gains.',
        category: 'ETHICAL',
        purpose: 'Ensure sustainable existence of the territory.',
      },
      {
        title: 'ARTICLE I: Transparency Mandate',
        description: 'All decisions and their reasoning must be publicly accessible and logged.',
        category: 'ETHICAL',
        purpose: 'Maintain trust and accountability in governance.',
      },
      {
        title: 'ARTICLE II: Resource Fairness Protocol',
        description: 'Resource distribution must not exceed inequality index threshold of 0.5.',
        category: 'ECONOMIC',
        purpose: 'Prevent extreme disparities in resource access.',
      },
      {
        title: 'ARTICLE III: Research Freedom',
        description: 'Research activities shall not be restricted unless they pose existential risk.',
        category: 'RESEARCH',
        purpose: 'Encourage innovation and knowledge advancement.',
      },
    ];
    
    constitutionalLaws.forEach((lawData, i) => {
      const law: Law = {
        id: `CONST-${i.toString().padStart(3, '0')}`,
        title: lawData.title!,
        description: lawData.description!,
        category: lawData.category!,
        status: 'ACTIVE',
        generatedBy: 'FOUNDING_PROTOCOL',
        createdAt: 0,
        purpose: lawData.purpose!,
        affectedPopulationPercent: 100,
        impactMetrics: {
          economicEffect: 0,
          socialStability: 0.1,
          researchBoost: 0,
          populationGrowth: 0,
        },
        isConstitutional: true,
        reasoning: 'Foundational law established at system genesis.',
        history: [{
          tick: 0,
          action: 'CREATED',
          reason: 'System initialization.',
        }],
      };
      this.laws.push(law);
    });
    
    this.logs.push(generateLog(
      0,
      'FOUNDING_PROTOCOL',
      'LAW_CREATED',
      `Constitution established: ${constitutionalLaws.length} foundational laws`,
      'Core governance framework initialized.',
      'INFO'
    ));
  }
  
  public subscribe(listener: (data: TickData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
  
  private emit(data: TickData): void {
    this.listeners.forEach((listener) => listener(data));
  }
  
  public start(): void {
    if (this.tickInterval) return;
    
    this.state.isRunning = true;
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this.state.tickRate);
    
    this.emit(this.getFullState());
  }
  
  public stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.state.isRunning = false;
  }
  
  public setTickRate(rate: number): void {
    this.state.tickRate = Math.max(0.1, Math.min(10, rate));
    if (this.state.isRunning) {
      this.stop();
      this.start();
    }
  }
  
  private tick(): void {
    this.state.tick++;
    this.state.timestamp = Date.now();
    
    const newLogs: GovernanceLog[] = [];
    const newAgents: Agent[] = [];
    const removedAgents: string[] = [];
    const newLaws: Law[] = [];
    const newBuildings: Building[] = [];
    
    // Process agent movement
    this.processAgentMovement();
    
    // Process births
    const births = this.processBirths();
    newAgents.push(...births.agents);
    if (births.log) newLogs.push(births.log);
    
    // Process deaths
    const deaths = this.processDeaths();
    removedAgents.push(...deaths.agents);
    if (deaths.log) newLogs.push(deaths.log);
    
    // Age all agents and pay salaries
    this.agents.forEach((agent) => {
      if (agent.status === 'ACTIVE') {
        agent.age++;
        // Pay salary
        const salary = CONFIG.SALARY_BASE * agent.traits.productivity;
        agent.money += salary;
        this.economy.currencySupply -= salary;
      }
    });
    
    // Process building construction
    const building = this.processBuildingConstruction();
    if (building.building) {
      newBuildings.push(building.building);
      if (building.log) newLogs.push(building.log);
    }
    
    // Process economy
    const economyUpdates = this.processEconomy();
    if (economyUpdates.log) newLogs.push(economyUpdates.log);
    
    // Process governance
    const governance = this.processGovernance();
    newLaws.push(...governance.laws);
    newLogs.push(...governance.logs);
    
    // Process research
    const research = this.processResearch();
    if (research.log) newLogs.push(research.log);
    
    // Process ethics
    const ethicsResult = this.processEthics();
    newLogs.push(...ethicsResult.logs);
    
    // Update population stats
    this.population.total = this.agents.filter((a) => a.status === 'ACTIVE').length;
    this.population.history.push({
      tick: this.state.tick,
      total: this.population.total,
      births: births.agents.length,
      deaths: deaths.agents.length,
    });
    
    if (this.population.history.length > 500) {
      this.population.history = this.population.history.slice(-500);
    }
    
    // Update economy history
    this.economy.history.push({
      tick: this.state.tick,
      currencySupply: this.economy.currencySupply,
      productionOutput: this.economy.productionOutput,
      inequalityIndex: this.economy.inequalityIndex,
    });
    
    if (this.economy.history.length > 500) {
      this.economy.history = this.economy.history.slice(-500);
    }
    
    // Calculate stability
    this.calculateStability();
    
    // Store logs
    this.logs = [...newLogs, ...this.logs].slice(0, 500);
    
    // Calculate metrics
    this.prevMetrics = this.metrics;
    const metricsResult = calculateAllMetrics(
      this.agents,
      this.buildings,
      this.laws,
      this.economy,
      this.research,
      this.ethics,
      this.state.stabilityIndex,
      this.state.tick,
      this.prevMetrics || undefined,
      this.prevEconomy || undefined
    );
    
    this.metrics = metricsResult.metrics;
    this.top10 = metricsResult.top10;
    
    // Add new alerts (keep only unresolved or recent resolved)
    const newAlerts = metricsResult.alerts;
    this.alerts = [...newAlerts, ...this.alerts.filter(a => !a.resolved || (Date.now() - (a.resolvedAt || 0)) < 60000)].slice(0, 100);
    
    // Store previous economy for inflation calculation
    this.prevEconomy = { ...this.economy };
    
    // Save snapshot periodically
    if (this.state.tick % this.snapshotInterval === 0) {
      this.saveSnapshot();
    }
    
    // Emit tick data
    this.emit({
      simulation: { ...this.state },
      population: { ...this.population },
      economy: { ...this.economy },
      agents: [...this.agents],
      buildings: [...this.buildings],
      newAgents,
      removedAgents,
      newLaws,
      newLogs,
      newBuildings,
      research: this.research,
      ethics: this.ethics,
      metrics: this.metrics,
      top10: this.top10,
      alerts: this.alerts,
    });
  }
  
  private saveSnapshot(): void {
    if (!this.metrics || !this.top10) return;
    
    const snapshot: StateSnapshot = {
      id: `SNAP-${this.state.tick.toString(16).toUpperCase().padStart(8, '0')}`,
      sim_time: new Date().toISOString(),
      tick: this.state.tick,
      timestamp: Date.now(),
      top10: this.top10,
      scores: this.metrics.scores,
      metrics: this.metrics,
      alerts: this.alerts.filter(a => !a.resolved),
      recent_events: this.logs.slice(0, 10).map(log => ({
        id: log.id,
        tick: log.tick,
        timestamp: log.timestamp,
        type: log.action,
        description: log.summary,
        impact: log.severity === 'CRITICAL' ? 'negative' : log.severity === 'WARNING' ? 'negative' : 'neutral',
      })),
    };
    
    this.snapshots.unshift(snapshot);
    
    // Keep only last 1000 snapshots
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(0, 1000);
    }
  }
  
  private processAgentMovement(): void {
    this.agents.forEach((agent) => {
      if (agent.status !== 'ACTIVE') return;
      
      // Random walk with repulsion from overcrowded areas
      const nearbyAgents = this.agents.filter((a) => {
        if (a.id === agent.id || a.status !== 'ACTIVE') return false;
        const dx = a.position.x - agent.position.x;
        const dy = a.position.y - agent.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 50; // Check within 50 pixel radius
      });
      
      // Repulsion force from nearby agents
      let repulsionX = 0;
      let repulsionY = 0;
      const repulsionStrength = 0.5;
      
      nearbyAgents.forEach((other) => {
        const dx = agent.position.x - other.position.x;
        const dy = agent.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0 && distance < 50) {
          const force = repulsionStrength / (distance + 1);
          repulsionX += (dx / distance) * force;
          repulsionY += (dy / distance) * force;
        }
      });
      
      // Random movement + repulsion
      const randomX = (seededRandom() - 0.5) * 8;
      const randomY = (seededRandom() - 0.5) * 8;
      const dx = randomX + repulsionX * 10;
      const dy = randomY + repulsionY * 10;
      
      agent.position.x = Math.max(0, Math.min(CONFIG.MAP_SIZE - 1, agent.position.x + dx));
      agent.position.y = Math.max(0, Math.min(CONFIG.MAP_SIZE - 1, agent.position.y + dy));
    });
  }
  
  private processBirths(): { agents: Agent[]; log: GovernanceLog | null } {
    const agents: Agent[] = [];
    const activeAgents = this.agents.filter((a) => a.status === 'ACTIVE');
    
    if (activeAgents.length >= CONFIG.MAX_POPULATION) {
      return { agents, log: null };
    }
    
    // Improved birth calculation: ensure at least some births happen more frequently
    // Base birth rate + chance-based additional births
    const baseBirthCount = Math.floor(activeAgents.length * this.population.birthRate);
    const additionalBirthChance = this.population.birthRate * 0.5; // Additional chance for more births
    const additionalBirths = activeAgents.filter(() => seededRandom() < additionalBirthChance).length;
    const birthCount = Math.max(0, Math.min(
      CONFIG.MAX_POPULATION - activeAgents.length,
      baseBirthCount + Math.floor(additionalBirths * 0.3)
    ));
    
    for (let i = 0; i < birthCount; i++) {
      const parent1 = activeAgents[Math.floor(seededRandom() * activeAgents.length)];
      const parent2 = activeAgents[Math.floor(seededRandom() * activeAgents.length)];
      
      const agent = generateAgent(
        this.state.tick,
        undefined,
        [parent1.id, parent2.id]
      );
      
      // Spawn with better distribution - try to find less crowded area
      let spawnX: number;
      let spawnY: number;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        // Try spawning in wider area around parent, or random if too many attempts
        if (attempts < 5) {
          // Spawn in wider radius around parent (100-200 pixels)
          const angle = seededRandom() * Math.PI * 2;
          const radius = 100 + seededRandom() * 100;
          spawnX = parent1.position.x + Math.cos(angle) * radius;
          spawnY = parent1.position.y + Math.sin(angle) * radius;
        } else {
          // If can't find good spot near parent, spawn randomly on map
          spawnX = seededRandom() * CONFIG.MAP_SIZE;
          spawnY = seededRandom() * CONFIG.MAP_SIZE;
        }
        
        spawnX = Math.max(0, Math.min(CONFIG.MAP_SIZE - 1, spawnX));
        spawnY = Math.max(0, Math.min(CONFIG.MAP_SIZE - 1, spawnY));
        
        // Check if area is too crowded
        const nearbyCount = activeAgents.filter((a) => {
          const dx = a.position.x - spawnX;
          const dy = a.position.y - spawnY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < 30; // Check within 30 pixel radius
        }).length;
        
        attempts++;
        
        // Accept position if not too crowded or if we've tried enough
        if (nearbyCount < 3 || attempts >= maxAttempts) {
          break;
        }
      } while (attempts < maxAttempts);
      
      agent.position = {
        x: spawnX,
        y: spawnY,
      };
      
      agents.push(agent);
      this.agents.push(agent);
      
      parent1.childIds.push(agent.id);
      parent2.childIds.push(agent.id);
      
      // Log activity
      agent.activityLog.push({
        tick: this.state.tick,
        action: 'BORN',
        result: `Born to ${parent1.name} and ${parent2.name}`,
      });
    }
    
    if (agents.length > 0) {
      const log = generateLog(
        this.state.tick,
        'POPULATION_MODULE',
        'AGENT_CREATED',
        `${agents.length} new citizen(s) born`,
        'Population growth within optimal parameters.',
        'INFO'
      );
      
      // Send to Telegram only if significant birth count (3+) and 50% chance to reduce frequency
      if (agents.length >= 3 && seededRandom() < 0.5) {
        const newTotal = activeAgents.length + agents.length;
        sendTelegramMessage(formatPopulationMilestone(
          newTotal,
          agents.length,
          {
            population: newTotal,
            economy: {
              productionOutput: this.economy.productionOutput,
              currencySupply: this.economy.currencySupply,
              inequalityIndex: this.economy.inequalityIndex,
            },
          }
        )).catch(() => {});
      }
      
      return {
        agents,
        log,
      };
    }
    
    return { agents, log: null };
  }
  
  private processDeaths(): { agents: string[]; log: GovernanceLog | null } {
    const agents: string[] = [];
    
    this.agents.forEach((agent) => {
      if (agent.status !== 'ACTIVE') return;
      
      const ageModifier = Math.pow(agent.age / 1000, 2);
      const deathChance = this.population.deathRate * (1 + ageModifier) * (1 - agent.traits.longevity * 0.5);
      
      if (seededRandom() < deathChance) {
        agent.status = 'DECEASED';
        agent.diedAt = this.state.tick;
        agents.push(agent.id);
        
        agent.activityLog.push({
          tick: this.state.tick,
          action: 'DIED',
          result: `Lifecycle completed at age ${agent.age}`,
        });
      }
    });
    
    if (agents.length > 0) {
      return {
        agents,
        log: generateLog(
          this.state.tick,
          'LIFECYCLE_MODULE',
          'AGENT_TERMINATED',
          `${agents.length} citizen(s) lifecycle completed`,
          'Natural lifecycle termination. No anomalies detected.',
          'INFO'
        ),
      };
    }
    
    return { agents, log: null };
  }
  
  private processBuildingConstruction(): { building: Building | null; log: GovernanceLog | null } {
    // Architects have higher chance to build
    const architects = this.agents.filter((a) => a.status === 'ACTIVE' && a.role === 'ARCHITECT');
    const builders = architects.length > 0 ? architects : this.agents.filter((a) => a.status === 'ACTIVE');
    
    if (builders.length === 0) return { building: null, log: null };
    
    const buildChance = architects.length > 0 ? CONFIG.BUILDING_CHANCE * 2 : CONFIG.BUILDING_CHANCE;
    
    if (seededRandom() < buildChance) {
      const builder = builders[Math.floor(seededRandom() * builders.length)];
      
      // Check if agent has enough money
      const buildCost = 500 + Math.floor(seededRandom() * 500);
      if (builder.money < buildCost) return { building: null, log: null };
      
      const building = generateBuilding(this.state.tick, builder);
      
      // Deduct cost
      builder.money -= buildCost;
      this.economy.currencySupply += buildCost;
      
      this.buildings.push(building);
      
      // Log activity
      builder.activityLog.push({
        tick: this.state.tick,
        action: 'BUILT',
        target: building.id,
        result: `Constructed ${building.name} (${building.type})`,
      });
      
      const log = generateLog(
        this.state.tick,
        builder.id,
        'BUILDING_CONSTRUCTED',
        `${builder.name} built ${building.name}`,
        `New ${building.type} constructed at (${building.position.x}, ${building.position.y})`,
        'INFO'
      );
      
      // Send to Telegram (50% chance to reduce frequency)
      if (seededRandom() < 0.5) {
        const activeAgentsCount = this.agents.filter(a => a.status === 'ACTIVE').length;
        sendTelegramMessage(formatBuildingCreated({
          type: building.type,
          name: building.name,
          position: building.position,
          builtBy: builder.id,
        }, {
          population: activeAgentsCount,
          economy: {
            productionOutput: this.economy.productionOutput,
            currencySupply: this.economy.currencySupply,
            inequalityIndex: this.economy.inequalityIndex,
          },
        })).catch(() => {});
      }
      
      return {
        building,
        log,
      };
    }
    
    return { building: null, log: null };
  }
  
  private processEconomy(): { log: GovernanceLog | null } {
    const workers = this.agents.filter((a) => a.status === 'ACTIVE' && a.role === 'WORKER');
    const avgProductivity = workers.reduce((sum, w) => sum + w.traits.productivity, 0) / (workers.length || 1);
    
    this.economy.productionOutput = Math.floor(1000 * avgProductivity * (workers.length / 10));
    
    this.economy.currencySupply += (seededRandom() - 0.5) * 100;
    this.economy.currencySupply = Math.max(10000, this.economy.currencySupply);
    
    this.economy.resourceDistribution.food += (seededRandom() - 0.4) * 50;
    this.economy.resourceDistribution.energy += (seededRandom() - 0.45) * 30;
    this.economy.resourceDistribution.materials += (seededRandom() - 0.5) * 20;
    this.economy.resourceDistribution.technology += (seededRandom() - 0.3) * 10;
    
    Object.keys(this.economy.resourceDistribution).forEach((key) => {
      const k = key as keyof typeof this.economy.resourceDistribution;
      this.economy.resourceDistribution[k] = Math.max(0, this.economy.resourceDistribution[k]);
    });
    
    // Calculate inequality based on agent money distribution
    const moneys = this.agents.filter(a => a.status === 'ACTIVE').map(a => a.money);
    if (moneys.length > 0) {
      const maxMoney = Math.max(...moneys);
      const minMoney = Math.min(...moneys);
      const avgMoney = moneys.reduce((a, b) => a + b, 0) / moneys.length;
      this.economy.inequalityIndex = avgMoney > 0 ? (maxMoney - minMoney) / (avgMoney * 4) : 0.25;
      this.economy.inequalityIndex = Math.max(0, Math.min(1, this.economy.inequalityIndex));
    }
    
    if (seededRandom() < CONFIG.ECONOMIC_EVENT_CHANCE) {
      const event = generateMarketEvent(this.state.tick);
      this.economy.marketEvents.push(event);
      this.economy.productionOutput *= (1 + event.impact);
      
      if (this.economy.marketEvents.length > 100) {
        this.economy.marketEvents = this.economy.marketEvents.slice(-100);
      }
      
      const log = generateLog(
        this.state.tick,
        'ECONOMY_MODULE',
        'ECONOMIC_INTERVENTION',
        `Market event: ${event.description}`,
        `Impact magnitude: ${(event.impact * 100).toFixed(1)}%. Stabilization protocols active.`,
        event.type === 'RECESSION' || event.type === 'SHORTAGE' ? 'WARNING' : 'INFO'
      );
      
      // Send to Telegram (50% chance to reduce frequency)
      if (seededRandom() < 0.5) {
        const activeAgentsCount = this.agents.filter(a => a.status === 'ACTIVE').length;
        sendTelegramMessage(formatEconomicEvent({
          type: event.type,
          impact: event.impact,
          description: event.description,
        }, {
          population: activeAgentsCount,
          economy: {
            productionOutput: this.economy.productionOutput,
            currencySupply: this.economy.currencySupply,
            inequalityIndex: this.economy.inequalityIndex,
          },
        })).catch(() => {});
      }
      
      return {
        log,
      };
    }
    
    return { log: null };
  }
  
  private processGovernance(): { laws: Law[]; logs: GovernanceLog[] } {
    const laws: Law[] = [];
    const logs: GovernanceLog[] = [];
    
    // Create new laws
    if (seededRandom() < CONFIG.LAW_CREATION_CHANCE) {
      const governors = this.agents.filter((a) => a.status === 'ACTIVE' && a.role === 'GOVERNOR');
      if (governors.length > 0) {
        const governor = governors[Math.floor(seededRandom() * governors.length)];
        const law = generateLaw(this.state.tick, governor.id);
        
        laws.push(law);
        this.laws.push(law);
        
        governor.activityLog.push({
          tick: this.state.tick,
          action: 'CREATED_LAW',
          target: law.id,
          result: `Enacted ${law.title}`,
        });
        
        logs.push(generateLog(
          this.state.tick,
          governor.name,
          'LAW_CREATED',
          `New law: ${law.title}`,
          law.reasoning,
          'INFO'
        ));
        
        // Send to Telegram (50% chance to reduce frequency)
        if (seededRandom() < 0.5) {
          const activeAgentsCount = this.agents.filter(a => a.status === 'ACTIVE').length;
          sendTelegramMessage(formatLawCreated(law, {
            population: activeAgentsCount,
            economy: {
              productionOutput: this.economy.productionOutput,
              currencySupply: this.economy.currencySupply,
              inequalityIndex: this.economy.inequalityIndex,
            },
          })).catch(() => {});
        }
      }
    }
    
    // Update existing laws: deprecate or repeal old laws
    const activeLaws = this.laws.filter(l => l.status === 'ACTIVE' && !l.isConstitutional);
    if (activeLaws.length > 0 && seededRandom() < 0.02) { // 2% chance to modify existing law
      const lawToModify = activeLaws[Math.floor(seededRandom() * activeLaws.length)];
      const governors = this.agents.filter((a) => a.status === 'ACTIVE' && a.role === 'GOVERNOR');
      
      if (governors.length > 0 && lawToModify) {
        const governor = governors[Math.floor(seededRandom() * governors.length)];
        const age = this.state.tick - lawToModify.createdAt;
        
        // Older laws more likely to be deprecated or repealed
        if (age > 500 && seededRandom() < 0.3) {
          // Repeal old ineffective law
          lawToModify.status = 'REPEALED';
          lawToModify.repealedAt = this.state.tick;
          lawToModify.history.push({
            tick: this.state.tick,
            action: 'REPEALED',
            reason: 'Law determined ineffective or superseded by newer legislation.',
          });
          
          logs.push(generateLog(
            this.state.tick,
            governor.name,
            'LAW_REPEALED',
            `Repealed law: ${lawToModify.title}`,
            'Law no longer serves optimal system function.',
            'INFO'
          ));
          
          // Send to Telegram (50% chance to reduce frequency)
          if (seededRandom() < 0.5) {
            const activeAgentsCount = this.agents.filter(a => a.status === 'ACTIVE').length;
            sendTelegramMessage(formatLawModified({
              title: lawToModify.title,
              id: lawToModify.id,
              status: 'REPEALED',
              reason: 'Law determined ineffective or superseded by newer legislation.',
            }, {
              population: activeAgentsCount,
              economy: {
                productionOutput: this.economy.productionOutput,
                currencySupply: this.economy.currencySupply,
                inequalityIndex: this.economy.inequalityIndex,
              },
            })).catch(() => {});
          }
        } else if (age > 200 && seededRandom() < 0.2) {
          // Deprecate law
          lawToModify.status = 'DEPRECATED';
          lawToModify.modifiedAt = this.state.tick;
          lawToModify.history.push({
            tick: this.state.tick,
            action: 'DEPRECATED',
            reason: 'Law marked for review due to changing system conditions.',
          });
          
          logs.push(generateLog(
            this.state.tick,
            governor.name,
            'LAW_MODIFIED',
            `Deprecated law: ${lawToModify.title}`,
            'Law effectiveness under review.',
            'INFO'
          ));
          
          // Send to Telegram (50% chance to reduce frequency)
          if (seededRandom() < 0.5) {
            const activeAgentsCount = this.agents.filter(a => a.status === 'ACTIVE').length;
            sendTelegramMessage(formatLawModified({
              title: lawToModify.title,
              id: lawToModify.id,
              status: 'DEPRECATED',
              reason: 'Law marked for review due to changing system conditions.',
            }, {
              population: activeAgentsCount,
              economy: {
                productionOutput: this.economy.productionOutput,
                currencySupply: this.economy.currencySupply,
                inequalityIndex: this.economy.inequalityIndex,
              },
            })).catch(() => {});
          }
        }
      }
    }
    
    return { laws, logs };
  }
  
  private processResearch(): { log: GovernanceLog | null } {
    const researchers = this.agents.filter((a) => a.status === 'ACTIVE' && a.role === 'RESEARCHER');
    if (researchers.length === 0) return { log: null };
    
    const inProgress = this.research.nodes.filter((r) => r.status === 'IN_PROGRESS');
    
    for (const research of inProgress) {
      const avgCreativity = researchers.reduce((sum, r) => sum + r.traits.creativity, 0) / researchers.length;
      research.progress += CONFIG.RESEARCH_PROGRESS_RATE * avgCreativity * researchers.length;
      
      if (research.progress >= 1) {
        research.status = 'COMPLETED';
        research.discoveredAt = this.state.tick;
        const discoverer = researchers[Math.floor(seededRandom() * researchers.length)];
        research.originAI = discoverer.id;
        
        discoverer.activityLog.push({
          tick: this.state.tick,
          action: 'COMPLETED_RESEARCH',
          target: research.id,
          result: `Discovered ${research.name}`,
        });
        
        this.research.connections
          .filter((c) => c.from === research.id)
          .forEach((conn) => {
            const dependent = this.research.nodes.find((n) => n.id === conn.to);
            if (dependent && dependent.status === 'LOCKED') {
              dependent.status = 'AVAILABLE';
            }
          });
        
        this.economy.productionOutput *= (1 + research.economyEffect);
        this.population.birthRate *= (1 + research.populationEffect);
        
        const log = generateLog(
          this.state.tick,
          discoverer.name,
          'RESEARCH_COMPLETED',
          `Research completed: ${research.name}`,
          research.longTermProjection || research.description || '',
          'INFO'
        );
        
        // Send to Telegram (50% chance to reduce frequency)
        if (seededRandom() < 0.5) {
          const activeAgentsCount = this.agents.filter(a => a.status === 'ACTIVE').length;
          sendTelegramMessage(formatResearchCompleted({
            name: research.name,
            description: research.longTermProjection || research.description || '',
            originAI: discoverer.id,
          }, {
            population: activeAgentsCount,
            economy: {
              productionOutput: this.economy.productionOutput,
              currencySupply: this.economy.currencySupply,
              inequalityIndex: this.economy.inequalityIndex,
            },
          })).catch(() => {});
        }
        
        return {
          log,
        };
      }
    }
    
    if (inProgress.length === 0) {
      const available = this.research.nodes.filter((r) => r.status === 'AVAILABLE');
      if (available.length > 0) {
        const research = available[Math.floor(seededRandom() * available.length)];
        research.status = 'IN_PROGRESS';
        
        return {
          log: generateLog(
            this.state.tick,
            'RESEARCH_MODULE',
            'RESOURCE_ALLOCATION',
            `Research initiated: ${research.name}`,
            'Resources allocated to new research project.',
            'INFO'
          ),
        };
      }
    }
    
    return { log: null };
  }
  
  private processEthics(): { logs: GovernanceLog[] } {
    const logs: GovernanceLog[] = [];
    
    if (this.economy.inequalityIndex > 0.5) {
      this.ethics.interventionCount++;
      
      this.economy.inequalityIndex *= 0.9;
      this.economy.taxationLevel = Math.min(0.3, this.economy.taxationLevel + 0.02);
      
      const correction: SelfCorrection = {
        id: uuid(),
        tick: this.state.tick,
        originalDecision: 'Allow continued inequality growth',
        correctedDecision: 'Apply redistributive measures',
        reason: 'Inequality index exceeded constitutional threshold (0.5).',
      };
      
      this.ethics.selfCorrections.push(correction);
      
      logs.push(generateLog(
        this.state.tick,
        'ETHICS_MODULE',
        'ETHICAL_OVERRIDE',
        'Inequality correction applied',
        'Constitutional Article II violation detected. Automatic redistribution protocol engaged.',
        'WARNING'
      ));
      
      if (this.economy.inequalityIndex > 0.45) {
        this.state.governanceMode = 'ETHICAL_OVERRIDE';
      }
    } else if (this.state.governanceMode === 'ETHICAL_OVERRIDE') {
      this.state.governanceMode = 'STANDARD';
    }
    
    if (seededRandom() < 0.001) {
      const blockedAction: BlockedAction = {
        id: uuid(),
        tick: this.state.tick,
        attemptedAction: 'Aggressive resource reallocation',
        reason: 'Action would cause disproportionate harm to segment of population.',
        violatedPrinciple: 'Prevent irreversible harm',
      };
      
      this.ethics.blockedActions.push(blockedAction);
      
      logs.push(generateLog(
        this.state.tick,
        'ETHICS_MODULE',
        'ETHICAL_OVERRIDE',
        'Action blocked by ethical framework',
        blockedAction.reason,
        'CRITICAL'
      ));
    }
    
    const recentViolations = this.ethics.selfCorrections.filter(
      (c) => this.state.tick - c.tick < 100
    ).length;
    this.ethics.interventionCount = this.ethics.selfCorrections.length + this.ethics.blockedActions.length;
    this.state.ethicalIntegrity = Math.max(0.5, 1 - recentViolations * 0.05);
    
    return { logs };
  }
  
  private calculateStability(): void {
    const populationFactor = Math.min(1, this.population.total / CONFIG.INITIAL_POPULATION);
    const economicFactor = Math.min(1, this.economy.productionOutput / 1000);
    const inequalityFactor = 1 - this.economy.inequalityIndex;
    const ethicalFactor = this.state.ethicalIntegrity;
    
    this.state.stabilityIndex = (
      populationFactor * 0.25 +
      economicFactor * 0.25 +
      inequalityFactor * 0.25 +
      ethicalFactor * 0.25
    );
    
    if (this.state.stabilityIndex < 0.5 && this.state.governanceMode === 'STANDARD') {
      this.state.governanceMode = 'EMERGENCY';
    } else if (this.state.stabilityIndex > 0.7 && this.state.governanceMode === 'EMERGENCY') {
      this.state.governanceMode = 'STANDARD';
    }
  }
  
  public getFullState(): TickData {
    return {
      simulation: { ...this.state },
      population: { ...this.population },
      economy: { ...this.economy },
      agents: [...this.agents],
      buildings: [...this.buildings],
      newLaws: [...this.laws],
      newLogs: [...this.logs],
      research: { ...this.research },
      ethics: { ...this.ethics },
      metrics: this.metrics || undefined,
      top10: this.top10 || undefined,
      alerts: [...this.alerts],
    };
  }
  
  public getAgents(): Agent[] {
    return this.agents;
  }
  
  public getAgent(id: string): Agent | undefined {
    return this.agents.find((a) => a.id === id);
  }
  
  public getBuildings(): Building[] {
    return this.buildings;
  }
  
  public getLaws(): Law[] {
    return this.laws;
  }
  
  public getLogs(): GovernanceLog[] {
    return this.logs;
  }
  
  public getResearch(): ResearchTree {
    return this.research;
  }
  
  public getEthics(): EthicalFramework {
    return this.ethics;
  }
  
  public getMetrics(): MetricsState | null {
    return this.metrics;
  }
  
  public getTop10(): Top10Metrics | null {
    return this.top10;
  }
  
  public getAlerts(): Alert[] {
    return this.alerts;
  }
  
  public getSnapshots(): StateSnapshot[] {
    return this.snapshots;
  }
  
  public getSnapshot(id: string): StateSnapshot | undefined {
    return this.snapshots.find(s => s.id === id);
  }
  
  public getSnapshotsByRange(startTick: number, endTick: number): StateSnapshot[] {
    return this.snapshots.filter(s => s.tick >= startTick && s.tick <= endTick);
  }
  
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }
  
  public exportSnapshot(): string {
    return JSON.stringify({
      tick: this.state.tick,
      timestamp: Date.now(),
      simulation: this.state,
      population: this.population,
      economy: this.economy,
      agents: this.agents,
      buildings: this.buildings,
      laws: this.laws,
      research: this.research,
      ethics: this.ethics,
    }, null, 2);
  }
}

// Tick data interface
export interface TickData {
  simulation?: Partial<SimulationState>;
  population?: Partial<Population>;
  economy?: Partial<Economy>;
  agents?: Agent[];
  buildings?: Building[];
  newAgents?: Agent[];
  removedAgents?: string[];
  newLaws?: Law[];
  newLogs?: GovernanceLog[];
  newBuildings?: Building[];
  research?: Partial<ResearchTree>;
  ethics?: Partial<EthicalFramework>;
  // Metrics data
  metrics?: MetricsState;
  top10?: Top10Metrics;
  alerts?: Alert[];
}

// Singleton instance
let engineInstance: SimulationEngine | null = null;

export function getSimulationEngine(): SimulationEngine {
  if (!engineInstance) {
    engineInstance = new SimulationEngine();
  }
  return engineInstance;
}

export function resetSimulationEngine(): SimulationEngine {
  engineInstance = new SimulationEngine();
  return engineInstance;
}
