"use client";

import { useEffect, useState } from "react";

interface LoadingPlanetProps {
  onComplete?: () => void;
}

export default function LoadingPlanet({ onComplete }: LoadingPlanetProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 3x faster loading progress (1.875% per update)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) {
              onComplete();
            }
          }, 500);
          return 100;
        }
        // 3x faster: 0.625 * 3 = 1.875% per update
        return Math.min(100, prev + 1.875);
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
        {/* LOADING text */}
        <div className="text-[var(--text)] uppercase text-2xl font-light tracking-wider">
          LOADING
        </div>
        
        {/* Progress line */}
        <div className="w-full">
          <div className="loading-progress-bar-sandy">
            <div 
              className="loading-progress-fill-sandy"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Percentage */}
        <div className="text-[var(--text)] text-lg font-light font-mono">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
