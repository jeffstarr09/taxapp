// Lightweight sound effects using Web Audio API — no external files needed

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.15
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playRepSound() {
  // Short click/pop
  playTone(880, 0.08, "sine", 0.12);
  setTimeout(() => playTone(1100, 0.06, "sine", 0.08), 30);
}

export function playMilestoneSound() {
  // Ascending arpeggio for milestones (10, 25, 50, etc.)
  playTone(523, 0.15, "sine", 0.15);
  setTimeout(() => playTone(659, 0.15, "sine", 0.15), 100);
  setTimeout(() => playTone(784, 0.15, "sine", 0.15), 200);
  setTimeout(() => playTone(1047, 0.25, "sine", 0.2), 300);
}

export function playAchievementSound() {
  // Fanfare
  playTone(523, 0.2, "sine", 0.15);
  setTimeout(() => playTone(659, 0.2, "sine", 0.15), 150);
  setTimeout(() => playTone(784, 0.2, "sine", 0.15), 300);
  setTimeout(() => playTone(1047, 0.4, "triangle", 0.2), 450);
}

export function playStartSound() {
  // Quick ascending
  playTone(440, 0.1, "sine", 0.1);
  setTimeout(() => playTone(660, 0.1, "sine", 0.12), 80);
  setTimeout(() => playTone(880, 0.15, "sine", 0.15), 160);
}

export function playEndSound() {
  // Descending wrap-up
  playTone(880, 0.15, "sine", 0.12);
  setTimeout(() => playTone(660, 0.15, "sine", 0.1), 120);
  setTimeout(() => playTone(440, 0.25, "sine", 0.08), 240);
}

export function triggerHaptic(pattern: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  switch (pattern) {
    case "light":
      navigator.vibrate(10);
      break;
    case "medium":
      navigator.vibrate(25);
      break;
    case "heavy":
      navigator.vibrate([30, 50, 30]);
      break;
  }
}

const REP_MILESTONES = [10, 25, 50, 75, 100, 150, 200];

export function isMilestone(count: number): boolean {
  return REP_MILESTONES.includes(count);
}
