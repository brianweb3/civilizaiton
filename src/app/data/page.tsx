"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNocracyStore } from "@/store/simulation";
import { 
  MetricCategory, 
  CATEGORY_LABELS, 
  CATEGORY_COLORS,
  TimeRange,
  TIME_RANGES,
} from "@/types/metrics";
import { METRIC_DEFINITIONS, getMetricsByCategory, formatMetricValue } from "@/lib/metrics-definitions";
import { getMetricHistory } from "@/lib/metrics-calculator";
import { downloadJSON, downloadCSV, downloadPDF } from "@/lib/export-utils";
import Top10MetricCards from "@/components/Top10MetricCards";
import AlertsPanel from "@/components/AlertsPanel";

// Simple Chart Component
function MiniChart({ 
  data, 
  color, 
  height = 60,
}: { 
  data: { tick: number; value: number }[]; 
  color: string;
  height?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-16 bg-[var(--bg-secondary)] text-[var(--muted)] text-xs border border-[var(--grid-line)] rounded">
        NO DATA
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 200;
  const padding = 4;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // Area fill
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
  const areaPoints = `${firstX},${height - padding} ${points} ${lastX},${height - padding}`;

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={height - padding - ratio * (height - 2 * padding)}
            x2={width - padding}
            y2={height - padding - ratio * (height - 2 * padding)}
            stroke="var(--border)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.3"
          />
        ))}
        {/* Area */}
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity="0.15"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Min/Max labels */}
        <text x={width - padding} y={padding + 8} fill="var(--muted)" fontSize="8" textAnchor="end">
          {max.toFixed(1)}
        </text>
        <text x={width - padding} y={height - padding - 2} fill="var(--muted)" fontSize="8" textAnchor="end">
          {min.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

// Category Section Component
function CategorySection({ 
  category, 
  metrics,
  expanded,
  onToggle,
}: { 
  category: MetricCategory; 
  metrics: typeof METRIC_DEFINITIONS;
  expanded: boolean;
  onToggle: () => void;
}) {
  const storeMetrics = useNocracyStore((state) => state.metrics);
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  const getMetricValue = (id: string): number | null => {
    if (!storeMetrics) return null;
    
    // Navigate through the metrics structure using safer access
    const getCategoryData = (): Record<string, unknown> | null => {
      switch (category) {
        case 'demography': return storeMetrics.demography as unknown as Record<string, unknown>;
        case 'economy': return storeMetrics.economy as unknown as Record<string, unknown>;
        case 'inequality': return storeMetrics.inequality as unknown as Record<string, unknown>;
        case 'resources': return storeMetrics.resources as unknown as Record<string, unknown>;
        case 'governance': return storeMetrics.governance as unknown as Record<string, unknown>;
        case 'stability': return storeMetrics.stability as unknown as Record<string, unknown>;
        case 'qualityOfLife': return storeMetrics.qualityOfLife as unknown as Record<string, unknown>;
        case 'research': return storeMetrics.research as unknown as Record<string, unknown>;
        case 'agentEvolution': return storeMetrics.agentEvolution as unknown as Record<string, unknown>;
        case 'ethics': return storeMetrics.ethics as unknown as Record<string, unknown>;
        case 'scores': return storeMetrics.scores as unknown as Record<string, unknown>;
        default: return null;
      }
    };
    
    const data = getCategoryData();
    if (!data) return null;
    
    const value = data[id];
    return typeof value === 'number' ? value : null;
  };

  return (
    <div className="border border-[var(--grid-line)] bg-[var(--panel)]">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-3">
          <span 
            className="text-sm font-bold tracking-[0.15em] text-[var(--text)]"
            style={{ color }}
          >
            {label}
          </span>
          <span className="text-xs text-[var(--muted)] font-medium">
            {metrics.length} METRICS
          </span>
        </div>
        <span className="text-[var(--text)] text-sm font-bold">
          {expanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="divide-y divide-[var(--grid-line)]">
          {metrics.map((metric) => {
            const value = getMetricValue(metric.id);
            const history = getMetricHistory(metric.id);
            
            return (
              <div key={metric.id} className="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-sm font-bold text-[var(--text)] leading-tight">
                        {metric.name}
                      </h4>
                      {metric.unit && (
                        <span className="text-[10px] text-[var(--muted)] px-2 py-0.5 border border-[var(--grid-line)] bg-[var(--panel2)] font-mono">
                          {metric.unit}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
                      {metric.description}
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-mono font-bold text-[var(--text)]" style={{ color }}>
                        {value !== null ? formatMetricValue(value, metric) : '—'}
                      </span>
                    </div>
                    {/* Chart */}
                    <div className="mt-3">
                      <MiniChart data={history} color={color} height={60} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DataPage() {
  const router = useRouter();
  const { manifestAccepted, simulation, metrics, alerts, top10, agents, buildings, laws } = useNocracyStore();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<MetricCategory>>(new Set());
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeAgents, setIncludeAgents] = useState(false);

  // Redirect if manifest not accepted
  useEffect(() => {
    if (!manifestAccepted) {
      router.push("/");
    }
  }, [manifestAccepted, router]);

  const categories: MetricCategory[] = [
    'demography',
    'economy',
    'inequality',
    'resources',
    'governance',
    'stability',
    'qualityOfLife',
    'research',
    'agentEvolution',
    'ethics',
  ];

  const filteredCategories = useMemo(() => {
    if (selectedCategory === 'all') return categories;
    return categories.filter(c => c === selectedCategory);
  }, [selectedCategory]);

  const getFilteredMetrics = (category: MetricCategory) => {
    let categoryMetrics = getMetricsByCategory(category);
    if (searchTerm) {
      categoryMetrics = categoryMetrics.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return categoryMetrics;
  };

  const toggleCategory = (category: MetricCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-[var(--border)]">
        <div>
          <h1 className="text-2xl tracking-wider text-[var(--text)] font-bold mb-1">DATA OBSERVATORY</h1>
          <p className="text-xs text-[var(--muted)] font-medium">
            FULL METRICS INSPECTION • DOWNLOAD REPORTS • HISTORICAL DATA
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--muted)] font-medium mb-1">CURRENT TICK</div>
          <div className="text-xl font-mono text-[var(--text)] font-bold">
            T+{simulation.tick.toString().padStart(8, '0')}
          </div>
        </div>
      </div>

      {/* Top 10 Summary */}
      <div className="border border-[var(--grid-line)] p-5 bg-[var(--panel)]">
        <h2 className="text-sm tracking-[0.15em] text-[var(--text)] font-bold mb-4">
          TOP 10 KEY METRICS SUMMARY
        </h2>
        <Top10MetricCards />
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between gap-4 bg-[var(--panel)] p-4 border border-[var(--grid-line)]">
        <div className="flex items-center gap-4">
          {/* Time Range */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text)] font-medium">RANGE</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm text-[var(--text)] font-medium"
            >
              {Object.entries(TIME_RANGES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text)] font-medium">CATEGORY</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MetricCategory | 'all')}
              className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm text-[var(--text)] font-medium"
            >
              <option value="all">ALL CATEGORIES</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text)] font-medium">SEARCH</span>
            <input
              type="text"
              placeholder="metric name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--grid-line)] px-3 py-1.5 text-sm text-[var(--text)] font-medium w-48"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 text-xs font-medium border border-[var(--grid-line)] hover:border-[var(--text)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            EXPAND ALL
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 text-xs font-medium border border-[var(--grid-line)] hover:border-[var(--text)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            COLLAPSE ALL
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Metrics Table */}
        <div className="col-span-2 space-y-3">
          {filteredCategories.map((category) => {
            const categoryMetrics = getFilteredMetrics(category);
            if (categoryMetrics.length === 0) return null;
            
            return (
              <CategorySection
                key={category}
                category={category}
                metrics={categoryMetrics}
                expanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
              />
            );
          })}
        </div>

        {/* Right: Export Panel + Alerts */}
        <div className="space-y-4">
          {/* Export Panel */}
          <div className="border border-[var(--grid-line)] p-5 bg-[var(--panel)]">
            <h3 className="text-sm tracking-[0.15em] text-[var(--text)] font-bold mb-4">
              EXPORT DATA
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => downloadPDF(simulation, metrics, top10, alerts)}
                className="w-full px-4 py-3 text-sm border-2 border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors font-medium"
              >
                <div className="font-bold">DOWNLOAD PDF REPORT</div>
                <div className="text-xs opacity-70 mt-1">Full state report with charts</div>
              </button>
              
              <button
                onClick={() => downloadCSV(metrics, simulation.tick)}
                className="w-full px-4 py-2 text-sm border border-[var(--grid-line)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors font-medium"
              >
                DOWNLOAD CSV
              </button>
              
              <button
                onClick={() => downloadJSON({
                  exportedAt: new Date().toISOString(),
                  tick: simulation.tick,
                  simulation,
                  metrics,
                  top10,
                  alerts,
                  agents,
                  buildings,
                  laws,
                }, includeAgents)}
                className="w-full px-4 py-2 text-sm border border-[var(--grid-line)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors font-medium"
              >
                DOWNLOAD JSON SNAPSHOT
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--grid-line)]">
              <div className="text-xs text-[var(--text)] font-medium mb-3">EXPORT OPTIONS</div>
              <label className="flex items-center gap-2 text-sm text-[var(--text)] font-medium">
                <input 
                  type="checkbox" 
                  checked={includeCharts} 
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="accent-[var(--text)]" 
                />
                Include charts
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text)] font-medium mt-2">
                <input 
                  type="checkbox" 
                  checked={includeAlerts}
                  onChange={(e) => setIncludeAlerts(e.target.checked)}
                  className="accent-[var(--text)]" 
                />
                Include alerts
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text)] font-medium mt-2">
                <input 
                  type="checkbox" 
                  checked={includeAgents}
                  onChange={(e) => setIncludeAgents(e.target.checked)}
                  className="accent-[var(--text)]" 
                />
                Include agent data
              </label>
            </div>
          </div>

          {/* Alerts */}
          <AlertsPanel maxAlerts={10} />

          {/* Stats */}
          <div className="border border-[var(--grid-line)] p-5 bg-[var(--panel)]">
            <h3 className="text-sm tracking-[0.15em] text-[var(--text)] font-bold mb-4">
              DATA STATS
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text)] font-medium">Total Metrics</span>
                <span className="text-[var(--text)] font-mono font-bold">{METRIC_DEFINITIONS.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text)] font-medium">Categories</span>
                <span className="text-[var(--text)] font-mono font-bold">{categories.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text)] font-medium">Active Alerts</span>
                <span className="text-[var(--critical)] font-mono font-bold">{alerts.filter(a => !a.resolved).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text)] font-medium">Snapshots Stored</span>
                <span className="text-[var(--text)] font-mono font-bold">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
