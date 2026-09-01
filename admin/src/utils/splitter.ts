import type { Beat, SceneId, VoiceRole, Pose, StageKind } from '../types/story';

export interface SplitterOptions {
  defaultScene?: SceneId;
  defaultStage?: StageKind;
  defaultVoice?: VoiceRole;
  defaultRabbit?: Pose;
  defaultTiger?: Pose;
}

export interface SmartSplitParams {
  enText?: string;
  neText?: string;
  stage?: StageKind;
  defaultVoice?: VoiceRole;
  defaultScene?: SceneId;
}

export class SmartSplitter {
  /**
   * Scene progression cadence for auto-assignment across beats
   */
  public static readonly SCENE_PROGRESSION: SceneId[] = [
    'establishing',
    'meeting',
    'walk',
    'roar',
    'well',
    'leap',
    'peace',
    'moon',
    'river',
    'courtyard',
    'hills',
    'lamp',
    'stars',
  ];

  /**
   * Normalize and tokenize text into clean paragraphs
   */
  public static tokenizeParagraphs(rawText?: string | null): string[] {
    if (!rawText || typeof rawText !== 'string') return [];
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Detect if a text paragraph is enclosed in dialogue quotes or contains prominent dialogue
   */
  public static isDialogueQuote(text: string): boolean {
    if (!text) return false;
    const t = text.trim();
    return (
      (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith('“') && t.endsWith('”')) ||
      (t.startsWith('«') && t.endsWith('»')) ||
      (t.startsWith("'") && t.endsWith("'")) ||
      (t.startsWith('‘') && t.endsWith('’')) ||
      t.includes('"') ||
      t.includes('“') ||
      t.includes('”')
    );
  }

  /**
   * Deduce the best voice role based on dialogue cues and text keywords
   */
  public static detectVoiceRole(enText: string, neText: string, defaultVoice: VoiceRole = 'narrator'): VoiceRole {
    const combined = `${enText} ${neText}`.toLowerCase();
    
    // Check specific character dialogue
    const isQuoted = this.isDialogueQuote(enText) || this.isDialogueQuote(neText);

    if (isQuoted) {
      if (combined.includes('tiger') || combined.includes('बाघ') || combined.includes('roar')) {
        return 'tiger';
      }
      if (combined.includes('rabbit') || combined.includes('खरायो') || combined.includes('hare')) {
        return 'rabbit';
      }
      return 'soft';
    }

    if (combined.includes('tiger') && combined.includes('roar')) {
      return 'tiger';
    }

    return defaultVoice;
  }

  /**
   * Infer appropriate character poses based on scene and text keywords
   */
  public static inferPoses(scene: SceneId, enText: string, neText: string): { rabbit: Pose; tiger: Pose } {
    const combined = `${enText} ${neText}`.toLowerCase();

    if (scene === 'roar' || combined.includes('roar') || combined.includes('कराय')) {
      return { rabbit: 'hidden', tiger: 'roar' };
    }
    if (scene === 'well' || combined.includes('well') || combined.includes('इनार')) {
      return { rabbit: 'idle', tiger: 'lookDown' };
    }
    if (scene === 'leap' || combined.includes('leap') || combined.includes('dive') || combined.includes('फाल')) {
      return { rabbit: 'idle', tiger: 'leap' };
    }
    if (scene === 'walk' || combined.includes('walk') || combined.includes('hop') || combined.includes('हिँड')) {
      return { rabbit: 'walk', tiger: 'walk' };
    }
    if (scene === 'meeting' || combined.includes('meet') || combined.includes('saw') || combined.includes('भेट')) {
      return { rabbit: 'idle', tiger: 'idle' };
    }
    if (scene === 'peace' || combined.includes('sleep') || combined.includes('rest') || combined.includes('सुत')) {
      return { rabbit: 'sit', tiger: 'sit' };
    }

    return { rabbit: 'hidden', tiger: 'hidden' };
  }

  /**
   * Split raw bilingual text (or single language) into structured Beats
   */
  public static splitIntoBeats(
    textEn: string = '',
    textNe: string = '',
    options: SplitterOptions = {}
  ): Beat[] {
    const defaultScene = options.defaultScene || 'establishing';
    const defaultVoice = options.defaultVoice || 'narrator';
    const defaultRabbit = options.defaultRabbit;
    const defaultTiger = options.defaultTiger;

    const parasEn = this.tokenizeParagraphs(textEn);
    const parasNe = this.tokenizeParagraphs(textNe);

    const count = Math.max(parasEn.length, parasNe.length);
    if (count === 0) return [];

    const beats: Beat[] = [];

    for (let i = 0; i < count; i++) {
      const enPart = parasEn[i] || (parasEn.length > 0 ? parasEn[parasEn.length - 1] : '');
      const nePart = parasNe[i] || (parasNe.length > 0 ? parasNe[parasNe.length - 1] : '');

      // Assign scene based on progression cadence or default
      const scene: SceneId =
        i < this.SCENE_PROGRESSION.length ? this.SCENE_PROGRESSION[i] : defaultScene;

      // Auto-detect voice role
      const voice = this.detectVoiceRole(enPart, nePart, defaultVoice);

      // Auto-assign poses
      const inferred = this.inferPoses(scene, enPart, nePart);
      const rabbit = defaultRabbit !== undefined ? defaultRabbit : inferred.rabbit;
      const tiger = defaultTiger !== undefined ? defaultTiger : inferred.tiger;

      const beatId = `beat-${i + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      beats.push({
        id: beatId,
        text: {
          en: enPart,
          ne: nePart,
        },
        scene,
        rabbit,
        tiger,
        voice,
      });
    }

    return beats;
  }

  /**
   * Calculate total estimated runtime in minutes from beats based on bedtime pacing (~90-100 WPM)
   */
  public static estimateRuntimeMinutes(beats: Array<{ text?: { en?: string; ne?: string } }> = []): number {
    if (!beats || beats.length === 0) return 1;

    let totalWords = 0;
    for (const beat of beats) {
      const enWords = (beat.text?.en || '').trim().split(/\s+/).filter(Boolean).length;
      const neWords = (beat.text?.ne || '').trim().split(/\s+/).filter(Boolean).length;
      totalWords += Math.max(enWords, neWords);
    }

    if (totalWords === 0) return 1;
    return Math.max(1, Math.ceil(totalWords / 90));
  }
}

/**
 * Top-level convenience function matching the requirement specification:
 * smartSplitBilingualText({ enText, neText, stage, defaultVoice })
 */
export function smartSplitBilingualText(params: SmartSplitParams): Beat[] {
  const {
    enText = '',
    neText = '',
    stage = 'forest',
    defaultVoice = 'narrator',
    defaultScene = 'establishing',
  } = params;

  return SmartSplitter.splitIntoBeats(enText, neText, {
    defaultStage: stage,
    defaultVoice,
    defaultScene,
  });
}

/**
 * Top-level runtime estimator
 */
export function estimateRuntimeMinutes(beats: Array<{ text?: { en?: string; ne?: string } }> = []): number {
  return SmartSplitter.estimateRuntimeMinutes(beats);
}

/**
 * Tokenizer helper
 */
export function tokenizeParagraphs(text?: string | null): string[] {
  return SmartSplitter.tokenizeParagraphs(text);
}
