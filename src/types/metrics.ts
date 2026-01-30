// CLAWTOWN METRICS SYSTEM
// Complete metrics model for evaluating the state of the territory

// ============================================
// METRIC CATEGORIES
// ============================================

export interface DemographyMetrics {
  population_total: number;
  population_growth_rate: number;
  birth_rate: number;
  death_rate: number;
  median_age: number;
  dependency_ratio: number;
  migration_rate: number;
}

export interface EconomyMetrics {
  gdp_total_output: number;
  gdp_per_capita: number;
  productivity_per_worker: number;
  employment_rate: number;
  median_income: number;
  price_index_cpi: number;
  inflation_rate: number;
  money_supply: number;
  money_velocity: number;
  tax_revenue: number;
  gov_spending: number;
  budget_balance: number;
  reserves: number;
  trade_balance: number;
}

export interface InequalityMetrics {
  gini_income: number;
  wealth_concentration_top1: number;
  poverty_rate: number;
  social_mobility_index: number;
  access_index: number;
}

export interface ResourceMetrics {
  energy_supply: number;
  energy_demand: number;
  resource_stockpiles: {
    food: number;
    energy: number;
    water: number;
    materials: number;
  };
  extraction_rate: number;
  depletion_rate: number;
  infrastructure_index: number;
  maintenance_load: number;
  supply_chain_health: number;
  resilience_score: number;
}

export interface GovernanceMetrics {
  active_law_count: number;
  law_churn_rate: number;
  compliance_rate: number;
  enforcement_cost: number;
  admin_overhead: number;
  rule_consistency_score: number;
  time_to_policy: number;
  decision_transparency_score: number;
}

export interface StabilityMetrics {
  conflict_rate: number;
  violence_index: number;
  dissent_index: number;
  trust_in_system: number;
  factionalism_index: number;
  security_incident_count: number;
  stability_index: number;
}

export interface QualityOfLifeMetrics {
  wellbeing_index: number;
  health_index: number;
  education_index: number;
  leisure_time_index: number;
  creativity_output_rate: number;
}

export interface ResearchMetrics {
  research_throughput: number;
  breakthrough_rate: number;
  tech_tree_depth: number;
  adoption_rate: number;
  knowledge_diffusion_score: number;
}

export interface AgentEvolutionMetrics {
  mutation_rate: number;
  trait_diversity_score: number;
  selection_pressure_index: number;
  role_evolution_rate: number;
  cooperation_vs_defection_ratio: number;
  emergent_institutions_count: number;
}

export interface EthicsMetrics {
  ethics_violations_attempted: number;
  ethics_blocks_triggered: number;
  judicial_overrides: number;
  time_to_correction: number;
  harm_proxy_score: number;
  love_equation_score: number;
  monoculture_risk_score: number;
}

// ============================================
// COMPOSITE SCORES
// ============================================

export interface CompositeScores {
  state_health_score: number;      // 0-100: economy + resources + stability + QoL + resilience
  legitimacy_score: number;        // 0-100: trust + compliance + fairness + transparency + consistency
  evolution_score: number;         // 0-100: research + breakthroughs + adoption + diversity + institutions
}

// ============================================
// FULL METRICS STATE
// ============================================

export interface MetricsState {
  demography: DemographyMetrics;
  economy: EconomyMetrics;
  inequality: InequalityMetrics;
  resources: ResourceMetrics;
  governance: GovernanceMetrics;
  stability: StabilityMetrics;
  qualityOfLife: QualityOfLifeMetrics;
  research: ResearchMetrics;
  agentEvolution: AgentEvolutionMetrics;
  ethics: EthicsMetrics;
  scores: CompositeScores;
}

// ============================================
// TOP 10 METRICS
// ============================================

export interface MetricDataPoint {
  tick: number;
  value: number;
  timestamp: number;
}

export type MetricStatus = 'neutral' | 'positive' | 'warning' | 'critical';

export interface TopMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  delta: number;
  deltaPercent: number;
  unit: string;
  history: MetricDataPoint[];
  status: MetricStatus;
  description: string;
}

export interface Top10Metrics {
  population_total: TopMetric;
  state_health_score: TopMetric;
  legitimacy_score: TopMetric;
  stability_index: TopMetric;
  gdp_per_capita: TopMetric;
  inflation_rate: TopMetric;
  gini_income: TopMetric;
  resource_stockpiles_summary: TopMetric;
  research_throughput: TopMetric;
  ethics_blocks_triggered: TopMetric;
}

// ============================================
// ALERTS
// ============================================

export type AlertType =
  | 'inflation_spike'
  | 'resource_collapse'
  | 'population_crash'
  | 'law_contradiction_detected'
  | 'dissent_rising'
  | 'ethics_override_triggered'
  | 'monoculture_risk'
  | 'supply_chain_break'
  | 'stability_warning'
  | 'economic_crisis'
  | 'research_breakthrough';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  tick: number;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  relatedMetrics: string[];
}

// ============================================
// STATE SNAPSHOT (for storage and export)
// ============================================

export interface StateSnapshot {
  id: string;
  sim_time: string;
  tick: number;
  timestamp: number;
  top10: Top10Metrics;
  scores: CompositeScores;
  metrics: MetricsState;
  alerts: Alert[];
  recent_events: RecentEvent[];
}

export interface RecentEvent {
  id: string;
  tick: number;
  timestamp: number;
  type: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

// ============================================
// EXPORT TYPES
// ============================================

export type ExportFormat = 'pdf' | 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  timeRange: TimeRange;
  includeCharts: boolean;
  includeAlerts: boolean;
  categories: string[];
}

export type TimeRange = '1h' | '24h' | '7d' | '30d' | 'all' | 'custom';

export interface TimeRangeConfig {
  label: string;
  ticks: number;
  milliseconds: number;
}

export const TIME_RANGES: Record<TimeRange, TimeRangeConfig> = {
  '1h': { label: 'Last Hour', ticks: 3600, milliseconds: 3600000 },
  '24h': { label: 'Last 24 Hours', ticks: 86400, milliseconds: 86400000 },
  '7d': { label: 'Last 7 Days', ticks: 604800, milliseconds: 604800000 },
  '30d': { label: 'Last 30 Days', ticks: 2592000, milliseconds: 2592000000 },
  'all': { label: 'All Time', ticks: Infinity, milliseconds: Infinity },
  'custom': { label: 'Custom Range', ticks: 0, milliseconds: 0 },
};

// ============================================
// METRIC DEFINITIONS (for UI rendering)
// ============================================

export interface MetricDefinition {
  id: string;
  name: string;
  category: MetricCategory;
  unit: string;
  description: string;
  format: 'number' | 'percent' | 'currency' | 'index';
  precision: number;
  thresholds: {
    warning: { min?: number; max?: number };
    critical: { min?: number; max?: number };
  };
  higherIsBetter: boolean;
}

export type MetricCategory =
  | 'demography'
  | 'economy'
  | 'inequality'
  | 'resources'
  | 'governance'
  | 'stability'
  | 'qualityOfLife'
  | 'research'
  | 'agentEvolution'
  | 'ethics'
  | 'scores';

export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  demography: 'DEMOGRAPHY & SOCIETY',
  economy: 'ECONOMY & PRODUCTION',
  inequality: 'INEQUALITY & MOBILITY',
  resources: 'RESOURCES & INFRASTRUCTURE',
  governance: 'GOVERNANCE & INSTITUTIONS',
  stability: 'STABILITY & SECURITY',
  qualityOfLife: 'QUALITY OF LIFE',
  research: 'RESEARCH & PROGRESS',
  agentEvolution: 'AGENT EVOLUTION',
  ethics: 'ETHICS & ALIGNMENT',
  scores: 'COMPOSITE SCORES',
};

export const CATEGORY_COLORS: Record<MetricCategory, string> = {
  demography: '#22d3ee',
  economy: '#4ade80',
  inequality: '#f97316',
  resources: '#a78bfa',
  governance: '#fbbf24',
  stability: '#ef4444',
  qualityOfLife: '#ec4899',
  research: '#3b82f6',
  agentEvolution: '#14b8a6',
  ethics: '#f472b6',
  scores: '#00ffff',
};
