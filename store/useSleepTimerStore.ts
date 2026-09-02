import { create } from 'zustand';

import { fadeAudioToSleep, stopAllAudio } from '@/lib/audio';

export type SleepTimerDuration = 'off' | '15m' | '30m' | '45m' | '60m' | 'endOfStory';

export const SLEEP_TIMER_SECONDS: Record<SleepTimerDuration, number | null> = {
  off: null,
  '15m': 15 * 60,
  '30m': 30 * 60,
  '45m': 45 * 60,
  '60m': 60 * 60,
  endOfStory: null,
};

export interface SleepTimerState {
  duration: SleepTimerDuration;
  remainingSeconds: number | null;
  isActive: boolean;
  isFadingOut: boolean;
  setDuration: (duration: SleepTimerDuration) => void;
  tick: () => void;
  cancelTimer: () => void;
  notifyStoryEnded: () => void;
}

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  duration: 'off',
  remainingSeconds: null,
  isActive: false,
  isFadingOut: false,

  setDuration: (duration: SleepTimerDuration) => {
    if (duration === 'off') {
      get().cancelTimer();
      return;
    }

    const seconds = SLEEP_TIMER_SECONDS[duration];
    set({
      duration,
      remainingSeconds: seconds,
      isActive: true,
      isFadingOut: false,
    });
  },

  tick: () => {
    const { isActive, duration, remainingSeconds, isFadingOut } = get();
    if (!isActive || duration === 'off') return;

    if (duration === 'endOfStory') {
      // Handled by story completion event or safety timeout
      return;
    }

    if (typeof remainingSeconds === 'number') {
      const next = remainingSeconds - 1;

      if (next <= 0) {
        // Expiry: stop all audio immediately and reset
        set({
          duration: 'off',
          remainingSeconds: null,
          isActive: false,
          isFadingOut: false,
        });
        stopAllAudio().catch(() => undefined);
        return;
      }

      if (next <= 10 && !isFadingOut) {
        set({ remainingSeconds: next, isFadingOut: true });
        // Begin smooth 10s audio fade
        fadeAudioToSleep(next * 1000).catch(() => undefined);
        return;
      }

      set({ remainingSeconds: next });
    }
  },

  cancelTimer: () => {
    set({
      duration: 'off',
      remainingSeconds: null,
      isActive: false,
      isFadingOut: false,
    });
  },

  notifyStoryEnded: () => {
    const { duration, isActive } = get();
    if (isActive && duration === 'endOfStory') {
      set({
        duration: 'off',
        remainingSeconds: null,
        isActive: false,
        isFadingOut: false,
      });
      stopAllAudio().catch(() => undefined);
    }
  },
}));

export function formatTimerSeconds(seconds: number | null, isEndOfStory?: boolean): string {
  if (isEndOfStory) return 'End of Story';
  if (seconds === null || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
