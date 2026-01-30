"use client";

import { useState } from "react";
import Link from "next/link";
import { useClawtownStore } from "@/store/simulation";

export default function LawNotificationToasts() {
  const pendingLawNotifications = useClawtownStore((s) => s.pendingLawNotifications);
  const clearPendingLawNotifications = useClawtownStore((s) => s.clearPendingLawNotifications);
  const [expanded, setExpanded] = useState(false);

  if (pendingLawNotifications.length === 0) return null;

  const count = pendingLawNotifications.length;
  const label = count === 1 ? "1 new law" : `${count} new laws`;

  return (
    <div className="fixed bottom-3 right-3 left-auto max-w-sm z-50 flex flex-col gap-0 pointer-events-auto">
      <div className="border-2 border-[var(--border)] bg-[var(--panel)] shadow-[var(--pixel-shadow-red)] overflow-hidden">
        {/* Collapsed header — always visible */}
        <div className="flex items-center gap-2 p-2 min-w-0">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 p-1 border-2 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg2)] text-[var(--text)] transition-colors"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <span className="text-[8px]">{expanded ? "▼" : "▶"}</span>
          </button>
          <span className="text-[8px] uppercase text-[var(--text-secondary)] truncate flex-1 min-w-0">
            {label}
          </span>
          <div className="flex gap-1 shrink-0">
            <Link
              href="/laws"
              className="inline-block px-2 py-1 text-[7px] uppercase bg-[var(--openclaw-red)] !text-white border-2 border-[var(--openclaw-red)] shadow-[var(--pixel-shadow-red)] hover:opacity-90 hover:!text-white"
              onClick={clearPendingLawNotifications}
            >
              View LAWS
            </Link>
            <button
              type="button"
              className="px-2 py-1 text-[7px] uppercase border-2 border-[var(--border)] bg-[var(--bg2)] text-[var(--text-secondary)] hover:bg-[var(--bg3)]"
              onClick={clearPendingLawNotifications}
            >
              Dismiss
            </button>
          </div>
        </div>
        {/* Expanded list — collapsible */}
        {expanded && (
          <div className="border-t-2 border-[var(--border)] p-2 max-h-40 overflow-y-auto space-y-1">
            {pendingLawNotifications.map((law) => (
              <div
                key={law.id}
                className="text-[7px] text-[var(--text)] truncate pl-2 border-l-2 border-[var(--openclaw-red)]"
              >
                {law.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
