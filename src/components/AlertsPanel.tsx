"use client";

import { useClawtownStore } from "@/store/simulation";
import { Alert, AlertSeverity } from "@/types/metrics";

const severityConfig: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
  info: {
    color: 'var(--research)',
    bg: 'rgba(42, 116, 184, 0.08)',
    label: 'INFO',
  },
  warning: {
    color: 'var(--alerts)',
    bg: 'rgba(194, 65, 12, 0.08)',
    label: 'WARN',
  },
  critical: {
    color: 'var(--critical)',
    bg: 'rgba(180, 35, 24, 0.12)',
    label: 'CRIT',
  },
};

function AlertItem({ alert }: { alert: Alert }) {
  const config = severityConfig[alert.severity];
  const timeSince = Math.floor((Date.now() - alert.timestamp) / 1000);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div 
      className="border-l-2 px-3 py-2 rounded transition-all hover:bg-[var(--panel2)]"
      style={{ borderColor: config.color, backgroundColor: config.bg }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[8px] px-1.5 py-0.5 font-bold tracking-wider rounded"
              style={{ backgroundColor: config.color, color: 'white' }}
            >
              {config.label}
            </span>
            <span className="text-[10px] text-[var(--muted)] font-mono">
              T+{alert.tick.toString().padStart(6, '0')}
            </span>
          </div>
          <h4 
            className="text-xs font-bold tracking-wide mb-0.5 truncate"
            style={{ color: config.color }}
          >
            {alert.title}
          </h4>
          <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">
            {alert.message}
          </p>
        </div>
        <span className="text-[9px] text-[var(--text-muted)] whitespace-nowrap">
          {formatTime(timeSince)}
        </span>
      </div>
    </div>
  );
}

interface AlertsPanelProps {
  maxAlerts?: number;
  compact?: boolean;
}

export default function AlertsPanel({ maxAlerts = 10, compact = false }: AlertsPanelProps) {
  const alerts = useClawtownStore((state) => state.alerts);
  
  const unresolvedAlerts = alerts.filter(a => !a.resolved).slice(0, maxAlerts);
  const criticalCount = unresolvedAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = unresolvedAlerts.filter(a => a.severity === 'warning').length;

  if (unresolvedAlerts.length === 0) {
    return (
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[var(--economy)] rounded-full" />
          <h3 className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase">
            SYSTEM ALERTS
          </h3>
        </div>
        <p className="text-[10px] text-[var(--muted)] text-center py-2">
          NO ACTIVE ALERTS
        </p>
        <p className="text-[9px] text-[var(--muted)] text-center opacity-50">
          System operating within normal parameters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${criticalCount > 0 ? 'bg-[var(--critical)]' : 'bg-[var(--alerts)]'} animate-pulse`} />
          <h3 className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase">
            SYSTEM ALERTS
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[8px]">
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 bg-[var(--critical)] text-white font-bold rounded">
              {criticalCount} CRIT
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-1.5 py-0.5 bg-[var(--alerts)] text-white font-bold rounded">
              {warningCount} WARN
            </span>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${compact ? 'max-h-48' : ''}`}>
        {unresolvedAlerts.map((alert, idx) => (
          <div key={alert.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
            <AlertItem alert={alert} />
          </div>
        ))}
      </div>

      {/* Footer */}
      {alerts.filter(a => !a.resolved).length > maxAlerts && (
        <div className="px-3 py-2 border-t border-[var(--border)] shrink-0">
          <p className="text-[9px] text-[var(--muted)] text-center">
            +{alerts.filter(a => !a.resolved).length - maxAlerts} more alerts
          </p>
        </div>
      )}
    </div>
  );
}
