"use client";

import { useEffect } from "react";
import { getSimulationEngine } from "@/lib/simulation-engine";
import { useNocracyStore } from "@/store/simulation";

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const applyTick = useNocracyStore((state) => state.applyTick);

  useEffect(() => {
    const engine = getSimulationEngine();
    
    const unsubscribe = engine.subscribe((data) => {
      applyTick(data);
    });
    
    engine.start();
    
    return () => {
      unsubscribe();
    };
  }, [applyTick]);

  return <>{children}</>;
}
