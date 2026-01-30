"use client";

import type {
  InspectorData,
  TileInspector,
  BuildingInspector,
  CitizenInspector,
  DistrictInspector,
  HeatmapType,
} from "@/types/tilemap";

interface InspectorPanelProps {
  data: InspectorData | null;
  onClose: () => void;
}

const HEATMAP_LABELS: Record<HeatmapType, string> = {
  POP: "Population Density",
  WEALTH: "Wealth Level",
  CONFLICT: "Conflict Risk",
  PROD: "Productivity",
  HAPPINESS: "Happiness Index",
  RESEARCH: "Research Activity",
  NONE: "None",
};

export default function InspectorPanel({ data, onClose }: InspectorPanelProps) {
  if (!data || !data.data) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-secondary)] p-3 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)]">
        <div className="text-center animate-pulse">
          <div className="text-lg mb-1 opacity-30">⊙</div>
          <div className="text-[var(--text-secondary)] font-mono text-[8px] tracking-wide uppercase">
            Click map to inspect
          </div>
        </div>
      </div>
    );
  }

  const formatNumber = (n: number, decimals = 0) =>
    n.toLocaleString(undefined, { maximumFractionDigits: decimals });

  const formatMoney = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  const renderTile = (tile: TileInspector) => (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-1">
        <span className="text-[var(--openclaw-red)] font-mono font-normal text-[8px] tracking-wide uppercase">
          Tile
        </span>
        <span className="text-[var(--text-secondary)] text-[8px] font-mono">
          ({tile.x}, {tile.y})
        </span>
      </div>

      <div>
        <div className="text-[7px] text-[var(--text-secondary)] mb-0.5 tracking-wide uppercase">
          Terrain type
        </div>
        <div className="text-[9px] text-[var(--text)] font-medium">{tile.terrain}</div>
      </div>

      {tile.district && (
        <div>
          <div className="text-[7px] text-[var(--text-secondary)] mb-0.5 tracking-wide uppercase">
            District
          </div>
          <div className="text-[9px] text-[var(--text)]">{tile.district.name}</div>
          <div className="text-[8px] text-[var(--text-secondary)] mt-0.5">{tile.district.type}</div>
        </div>
      )}

      <div>
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          Heatmap values
        </div>
        <div className="space-y-2">
          {(Object.keys(tile.heatmapValues) as HeatmapType[])
            .filter((k) => k !== "NONE")
            .map((key) => (
              <div key={key} className="animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {HEATMAP_LABELS[key]}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text)] font-semibold">
                    {(tile.heatmapValues[key] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full rounded-[var(--radius)] transition-all duration-500"
                    style={{
                      width: `${tile.heatmapValues[key] * 100}%`,
                      backgroundColor:
                        key === "POP"
                          ? "var(--status-ok)"
                          : key === "WEALTH"
                            ? "var(--openclaw-red)"
                            : key === "CONFLICT"
                              ? "var(--critical)"
                              : key === "PROD"
                                ? "var(--openclaw-red)"
                                : key === "HAPPINESS"
                                  ? "var(--status-ok)"
                                  : "var(--openclaw-red)",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          Tile statistics
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Grid position</div>
            <div className="text-[var(--text)] font-mono font-semibold">
              {tile.x}, {tile.y}
            </div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Terrain</div>
            <div className="text-[var(--text)] font-semibold">{tile.terrain}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBuilding = (building: BuildingInspector) => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-[var(--openclaw-red)] font-mono font-semibold text-[10px] tracking-wider uppercase">
          Building
        </span>
        <span className="text-[var(--text-secondary)] text-[10px] font-mono">
          {building.id.slice(0, 8)}
        </span>
      </div>

      <div>
        <div className="text-sm text-[var(--text)] font-semibold">{building.name}</div>
        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{building.type}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] p-2 animate-fade-in">
          <div className="text-[8px] text-[var(--text-secondary)] mb-1 uppercase">Level</div>
          <div className="text-xl text-[var(--openclaw-red)] font-mono font-bold animate-number">
            {building.level}
          </div>
        </div>
        <div
          className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] p-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="text-[8px] text-[var(--text-secondary)] mb-1 uppercase">Workers</div>
          <div className="text-xl text-[var(--openclaw-red)] font-mono font-bold animate-number">
            {building.workers}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] text-[var(--text-secondary)] tracking-wide uppercase">
            Productivity
          </div>
          <div className="text-[10px] font-mono text-[var(--text)] font-semibold">
            {(building.productivity * 100).toFixed(1)}%
          </div>
        </div>
        <div className="w-full h-2.5 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
          <div
            className="h-full bg-[var(--openclaw-red)] rounded-[var(--radius)] transition-all duration-500"
            style={{ width: `${building.productivity * 100}%` }}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          Economic impact
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center animate-fade-in bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
              Housing capacity
            </span>
            <span className="text-[11px] text-[var(--text)] font-mono font-semibold">
              {building.impact.population} residents
            </span>
          </div>
          <div
            className="flex justify-between items-center animate-fade-in bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
              Economic output
            </span>
            <span className="text-[11px] text-[var(--openclaw-red)] font-mono font-semibold">
              +{formatMoney(building.impact.economy)}/tick
            </span>
          </div>
          <div
            className="flex justify-between items-center animate-fade-in bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
              Research points
            </span>
            <span className="text-[11px] text-[var(--openclaw-red)] font-mono font-semibold">
              +{building.impact.research} pts/tick
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          Building statistics
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Type</div>
            <div className="text-[var(--text)] font-semibold">{building.type}</div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Efficiency</div>
            <div className="text-[var(--text)] font-mono font-semibold">
              {(building.productivity * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCitizen = (citizen: CitizenInspector) => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-[var(--openclaw-red)] font-mono font-semibold text-[10px] tracking-wider uppercase">
          Citizen
        </span>
        <span className="text-[var(--text-secondary)] text-[10px] font-mono">
          {citizen.id.slice(0, 8)}
        </span>
      </div>

      <div>
        <div className="text-sm text-[var(--text)] font-semibold">{citizen.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-2 py-1 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] font-medium">
            {citizen.role}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)]">Age: {citizen.age}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] p-2 animate-fade-in">
          <div className="text-[8px] text-[var(--text-secondary)] mb-1 uppercase">Money</div>
          <div className="text-xl text-[var(--openclaw-red)] font-mono font-bold animate-number">
            {formatMoney(citizen.money)}
          </div>
        </div>
        <div
          className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] p-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="text-[8px] text-[var(--text-secondary)] mb-1 uppercase">Productivity</div>
          <div className="text-xl text-[var(--openclaw-red)] font-mono font-bold animate-number">
            {(citizen.productivity * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] text-[var(--text-secondary)] tracking-wide uppercase">
            Happiness
          </div>
          <div className="text-[10px] font-mono text-[var(--text)] font-semibold">
            {(citizen.happiness * 100).toFixed(1)}%
          </div>
        </div>
        <div className="w-full h-2.5 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
          <div
            className="h-full rounded-[var(--radius)] transition-all duration-500"
            style={{
              width: `${citizen.happiness * 100}%`,
              backgroundColor:
                citizen.happiness > 0.7
                  ? "var(--status-ok)"
                  : citizen.happiness > 0.4
                    ? "var(--alerts)"
                    : "var(--critical)",
            }}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          Contributions
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center animate-fade-in bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">Tax paid</span>
            <span className="text-[11px] text-[var(--openclaw-red)] font-mono font-semibold">
              {formatMoney(citizen.impact.taxPaid)}
            </span>
          </div>
          <div
            className="flex justify-between items-center animate-fade-in bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
              Laws affected by
            </span>
            <span className="text-[11px] text-[var(--text)] font-mono font-semibold">
              {citizen.impact.lawsAffectedBy}
            </span>
          </div>
          <div
            className="flex justify-between items-center animate-fade-in bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
              Buildings built
            </span>
            <span className="text-[11px] text-[var(--text)] font-mono font-semibold">
              {citizen.impact.buildingsBuilt}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          Citizen statistics
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Role</div>
            <div className="text-[var(--text)] font-semibold">{citizen.role}</div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Age</div>
            <div className="text-[var(--text)] font-mono font-semibold">{citizen.age}</div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Wealth</div>
            <div className="text-[var(--text)] font-mono font-semibold">
              {formatMoney(citizen.money)}
            </div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Status</div>
            <div className="text-[var(--text)] font-semibold">
              {citizen.happiness > 0.7 ? "Content" : citizen.happiness > 0.4 ? "Neutral" : "Unhappy"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDistrict = (district: DistrictInspector) => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-[var(--openclaw-red)] font-mono font-semibold text-[10px] tracking-wider uppercase">
          District
        </span>
        <span className="text-[var(--text-secondary)] text-[10px] font-mono">
          {district.id.slice(0, 8)}
        </span>
      </div>

      <div>
        <div className="text-sm text-[var(--text)] font-semibold">{district.name}</div>
        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{district.type}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] p-2 animate-fade-in">
          <div className="text-[8px] text-[var(--text-secondary)] mb-1 uppercase">Population</div>
          <div className="text-xl text-[var(--openclaw-red)] font-mono font-bold animate-number">
            {formatNumber(district.stats.population)}
          </div>
        </div>
        <div
          className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] p-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="text-[8px] text-[var(--text-secondary)] mb-1 uppercase">Buildings</div>
          <div className="text-xl text-[var(--openclaw-red)] font-mono font-bold animate-number">
            {district.stats.buildings}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          District metrics
        </div>
        <div className="space-y-3">
          <div className="animate-fade-in">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--text-secondary)] font-medium">Average wealth</span>
              <span className="text-[var(--text)] font-mono font-semibold">
                {formatMoney(district.stats.avgWealth)}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--openclaw-red)] rounded-[var(--radius)] transition-all duration-500"
                style={{
                  width: `${Math.min(100, (district.stats.avgWealth / 10000) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--text-secondary)] font-medium">Happiness</span>
              <span className="text-[var(--text)] font-mono font-semibold">
                {(district.stats.avgHappiness * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--status-ok)] rounded-[var(--radius)] transition-all duration-500"
                style={{ width: `${district.stats.avgHappiness * 100}%` }}
              />
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--text-secondary)] font-medium">Productivity</span>
              <span className="text-[var(--text)] font-mono font-semibold">
                {(district.stats.productivity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--openclaw-red)] rounded-[var(--radius)] transition-all duration-500"
                style={{ width: `${district.stats.productivity * 100}%` }}
              />
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--text-secondary)] font-medium">Dissent level</span>
              <span className="text-[var(--text)] font-mono font-semibold">
                {(district.stats.dissent * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--panel2)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--critical)] rounded-[var(--radius)] transition-all duration-500"
                style={{ width: `${district.stats.dissent * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="text-[9px] text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
          District statistics
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Type</div>
            <div className="text-[var(--text)] font-semibold">{district.type}</div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Population</div>
            <div className="text-[var(--text)] font-mono font-semibold">
              {formatNumber(district.stats.population)}
            </div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Buildings</div>
            <div className="text-[var(--text)] font-mono font-semibold">
              {district.stats.buildings}
            </div>
          </div>
          <div className="bg-[var(--panel2)] border border-[var(--border)] p-2 rounded-[var(--radius)]">
            <div className="text-[var(--text-secondary)] mb-0.5">Stability</div>
            <div className="text-[var(--text)] font-mono font-semibold">
              {((1 - district.stats.dissent) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm flex flex-col animate-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border)] p-2 shrink-0 bg-[var(--panel2)] rounded-t-[var(--radius)]">
        <span className="text-[10px] tracking-[0.15em] text-[var(--text)] font-mono font-semibold uppercase">
          Inspector
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 text-sm text-[var(--text-secondary)] hover:!text-white hover:bg-[var(--openclaw-red)] border border-[var(--border)] rounded-[var(--radius)] transition-all font-bold leading-none flex items-center justify-center"
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>

      <div className="p-3 text-xs overflow-y-auto flex-1 min-h-0">
        {data.type === "tile" && renderTile(data.data as TileInspector)}
        {data.type === "building" && renderBuilding(data.data as BuildingInspector)}
        {data.type === "citizen" && renderCitizen(data.data as CitizenInspector)}
        {data.type === "district" && renderDistrict(data.data as DistrictInspector)}
      </div>
    </div>
  );
}
