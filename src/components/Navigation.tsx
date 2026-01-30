"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClawtownStore } from "@/store/simulation";

export default function Navigation() {
  const pathname = usePathname();
  const { agents, economy, scores, research } = useClawtownStore();

  const activeAgents = agents.filter((a) => a.status === "ACTIVE");
  const activeResearch = research?.nodes?.find((n) => n.status === "IN_PROGRESS");
  const researchProgress = activeResearch ? activeResearch.progress * 100 : 0;

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
    <header className="h-12 border-b-2 border-[var(--border)] bg-[var(--panel)] sticky top-0 z-40 shadow-[var(--pixel-shadow)]">
      <div className="h-full flex items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/simulation"
          className="flex items-center gap-2 shrink-0"
        >
          <span className="font-mono text-sm font-normal tracking-wide text-[var(--text)]">
            CLAW<span className="text-[var(--openclaw-red)]">TOWN</span>
          </span>
        </Link>

        {/* Metrics — no Status: Online, no Output */}
        {pathname === "/simulation" && (
          <div className="hidden md:flex items-center gap-3 font-mono text-xs">
            <span className="text-[var(--text-secondary)]">
              Claw residents:{" "}
              <span className="text-[var(--openclaw-red)] font-semibold">
                {activeAgents.length}
              </span>
            </span>
            <span className="text-[var(--border)]">|</span>
            <span className="text-[var(--text-secondary)]">
              Agents:{" "}
              <span className="text-[var(--openclaw-red)] font-semibold">
                {activeAgents.length}
              </span>
            </span>
            <span className="text-[var(--border)]">|</span>
            <span className="text-[var(--text-secondary)]">
              Treasury:{" "}
              <span className="text-[var(--openclaw-red)] font-semibold">
                ${formatMoney(economy.currencySupply)}
              </span>
            </span>
            <span className="text-[var(--border)]">|</span>
            <span className="text-[var(--text-secondary)]">
              Research:{" "}
              <span className="text-[var(--openclaw-red)] font-semibold">
                {Math.round(researchProgress)}%
              </span>
            </span>
            <span className="text-[var(--border)]">|</span>
            <span className="text-[var(--text-secondary)]">
              Stability:{" "}
              <span className="text-[var(--openclaw-red)] font-semibold">
                {scores ? Math.round(scores.state_health_score) : 0}%
              </span>
            </span>
          </div>
        )}

        {/* COPY CA & X (Twitter) — on simulation page */}
        {pathname === "/simulation" && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const ca = typeof window !== "undefined" && process.env.NEXT_PUBLIC_CA_ADDRESS
                  ? process.env.NEXT_PUBLIC_CA_ADDRESS
                  : typeof window !== "undefined"
                    ? window.location.origin
                    : "";
                navigator.clipboard?.writeText(ca).then(() => {}, () => {});
              }}
              className="px-2 py-1.5 text-[7px] font-normal uppercase bg-[var(--panel)] text-[var(--text)] border-2 border-[var(--border)] hover:bg-[var(--bg2)] transition-all"
            >
              COPY CA
            </button>
            <a
              href="https://x.com/i/communities/2017285498591408442"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-[7px] font-normal uppercase bg-[var(--panel)] text-[var(--text)] border-2 border-[var(--border)] hover:bg-[var(--bg2)] transition-all inline-block"
            >
              X
            </a>
          </div>
        )}

        {/* Nav links — SIMULATION with white text when active */}
        <nav className="flex items-center gap-1 shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-2 py-2 text-xs font-normal uppercase tracking-wide border-2 border-transparent transition-all ${
                  isActive
                    ? "bg-[var(--openclaw-red)] border-[var(--openclaw-red)] !text-white hover:!text-white shadow-[var(--pixel-shadow-red)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border)]"
                }`}
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
