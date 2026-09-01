import { VoiceRole } from '@/types/story';
import { SpeechSegment, VoiceProfile, VoiceProfiles } from './types';

export const VOICE_PROFILES: VoiceProfiles = {
  narrator: { pitchDelta: 0.0, rateMultiplier: 1.0, volume: 0.92 },
  soft: { pitchDelta: -0.05, rateMultiplier: 0.88, volume: 0.85 },
  rabbit: { pitchDelta: 0.18, rateMultiplier: 1.08, volume: 0.95 },
  tiger: { pitchDelta: -0.22, rateMultiplier: 0.86, volume: 1.0 },
};

/**
 * Strips SSML XML tags (e.g. <speak>, <prosody>, <break>) to prevent
 * on-device TTS engines from reading XML tags aloud.
 */
export function cleanSsml(text: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Tokenizes story/beat text into natural speech segments with strategic bedtime pauses,
 * character voice modulation for dialogue vs narration, and SSML sanitization.
 */
export function segmentText(text: string | null | undefined, defaultRole: VoiceRole = 'narrator'): SpeechSegment[] {
  if (!text || typeof text !== 'string') return [];
  const cleaned = cleanSsml(text);
  if (!cleaned || !cleaned.trim() || !/[^\s.!?।॥…\-–—,;:()"'“”]/.test(cleaned)) {
    return [];
  }

  const segments: SpeechSegment[] = [];

  // Match dialogue blocks (e.g. “...”, "...") or non-dialogue blocks
  const dialogueRegex = /(["“][^"”]+["”])/g;
  const parts = cleaned.split(dialogueRegex).filter(Boolean);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const isDialogue =
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('“') && trimmed.endsWith('”')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"));

    let role: VoiceRole = defaultRole;
    if (isDialogue) {
      if (defaultRole === 'narrator') {
        // Dialogue default modulation
        role = 'soft';
      } else {
        role = defaultRole;
      }
    } else {
      role = defaultRole;
    }

    const content = isDialogue ? trimmed.slice(1, -1).trim() : trimmed;
    if (!content || !/[^\s.!?।॥…\-–—,;:()"'“”]/.test(content)) continue;

    // Split sentences by sentence terminators (. ! ? । ॥) or paragraphs (\n\n or \n) or ellipsis (...)
    // Regex splits keeping delimiters: (\.\.\.|…|\n\n|\n|[.!?।॥])
    const sentenceTokens = content.split(/(\.\.\.|…|\n\n|\n|[.!?।॥])/g).filter(Boolean);

    for (let i = 0; i < sentenceTokens.length; i += 2) {
      const sentenceBody = sentenceTokens[i]?.trim();
      const delimiter = sentenceTokens[i + 1] || '';

      if (!sentenceBody || !/[^\s.!?।॥…\-–—,;:()"'“”]/.test(sentenceBody)) continue;

      let pauseAfterMs = 750; // Default sentence pause (750ms)

      if (delimiter.includes('\n\n')) {
        pauseAfterMs = 1200;
      } else if (delimiter.includes('\n')) {
        pauseAfterMs = 1100;
      } else if (delimiter.includes('...') || delimiter.includes('…')) {
        pauseAfterMs = 1000;
      } else if (/[.!?।॥]/.test(delimiter)) {
        pauseAfterMs = 750;
      } else if (sentenceBody.endsWith(',') || sentenceBody.endsWith(';') || sentenceBody.endsWith('—') || sentenceBody.endsWith('-')) {
        pauseAfterMs = 300;
      }

      // Check if sentenceBody ends with comma or clause pause if no trailing sentence delimiter
      if (!delimiter && (sentenceBody.endsWith(',') || sentenceBody.endsWith(';') || sentenceBody.endsWith('—'))) {
        pauseAfterMs = 300;
      }

      const profile = VOICE_PROFILES[role] || VOICE_PROFILES.narrator;

      segments.push({
        text: sentenceBody.replace(/^[,;—\-]\s*/, '').trim(),
        pauseAfterMs,
        isDialogue,
        role,
        pitchModifier: profile.pitchDelta,
        rateModifier: profile.rateMultiplier,
        volume: profile.volume,
      });
    }
  }

  return segments;
}
