"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SimulationProvider } from "@/components/SimulationProvider";
import Navigation from "@/components/Navigation";
import LoadingPlanet from "@/components/LoadingPlanet";
import LawNotificationToasts from "@/components/LawNotificationToasts";
import { playClickSound, playSoftClickSound } from "@/lib/sounds";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  // Don't show navigation on the manifest page
  const showNavigation = pathname !== "/";

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Global click sound handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is interactive
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.closest('[role="button"]') !== null ||
        target.closest('select') !== null ||
        target.closest('input[type="checkbox"]') !== null ||
        target.closest('input[type="radio"]') !== null;

      if (isInteractive) {
        // Use soft click for less prominent elements
        const isSoft = 
          target.closest('input[type="checkbox"]') !== null ||
          target.closest('input[type="radio"]') !== null ||
          target.closest('select') !== null ||
          target.classList.contains('minimal-nav-link') ||
          target.closest('.minimal-nav-link') !== null;

        if (isSoft) {
          playSoftClickSound();
        } else {
          playClickSound();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <SimulationProvider>
      {isLoading && <LoadingPlanet onComplete={handleLoadingComplete} />}
      {!isLoading && (
        <div className="min-h-screen flex flex-col">
          {showNavigation && <Navigation />}
          <main className="flex-1">{children}</main>
          {showNavigation && <LawNotificationToasts />}
          {showNavigation && (
            <footer className="border-t-2 border-[var(--border)] bg-[var(--panel)] py-2 px-3 text-center text-[7px] uppercase tracking-wide text-[var(--text-secondary)] font-mono shadow-[var(--pixel-shadow)]">
              <span className="text-[var(--text)]">Clawtown</span>
              {" © "}
              {new Date().getFullYear()}
              {" | POWERED BY "}
              <span className="text-[var(--openclaw-red)] font-semibold">
                OpenClaw
              </span>
            </footer>
          )}
        </div>
      )}
    </SimulationProvider>
  );
}
