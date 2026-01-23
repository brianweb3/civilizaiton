"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useNocracyStore } from "@/store/simulation";

interface TimelineReplayProps {
  onTickChange?: (tick: number) => void;
}

export default function TimelineReplay({ onTickChange }: TimelineReplayProps) {
  const { simulation, historicalSnapshots } = useNocracyStore();
  
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayTick, setReplayTick] = useState(simulation.tick);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h");
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate tick range based on time selection
  const getTickRange = useCallback(() => {
    const currentTick = simulation.tick;
    const ticksPerHour = 3600; // Assuming 1 tick per second
    
    switch (timeRange) {
      case "1h":
        return { min: Math.max(0, currentTick - ticksPerHour), max: currentTick };
      case "24h":
        return { min: Math.max(0, currentTick - ticksPerHour * 24), max: currentTick };
      case "7d":
        return { min: Math.max(0, currentTick - ticksPerHour * 24 * 7), max: currentTick };
      default:
        return { min: 0, max: currentTick };
    }
  }, [simulation.tick, timeRange]);
  
  const tickRange = getTickRange();
  
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tick = parseInt(e.target.value, 10);
    setReplayTick(tick);
    onTickChange?.(tick);
  };
  
  // Enter/exit replay mode
  const toggleReplayMode = () => {
    if (isReplayMode) {
      // Exit replay mode - return to live
      setIsReplayMode(false);
      setIsPlaying(false);
      setReplayTick(simulation.tick);
      onTickChange?.(simulation.tick);
    } else {
      // Enter replay mode
      setIsReplayMode(true);
      setReplayTick(tickRange.min);
    }
  };
  
  // Play/pause replay
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };
  
  // Handle playback
  useEffect(() => {
    if (isPlaying && isReplayMode) {
      playIntervalRef.current = setInterval(() => {
        setReplayTick((prev) => {
          const next = prev + playSpeed;
          if (next >= tickRange.max) {
            setIsPlaying(false);
            return tickRange.max;
          }
          onTickChange?.(next);
          return next;
        });
      }, 100);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, isReplayMode, playSpeed, tickRange.max, onTickChange]);
  
  // Skip to specific position
  const skipToStart = () => {
    setReplayTick(tickRange.min);
    onTickChange?.(tickRange.min);
  };
  
  const skipToEnd = () => {
    setReplayTick(tickRange.max);
    onTickChange?.(tickRange.max);
  };
  
  // Format tick as time
  const formatTick = (tick: number) => {
    return `T+${tick.toString().padStart(6, "0")}`;
  };
  
  // Calculate percentage for slider position
  const sliderPercentage =
    tickRange.max > tickRange.min
      ? ((replayTick - tickRange.min) / (tickRange.max - tickRange.min)) * 100
      : 0;
  
  // Find nearest snapshot for the current replay tick
  const currentSnapshot = historicalSnapshots?.find(
    (s) => Math.abs(s.tick - replayTick) < 10
  );
  
  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] text-[var(--text-muted)] tracking-[0.2em]">
          TIMELINE REPLAY
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex gap-1">
            {(["1h", "24h", "7d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-0.5 text-[8px] border rounded transition-colors ${
                  timeRange === range
                    ? "border-[var(--research)] text-[var(--research)] bg-[rgba(42,116,184,0.08)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          
          {/* Replay mode toggle */}
          <button
            onClick={toggleReplayMode}
            className={`px-2 py-0.5 text-[8px] border rounded transition-colors ${
              isReplayMode
                ? "border-[var(--alerts)] text-[var(--alerts)] bg-[rgba(194,65,12,0.08)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]"
            }`}
          >
            {isReplayMode ? "EXIT REPLAY" : "ENTER REPLAY"}
          </button>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between mb-2 text-[10px]">
        <span className={isReplayMode ? "text-[var(--alerts)]" : "text-[var(--economy)]"}>
          {isReplayMode ? "REPLAY MODE" : "LIVE"}
        </span>
        <span className="text-[var(--text)] font-mono">
          {formatTick(isReplayMode ? replayTick : simulation.tick)}
        </span>
      </div>
      
      {/* Timeline slider */}
      <div className="relative">
        <div className="h-2 bg-[var(--panel2)] border border-[var(--border)] rounded-full relative">
          {/* Progress fill */}
          <div
            className={`absolute h-full rounded-full ${
              isReplayMode ? "bg-[var(--alerts)]" : "bg-[var(--research)]"
            }`}
            style={{ width: `${sliderPercentage}%` }}
          />
          
          {/* Snapshot markers */}
          {historicalSnapshots?.map((snapshot) => {
            const pos =
              ((snapshot.tick - tickRange.min) / (tickRange.max - tickRange.min)) * 100;
            if (pos < 0 || pos > 100) return null;
            return (
              <div
                key={snapshot.tick}
                className="absolute top-0 w-0.5 h-full bg-[var(--ethics)] opacity-50 rounded-full"
                style={{ left: `${pos}%` }}
                title={`Snapshot at ${formatTick(snapshot.tick)}`}
              />
            );
          })}
        </div>
        
        {/* Slider input */}
        <input
          type="range"
          min={tickRange.min}
          max={tickRange.max}
          value={isReplayMode ? replayTick : simulation.tick}
          onChange={handleSliderChange}
          disabled={!isReplayMode}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {/* Playhead indicator */}
        <div
          className={`absolute top-0 w-1 h-3 -mt-0.5 transform -translate-x-1/2 ${
            isReplayMode ? "bg-[var(--status-warning)]" : "bg-[var(--accent-cyan)]"
          }`}
          style={{ left: `${sliderPercentage}%` }}
        />
      </div>
      
      {/* Tick labels */}
      <div className="flex justify-between text-[8px] text-[var(--text-muted)] mt-1">
        <span>{formatTick(tickRange.min)}</span>
        <span>{formatTick(tickRange.max)}</span>
      </div>
      
      {/* Playback controls (only in replay mode) */}
      {isReplayMode && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={skipToStart}
            className="w-6 h-6 text-xs border border-[var(--grid-line)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            title="Skip to start"
          >
            ⏮
          </button>
          <button
            onClick={togglePlay}
            className={`w-8 h-6 text-xs border ${
              isPlaying
                ? "border-[var(--status-warning)] text-[var(--status-warning)]"
                : "border-[var(--grid-line)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            }`}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={skipToEnd}
            className="w-6 h-6 text-xs border border-[var(--grid-line)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            title="Skip to end"
          >
            ⏭
          </button>
          
          {/* Speed selector */}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[8px] text-[var(--text-muted)]">SPEED</span>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(parseInt(e.target.value, 10))}
              className="bg-[var(--bg-primary)] border border-[var(--grid-line)] text-[9px] px-1"
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Snapshot info (if available) */}
      {isReplayMode && currentSnapshot && (
        <div className="mt-2 p-2 bg-[var(--bg-primary)] border border-[var(--grid-line)] text-[9px]">
          <div className="text-[var(--text-muted)]">SNAPSHOT DATA</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <span className="text-[var(--text-muted)]">Pop: </span>
              <span className="text-[var(--accent-cyan)]">
                {currentSnapshot.population}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">GDP: </span>
              <span className="text-[var(--accent-cyan)]">
                {(currentSnapshot.economy?.gdp || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Stab: </span>
              <span className="text-[var(--status-active)]">
                {((currentSnapshot.stability || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
