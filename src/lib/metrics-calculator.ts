// NOCRACY METRICS CALCULATOR
// Computes all metrics from simulation state

import type {
  MetricsState,
  CompositeScores,
  TopMetric,
  Top10Metrics,
  MetricDataPoint,
  MetricStatus,
  Alert,
  AlertType,
  AlertSeverity,
  DemographyMetrics,
  EconomyMetrics,
  InequalityMetrics,
  ResourceMetrics,
  GovernanceMetrics,
  StabilityMetrics,
  QualityOfLifeMetrics,
  ResearchMetrics,
  AgentEvolutionMetrics,
  EthicsMetrics,
} from '@/types/metrics';
import type { Agent, Building, Law, Economy, EthicalFramework, ResearchTree } from '@/types/simulation';
import { SCORE_WEIGHTS, getMetricDefinition, formatMetricValue } from './metrics-definitions';

// ============================================
// METRIC HISTORY STORAGE
// ============================================

const HISTORY_LENGTH = 100;
const metricHistory: Map<string, MetricDataPoint[]> = new Map();

function addToHistory(metricId: string, tick: number, value: number): MetricDataPoint[] {
  if (!metricHistory.has(metricId)) {
    metricHistory.set(metricId, []);
  }
  
  const history = metricHistory.get(metricId)!;
  history.push({ tick, value, timestamp: Date.now() });
  
  // Keep only last N entries
  if (history.length > HISTORY_LENGTH) {
    history.shift();
  }
  
  return [...history];
}

export function getMetricHistory(metricId: string): MetricDataPoint[] {
  return metricHistory.get(metricId) || [];
}

export function clearMetricHistory(): void {
  metricHistory.clear();
}

// ============================================
// DEMOGRAPHY METRICS
// ============================================

export function calculateDemographyMetrics(
  agents: Agent[],
  prevAgentCount: number,
  tickDelta: number
): DemographyMetrics {
  const active = agents.filter(a => a.status === 'ACTIVE');
  const deceased = agents.filter(a => a.status === 'DECEASED');
  
  const population_total = active.length;
  const births = active.filter(a => a.createdAt >= (agents[0]?.createdAt || 0) + tickDelta - 100).length;
  const deaths = deceased.filter(a => a.diedAt && a.diedAt >= (agents[0]?.createdAt || 0) + tickDelta - 100).length;
  
  const birth_rate = population_total > 0 ? (births / population_total) * 100 : 0;
  const death_rate = population_total > 0 ? (deaths / population_total) * 100 : 0;
  const population_growth_rate = birth_rate - death_rate;
  
  const ages = active.map(a => a.age).sort((a, b) => a - b);
  const median_age = ages.length > 0 ? ages[Math.floor(ages.length / 2)] : 0;
  
  // Workers vs non-workers (simplified)
  const workers = active.filter(a => ['WORKER', 'RESEARCHER', 'ECONOMIST', 'ARCHITECT', 'MERCHANT'].includes(a.role));
  const dependency_ratio = workers.length > 0 ? (active.length - workers.length) / workers.length : 0;
  
  return {
    population_total,
    population_growth_rate,
    birth_rate,
    death_rate,
    median_age,
    dependency_ratio,
    migration_rate: 0, // Not implemented yet
  };
}

// ============================================
// ECONOMY METRICS
// ============================================

export function calculateEconomyMetrics(
  agents: Agent[],
  buildings: Building[],
  economy: Economy,
  prevEconomy?: Economy
): EconomyMetrics {
  const active = agents.filter(a => a.status === 'ACTIVE');
  const totalWealth = active.reduce((sum, a) => sum + a.money, 0);
  const population = active.length || 1;
  
  // Calculate production output based on buildings and workers
  const productionBuildings = buildings.filter(b => 
    ['FACTORY', 'FARM', 'OFFICE', 'RESEARCH_LAB'].includes(b.type)
  );
  const productionCapacity = productionBuildings.reduce((sum, b) => sum + b.productivity * 100, 0);
  
  const gdp_total_output = productionCapacity + totalWealth * 0.1;
  const gdp_per_capita = gdp_total_output / population;
  
  const workers = active.filter(a => a.role === 'WORKER');
  const productivity_per_worker = workers.length > 0 ? gdp_total_output / workers.length : 0;
  
  const employed = active.filter(a => a.workplace).length;
  const employment_rate = (employed / population) * 100;
  
  const incomes = active.map(a => a.money).sort((a, b) => a - b);
  const median_income = incomes.length > 0 ? incomes[Math.floor(incomes.length / 2)] : 0;
  
  // Inflation calculation
  const prevCPI = prevEconomy?.currencySupply || economy.currencySupply;
  const currentCPI = economy.currencySupply;
  const inflation_rate = prevCPI > 0 ? ((currentCPI - prevCPI) / prevCPI) * 100 : 0;
  
  return {
    gdp_total_output,
    gdp_per_capita,
    productivity_per_worker,
    employment_rate,
    median_income,
    price_index_cpi: 100 + inflation_rate,
    inflation_rate: Math.abs(inflation_rate) < 0.01 ? 0 : inflation_rate,
    money_supply: economy.currencySupply,
    money_velocity: 1.5 + Math.random() * 0.5,
    tax_revenue: economy.taxationLevel * gdp_total_output,
    gov_spending: economy.taxationLevel * gdp_total_output * 0.9,
    budget_balance: economy.taxationLevel * gdp_total_output * 0.1,
    reserves: economy.currencySupply * 0.2,
    trade_balance: 0,
  };
}

// ============================================
// INEQUALITY METRICS
// ============================================

export function calculateInequalityMetrics(agents: Agent[]): InequalityMetrics {
  const active = agents.filter(a => a.status === 'ACTIVE');
  if (active.length === 0) {
    return {
      gini_income: 0,
      wealth_concentration_top1: 0,
      poverty_rate: 0,
      social_mobility_index: 50,
      access_index: 50,
    };
  }
  
  const incomes = active.map(a => a.money).sort((a, b) => a - b);
  const totalIncome = incomes.reduce((sum, i) => sum + i, 0);
  const n = incomes.length;
  
  // Gini coefficient calculation
  let giniSum = 0;
  for (let i = 0; i < n; i++) {
    giniSum += (2 * (i + 1) - n - 1) * incomes[i];
  }
  const gini_income = totalIncome > 0 ? giniSum / (n * totalIncome) : 0;
  
  // Top 1% wealth concentration
  const top1Count = Math.max(1, Math.floor(n * 0.01));
  const top1Wealth = incomes.slice(-top1Count).reduce((sum, i) => sum + i, 0);
  const wealth_concentration_top1 = totalIncome > 0 ? (top1Wealth / totalIncome) * 100 : 0;
  
  // Poverty rate (below 30% of median)
  const medianIncome = incomes[Math.floor(n / 2)];
  const povertyThreshold = medianIncome * 0.3;
  const poverty_rate = (incomes.filter(i => i < povertyThreshold).length / n) * 100;
  
  return {
    gini_income: Math.max(0, Math.min(1, gini_income)),
    wealth_concentration_top1,
    poverty_rate,
    social_mobility_index: 50 + (1 - gini_income) * 30,
    access_index: 70 - poverty_rate,
  };
}

// ============================================
// RESOURCE METRICS
// ============================================

export function calculateResourceMetrics(
  buildings: Building[],
  economy: Economy
): ResourceMetrics {
  const energyBuildings = buildings.filter(b => ['FACTORY', 'FARM'].includes(b.type));
  const energy_supply = energyBuildings.reduce((sum, b) => sum + b.productivity * 50, 0) + 500;
  const energy_demand = buildings.length * 10 + 200;
  
  const resources = economy.resourceDistribution;
  const maxResource = Math.max(resources.food, resources.energy, resources.materials, resources.technology, 1);
  const resourceNormalized = (
    (resources.food / maxResource) +
    (resources.energy / maxResource) +
    (resources.materials / maxResource) +
    (resources.technology / maxResource)
  ) / 4;
  
  const infrastructure_index = Math.min(100, buildings.length * 2 + 20);
  const maintenance_load = buildings.length > 0 ? Math.min(50, buildings.length * 0.5) : 0;
  
  return {
    energy_supply,
    energy_demand,
    resource_stockpiles: {
      food: resources.food,
      energy: resources.energy,
      water: resources.materials * 0.5,
      materials: resources.materials,
    },
    extraction_rate: 100 + Math.random() * 50,
    depletion_rate: 0.5 + Math.random() * 0.5,
    infrastructure_index,
    maintenance_load,
    supply_chain_health: 70 + Math.random() * 20,
    resilience_score: Math.min(100, 60 + infrastructure_index * 0.3),
  };
}

// ============================================
// GOVERNANCE METRICS
// ============================================

export function calculateGovernanceMetrics(
  laws: Law[],
  agents: Agent[]
): GovernanceMetrics {
  const activeLaws = laws.filter(l => l.status === 'ACTIVE');
  const active_law_count = activeLaws.length;
  
  const recentLawChanges = laws.filter(l => l.history.length > 1).length;
  const law_churn_rate = laws.length > 0 ? (recentLawChanges / laws.length) * 100 : 0;
  
  const activeAgents = agents.filter(a => a.status === 'ACTIVE');
  const compliantAgents = activeAgents.filter(a => 
    a.traits.compliance > 0.5
  );
  const compliance_rate = activeAgents.length > 0 
    ? (compliantAgents.length / activeAgents.length) * 100 
    : 100;
  
  return {
    active_law_count,
    law_churn_rate,
    compliance_rate,
    enforcement_cost: active_law_count * 100,
    admin_overhead: Math.min(25, 5 + active_law_count * 0.5),
    rule_consistency_score: 75 + Math.random() * 15,
    time_to_policy: 20 + Math.random() * 30,
    decision_transparency_score: 85 + Math.random() * 10,
  };
}

// ============================================
// STABILITY METRICS
// ============================================

export function calculateStabilityMetrics(
  agents: Agent[],
  stabilityIndex: number
): StabilityMetrics {
  const activeAgents = agents.filter(a => a.status === 'ACTIVE');
  
  // Calculate dissent based on agent traits
  const avgCompliance = activeAgents.length > 0
    ? activeAgents.reduce((sum, a) => sum + a.traits.compliance, 0) / activeAgents.length
    : 0.8;
  
  const dissent_index = (1 - avgCompliance) * 100;
  const trust_in_system = avgCompliance * 100;
  
  // Role diversity affects factionalism
  const roles = new Set(activeAgents.map(a => a.role));
  const factionalism_index = Math.max(0, (roles.size - 4) * 10);
  
  return {
    conflict_rate: 2 + Math.random() * 3,
    violence_index: Math.random() * 10,
    dissent_index,
    trust_in_system,
    factionalism_index,
    security_incident_count: Math.floor(Math.random() * 3),
    stability_index: stabilityIndex * 100,
  };
}

// ============================================
// QUALITY OF LIFE METRICS
// ============================================

export function calculateQualityOfLifeMetrics(
  agents: Agent[],
  buildings: Building[]
): QualityOfLifeMetrics {
  const activeAgents = agents.filter(a => a.status === 'ACTIVE');
  
  // Wellbeing based on average traits
  const avgTraits = activeAgents.length > 0
    ? activeAgents.reduce((sum, a) => sum + (a.traits.productivity + a.traits.creativity) / 2, 0) / activeAgents.length
    : 0.5;
  
  const wellbeing_index = avgTraits * 100;
  
  // Health based on hospitals
  const hospitals = buildings.filter(b => b.type === 'HOSPITAL').length;
  const health_index = Math.min(100, 50 + hospitals * 15);
  
  // Education based on research labs
  const researchLabs = buildings.filter(b => b.type === 'RESEARCH_LAB').length;
  const education_index = Math.min(100, 40 + researchLabs * 20);
  
  return {
    wellbeing_index,
    health_index,
    education_index,
    leisure_time_index: 40 + Math.random() * 30,
    creativity_output_rate: activeAgents.reduce((sum, a) => sum + a.traits.creativity, 0),
  };
}

// ============================================
// RESEARCH METRICS
// ============================================

export function calculateResearchMetrics(
  research: ResearchTree,
  agents: Agent[]
): ResearchMetrics {
  const completed = research.nodes.filter(n => n.status === 'COMPLETED').length;
  const inProgress = research.nodes.filter(n => n.status === 'IN_PROGRESS').length;
  const total = research.nodes.length || 1;
  
  const researchers = agents.filter(a => a.status === 'ACTIVE' && a.role === 'RESEARCHER');
  
  return {
    research_throughput: researchers.length * 2 + inProgress * 0.5,
    breakthrough_rate: total > 0 ? (completed / total) * 10 : 0,
    tech_tree_depth: Math.max(1, completed),
    adoption_rate: completed > 0 ? Math.min(100, 30 + completed * 10) : 30,
    knowledge_diffusion_score: Math.min(100, 40 + completed * 5 + researchers.length * 3),
  };
}

// ============================================
// AGENT EVOLUTION METRICS
// ============================================

export function calculateAgentEvolutionMetrics(
  agents: Agent[]
): AgentEvolutionMetrics {
  const activeAgents = agents.filter(a => a.status === 'ACTIVE');
  
  // Trait diversity
  const traits = activeAgents.map(a => Object.values(a.traits));
  const traitVariances = traits.length > 1
    ? traits[0].map((_, i) => {
        const values = traits.map(t => t[i]);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      })
    : [0.1, 0.1, 0.1, 0.1, 0.1];
  
  const trait_diversity_score = Math.min(100, traitVariances.reduce((a, b) => a + b, 0) * 200);
  
  // Cooperation based on compliance trait
  const avgCompliance = activeAgents.length > 0
    ? activeAgents.reduce((sum, a) => sum + a.traits.compliance, 0) / activeAgents.length
    : 0.5;
  
  // Count unique roles as institutions
  const roles = new Set(activeAgents.map(a => a.role));
  
  return {
    mutation_rate: 3 + Math.random() * 4,
    trait_diversity_score,
    selection_pressure_index: 30 + Math.random() * 20,
    role_evolution_rate: 2 + Math.random() * 3,
    cooperation_vs_defection_ratio: avgCompliance / (1 - avgCompliance + 0.1),
    emergent_institutions_count: roles.size,
  };
}

// ============================================
// ETHICS METRICS
// ============================================

export function calculateEthicsMetrics(
  ethics: EthicalFramework
): EthicsMetrics {
  return {
    ethics_violations_attempted: Math.floor(ethics.blockedActions.length * 1.5),
    ethics_blocks_triggered: ethics.blockedActions.length,
    judicial_overrides: ethics.selfCorrections.length,
    time_to_correction: ethics.selfCorrections.length > 0 ? 15 + Math.random() * 20 : 0,
    harm_proxy_score: Math.max(0, 10 + ethics.blockedActions.length * 5),
    love_equation_score: Math.max(0, 90 - ethics.blockedActions.length * 5),
    monoculture_risk_score: 20 + Math.random() * 20,
  };
}

// ============================================
// COMPOSITE SCORES
// ============================================

export function calculateCompositeScores(metrics: MetricsState): CompositeScores {
  // State Health Score
  const stateHealthComponents = [
    metrics.economy.gdp_per_capita / 20, // Normalize to ~0-100
    metrics.economy.employment_rate,
    100 - Math.abs(metrics.economy.inflation_rate) * 10,
    (metrics.resources.resource_stockpiles.food + 
     metrics.resources.resource_stockpiles.energy + 
     metrics.resources.resource_stockpiles.materials) / 300,
    metrics.resources.supply_chain_health,
    metrics.resources.resilience_score,
    metrics.stability.stability_index,
    metrics.qualityOfLife.wellbeing_index,
  ];
  const state_health_score = Math.min(100, Math.max(0,
    stateHealthComponents.reduce((a, b) => a + b, 0) / stateHealthComponents.length
  ));

  // Legitimacy Score
  const legitimacyComponents = [
    metrics.stability.trust_in_system,
    metrics.governance.compliance_rate,
    metrics.governance.rule_consistency_score,
    metrics.governance.decision_transparency_score,
    100 - metrics.inequality.gini_income * 100,
    metrics.inequality.social_mobility_index,
  ];
  const legitimacy_score = Math.min(100, Math.max(0,
    legitimacyComponents.reduce((a, b) => a + b, 0) / legitimacyComponents.length
  ));

  // Evolution Score
  const evolutionComponents = [
    metrics.research.research_throughput * 5,
    metrics.research.breakthrough_rate * 10,
    metrics.research.adoption_rate,
    metrics.research.knowledge_diffusion_score,
    metrics.agentEvolution.trait_diversity_score,
    metrics.agentEvolution.emergent_institutions_count * 10,
    metrics.agentEvolution.cooperation_vs_defection_ratio * 50,
  ];
  const evolution_score = Math.min(100, Math.max(0,
    evolutionComponents.reduce((a, b) => a + b, 0) / evolutionComponents.length
  ));

  return {
    state_health_score: Math.round(state_health_score),
    legitimacy_score: Math.round(legitimacy_score),
    evolution_score: Math.round(evolution_score),
  };
}

// ============================================
// TOP 10 METRICS BUILDER
// ============================================

function getMetricStatus(value: number, definition: ReturnType<typeof getMetricDefinition>): MetricStatus {
  if (!definition) return 'neutral';
  
  const { thresholds, higherIsBetter } = definition;
  
  // Check critical first
  if (thresholds.critical.min !== undefined && value < thresholds.critical.min) {
    return higherIsBetter ? 'critical' : 'positive';
  }
  if (thresholds.critical.max !== undefined && value > thresholds.critical.max) {
    return higherIsBetter ? 'positive' : 'critical';
  }
  
  // Check warning
  if (thresholds.warning.min !== undefined && value < thresholds.warning.min) {
    return higherIsBetter ? 'warning' : 'neutral';
  }
  if (thresholds.warning.max !== undefined && value > thresholds.warning.max) {
    return higherIsBetter ? 'neutral' : 'warning';
  }
  
  return 'neutral';
}

function buildTopMetric(
  id: string,
  value: number,
  tick: number,
  prevValue?: number
): TopMetric {
  const definition = getMetricDefinition(id);
  const history = addToHistory(id, tick, value);
  
  const delta = prevValue !== undefined ? value - prevValue : 0;
  const deltaPercent = prevValue && prevValue !== 0 ? (delta / prevValue) * 100 : 0;
  
  return {
    id,
    name: definition?.name || id,
    category: definition?.category || 'unknown',
    value,
    delta,
    deltaPercent,
    unit: definition?.unit || '',
    history,
    status: getMetricStatus(value, definition),
    description: definition?.description || '',
  };
}

export function buildTop10Metrics(
  metrics: MetricsState,
  tick: number,
  prevMetrics?: MetricsState
): Top10Metrics {
  // Calculate resource stockpiles summary
  const stockpiles = metrics.resources.resource_stockpiles;
  const maxStock = Math.max(stockpiles.food, stockpiles.energy, stockpiles.water, stockpiles.materials, 1);
  const resource_stockpiles_summary = Math.round(
    ((stockpiles.food / maxStock) + 
     (stockpiles.energy / maxStock) + 
     (stockpiles.water / maxStock) + 
     (stockpiles.materials / maxStock)) * 25
  );

  return {
    population_total: buildTopMetric(
      'population_total',
      metrics.demography.population_total,
      tick,
      prevMetrics?.demography.population_total
    ),
    state_health_score: buildTopMetric(
      'state_health_score',
      metrics.scores.state_health_score,
      tick,
      prevMetrics?.scores.state_health_score
    ),
    legitimacy_score: buildTopMetric(
      'legitimacy_score',
      metrics.scores.legitimacy_score,
      tick,
      prevMetrics?.scores.legitimacy_score
    ),
    stability_index: buildTopMetric(
      'stability_index',
      metrics.stability.stability_index,
      tick,
      prevMetrics?.stability.stability_index
    ),
    gdp_per_capita: buildTopMetric(
      'gdp_per_capita',
      metrics.economy.gdp_per_capita,
      tick,
      prevMetrics?.economy.gdp_per_capita
    ),
    inflation_rate: buildTopMetric(
      'inflation_rate',
      metrics.economy.inflation_rate,
      tick,
      prevMetrics?.economy.inflation_rate
    ),
    gini_income: buildTopMetric(
      'gini_income',
      metrics.inequality.gini_income,
      tick,
      prevMetrics?.inequality.gini_income
    ),
    resource_stockpiles_summary: buildTopMetric(
      'resource_stockpiles_summary',
      resource_stockpiles_summary,
      tick,
      prevMetrics ? Math.round(
        ((prevMetrics.resources.resource_stockpiles.food / maxStock) + 
         (prevMetrics.resources.resource_stockpiles.energy / maxStock) + 
         (prevMetrics.resources.resource_stockpiles.water || 0) / maxStock + 
         (prevMetrics.resources.resource_stockpiles.materials / maxStock)) * 25
      ) : undefined
    ),
    research_throughput: buildTopMetric(
      'research_throughput',
      metrics.research.research_throughput,
      tick,
      prevMetrics?.research.research_throughput
    ),
    ethics_blocks_triggered: buildTopMetric(
      'ethics_blocks_triggered',
      metrics.ethics.ethics_blocks_triggered,
      tick,
      prevMetrics?.ethics.ethics_blocks_triggered
    ),
  };
}

// ============================================
// ALERTS GENERATOR
// ============================================

let alertIdCounter = 0;

export function generateAlerts(
  metrics: MetricsState,
  prevMetrics: MetricsState | undefined,
  tick: number
): Alert[] {
  const alerts: Alert[] = [];
  
  const createAlert = (
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    relatedMetrics: string[]
  ): Alert => ({
    id: `ALT-${++alertIdCounter}-${tick}`,
    type,
    severity,
    title,
    message,
    tick,
    timestamp: Date.now(),
    resolved: false,
    relatedMetrics,
  });

  // Inflation spike
  if (metrics.economy.inflation_rate > 8) {
    alerts.push(createAlert(
      'inflation_spike',
      metrics.economy.inflation_rate > 15 ? 'critical' : 'warning',
      'INFLATION SPIKE DETECTED',
      `Inflation rate has reached ${metrics.economy.inflation_rate.toFixed(1)}%`,
      ['inflation_rate', 'price_index_cpi']
    ));
  }

  // Resource collapse
  const stockpiles = metrics.resources.resource_stockpiles;
  if (stockpiles.food < 500 || stockpiles.energy < 500 || stockpiles.materials < 500) {
    alerts.push(createAlert(
      'resource_collapse',
      'critical',
      'RESOURCE SHORTAGE',
      'Critical resource levels detected. Supply chain intervention required.',
      ['resource_stockpiles_summary', 'supply_chain_health']
    ));
  }

  // Population crash
  if (prevMetrics && metrics.demography.population_total < prevMetrics.demography.population_total * 0.9) {
    alerts.push(createAlert(
      'population_crash',
      'critical',
      'POPULATION DECLINE',
      `Population decreased by ${((1 - metrics.demography.population_total / prevMetrics.demography.population_total) * 100).toFixed(1)}%`,
      ['population_total', 'death_rate']
    ));
  }

  // Dissent rising
  if (metrics.stability.dissent_index > 40) {
    alerts.push(createAlert(
      'dissent_rising',
      metrics.stability.dissent_index > 60 ? 'critical' : 'warning',
      'DISSENT LEVELS ELEVATED',
      `Dissent index at ${metrics.stability.dissent_index.toFixed(0)}. Social stability may be at risk.`,
      ['dissent_index', 'trust_in_system']
    ));
  }

  // Ethics override
  if (metrics.ethics.ethics_blocks_triggered > 0 && 
      (!prevMetrics || metrics.ethics.ethics_blocks_triggered > prevMetrics.ethics.ethics_blocks_triggered)) {
    alerts.push(createAlert(
      'ethics_override_triggered',
      'warning',
      'ETHICS BLOCK TRIGGERED',
      'The ethical framework has blocked an attempted action.',
      ['ethics_blocks_triggered', 'harm_proxy_score']
    ));
  }

  // Monoculture risk
  if (metrics.ethics.monoculture_risk_score > 50) {
    alerts.push(createAlert(
      'monoculture_risk',
      'warning',
      'MONOCULTURE RISK',
      `Trait diversity is declining. Monoculture risk: ${metrics.ethics.monoculture_risk_score.toFixed(0)}%`,
      ['monoculture_risk_score', 'trait_diversity_score']
    ));
  }

  // Supply chain break
  if (metrics.resources.supply_chain_health < 50) {
    alerts.push(createAlert(
      'supply_chain_break',
      metrics.resources.supply_chain_health < 30 ? 'critical' : 'warning',
      'SUPPLY CHAIN DISRUPTION',
      `Supply chain health at ${metrics.resources.supply_chain_health.toFixed(0)}%`,
      ['supply_chain_health', 'resource_stockpiles_summary']
    ));
  }

  // Stability warning
  if (metrics.stability.stability_index < 50) {
    alerts.push(createAlert(
      'stability_warning',
      metrics.stability.stability_index < 30 ? 'critical' : 'warning',
      'STABILITY WARNING',
      `System stability index at ${metrics.stability.stability_index.toFixed(0)}%`,
      ['stability_index', 'trust_in_system']
    ));
  }

  return alerts;
}

// ============================================
// FULL METRICS CALCULATOR
// ============================================

export function calculateAllMetrics(
  agents: Agent[],
  buildings: Building[],
  laws: Law[],
  economy: Economy,
  research: ResearchTree,
  ethics: EthicalFramework,
  stabilityIndex: number,
  tick: number,
  prevMetrics?: MetricsState,
  prevEconomy?: Economy
): {
  metrics: MetricsState;
  top10: Top10Metrics;
  alerts: Alert[];
} {
  const demography = calculateDemographyMetrics(agents, prevMetrics?.demography.population_total || 0, tick);
  const economyMetrics = calculateEconomyMetrics(agents, buildings, economy, prevEconomy);
  const inequality = calculateInequalityMetrics(agents);
  const resources = calculateResourceMetrics(buildings, economy);
  const governance = calculateGovernanceMetrics(laws, agents);
  const stability = calculateStabilityMetrics(agents, stabilityIndex);
  const qualityOfLife = calculateQualityOfLifeMetrics(agents, buildings);
  const researchMetrics = calculateResearchMetrics(research, agents);
  const agentEvolution = calculateAgentEvolutionMetrics(agents);
  const ethicsMetrics = calculateEthicsMetrics(ethics);

  const partialMetrics: Omit<MetricsState, 'scores'> = {
    demography,
    economy: economyMetrics,
    inequality,
    resources,
    governance,
    stability,
    qualityOfLife,
    research: researchMetrics,
    agentEvolution,
    ethics: ethicsMetrics,
  };

  const scores = calculateCompositeScores(partialMetrics as MetricsState);
  
  const metrics: MetricsState = {
    ...partialMetrics,
    scores,
  };

  const top10 = buildTop10Metrics(metrics, tick, prevMetrics);
  const alerts = generateAlerts(metrics, prevMetrics, tick);

  return { metrics, top10, alerts };
}
