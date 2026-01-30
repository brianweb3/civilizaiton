"use client";

import Link from "next/link";
import { useClawtownStore } from "@/store/simulation";

export default function LawNotificationToasts() {
  const pendingLawNotifications = useClawtownStore((s) => s.pendingLawNotifications);
  const clearPendingLawNotifications = useClawtownStore((s) => s.clearPendingLawNotifications);

  if (pendingLawNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-3 right-3 left-auto max-w-sm z-50 flex flex-col gap-2 pointer-events-auto">
      {pendingLawNotifications.map((law) => (
        <div
          key={law.id}
          className="border-2 border-[var(--border)] bg-[var(--panel)] shadow-[var(--pixel-shadow-red)] p-3"
        >
          <div className="text-[8px] uppercase text-[var(--text-secondary)] mb-1">
            New law adopted
          </div>
          <div className="text-xs font-semibold text-[var(--text)] mb-2 line-clamp-2">
            {law.title}
          </div>
          <div className="flex gap-2">
            <Link
              href="/laws"
              className="inline-block px-2 py-1.5 text-[7px] uppercase bg-[var(--openclaw-red)] !text-white border-2 border-[var(--openclaw-red)] shadow-[var(--pixel-shadow-red)] hover:opacity-90 hover:!text-white"
              onClick={clearPendingLawNotifications}
            >
              View LAWS
            </Link>
            <button
              type="button"
              className="px-2 py-1.5 text-[7px] uppercase border-2 border-[var(--border)] bg-[var(--bg2)] text-[var(--text-secondary)] hover:bg-[var(--bg3)]"
              onClick={clearPendingLawNotifications}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
      {pendingLawNotifications.length > 1 && (
        <div className="border-2 border-[var(--border)] bg-[var(--panel)] shadow-[var(--pixel-shadow)] p-2 flex justify-between items-center">
          <span className="text-[7px] text-[var(--text-secondary)]">
            {pendingLawNotifications.length} new laws
          </span>
          <Link
            href="/laws"
            className="text-[7px] uppercase text-[var(--openclaw-red)] font-semibold hover:underline"
            onClick={clearPendingLawNotifications}
          >
            View all in LAWS
          </Link>
        </div>
      )}
    </div>
  );
}
