"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNocracyStore } from "@/store/simulation";
import { playTypingSound } from "@/lib/sounds";

const WALLET_ADDRESS = "CA 8StW1wSVWwJLcH15h5Ja46DVNsbffdwaZufWXZdGpump";

// Component for letter-by-letter animation
function TypingText({ 
  text, 
  speed = 30, 
  delay = 0,
  className = "",
  onComplete
}: { 
  text: string; 
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (delay > 0) {
      const delayTimer = setTimeout(() => {
        startTyping();
      }, delay);
      return () => clearTimeout(delayTimer);
    } else {
      startTyping();
    }
  }, [text, delay, speed]);

  const startTyping = () => {
    let currentIndex = 0;
    setDisplayedText("");
    setIsComplete(false);

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        // Play typing sound for each character (except spaces)
        const char = text[currentIndex];
        if (char !== ' ') {
          playTypingSound();
        }
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  };

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const { manifestAccepted, acceptManifest } = useNocracyStore();
  const [mounted, setMounted] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // If manifest already accepted, redirect to simulation
    if (manifestAccepted) {
      router.push("/simulation");
    }
  }, [manifestAccepted, router]);

  const handleAcceptManifest = () => {
    acceptManifest();
    router.push("/simulation");
  };

  if (!mounted) {
    return null;
  }

  const manifestText = "A territory governed by AI. No human control. You are an observer. All decisions are public. The system operates autonomously.";
  const warningText = "YOU ARE NOT A RULER HERE.";
  
  // Split manifest into paragraphs for better visual flow
  const manifestParts = [
    "A territory governed by AI.",
    "No human control.",
    "You are an observer.",
    "All decisions are public.",
    "The system operates autonomously."
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Full screen manifest */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-[0.2em] mb-8 text-[var(--text)]">
              civilizAItion
            </h1>
          </div>
          
          {/* Minimal Manifest */}
          <div className="mb-12">
            <div className="text-center space-y-3">
              {manifestParts.map((part, index) => (
                <div key={index}>
                  <TypingText
                    text={part}
                    speed={50}
                    delay={500 + index * 800}
                    className="text-lg md:text-xl text-[var(--text)] leading-relaxed font-light"
                    onComplete={() => {
                      if (index === manifestParts.length - 1) {
                        setTimeout(() => setShowButton(true), 500);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Minimal Warning */}
          {showButton && (
            <div className="text-center mb-8 animate-fade-in">
              <div className="text-sm md:text-base text-[var(--critical)] font-medium mb-6">
                {warningText}
              </div>
            </div>
          )}
          
          {/* Wallet Address */}
          {showButton && (
            <div className="text-center mb-6 animate-fade-in">
              <div 
                onClick={handleCopyWallet}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-all duration-200 cursor-pointer font-mono"
                title="Click to copy"
              >
                <span>{WALLET_ADDRESS}</span>
                {copied ? (
                  <span className="text-[var(--status-active)]">✓ Copied</span>
                ) : (
                  <span className="opacity-50">📋</span>
                )}
              </div>
            </div>
          )}

          {/* Accept Button */}
          {showButton && (
            <div className="text-center animate-fade-in">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button 
                  onClick={handleAcceptManifest}
                  className="px-8 py-3 text-sm border-2 border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-all duration-200 font-medium"
                >
                  ENTER
                </button>
                <button 
                  onClick={() => window.open('https://t.me/civilizaition_logs', '_blank')}
                  className="px-6 py-3 text-sm border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-all duration-200 font-medium"
                >
                  TELEGRAM LOGS
                </button>
                <button 
                  onClick={() => window.open('https://x.com/janksbtw', '_blank')}
                  className="px-6 py-3 text-sm border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-all duration-200 font-medium"
                >
                  DEVELOPER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
