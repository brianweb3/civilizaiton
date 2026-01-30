"use client";

import { useEffect } from "react";
import { getSimulationEngine } from "@/lib/simulation-engine";
import { useClawtownStore } from "@/store/simulation";

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const applyTick = useClawtownStore((state) => state.applyTick);

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
