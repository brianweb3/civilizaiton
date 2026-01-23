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
      <div className="h-full flex items-center justify-center text-[#8B7355] text-xs p-4 bg-[#F4F1E8]">
        <div className="text-center animate-pulse">
          <div className="text-2xl mb-2 opacity-30">⊙</div>
          <div className="text-[#8B7355] font-serif">CLICK MAP TO INSPECT</div>
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b-2 border-[#D4C5A9] pb-2">
        <span className="text-[#8B5CF6] font-serif font-semibold text-sm">TILE</span>
        <span className="text-[#8B7355] text-xs font-mono">
          ({tile.x}, {tile.y})
        </span>
      </div>
      
      <div>
        <div className="text-[9px] text-[#8B7355] mb-1 tracking-wide">TERRAIN TYPE</div>
        <div className="text-sm text-[#5C4A37] font-serif font-semibold">{tile.terrain}</div>
      </div>

      {tile.district && (
        <div>
          <div className="text-[9px] text-[#8B7355] mb-1 tracking-wide">DISTRICT</div>
          <div className="text-sm text-[#5C4A37] font-serif">{tile.district.name}</div>
          <div className="text-[10px] text-[#8B7355] mt-0.5">{tile.district.type}</div>
        </div>
      )}
      
      <div>
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">HEATMAP VALUES</div>
        <div className="space-y-2">
          {(Object.keys(tile.heatmapValues) as HeatmapType[])
            .filter((k) => k !== "NONE")
            .map((key) => (
              <div key={key} className="animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8B7355] font-medium">
                    {HEATMAP_LABELS[key]}
                  </span>
                  <span className="text-[10px] font-mono text-[#5C4A37] font-semibold">
                    {(tile.heatmapValues[key] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E9E2D0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${tile.heatmapValues[key] * 100}%`,
                      backgroundColor: key === 'POP' ? '#2E8B57' : 
                                     key === 'WEALTH' ? '#D9B56C' :
                                     key === 'CONFLICT' ? '#B42318' :
                                     key === 'PROD' ? '#2A74B8' :
                                     key === 'HAPPINESS' ? '#4ade80' :
                                     '#7C3AED'
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">TILE STATISTICS</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Grid Position</div>
            <div className="text-[#5C4A37] font-mono font-semibold">{tile.x}, {tile.y}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Terrain</div>
            <div className="text-[#5C4A37] font-semibold">{tile.terrain}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBuilding = (building: BuildingInspector) => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b-2 border-[#D4C5A9] pb-2">
        <span className="text-[#7C3AED] font-serif font-semibold text-sm">BUILDING</span>
        <span className="text-[#8B7355] text-xs font-mono">{building.id.slice(0, 8)}</span>
      </div>
      
      <div>
        <div className="text-sm text-[#5C4A37] font-serif font-semibold">{building.name}</div>
        <div className="text-[10px] text-[#8B7355] mt-0.5">{building.type}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#E9E2D0] border border-[#D4C5A9] rounded-lg p-2 animate-fade-in">
          <div className="text-[8px] text-[#8B7355] mb-1">LEVEL</div>
          <div className="text-xl text-[#2A74B8] font-mono font-bold animate-number">{building.level}</div>
        </div>
        <div className="bg-[#E9E2D0] border border-[#D4C5A9] rounded-lg p-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-[8px] text-[#8B7355] mb-1">WORKERS</div>
          <div className="text-xl text-[#2A74B8] font-mono font-bold animate-number">{building.workers}</div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] text-[#8B7355] tracking-wide">PRODUCTIVITY</div>
          <div className="text-[10px] font-mono text-[#5C4A37] font-semibold">
            {(building.productivity * 100).toFixed(1)}%
          </div>
        </div>
        <div className="w-full h-2.5 bg-[#E9E2D0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2E8B57] rounded-full transition-all duration-500"
            style={{ width: `${building.productivity * 100}%` }}
          />
        </div>
      </div>
      
      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">ECONOMIC IMPACT</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center animate-fade-in bg-[#E9E2D0] p-2 rounded">
            <span className="text-[10px] text-[#8B7355] font-medium">Housing Capacity</span>
            <span className="text-[11px] text-[#5C4A37] font-mono font-semibold">
              {building.impact.population} residents
            </span>
          </div>
          <div className="flex justify-between items-center animate-fade-in bg-[#E9E2D0] p-2 rounded" style={{ animationDelay: '0.1s' }}>
            <span className="text-[10px] text-[#8B7355] font-medium">Economic Output</span>
            <span className="text-[11px] text-[#2E8B57] font-mono font-semibold">
              +{formatMoney(building.impact.economy)}/tick
            </span>
          </div>
          <div className="flex justify-between items-center animate-fade-in bg-[#E9E2D0] p-2 rounded" style={{ animationDelay: '0.2s' }}>
            <span className="text-[10px] text-[#8B7355] font-medium">Research Points</span>
            <span className="text-[11px] text-[#7C3AED] font-mono font-semibold">
              +{building.impact.research} pts/tick
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">BUILDING STATISTICS</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Type</div>
            <div className="text-[#5C4A37] font-semibold">{building.type}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Efficiency</div>
            <div className="text-[#5C4A37] font-mono font-semibold">{(building.productivity * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCitizen = (citizen: CitizenInspector) => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b-2 border-[#D4C5A9] pb-2">
        <span className="text-[#2E8B57] font-serif font-semibold text-sm">CITIZEN</span>
        <span className="text-[#8B7355] text-xs font-mono">{citizen.id.slice(0, 8)}</span>
      </div>
      
      <div>
        <div className="text-sm text-[#5C4A37] font-serif font-semibold">{citizen.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-2 py-1 bg-[#E9E2D0] border border-[#D4C5A9] rounded text-[#5C4A37] font-medium">
            {citizen.role}
          </span>
          <span className="text-[10px] text-[#8B7355]">
            Age: {citizen.age}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#E9E2D0] border border-[#D4C5A9] rounded-lg p-2 animate-fade-in">
          <div className="text-[8px] text-[#8B7355] mb-1">MONEY</div>
          <div className="text-xl text-[#2A74B8] font-mono font-bold animate-number">
            {formatMoney(citizen.money)}
          </div>
        </div>
        <div className="bg-[#E9E2D0] border border-[#D4C5A9] rounded-lg p-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-[8px] text-[#8B7355] mb-1">PRODUCTIVITY</div>
          <div className="text-xl text-[#2E8B57] font-mono font-bold animate-number">
            {(citizen.productivity * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] text-[#8B7355] tracking-wide">HAPPINESS</div>
          <div className="text-[10px] font-mono text-[#5C4A37] font-semibold">
            {(citizen.happiness * 100).toFixed(1)}%
          </div>
        </div>
        <div className="w-full h-2.5 bg-[#E9E2D0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${citizen.happiness * 100}%`,
              backgroundColor:
                citizen.happiness > 0.7
                  ? "#2E8B57"
                  : citizen.happiness > 0.4
                  ? "#C2410C"
                  : "#B42318",
            }}
          />
        </div>
      </div>
      
      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">CONTRIBUTIONS</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center animate-fade-in bg-[#E9E2D0] p-2 rounded">
            <span className="text-[10px] text-[#8B7355] font-medium">Tax Paid</span>
            <span className="text-[11px] text-[#2A74B8] font-mono font-semibold">
              {formatMoney(citizen.impact.taxPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center animate-fade-in bg-[#E9E2D0] p-2 rounded" style={{ animationDelay: '0.1s' }}>
            <span className="text-[10px] text-[#8B7355] font-medium">Laws Affected By</span>
            <span className="text-[11px] text-[#5C4A37] font-mono font-semibold">{citizen.impact.lawsAffectedBy}</span>
          </div>
          <div className="flex justify-between items-center animate-fade-in bg-[#E9E2D0] p-2 rounded" style={{ animationDelay: '0.2s' }}>
            <span className="text-[10px] text-[#8B7355] font-medium">Buildings Built</span>
            <span className="text-[11px] text-[#5C4A37] font-mono font-semibold">{citizen.impact.buildingsBuilt}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">CITIZEN STATISTICS</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Role</div>
            <div className="text-[#5C4A37] font-semibold">{citizen.role}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Age</div>
            <div className="text-[#5C4A37] font-mono font-semibold">{citizen.age}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Wealth</div>
            <div className="text-[#5C4A37] font-mono font-semibold">{formatMoney(citizen.money)}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Status</div>
            <div className="text-[#5C4A37] font-semibold">
              {citizen.happiness > 0.7 ? 'Content' : citizen.happiness > 0.4 ? 'Neutral' : 'Unhappy'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDistrict = (district: DistrictInspector) => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b-2 border-[#D4C5A9] pb-2">
        <span className="text-[#C2410C] font-serif font-semibold text-sm">DISTRICT</span>
        <span className="text-[#8B7355] text-xs font-mono">{district.id.slice(0, 8)}</span>
      </div>
      
      <div>
        <div className="text-sm text-[#5C4A37] font-serif font-semibold">{district.name}</div>
        <div className="text-[10px] text-[#8B7355] mt-0.5">{district.type}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#E9E2D0] border border-[#D4C5A9] rounded-lg p-2 animate-fade-in">
          <div className="text-[8px] text-[#8B7355] mb-1">POPULATION</div>
          <div className="text-xl text-[#2A74B8] font-mono font-bold animate-number">
            {formatNumber(district.stats.population)}
          </div>
        </div>
        <div className="bg-[#E9E2D0] border border-[#D4C5A9] rounded-lg p-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="text-[8px] text-[#8B7355] mb-1">BUILDINGS</div>
          <div className="text-xl text-[#7C3AED] font-mono font-bold animate-number">
            {district.stats.buildings}
          </div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">DISTRICT METRICS</div>
        <div className="space-y-3">
          <div className="animate-fade-in">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#8B7355] font-medium">Average Wealth</span>
              <span className="text-[#5C4A37] font-mono font-semibold">{formatMoney(district.stats.avgWealth)}</span>
            </div>
            <div className="w-full h-2 bg-[#E9E2D0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D9B56C] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (district.stats.avgWealth / 10000) * 100)}%` }}
              />
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#8B7355] font-medium">Happiness</span>
              <span className="text-[#5C4A37] font-mono font-semibold">{(district.stats.avgHappiness * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-[#E9E2D0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2E8B57] rounded-full transition-all duration-500"
                style={{ width: `${district.stats.avgHappiness * 100}%` }}
              />
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#8B7355] font-medium">Productivity</span>
              <span className="text-[#5C4A37] font-mono font-semibold">{(district.stats.productivity * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-[#E9E2D0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2A74B8] rounded-full transition-all duration-500"
                style={{ width: `${district.stats.productivity * 100}%` }}
              />
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#8B7355] font-medium">Dissent Level</span>
              <span className="text-[#5C4A37] font-mono font-semibold">{(district.stats.dissent * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-[#E9E2D0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B42318] rounded-full transition-all duration-500"
                style={{ width: `${district.stats.dissent * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#D4C5A9]">
        <div className="text-[9px] text-[#8B7355] mb-2 tracking-wide">DISTRICT STATISTICS</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Type</div>
            <div className="text-[#5C4A37] font-semibold">{district.type}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Population</div>
            <div className="text-[#5C4A37] font-mono font-semibold">{formatNumber(district.stats.population)}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Buildings</div>
            <div className="text-[#5C4A37] font-mono font-semibold">{district.stats.buildings}</div>
          </div>
          <div className="bg-[#E9E2D0] p-2 rounded">
            <div className="text-[#8B7355] mb-0.5">Stability</div>
            <div className="text-[#5C4A37] font-mono font-semibold">
              {((1 - district.stats.dissent) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-[#F4F1E8] border-2 border-[#D4C5A9] rounded-lg shadow-xl flex flex-col animate-fade-in">
      <div className="flex items-center justify-between border-b-2 border-[#D4C5A9] p-3 shrink-0 bg-[#E9E2D0]">
        <span className="text-[11px] tracking-[0.2em] text-[#5C4A37] font-serif font-semibold">
          INSPECTOR
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 text-sm text-[#8B7355] hover:text-[#5C4A37] border border-[#D4C5A9] rounded hover:border-[#8B5CF6] hover:bg-[#F4F1E8] transition-all font-bold"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 text-xs overflow-y-auto flex-1 min-h-0">
        {data.type === "tile" && renderTile(data.data as TileInspector)}
        {data.type === "building" && renderBuilding(data.data as BuildingInspector)}
        {data.type === "citizen" && renderCitizen(data.data as CitizenInspector)}
        {data.type === "district" && renderDistrict(data.data as DistrictInspector)}
      </div>
    </div>
  );
}
