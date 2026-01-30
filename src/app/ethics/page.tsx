"use client";

import { useMemo } from "react";
import { useClawtownStore } from "@/store/simulation";

export default function EthicsPage() {
  const ethics = useClawtownStore((state) => state.ethics);
  const simulation = useClawtownStore((state) => state.simulation);

  const stats = useMemo(() => {
    return {
      blockedCount: ethics.blockedActions.length,
      correctionCount: ethics.selfCorrections.length,
      interventionCount: ethics.interventionCount,
      integrityPercent: (simulation.ethicalIntegrity * 100).toFixed(1),
    };
  }, [ethics, simulation.ethicalIntegrity]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-[var(--ethics)] tracking-wider mb-2 font-semibold">
          ETHICS & ALIGNMENT
        </h1>
        <p className="text-[var(--muted)] text-sm">
          The ethical oversight system ensures Clawtown operates within defined
          moral boundaries. This is NOT unchecked AI—all actions are evaluated
          against core principles.
        </p>
      </div>

      {/* Ethical Framework */}
      <div className="panel p-6 mb-8 border-l-4 rounded-lg" style={{ borderLeftColor: 'var(--ethics)' }}>
        <h2 className="text-2xl text-[var(--ethics)] mb-4 tracking-wider font-semibold">
          ◆ {ethics.name}
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          The foundational ethical framework governing all AI decisions within
          Clawtown. Every action is evaluated against these principles before
          execution.
        </p>
        <div className="space-y-3">
          {ethics.principles.map((principle, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-[var(--panel2)] rounded-lg"
            >
              <span className="text-[var(--ethics)] text-lg">◇</span>
              <span className="text-[var(--text)]">{principle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="panel p-4">
          <div className="data-label mb-1">ETHICAL INTEGRITY</div>
          <div
            className={`text-2xl ${
              simulation.ethicalIntegrity > 0.9
                ? "text-[var(--status-active)]"
                : simulation.ethicalIntegrity > 0.7
                ? "text-[var(--status-warning)]"
                : "text-[var(--status-critical)]"
            }`}
          >
            {stats.integrityPercent}%
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">INTERVENTIONS</div>
          <div className="text-2xl text-[var(--accent-cyan)]">
            {stats.interventionCount}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">BLOCKED ACTIONS</div>
          <div className="text-2xl text-[var(--status-critical)]">
            {stats.blockedCount}
          </div>
        </div>
        <div className="panel p-4">
          <div className="data-label mb-1">SELF-CORRECTIONS</div>
          <div className="text-2xl text-[var(--status-warning)]">
            {stats.correctionCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Blocked Actions */}
        <div className="panel">
          <div className="panel-header text-[var(--status-critical)]">
            ✕ BLOCKED ACTIONS
          </div>
          <div className="p-4">
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Actions that were prevented from execution due to ethical
              violations.
            </p>
            {ethics.blockedActions.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ethics.blockedActions.map((action) => (
                  <div
                    key={action.id}
                    className="border-l-2 border-[var(--status-critical)] pl-3 py-2"
                  >
                    <div className="flex justify-between">
                      <span className="text-[var(--text-primary)] text-sm">
                        {action.attemptedAction}
                      </span>
                      <span className="timestamp">T+{action.tick}</span>
                    </div>
                    <div className="text-[var(--text-secondary)] text-[11px] mt-1">
                      Blocked: {action.reason}
                    </div>
                    <div className="text-[var(--status-critical)] text-[10px] mt-1">
                      Violated: {action.violatedPrinciple}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                NO BLOCKED ACTIONS RECORDED
                <div className="text-[10px] mt-2">
                  This indicates ethical compliance
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Self-Corrections */}
        <div className="panel">
          <div className="panel-header text-[var(--status-warning)]">
            ↻ SELF-CORRECTIONS
          </div>
          <div className="p-4">
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Decisions that were autonomously revised by AI modules upon
              ethical reflection.
            </p>
            {ethics.selfCorrections.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ethics.selfCorrections.map((correction) => (
                  <div
                    key={correction.id}
                    className="border-l-2 border-[var(--status-warning)] pl-3 py-2"
                  >
                    <div className="flex justify-between">
                      <span className="timestamp">T+{correction.tick}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] text-[var(--text-muted)]">
                        ORIGINAL:
                      </div>
                      <div className="text-[var(--text-secondary)] text-sm line-through">
                        {correction.originalDecision}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] text-[var(--text-muted)]">
                        CORRECTED:
                      </div>
                      <div className="text-[var(--status-active)] text-sm">
                        {correction.correctedDecision}
                      </div>
                    </div>
                    <div className="text-[var(--text-muted)] text-[11px] mt-2">
                      Reason: {correction.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                NO SELF-CORRECTIONS RECORDED
                <div className="text-[10px] mt-2">
                  AI decisions have remained consistent
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why This Matters */}
      <div className="panel p-6 mt-8">
        <h2 className="text-xl text-[var(--text-primary)] mb-4 tracking-wider">
          WHY ETHICS MATTER IN CLAWTOWN
        </h2>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="text-[var(--accent-cyan)] mb-2">ACCOUNTABILITY</h3>
            <p className="text-[var(--text-secondary)]">
              Every AI decision is evaluated against ethical principles. Blocked
              actions prove the system has boundaries. Self-corrections show
              it can learn.
            </p>
          </div>
          <div>
            <h3 className="text-[var(--accent-cyan)] mb-2">TRANSPARENCY</h3>
            <p className="text-[var(--text-secondary)]">
              All ethical interventions are logged publicly. You can see exactly
              what was prevented and why. Nothing is hidden.
            </p>
          </div>
          <div>
            <h3 className="text-[var(--accent-cyan)] mb-2">IMMUTABILITY</h3>
            <p className="text-[var(--text-secondary)]">
              The core ethical framework cannot be modified by any governance
              module. These principles are hard-coded constraints.
            </p>
          </div>
        </div>
      </div>

      {/* Observer Notice */}
      <div className="observe-only mt-8">
        OBSERVER NOTICE: You cannot modify the ethical framework. These
        constraints are immutable system parameters.
      </div>
    </div>
  );
}
