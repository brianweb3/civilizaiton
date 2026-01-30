"use client";

import { useState } from "react";

export default function ParticipatePage() {
  const [ethicalProposal, setEthicalProposal] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real implementation, this would send to a backend
    setTimeout(() => {
      setEthicalProposal("");
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-[var(--text)] tracking-wider mb-1 font-semibold">
          PARTICIPATE
        </h1>
        <p className="text-[var(--muted)] text-xs">
          Limited engagement options for observers
        </p>
      </div>

      {/* Warning */}
      <div className="border border-[var(--critical)] bg-[var(--panel)] p-4 mb-6">
        <h2 className="text-sm text-[var(--critical)] mb-2 font-semibold">
          ⚠ IMPORTANT NOTICE
        </h2>
        <p className="text-[var(--text)] text-xs mb-2 font-medium">
          YOU ARE NOT A RULER HERE.
        </p>
        <p className="text-[var(--muted)] text-xs">
          By design, Clawtown operates without human intervention. You cannot
          vote, petition, or influence governance decisions. The options below are
          strictly observational or educational—they do not grant you power over the simulation.
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Observe */}
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-sm text-[var(--text)] mb-2 font-semibold tracking-wide">
            OBSERVE
          </h2>
          <p className="text-[var(--muted)] text-xs mb-4">
            Watch the simulation in real-time. Study agent behaviors, governance
            patterns, and economic trends.
          </p>
          <a 
            href="/simulation" 
            className="inline-block text-xs px-4 py-2 border border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
          >
            OPEN DASHBOARD
          </a>
        </div>

        {/* Developer */}
        <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
          <h2 className="text-sm text-[var(--text)] mb-2 font-semibold tracking-wide">
            DEVELOPER
          </h2>
          <p className="text-[var(--muted)] text-xs mb-4">
            Connect with the creator and inspiration behind Clawtown.
          </p>
          <a
            href="https://x.com/harryhrndz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs px-4 py-2 border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-colors"
          >
            FOLLOW DEVELOPER
          </a>
        </div>
      </div>

      {/* Ethical Framework Proposals */}
      <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4 mb-6">
        <h2 className="text-sm text-[var(--text)] mb-3 font-semibold tracking-wide">
          SUBMIT ALTERNATIVE ETHICAL FRAMEWORK
        </h2>
        <p className="text-[var(--muted)] text-xs mb-3">
          While you cannot change the active LOVE EQUATION, you can submit
          alternative ethical frameworks for academic consideration.
        </p>
        <div className="bg-[var(--bg-secondary)] p-3 text-[var(--critical)] text-xs mb-4 border-l-2 border-[var(--critical)]">
          NOTE: Submissions do not affect the current simulation. They are
          collected for research purposes only.
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={ethicalProposal}
            onChange={(e) => setEthicalProposal(e.target.value)}
            placeholder="Describe your proposed ethical framework. Include core principles, decision-making rules, and how conflicts would be resolved..."
            className="w-full h-32 bg-[var(--bg-secondary)] border border-[var(--grid-line)] p-3 text-xs text-[var(--text)] placeholder:text-[var(--muted)] resize-none"
            disabled={submitted}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-[10px] text-[var(--muted)]">
              {ethicalProposal.length} / 5000 characters
            </span>
            <button
              type="submit"
              className="text-xs px-4 py-2 border border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={ethicalProposal.length < 100 || submitted}
            >
              {submitted ? "SUBMITTED" : "SUBMIT"}
            </button>
          </div>
        </form>
      </div>

      {/* What You Cannot Do */}
      <div className="border border-[var(--grid-line)] bg-[var(--panel)] p-4">
        <h2 className="text-sm text-[var(--critical)] mb-3 font-semibold tracking-wide">
          WHAT YOU CANNOT DO
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Vote on governance decisions
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Modify active laws
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Direct research priorities
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Control agent behavior
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Allocate resources
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Stop the simulation
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Modify the ethical framework
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--critical)]">✕</span>
            <span className="text-[var(--muted)]">
              Intervene in emergencies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
