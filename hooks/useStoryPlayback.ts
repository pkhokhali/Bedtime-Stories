import { useCallback, useEffect, useRef, useState } from 'react';

import { fadeBedVolume, playBed, playSfx, resolveAmbientBed, stopAllAudio, windDownFinalBeat } from '@/lib/audio';
import { prefetchUpcomingBeats } from '@/lib/narrator/cloudTts';
import { speakBeat, stopSpeech, wait } from '@/lib/speech';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Beat, Language, StageKind } from '@/types/story';

type Status = 'idle' | 'playing' | 'paused' | 'done';

export function useStoryPlayback(beats: Beat[], language: Language, stage?: StageKind) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const statusRef = useRef(status);
  const indexRef = useRef(index);
  const langRef = useRef(language);
  const beatsRef = useRef(beats);
  const stageRef = useRef(stage);
  const genRef = useRef(0);

  statusRef.current = status;
  indexRef.current = index;
  langRef.current = language;
  beatsRef.current = beats;
  stageRef.current = stage;

  const speakCurrent = useCallback((at: number) => {
    const beat = beatsRef.current[at];
    const gen = ++genRef.current;
    if (!beat) {
      setStatus('done');
      windDownFinalBeat().catch(() => stopAllAudio().catch(() => undefined));
      return;
    }

    const { nightSounds, aiVoice, voiceGender, voicePace } = useSettingsStore.getState();

    // Auto-detect and layer ambient sound bed
    if (nightSounds) {
      const resolvedBed = resolveAmbientBed(beat.music, beat.scene, stageRef.current);
      playBed(resolvedBed).catch(() => undefined);
      playSfx(beat.sfx).catch(() => undefined);
    } else {
      stopAllAudio().catch(() => undefined);
    }

    // Pre-fetch upcoming beats for Cloud AI Voice if enabled
    if (aiVoice) {
      prefetchUpcomingBeats(beatsRef.current, at + 1, {
        language: langRef.current,
        gender: voiceGender,
        pace: voicePace,
      }).catch(() => undefined);
    }

    const isFinalBeat = at >= beatsRef.current.length - 1;
    if (isFinalBeat && nightSounds) {
      // Begin gentle sleep wind-down fade during final beat
      fadeBedVolume(0.06, 3500).catch(() => undefined);
    }

    speakBeat(beat.text[langRef.current], {
      language: langRef.current,
      voice: beat.voice,
      onDone: () => {
        if (gen !== genRef.current || statusRef.current !== 'playing') return;
        const next = at + 1;
        if (next >= beatsRef.current.length) {
          setStatus('done');
          windDownFinalBeat().catch(() => stopAllAudio().catch(() => undefined));
          return;
        }
        wait(560).then(() => {
          if (gen !== genRef.current || statusRef.current !== 'playing') return;
          setIndex(next);
          indexRef.current = next;
          speakCurrent(next);
        });
      },
    });
  }, []);

  const play = useCallback(() => {
    const start = statusRef.current === 'done' ? 0 : indexRef.current;
    if (statusRef.current === 'done') {
      setIndex(0);
      indexRef.current = 0;
    }
    setStatus('playing');
    speakCurrent(statusRef.current === 'done' ? 0 : start);
  }, [speakCurrent]);

  const pause = useCallback(() => {
    genRef.current += 1;
    setStatus('paused');
    stopSpeech();
    stopAllAudio().catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    if (statusRef.current === 'playing') pause();
    else play();
  }, [pause, play]);

  const stop = useCallback(() => {
    genRef.current += 1;
    setStatus('idle');
    stopSpeech();
    stopAllAudio().catch(() => undefined);
  }, []);

  const seekTo = useCallback(
    (next: number) => {
      const last = Math.max(beatsRef.current.length - 1, 0);
      const at = Math.max(0, Math.min(last, next));
      setIndex(at);
      indexRef.current = at;
      if (statusRef.current === 'done') setStatus('paused');
      if (statusRef.current === 'playing') speakCurrent(at);
      else {
        genRef.current += 1;
        stopSpeech();
      }
    },
    [speakCurrent],
  );

  useEffect(() => {
    if (statusRef.current === 'playing') {
      speakCurrent(indexRef.current);
    }
  }, [language, speakCurrent]);

  useEffect(() => {
    return () => {
      genRef.current += 1;
      stopSpeech();
      stopAllAudio().catch(() => undefined);
    };
  }, []);

  const beat = beats[index] ?? beats[0];

  return {
    index,
    count: beats.length,
    beat,
    status,
    play,
    pause,
    toggle,
    stop,
    seekTo,
  };
}
