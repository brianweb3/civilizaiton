"use client";

import { useNocracyStore } from "@/store/simulation";
import { TopMetric, MetricStatus } from "@/types/metrics";
import { getMetricDefinition, formatMetricValue } from "@/lib/metrics-definitions";

// Sparkline component
function Sparkline({ data, status }: { data: { tick: number; value: number }[]; status: MetricStatus }) {
  if (!data || data.length < 2) {
    return <div className="w-16 h-6 bg-[var(--bg-tertiary)] opacity-30" />;
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 64;
  const height = 24;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const statusColors: Record<MetricStatus, string> = {
    neutral: 'var(--text-muted)',
    positive: 'var(--accent-cyan)',
    warning: '#fbbf24',
    critical: '#ef4444',
  };

  const color = statusColors[status];

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Single metric card
function MetricCard({ metric, compact = false }: { metric: TopMetric; compact?: boolean }) {
  const definition = getMetricDefinition(metric.id);
  
  const statusColors: Record<MetricStatus, string> = {
    neutral: 'var(--text-muted)',
    positive: 'var(--accent-cyan)',
    warning: '#fbbf24',
    critical: '#ef4444',
  };

  const statusBg: Record<MetricStatus, string> = {
    neutral: 'transparent',
    positive: 'rgba(46, 139, 87, 0.08)',
    warning: 'rgba(194, 65, 12, 0.08)',
    critical: 'rgba(180, 35, 24, 0.12)',
  };

  const formattedValue = definition 
    ? formatMetricValue(metric.value, definition)
    : metric.value.toFixed(2);

  const deltaSign = metric.delta > 0 ? '+' : '';
  const deltaColor = metric.delta === 0 
    ? 'var(--muted)' 
    : definition?.higherIsBetter 
      ? (metric.delta > 0 ? 'var(--economy)' : 'var(--critical)')
      : (metric.delta < 0 ? 'var(--economy)' : 'var(--critical)');

  if (compact) {
    return (
      <div 
        className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-lg transition-all hover:border-[var(--research)] hover:shadow-sm"
        style={{ backgroundColor: statusBg[metric.status] }}
      >
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusColors[metric.status] }}
        />
        <span className="text-[8px] text-[var(--muted)] uppercase truncate flex-1">
          {metric.name}
        </span>
        <span 
          className="text-sm font-mono"
          style={{ color: statusColors[metric.status] === 'var(--muted)' ? 'var(--text)' : statusColors[metric.status] }}
        >
          {formattedValue}
        </span>
        <span className="text-[9px]" style={{ color: deltaColor }}>
          {deltaSign}{metric.delta.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-1 p-3 border border-[var(--border)] rounded-lg transition-all hover:border-[var(--research)] hover:shadow-sm"
      style={{ backgroundColor: statusBg[metric.status] }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] tracking-[0.15em] text-[var(--muted)] uppercase truncate">
          {metric.name}
        </span>
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusColors[metric.status] }}
        />
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between gap-2">
        <span 
          className="text-lg font-mono tracking-tight"
          style={{ color: statusColors[metric.status] === 'var(--muted)' ? 'var(--text)' : statusColors[metric.status] }}
        >
          {formattedValue}
        </span>
        <Sparkline data={metric.history} status={metric.status} />
      </div>

      {/* Delta row */}
      <div className="flex items-center gap-2 text-[10px]">
        <span style={{ color: deltaColor }}>
          {deltaSign}{metric.delta.toFixed(2)}
        </span>
        {metric.deltaPercent !== 0 && (
          <span className="text-[var(--muted)]">
            ({deltaSign}{metric.deltaPercent.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}

// Composite score card (larger)
function ScoreCard({ 
  name, 
  value, 
  history,
  color 
}: { 
  name: string; 
  value: number; 
  history?: { tick: number; value: number }[];
  color: string;
}) {
  const status: MetricStatus = value >= 70 ? 'positive' : value >= 40 ? 'warning' : 'critical';
  
  return (
    <div 
      className="flex flex-col gap-1 p-3 border border-[var(--border)] rounded-lg"
      style={{ borderColor: color, borderLeftWidth: '3px', backgroundColor: 'var(--panel)' }}
    >
      <span className="text-[9px] tracking-[0.15em] text-[var(--muted)] uppercase">
        {name}
      </span>
      <div className="flex items-center gap-3">
        <span 
          className="text-2xl font-mono font-bold"
          style={{ color }}
        >
          {Math.round(value)}
        </span>
        <div className="flex-1 h-1.5 bg-[var(--panel2)] overflow-hidden rounded-full">
          <div 
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {history && history.length > 1 && (
        <Sparkline data={history} status={status} />
      )}
    </div>
  );
}

export default function Top10MetricCards({ compact = false }: { compact?: boolean }) {
  const top10 = useNocracyStore((state) => state.top10);
  const scores = useNocracyStore((state) => state.scores);

  if (!top10 || !scores) {
    return (
      <div className={`grid ${compact ? 'grid-cols-5' : 'grid-cols-5'} gap-2 animate-pulse`}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`${compact ? 'h-10' : 'h-20'} bg-[var(--bg-secondary)] border border-[var(--grid-line)]`} />
        ))}
      </div>
    );
  }

  const metricsArray = [
    top10.population_total,
    top10.state_health_score,
    top10.legitimacy_score,
    top10.stability_index,
    top10.gdp_per_capita,
    top10.inflation_rate,
    top10.gini_income,
    top10.resource_stockpiles_summary,
    top10.research_throughput,
    top10.ethics_blocks_triggered,
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact Composite Scores */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2 p-2 border border-[var(--research)] rounded-lg bg-[rgba(42,116,184,0.08)]">
            <span className="text-[8px] text-[var(--muted)]">HEALTH</span>
            <span className="text-lg font-mono text-[var(--research)]">{Math.round(scores.state_health_score)}</span>
            <div className="flex-1 h-1 bg-[var(--panel2)] rounded-full">
              <div className="h-full bg-[var(--research)] rounded-full" style={{ width: `${scores.state_health_score}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 border border-[var(--ethics)] rounded-lg bg-[rgba(124,58,237,0.08)]">
            <span className="text-[8px] text-[var(--muted)]">LEGIT</span>
            <span className="text-lg font-mono text-[var(--ethics)]">{Math.round(scores.legitimacy_score)}</span>
            <div className="flex-1 h-1 bg-[var(--panel2)] rounded-full">
              <div className="h-full bg-[var(--ethics)] rounded-full" style={{ width: `${scores.legitimacy_score}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 border border-[var(--economy)] rounded-lg bg-[rgba(46,139,87,0.08)]">
            <span className="text-[8px] text-[var(--muted)]">EVOL</span>
            <span className="text-lg font-mono text-[var(--economy)]">{Math.round(scores.evolution_score)}</span>
            <div className="flex-1 h-1 bg-[var(--panel2)] rounded-full">
              <div className="h-full bg-[var(--economy)] rounded-full" style={{ width: `${scores.evolution_score}%` }} />
            </div>
          </div>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-5 gap-1">
          {metricsArray.map((metric) => (
            <MetricCard key={metric.id} metric={metric} compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Composite Scores - Top Bar */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard 
          name="State Health" 
          value={scores.state_health_score}
          history={top10.state_health_score.history}
          color="var(--research)"
        />
        <ScoreCard 
          name="Legitimacy" 
          value={scores.legitimacy_score}
          history={top10.legitimacy_score.history}
          color="var(--ethics)"
        />
        <ScoreCard 
          name="Evolution" 
          value={scores.evolution_score}
          color="var(--economy)"
        />
      </div>

      {/* Top 10 Metrics Grid */}
      <div className="grid grid-cols-5 gap-2">
        {metricsArray.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  );
}
