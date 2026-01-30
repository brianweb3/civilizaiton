"use client";

import { useClawtownStore } from "@/store/simulation";

export default function EconomyPanel() {
  const economy = useClawtownStore((state) => state.economy);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toFixed(0);
  };

  const resources = [
    { name: "FOOD", value: economy.resourceDistribution.food, color: "#00ff88" },
    { name: "ENERGY", value: economy.resourceDistribution.energy, color: "#ffaa00" },
    { name: "MATERIALS", value: economy.resourceDistribution.materials, color: "#888888" },
    { name: "TECHNOLOGY", value: economy.resourceDistribution.technology, color: "#00ffff" },
  ];

  return (
    <div className="panel">
      <div className="panel-header">ECONOMY</div>
      <div className="p-4 space-y-4">
        {/* Currency Supply */}
        <div className="flex justify-between items-center">
          <span className="data-label">CURRENCY SUPPLY</span>
          <span className="text-xl text-[var(--accent-cyan)]">
            {formatNumber(economy.currencySupply)}
          </span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="data-label mb-1">TAXATION</div>
            <div className="text-[var(--text-primary)]">
              {(economy.taxationLevel * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="data-label mb-1">PRODUCTION</div>
            <div className="text-[var(--text-primary)]">
              {formatNumber(economy.productionOutput)}
            </div>
          </div>
        </div>

        {/* Inequality Index */}
        <div className="flex justify-between items-center">
          <span className="data-label">INEQUALITY INDEX</span>
          <span
            className={
              economy.inequalityIndex < 0.3
                ? "text-[var(--status-active)]"
                : economy.inequalityIndex < 0.5
                ? "text-[var(--status-warning)]"
                : "text-[var(--status-critical)]"
            }
          >
            {economy.inequalityIndex.toFixed(3)}
          </span>
        </div>

        {/* Resources */}
        <div className="pt-4 border-t border-[var(--grid-line)]">
          <div className="data-label mb-2">RESOURCE DISTRIBUTION</div>
          <div className="space-y-2">
            {resources.map((resource) => (
              <div key={resource.name} className="flex justify-between items-center">
                <span className="text-[11px]" style={{ color: resource.color }}>
                  {resource.name}
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {formatNumber(resource.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Events */}
        <div className="pt-4 border-t border-[var(--grid-line)]">
          <div className="data-label mb-2">RECENT MARKET EVENTS</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {economy.marketEvents.length > 0 ? (
              economy.marketEvents.slice(-5).reverse().map((event) => (
                <div key={event.id} className="text-[10px] text-[var(--text-muted)]">
                  T+{event.tick}: {event.description}
                </div>
              ))
            ) : (
              <div className="text-[10px] text-[var(--text-muted)]">
                NO RECENT EVENTS
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
