// Sound utilities for UI interactions

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume audio context if suspended (required by some browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Generate a click sound using Web Audio API
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    
    // Create a more natural click sound with two frequencies
    const now = ctx.currentTime;
    
    // Main click tone
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);
    
    oscillator1.frequency.value = 1000;
    oscillator1.type = 'sine';
    
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.15, now + 0.001);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    oscillator1.start(now);
    oscillator1.stop(now + 0.08);
    
    // Subtle lower frequency for depth
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    
    oscillator2.frequency.value = 400;
    oscillator2.type = 'sine';
    
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.05, now + 0.001);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    oscillator2.start(now);
    oscillator2.stop(now + 0.06);
  } catch (error) {
    // Silently fail if audio context is not available
    console.debug('Audio context not available:', error);
  }
}

// Generate a softer click sound for less important interactions
export function playSoftClickSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Softer click: lower pitch, quieter
    oscillator.frequency.value = 700;
    oscillator.type = 'sine';

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    oscillator.start(now);
    oscillator.stop(now + 0.04);
  } catch (error) {
    console.debug('Audio context not available:', error);
  }
}

// Generate a typing sound - short, quiet click-like sound
export function playTypingSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create a quick, quiet typing sound with slight variation
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Vary frequency slightly for more natural typing sound (800-1200 Hz range)
    oscillator.frequency.value = 900 + Math.random() * 300;
    oscillator.type = 'square'; // Square wave for more mechanical/typewriter feel
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.03, now + 0.001); // Very quiet
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    
    oscillator.start(now);
    oscillator.stop(now + 0.02);
  } catch (error) {
    console.debug('Audio context not available:', error);
  }
}
