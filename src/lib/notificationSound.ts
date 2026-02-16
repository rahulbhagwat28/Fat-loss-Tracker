let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/** Call after user gesture so future sounds are allowed (browser autoplay policy). */
export function prepareNotificationSound(): void {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") ctx.resume();
}

/**
 * Play a short "pop" notification sound (like Facebook) using Web Audio API.
 * No external audio file needed.
 */
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1100, now + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch {
    // Ignore errors (e.g. autoplay policy)
  }
}
