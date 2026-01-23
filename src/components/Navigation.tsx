"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNocracyStore } from "@/store/simulation";

export default function Navigation() {
  const pathname = usePathname();
  const { agents, economy, scores, research } = useNocracyStore();
  
  const activeAgents = agents.filter((a) => a.status === "ACTIVE");
  const activeResearch = research?.nodes?.find(n => n.status === 'IN_PROGRESS');
  const researchProgress = activeResearch ? (activeResearch.progress * 100) : 0;
  
  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const navItems = [
    { name: "SIMULATION", href: "/simulation" },
    { name: "DATA", href: "/data" },
    { name: "AGENTS", href: "/agents" },
    { name: "LAWS", href: "/laws" },
    { name: "RESEARCH", href: "/research" },
    { name: "ETHICS", href: "/ethics" },
    { name: "ARCHIVE", href: "/archive" },
    { name: "PARTICIPATE", href: "/participate" },
  ];

  return (
    <header className="minimal-nav-header">
      <div className="minimal-nav-container">
        {/* Logo */}
        <Link href="/simulation" className="minimal-logo">
          <span className="minimal-logo-text">civilizAItion</span>
        </Link>

        {/* Metrics - only show on simulation page */}
        {pathname === "/simulation" && (
          <div className="minimal-nav-metrics">
            <div className="minimal-metric">
              <span className="minimal-metric-label">POPULATION</span>
              <span className="minimal-metric-value" style={{ color: 'var(--research)' }}>
                {activeAgents.length}
              </span>
            </div>
            <div className="minimal-metric">
              <span className="minimal-metric-label">TREASURY</span>
              <span className="minimal-metric-value" style={{ color: 'var(--desert)' }}>
                ${formatMoney(economy.currencySupply)}
              </span>
            </div>
            <div className="minimal-metric">
              <span className="minimal-metric-label">OUTPUT</span>
              <span className="minimal-metric-value" style={{ color: 'var(--economy)' }}>
                {Math.round(economy.productionOutput)}
              </span>
            </div>
            <div className="minimal-metric">
              <span className="minimal-metric-label">RESEARCH</span>
              <span className="minimal-metric-value" style={{ color: 'var(--ethics)' }}>
                {Math.round(researchProgress)}%
              </span>
            </div>
            <div className="minimal-metric">
              <span className="minimal-metric-label">STABILITY</span>
              <span className="minimal-metric-value" style={{ color: 'var(--economy)' }}>
                {scores ? Math.round(scores.state_health_score) : 0}%
              </span>
            </div>
            <div className="minimal-metric">
              <span className="minimal-metric-label">LEGITIMACY</span>
              <span className="minimal-metric-value" style={{ color: 'var(--desert)' }}>
                {scores ? Math.round(scores.legitimacy_score) : 0}%
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="minimal-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`minimal-nav-link ${isActive ? "active" : ""}`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
