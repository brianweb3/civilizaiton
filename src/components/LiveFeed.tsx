"use client";

import { useState, useMemo } from "react";
import { useNocracyStore } from "@/store/simulation";
import Link from "next/link";

type FeedFilter = "All" | "Laws" | "Economy" | "Research" | "Ethics";

export default function LiveFeed() {
  const { governanceLogs, laws, research, ethics } = useNocracyStore();
  const [filter, setFilter] = useState<FeedFilter>("All");
  
  // Combine all events
  const allEvents = useMemo(() => {
    const events: Array<{
      id: string;
      tick: number;
      type: FeedFilter;
      message: string;
      severity?: "CRITICAL" | "WARNING" | "INFO";
      link?: string;
    }> = [];
    
    // Governance logs
    governanceLogs.slice(0, 20).forEach((log) => {
      let type: FeedFilter = "All";
      if (log.summary.toLowerCase().includes("law")) type = "Laws";
      else if (log.summary.toLowerCase().includes("econom") || log.summary.toLowerCase().includes("tax")) type = "Economy";
      else if (log.summary.toLowerCase().includes("research")) type = "Research";
      else if (log.summary.toLowerCase().includes("ethic")) type = "Ethics";
      
      events.push({
        id: log.id,
        tick: log.tick,
        type,
        message: log.summary,
        severity: log.severity,
      });
    });
    
    // Recent laws
    laws.slice(0, 5).forEach((law) => {
      events.push({
        id: `law-${law.id}`,
        tick: law.createdAt,
        type: "Laws",
        message: `New law: ${law.title}`,
        link: "/laws",
      });
    });
    
    // Research completions
    research.nodes
      .filter((n) => n.status === "COMPLETED")
      .slice(0, 3)
      .forEach((node) => {
        events.push({
          id: `research-${node.id}`,
          tick: node.discoveredAt || 0,
          type: "Research",
          message: `Research completed: ${node.name}`,
          link: "/research",
        });
      });
    
    // Ethics interventions
    ethics.blockedActions.slice(0, 3).forEach((action) => {
      events.push({
        id: `ethics-${action.id}`,
        tick: action.tick,
        type: "Ethics",
        message: `Action blocked: ${action.attemptedAction}`,
        severity: "WARNING",
        link: "/ethics",
      });
    });
    
    return events.sort((a, b) => b.tick - a.tick).slice(0, 10);
  }, [governanceLogs, laws, research, ethics]);
  
  const filteredEvents = useMemo(() => {
    if (filter === "All") return allEvents;
    return allEvents.filter((e) => e.type === filter);
  }, [allEvents, filter]);
  
  const getTypeColor = (type: FeedFilter): string => {
    switch (type) {
      case "Laws": return "var(--laws)";
      case "Economy": return "var(--economy)";
      case "Research": return "var(--research)";
      case "Ethics": return "var(--ethics)";
      default: return "var(--muted)";
    }
  };
  
  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-sm flex flex-col h-full">
      <div className="border-b border-[var(--border)] p-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] tracking-[0.2em] text-[var(--muted)]">
            LIVE FEED
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-1 flex-wrap">
          {(["All", "Laws", "Economy", "Research", "Ethics"] as FeedFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[7px] border rounded transition-colors ${
                filter === f
                  ? "border-[var(--research)] text-[var(--research)] bg-[rgba(42,116,184,0.08)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel2)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-[var(--muted)] text-[9px] py-4">
            NO EVENTS
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`p-2 border border-[var(--border)] rounded text-[9px] transition-colors ${
                event.link ? "cursor-pointer hover:bg-[var(--panel2)]" : ""
              }`}
              onClick={() => event.link && (window.location.href = event.link)}
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-[var(--muted)] font-mono text-[8px] shrink-0">
                  T+{event.tick.toString().padStart(6, "0")}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[7px] shrink-0"
                  style={{
                    backgroundColor: `${getTypeColor(event.type)}20`,
                    color: getTypeColor(event.type),
                    border: `1px solid ${getTypeColor(event.type)}40`,
                  }}
                >
                  {event.type}
                </span>
                {event.severity && (
                  <span
                    className={`text-[7px] shrink-0 ${
                      event.severity === "CRITICAL"
                        ? "text-[var(--critical)]"
                        : event.severity === "WARNING"
                        ? "text-[var(--alerts)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    [{event.severity.slice(0, 3)}]
                  </span>
                )}
              </div>
              <div className="text-[var(--text)] text-[9px] leading-relaxed">
                {event.message}
              </div>
              {event.link && (
                <div className="mt-1 text-[var(--research)] text-[8px]">
                  View details →
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
