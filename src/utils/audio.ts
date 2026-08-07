// Synthetic sound effects using Web Audio API

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

function createOscillator(
  type: OscillatorType,
  frequency: number,
  duration: number,
  volume: number,
  freqChange?: { target: number; duration: number }
) {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    if (freqChange) {
      osc.frequency.exponentialRampToValueAtTime(
        freqChange.target,
        ctx.currentTime + freqChange.duration
      );
    }

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    // Smooth fade out to prevent clicks
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio playback failed', e);
  }
}

export const playEatNormal = () => {
  createOscillator('sine', 523.25, 0.1, 0.1, { target: 783.99, duration: 0.1 }); // C5 to G5 quick slide
};

export const playEatSpecial = () => {
  // Arpeggio sound
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      createOscillator('triangle', freq, 0.15, 0.15, { target: freq * 1.2, duration: 0.1 });
    }, idx * 60);
  });
};

export const playTurn = () => {
  // Soft, subtle click
  createOscillator('sine', 150, 0.03, 0.05);
};

export const playGameOver = () => {
  // Disappointing descending noise/slide
  createOscillator('sawtooth', 300, 0.6, 0.15, { target: 80, duration: 0.6 });
  setTimeout(() => {
    createOscillator('square', 180, 0.4, 0.1, { target: 60, duration: 0.4 });
  }, 150);
};

export const playStart = () => {
  // Playful retro melody
  const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C, D, E, G, A, C
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      createOscillator('sine', freq, 0.12, 0.08);
    }, idx * 80);
  });
};

export const playPause = () => {
  createOscillator('sine', 600, 0.1, 0.08);
  setTimeout(() => {
    createOscillator('sine', 450, 0.1, 0.08);
  }, 80);
};

export const playResume = () => {
  createOscillator('sine', 450, 0.1, 0.08);
  setTimeout(() => {
    createOscillator('sine', 600, 0.1, 0.08);
  }, 80);
};

export const playClick = () => {
  createOscillator('sine', 400, 0.05, 0.08);
};
