import { SleepTimerDuration, useSleepTimerStore, formatTimerSeconds } from '@/store/useSleepTimerStore';
import { Language } from '@/types/story';

export interface SleepTimerOption {
  id: SleepTimerDuration;
  label: { en: string; ne: string };
  hint?: { en: string; ne: string };
  minutes?: number;
}

export const SLEEP_TIMER_OPTIONS: SleepTimerOption[] = [
  {
    id: 'off',
    label: { en: 'Off', ne: 'बन्द' },
    hint: { en: 'No sleep timer', ne: 'टाइमर नराख्ने' },
  },
  {
    id: '15m',
    label: { en: '15 Minutes', ne: '१५ मिनेट' },
    hint: { en: 'Quick nap or fast wind-down', ne: 'छोटो निन्द्राका लागि' },
    minutes: 15,
  },
  {
    id: '30m',
    label: { en: '30 Minutes', ne: '३० मिनेट' },
    hint: { en: 'Standard bedtime drift', ne: 'नियमित सुत्ने समय' },
    minutes: 30,
  },
  {
    id: '45m',
    label: { en: '45 Minutes', ne: '४५ मिनेट' },
    hint: { en: 'Deep relaxation bed', ne: 'गहिरो आरामका लागि' },
    minutes: 45,
  },
  {
    id: '60m',
    label: { en: '60 Minutes', ne: '६० मिनेट' },
    hint: { en: 'Extended overnight ambiance', ne: 'लामो समयको लागि' },
    minutes: 60,
  },
  {
    id: 'endOfStory',
    label: { en: 'End of Story', ne: 'कथा सकिएपछि' },
    hint: { en: 'Stops when current story finishes', ne: 'हालको कथा पूरा भएपछि बन्द हुने' },
  },
];

let globalTimerInterval: ReturnType<typeof setInterval> | null = null;

export function startGlobalSleepTimerTicker() {
  if (globalTimerInterval) return;
  globalTimerInterval = setInterval(() => {
    useSleepTimerStore.getState().tick();
  }, 1000);
}

export function stopGlobalSleepTimerTicker() {
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
  }
}

export function getSleepTimerBadgeText(
  duration: SleepTimerDuration,
  remainingSeconds: number | null,
  lang: Language = 'ne'
): string {
  if (duration === 'off') return '';
  if (duration === 'endOfStory') {
    return lang === 'ne' ? 'कथा अन्त्य' : 'End of Story';
  }
  return formatTimerSeconds(remainingSeconds);
}
