// CLAWTOWN EXPORT UTILITIES
// CSV, JSON, and PDF export functionality

import type { MetricsState, Top10Metrics, Alert, StateSnapshot, MetricCategory } from '@/types/metrics';
import { CATEGORY_LABELS } from '@/types/metrics';
import type { SimulationState, Agent, Building, Law } from '@/types/simulation';
import { METRIC_DEFINITIONS, getMetricsByCategory, formatMetricValue } from './metrics-definitions';

// ============================================
// JSON EXPORT
// ============================================

export interface ExportData {
  exportedAt: string;
  tick: number;
  simulation: SimulationState;
  metrics: MetricsState | null;
  top10: Top10Metrics | null;
  alerts: Alert[];
  agents?: Agent[];
  buildings?: Building[];
  laws?: Law[];
}

export function exportToJSON(
  data: ExportData,
  includeAgents: boolean = false
): string {
  const exportPayload = {
    ...data,
    agents: includeAgents ? data.agents : undefined,
    buildings: includeAgents ? data.buildings : undefined,
    laws: includeAgents ? data.laws : undefined,
  };
  
  return JSON.stringify(exportPayload, null, 2);
}

export function downloadJSON(data: ExportData, includeAgents: boolean = false): void {
  const json = exportToJSON(data, includeAgents);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `clawtown-snapshot-${data.tick}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// CSV EXPORT
// ============================================

export function exportToCSV(metrics: MetricsState | null): string {
  if (!metrics) return 'No metrics data available';
  
  const rows: string[] = [];
  
  // Header
  rows.push('Category,Metric ID,Metric Name,Value,Unit,Description');
  
  const categories: MetricCategory[] = [
    'demography', 'economy', 'inequality', 'resources', 
    'governance', 'stability', 'qualityOfLife', 'research', 
    'agentEvolution', 'ethics', 'scores'
  ];
  
  for (const category of categories) {
    const categoryMetrics = getMetricsByCategory(category);
    
    for (const def of categoryMetrics) {
      let value: number | null = null;
      
      // Extract value from metrics structure
      const categoryData = getCategoryData(metrics, category);
      if (categoryData && typeof categoryData === 'object') {
        value = (categoryData as Record<string, number>)[def.id] ?? null;
      }
      
      const formattedValue = value !== null ? formatMetricValue(value, def) : 'N/A';
      const escapedDesc = `"${def.description.replace(/"/g, '""')}"`;
      
      rows.push(`${CATEGORY_LABELS[category]},${def.id},${def.name},${formattedValue},${def.unit},${escapedDesc}`);
    }
  }
  
  return rows.join('\n');
}

function getCategoryData(metrics: MetricsState, category: MetricCategory): unknown {
  switch (category) {
    case 'demography': return metrics.demography;
    case 'economy': return metrics.economy;
    case 'inequality': return metrics.inequality;
    case 'resources': return metrics.resources;
    case 'governance': return metrics.governance;
    case 'stability': return metrics.stability;
    case 'qualityOfLife': return metrics.qualityOfLife;
    case 'research': return metrics.research;
    case 'agentEvolution': return metrics.agentEvolution;
    case 'ethics': return metrics.ethics;
    case 'scores': return metrics.scores;
    default: return null;
  }
}

export function downloadCSV(metrics: MetricsState | null, tick: number): void {
  const csv = exportToCSV(metrics);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `clawtown-metrics-${tick}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// PDF EXPORT (using basic HTML rendering)
// ============================================

export function generatePDFContent(
  simulation: SimulationState,
  metrics: MetricsState | null,
  top10: Top10Metrics | null,
  alerts: Alert[],
  includeCharts: boolean = true,
  includeAlerts: boolean = true
): string {
  const timestamp = new Date().toISOString();
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Clawtown STATE REPORT - T+${simulation.tick}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0a;
      color: #e0e0e0;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 24px;
      color: #00ffff;
      letter-spacing: 0.2em;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 14px;
      color: #888;
      letter-spacing: 0.15em;
      margin: 24px 0 12px;
      border-bottom: 1px solid #333;
      padding-bottom: 4px;
    }
    h3 {
      font-size: 12px;
      color: #00ffff;
      margin: 16px 0 8px;
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .meta {
      font-size: 10px;
      color: #666;
    }
    .scores {
      display: flex;
      gap: 24px;
      margin: 16px 0;
    }
    .score {
      text-align: center;
      padding: 16px;
      border: 1px solid #333;
      min-width: 120px;
    }
    .score-value {
      font-size: 32px;
      font-weight: bold;
    }
    .score-label {
      font-size: 10px;
      color: #888;
      margin-top: 4px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #1a1a1a;
      font-size: 11px;
    }
    .metric-name { color: #888; }
    .metric-value { color: #00ffff; font-weight: bold; }
    .alert {
      padding: 8px 12px;
      margin: 4px 0;
      border-left: 3px solid;
      font-size: 11px;
    }
    .alert-critical { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .alert-warning { border-color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
    .alert-info { border-color: #00ffff; background: rgba(0, 255, 255, 0.05); }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #333;
      font-size: 9px;
      color: #666;
      text-align: center;
    }
    @media print {
      body { background: white; color: black; }
      .score-value { color: #0066cc; }
      .metric-value { color: #0066cc; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Clawtown</h1>
    <div class="meta">STATE REPORT</div>
    <div class="meta">Generated: ${timestamp}</div>
    <div class="meta">Simulation Tick: T+${simulation.tick.toString().padStart(8, '0')}</div>
    <div class="meta">Governance Mode: ${simulation.governanceMode}</div>
  </div>
`;

  // Composite Scores
  if (metrics?.scores) {
    const healthColor = metrics.scores.state_health_score >= 70 ? '#4ade80' : metrics.scores.state_health_score >= 40 ? '#fbbf24' : '#ef4444';
    const legitColor = metrics.scores.legitimacy_score >= 70 ? '#4ade80' : metrics.scores.legitimacy_score >= 40 ? '#fbbf24' : '#ef4444';
    const evolColor = metrics.scores.evolution_score >= 70 ? '#4ade80' : metrics.scores.evolution_score >= 40 ? '#fbbf24' : '#ef4444';
    
    html += `
  <h2>COMPOSITE SCORES</h2>
  <div class="scores">
    <div class="score">
      <div class="score-value" style="color: ${healthColor}">${Math.round(metrics.scores.state_health_score)}</div>
      <div class="score-label">STATE HEALTH</div>
    </div>
    <div class="score">
      <div class="score-value" style="color: ${legitColor}">${Math.round(metrics.scores.legitimacy_score)}</div>
      <div class="score-label">LEGITIMACY</div>
    </div>
    <div class="score">
      <div class="score-value" style="color: ${evolColor}">${Math.round(metrics.scores.evolution_score)}</div>
      <div class="score-label">EVOLUTION</div>
    </div>
  </div>
`;
  }

  // Top 10 Metrics
  if (top10) {
    html += `
  <h2>TOP 10 KEY METRICS</h2>
`;
    const top10Array = [
      { name: 'Population Total', value: top10.population_total.value, delta: top10.population_total.delta },
      { name: 'State Health Score', value: top10.state_health_score.value, delta: top10.state_health_score.delta },
      { name: 'Legitimacy Score', value: top10.legitimacy_score.value, delta: top10.legitimacy_score.delta },
      { name: 'Stability Index', value: top10.stability_index.value, delta: top10.stability_index.delta },
      { name: 'GDP Per Capita', value: top10.gdp_per_capita.value, delta: top10.gdp_per_capita.delta },
      { name: 'Inflation Rate', value: top10.inflation_rate.value, delta: top10.inflation_rate.delta },
      { name: 'Gini Income', value: top10.gini_income.value, delta: top10.gini_income.delta },
      { name: 'Resource Stockpiles', value: top10.resource_stockpiles_summary.value, delta: top10.resource_stockpiles_summary.delta },
      { name: 'Research Throughput', value: top10.research_throughput.value, delta: top10.research_throughput.delta },
      { name: 'Ethics Blocks', value: top10.ethics_blocks_triggered.value, delta: top10.ethics_blocks_triggered.delta },
    ];
    
    for (const metric of top10Array) {
      const deltaStr = metric.delta >= 0 ? `+${metric.delta.toFixed(2)}` : metric.delta.toFixed(2);
      html += `
  <div class="metric-row">
    <span class="metric-name">${metric.name}</span>
    <span class="metric-value">${metric.value.toFixed(2)} (${deltaStr})</span>
  </div>
`;
    }
  }

  // Alerts
  if (includeAlerts && alerts.length > 0) {
    const unresolvedAlerts = alerts.filter(a => !a.resolved).slice(0, 10);
    if (unresolvedAlerts.length > 0) {
      html += `
  <h2>ACTIVE ALERTS</h2>
`;
      for (const alert of unresolvedAlerts) {
        const alertClass = alert.severity === 'critical' ? 'alert-critical' : alert.severity === 'warning' ? 'alert-warning' : 'alert-info';
        html += `
  <div class="alert ${alertClass}">
    <strong>${alert.title}</strong><br>
    ${alert.message}
  </div>
`;
      }
    }
  }

  // All Categories (summary)
  if (metrics) {
    const categories: MetricCategory[] = [
      'demography', 'economy', 'inequality', 'resources', 
      'governance', 'stability', 'qualityOfLife', 'research', 
      'agentEvolution', 'ethics'
    ];
    
    for (const category of categories) {
      const categoryMetrics = getMetricsByCategory(category);
      const categoryData = getCategoryData(metrics, category) as Record<string, number> | null;
      
      if (!categoryData) continue;
      
      html += `
  <h2>${CATEGORY_LABELS[category]}</h2>
`;
      for (const def of categoryMetrics.slice(0, 8)) { // Limit to 8 per category
        const value = categoryData[def.id];
        if (value === undefined) continue;
        
        const formattedValue = formatMetricValue(value, def);
        html += `
  <div class="metric-row">
    <span class="metric-name">${def.name}</span>
    <span class="metric-value">${formattedValue}</span>
  </div>
`;
      }
    }
  }

  html += `
  <div class="footer">
    Clawtown • ALL DATA PUBLIC • OBSERVE ONLY
  </div>
</body>
</html>
`;

  return html;
}

export function downloadPDF(
  simulation: SimulationState,
  metrics: MetricsState | null,
  top10: Top10Metrics | null,
  alerts: Alert[]
): void {
  const html = generatePDFContent(simulation, metrics, top10, alerts);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Trigger print dialog after load
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
