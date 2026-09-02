/**
 * Saanjh 3.0 E2E Test Suite - Shared Test Harness & Contract Simulators
 * 
 * Provides:
 * 1. Assertion Engine (expect, test, testAsync, suite)
 * 2. Mock Cloudflare KV Database (MockKV)
 * 3. Cloudflare Worker API Simulator implementing Backend Contract (PROJECT.md § 1)
 * 4. Smart Auto-Splitter Reference Engine (PROJECT.md § Feature 7)
 * 5. Admin CMS State & Toast Simulator (PROJECT.md § Feature 6, 8, 9, 10, 11)
 * 6. Story & Beat Schema Validator (types/story.ts contract)
 * 7. Terminal Color Formatting
 */

const crypto = require('crypto');

// Terminal ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgDark: '\x1b[40m',
};

// ============================================================================
// 1. ASSERTION ENGINE & TEST CONTEXT
// ============================================================================

class TestContext {
  constructor(name = 'default') {
    this.name = name;
    this.totalAssertions = 0;
    this.passedAssertions = 0;
    this.failedAssertions = 0;
    this.tests = [];
    this.passedCount = 0;
    this.failedCount = 0;
    this.failures = [];
  }

  async runTest(name, fn) {
    const startTime = Date.now();
    let passed = true;
    let error = null;

    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        await res;
      }
    } catch (err) {
      passed = false;
      error = err;
    }

    const duration = Date.now() - startTime;
    this.tests.push({ name, passed, duration, error });

    if (passed) {
      this.passedCount++;
      console.log(`    ${colors.green}✓${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}`);
    } else {
      this.failedCount++;
      this.failures.push({ name, error, duration });
      console.log(`    ${colors.red}✗${colors.reset} ${colors.red}${name}${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
      console.log(`      ${colors.yellow}Error:${colors.reset} ${error ? error.message : 'Unknown error'}`);
      if (error && error.stack) {
        const stackLines = error.stack.split('\n').slice(1, 3).join('\n');
        console.log(`      ${colors.gray}${stackLines}${colors.reset}`);
      }
    }
  }

  expect(actual) {
    const ctx = this;
    return {
      toBe(expected, msg) {
        ctx.totalAssertions++;
        if (actual === expected) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected === ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toEqual(expected, msg) {
        ctx.totalAssertions++;
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr === expectedStr) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Deep equality failed:\nActual:   ${actualStr}\nExpected: ${expectedStr}`);
        }
      },
      toBeTruthy(msg) {
        ctx.totalAssertions++;
        if (Boolean(actual)) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected truthy value but got ${JSON.stringify(actual)}`);
        }
      },
      toBeFalsy(msg) {
        ctx.totalAssertions++;
        if (!Boolean(actual)) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected falsy value but got ${JSON.stringify(actual)}`);
        }
      },
      toBeGreaterThan(expected, msg) {
        ctx.totalAssertions++;
        if (typeof actual === 'number' && actual > expected) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected ${actual} > ${expected}`);
        }
      },
      toBeGreaterThanOrEqual(expected, msg) {
        ctx.totalAssertions++;
        if (typeof actual === 'number' && actual >= expected) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected ${actual} >= ${expected}`);
        }
      },
      toBeLessThan(expected, msg) {
        ctx.totalAssertions++;
        if (typeof actual === 'number' && actual < expected) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected ${actual} < ${expected}`);
        }
      },
      toBeLessThanOrEqual(expected, msg) {
        ctx.totalAssertions++;
        if (typeof actual === 'number' && actual <= expected) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected ${actual} <= ${expected}`);
        }
      },
      toContain(expected, msg) {
        ctx.totalAssertions++;
        if (Array.isArray(actual) && actual.includes(expected)) {
          ctx.passedAssertions++;
        } else if (typeof actual === 'string' && actual.includes(expected)) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
        }
      },
      toNotContain(expected, msg) {
        ctx.totalAssertions++;
        if (Array.isArray(actual) && !actual.includes(expected)) {
          ctx.passedAssertions++;
        } else if (typeof actual === 'string' && !actual.includes(expected)) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected ${JSON.stringify(actual)} NOT to contain ${JSON.stringify(expected)}`);
        }
      },
      toMatch(regex, msg) {
        ctx.totalAssertions++;
        if (regex instanceof RegExp && regex.test(String(actual))) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected "${actual}" to match pattern ${regex}`);
        }
      },
      toNotMatch(regex, msg) {
        ctx.totalAssertions++;
        if (regex instanceof RegExp && !regex.test(String(actual))) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected "${actual}" NOT to match pattern ${regex}`);
        }
      },
      toThrow(expectedSubstringOrRegex, msg) {
        ctx.totalAssertions++;
        if (typeof actual !== 'function') {
          ctx.failedAssertions++;
          throw new Error(`expect(fn).toThrow requires a function input`);
        }
        let threw = false;
        let thrownError = null;
        try {
          actual();
        } catch (err) {
          threw = true;
          thrownError = err;
        }

        if (!threw) {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected function to throw, but it executed without error`);
        }

        if (expectedSubstringOrRegex) {
          const errStr = thrownError ? String(thrownError.message || thrownError) : '';
          if (expectedSubstringOrRegex instanceof RegExp) {
            if (!expectedSubstringOrRegex.test(errStr)) {
              ctx.failedAssertions++;
              throw new Error(msg || `Expected error matching ${expectedSubstringOrRegex}, got "${errStr}"`);
            }
          } else if (typeof expectedSubstringOrRegex === 'string') {
            if (!errStr.includes(expectedSubstringOrRegex)) {
              ctx.failedAssertions++;
              throw new Error(msg || `Expected error containing "${expectedSubstringOrRegex}", got "${errStr}"`);
            }
          }
        }
        ctx.passedAssertions++;
      },
      toBeInstanceOf(expectedClass, msg) {
        ctx.totalAssertions++;
        if (actual instanceof expectedClass) {
          ctx.passedAssertions++;
        } else {
          ctx.failedAssertions++;
          throw new Error(msg || `Expected instance of ${expectedClass.name}`);
        }
      },
    };
  }
}

// ============================================================================
// 2. MOCK CLOUDFLARE WORKERS KV STORE
// ============================================================================

class MockKV {
  constructor() {
    this.store = new Map(); // key -> { value: string | Buffer, metadata?: any }
  }

  async get(key, type = 'text') {
    if (!this.store.has(key)) return null;
    const item = this.store.get(key);
    const rawVal = item.value;

    if (type === 'json') {
      try {
        return typeof rawVal === 'string' ? JSON.parse(rawVal) : JSON.parse(rawVal.toString('utf8'));
      } catch {
        return null;
      }
    }
    if (type === 'arrayBuffer') {
      if (Buffer.isBuffer(rawVal)) {
        return rawVal.buffer.slice(rawVal.byteOffset, rawVal.byteOffset + rawVal.byteLength);
      }
      return Buffer.from(String(rawVal)).buffer;
    }
    if (type === 'stream') {
      return Buffer.isBuffer(rawVal) ? rawVal : Buffer.from(String(rawVal));
    }
    return Buffer.isBuffer(rawVal) ? rawVal.toString('utf8') : String(rawVal);
  }

  async getWithMetadata(key, type = 'text') {
    if (!this.store.has(key)) return { value: null, metadata: null };
    const item = this.store.get(key);
    const value = await this.get(key, type);
    return { value, metadata: item.metadata || null };
  }

  async put(key, value, options = {}) {
    let storedValue = value;
    if (value instanceof ArrayBuffer) {
      storedValue = Buffer.from(value);
    } else if (typeof value === 'object' && !Buffer.isBuffer(value)) {
      storedValue = JSON.stringify(value);
    }
    this.store.set(key, {
      value: storedValue,
      metadata: options.metadata || null,
      expirationTtl: options.expirationTtl,
    });
  }

  async delete(key) {
    this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const keys = [];
    for (const [key, item] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key, metadata: item.metadata });
      }
    }
    return { keys, list_complete: true };
  }

  clear() {
    this.store.clear();
  }
}

// ============================================================================
// 3. CLOUDFLARE WORKER BACKEND API SIMULATOR (PROJECT.md § 1)
// ============================================================================

class WorkerApiSimulator {
  constructor(options = {}) {
    this.kv = options.kv || new MockKV();
    this.adminSecret = options.adminSecret || 'saanjh_secret_key_2026';
    this.maxUploadBytes = options.maxUploadBytes || 5 * 1024 * 1024; // 5MB limit
    this.publicBaseUrl = options.publicBaseUrl || 'https://saanjh-api.prabinkhokhali89.workers.dev';
  }

  /**
   * Dispatch a simulated HTTP request against the Cloudflare Worker API
   * @param {string} path - URL path e.g. '/catalog', '/upload', '/images/123'
   * @param {object} options - { method, headers, body }
   * @returns {Promise<{ status: number, headers: Record<string, string>, data: any, buffer?: Buffer }>}
   */
  async handleRequest(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const body = options.body;

    // CORS pre-flight
    if (method === 'OPTIONS') {
      return {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        data: null,
      };
    }

    const defaultHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    // Route: GET /
    if (method === 'GET' && (path === '/' || path === '')) {
      return {
        status: 200,
        headers: defaultHeaders,
        data: { message: 'Welcome to the Saanjh API' },
      };
    }

    // Route: GET /catalog
    if (method === 'GET' && path === '/catalog') {
      try {
        const raw = await this.kv.get('catalog');
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            status: 200,
            headers: defaultHeaders,
            data: parsed,
          };
        }
        return {
          status: 200,
          headers: defaultHeaders,
          data: { version: 1, stories: [] },
        };
      } catch (err) {
        return {
          status: 500,
          headers: defaultHeaders,
          data: { error: 'Failed to fetch catalog' },
        };
      }
    }

    // Route: POST /catalog (Requires Bearer Auth)
    if (method === 'POST' && path === '/catalog') {
      const authHeader = headers['Authorization'] || headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

      if (!token || token !== this.adminSecret) {
        return {
          status: 401,
          headers: defaultHeaders,
          data: { success: false, error: 'Unauthorized: Invalid or missing admin secret' },
        };
      }

      try {
        let catalogData;
        if (typeof body === 'string') {
          catalogData = JSON.parse(body);
        } else if (body && typeof body === 'object') {
          catalogData = body;
        } else {
          return {
            status: 400,
            headers: defaultHeaders,
            data: { success: false, error: 'Bad Request: Missing or invalid JSON body' },
          };
        }

        if (typeof catalogData !== 'object' || catalogData === null || !Array.isArray(catalogData.stories)) {
          return {
            status: 400,
            headers: defaultHeaders,
            data: { success: false, error: 'Bad Request: Catalog must contain stories array' },
          };
        }

        // Persist to KV
        await this.kv.put('catalog', JSON.stringify(catalogData));
        return {
          status: 200,
          headers: defaultHeaders,
          data: {
            success: true,
            message: 'Catalog updated successfully!',
            count: catalogData.stories.length,
            version: catalogData.version || 1,
          },
        };
      } catch (err) {
        return {
          status: 500,
          headers: defaultHeaders,
          data: { success: false, error: 'Failed to update catalog: ' + err.message },
        };
      }
    }

    // Route: POST /upload (Requires Bearer Auth)
    if (method === 'POST' && path === '/upload') {
      const authHeader = headers['Authorization'] || headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

      if (!token || token !== this.adminSecret) {
        return {
          status: 401,
          headers: defaultHeaders,
          data: { success: false, error: 'Unauthorized: Invalid or missing admin secret' },
        };
      }

      let contentType = headers['Content-Type'] || headers['content-type'] || 'image/jpeg';
      let fileBuffer = null;
      let originalFilename = 'image.jpg';

      // Parse multipart form or raw binary
      if (Buffer.isBuffer(body)) {
        fileBuffer = body;
      } else if (typeof body === 'string' && body.startsWith('data:image/')) {
        // Base64 Data URL upload support
        const matches = body.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          fileBuffer = Buffer.from(matches[2], 'base64');
        }
      } else if (body && body.fileBuffer) {
        fileBuffer = body.fileBuffer;
        contentType = body.contentType || contentType;
        originalFilename = body.filename || originalFilename;
      } else if (typeof body === 'string') {
        fileBuffer = Buffer.from(body);
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return {
          status: 400,
          headers: defaultHeaders,
          data: { success: false, error: 'Bad Request: No file provided for upload' },
        };
      }

      // Check 5MB size limit
      if (fileBuffer.length > this.maxUploadBytes) {
        return {
          status: 413,
          headers: defaultHeaders,
          data: {
            success: false,
            error: `Payload Too Large: File size (${fileBuffer.length} bytes) exceeds 5MB limit (${this.maxUploadBytes} bytes)`,
          },
        };
      }

      // Validate allowed mime types
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      const normalizedMime = contentType.split(';')[0].trim().toLowerCase();
      if (!allowedMimes.includes(normalizedMime)) {
        return {
          status: 415,
          headers: defaultHeaders,
          data: {
            success: false,
            error: `Unsupported Media Type: "${normalizedMime}". Only JPEG, PNG, WEBP, GIF, and SVG are supported.`,
          },
        };
      }

      // Generate unique image ID
      const imageId = 'img_' + crypto.randomBytes(8).toString('hex') + '_' + Date.now();
      const ext = normalizedMime.includes('png') ? '.png' : normalizedMime.includes('webp') ? '.webp' : '.jpg';
      const publicUrl = `${this.publicBaseUrl}/images/${imageId}${ext}`;

      // Save binary image to KV
      await this.kv.put(`image:${imageId}`, fileBuffer, {
        metadata: {
          contentType: normalizedMime,
          size: fileBuffer.length,
          originalFilename,
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        status: 200,
        headers: defaultHeaders,
        data: {
          success: true,
          id: imageId,
          url: publicUrl,
          contentType: normalizedMime,
          size: fileBuffer.length,
        },
      };
    }

    // Route: GET /images/:id
    if (method === 'GET' && path.startsWith('/images/')) {
      const rawId = path.slice('/images/'.length).split('?')[0];
      // Strip extension if present
      const cleanId = rawId.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');

      // Path traversal security check
      if (cleanId.includes('..') || cleanId.includes('/') || cleanId.includes('\\')) {
        return {
          status: 400,
          headers: defaultHeaders,
          data: { error: 'Bad Request: Invalid image identifier' },
        };
      }

      const { value, metadata } = await this.kv.getWithMetadata(`image:${cleanId}`, 'stream');

      if (!value) {
        return {
          status: 404,
          headers: defaultHeaders,
          data: { error: 'Image not found' },
        };
      }

      const imageHeaders = {
        'Content-Type': metadata?.contentType || 'image/jpeg',
        'Content-Length': String(value.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };

      return {
        status: 200,
        headers: imageHeaders,
        data: value.toString('base64'),
        buffer: value,
      };
    }

    // Route: DELETE /images/:id (Requires Bearer Auth)
    if (method === 'DELETE' && path.startsWith('/images/')) {
      const authHeader = headers['Authorization'] || headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

      if (!token || token !== this.adminSecret) {
        return {
          status: 401,
          headers: defaultHeaders,
          data: { success: false, error: 'Unauthorized' },
        };
      }

      const rawId = path.slice('/images/'.length).split('?')[0];
      const cleanId = rawId.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');
      await this.kv.delete(`image:${cleanId}`);

      return {
        status: 200,
        headers: defaultHeaders,
        data: { success: true, message: `Image ${cleanId} deleted` },
      };
    }

    // Fallback: 404 Not Found
    return {
      status: 404,
      headers: defaultHeaders,
      data: { error: 'Route not found' },
    };
  }
}

// ============================================================================
// 4. SMART AUTO-SPLITTER ALGORITHM (PROJECT.md § Feature 7)
// ============================================================================

class SmartSplitter {
  /**
   * Split raw bilingual text (or single language) into structured Beats
   * @param {string} textEn - English narrative text
   * @param {string} textNe - Nepali narrative text (optional)
   * @param {object} defaults - { defaultScene, defaultStage, defaultVoice }
   * @returns {Array<object>} Array of Beat objects
   */
  static splitIntoBeats(textEn = '', textNe = '', defaults = {}) {
    const defaultScene = defaults.defaultScene || 'establishing';
    const defaultVoice = defaults.defaultVoice || 'narrator';
    const defaultRabbit = defaults.defaultRabbit || 'hidden';
    const defaultTiger = defaults.defaultTiger || 'hidden';

    // Normalize newlines
    const rawEn = (textEn || '').replace(/\r\n/g, '\n').trim();
    const rawNe = (textNe || '').replace(/\r\n/g, '\n').trim();

    if (!rawEn && !rawNe) return [];

    // Split paragraphs by double newlines or major breaks
    const parasEn = rawEn ? rawEn.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
    const parasNe = rawNe ? rawNe.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];

    // If both EN and NE have identical paragraph counts, pair them by paragraph
    const count = Math.max(parasEn.length, parasNe.length);
    const beats = [];

    // Scene progression cadence for auto-assignment
    const sceneProgression = [
      'establishing',
      'meeting',
      'walk',
      'roar',
      'well',
      'leap',
      'peace',
      'moon',
      'stars',
    ];

    for (let i = 0; i < count; i++) {
      const enPart = parasEn[i] || (parasEn.length > 0 ? parasEn[parasEn.length - 1] : '');
      const nePart = parasNe[i] || (parasNe.length > 0 ? parasNe[parasNe.length - 1] : '');

      // Assign scene based on progression or default
      const scene = i < sceneProgression.length ? sceneProgression[i] : defaultScene;

      // Auto-detect dialogue quotes
      const isDialogue = (enPart.startsWith('"') && enPart.endsWith('"')) ||
                         (enPart.startsWith('“') && enPart.endsWith('”')) ||
                         (nePart.startsWith('"') && nePart.endsWith('"')) ||
                         (nePart.startsWith('“') && nePart.endsWith('”'));

      const voice = isDialogue ? 'soft' : defaultVoice;

      beats.push({
        id: `beat-${i + 1}-${Date.now().toString(36)}`,
        text: {
          en: enPart,
          ne: nePart,
        },
        scene,
        rabbit: defaultRabbit,
        tiger: defaultTiger,
        voice,
      });
    }

    return beats;
  }

  /**
   * Calculate total estimated runtime in minutes from beats
   */
  static estimateRuntimeMinutes(beats = []) {
    if (!beats || beats.length === 0) return 1;
    let totalWords = 0;
    for (const b of beats) {
      const enWords = (b.text?.en || '').split(/\s+/).filter(Boolean).length;
      const neWords = (b.text?.ne || '').split(/\s+/).filter(Boolean).length;
      totalWords += Math.max(enWords, neWords);
    }
    // Average bedtime storytelling speed: ~100 words per minute + pauses
    return Math.max(1, Math.ceil(totalWords / 90));
  }
}

// ============================================================================
// 5. SCHEMA VALIDATOR (types/story.ts contract)
// ============================================================================

const VALID_AGE_BANDS = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'];
const VALID_CATEGORIES = ['roots', 'universal', 'custom'];
const VALID_FORMS = ['story', 'novel'];
const VALID_STAGE_KINDS = ['forest', 'moon', 'river', 'courtyard', 'hills', 'lamp', 'stars'];
const VALID_SCENE_IDS = [
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
const VALID_VOICE_ROLES = ['narrator', 'tiger', 'rabbit', 'soft'];
const VALID_SOUND_IDS = ['night', 'moon', 'river', 'courtyard', 'roar', 'splash', 'ripple', 'chime', 'wind'];
const VALID_POSES = ['hidden', 'idle', 'walk', 'bow', 'sit', 'roar', 'leap', 'lookDown'];

class SchemaValidator {
  static validateAgeBand(ageBand) {
    return VALID_AGE_BANDS.includes(ageBand);
  }

  static validateStageKind(stage) {
    return !stage || VALID_STAGE_KINDS.includes(stage);
  }

  static validateSceneId(scene) {
    return VALID_SCENE_IDS.includes(scene);
  }

  static validateVoiceRole(role) {
    return !role || VALID_VOICE_ROLES.includes(role);
  }

  static validateSoundId(sound) {
    return !sound || VALID_SOUND_IDS.includes(sound);
  }

  static validatePose(pose) {
    return !pose || VALID_POSES.includes(pose);
  }

  static validateBeat(beat) {
    if (!beat || typeof beat !== 'object') return { valid: false, error: 'Beat must be an object' };
    if (!beat.id || typeof beat.id !== 'string') return { valid: false, error: 'Beat missing string id' };
    if (!beat.text || typeof beat.text !== 'object') return { valid: false, error: 'Beat missing text object' };
    if (typeof beat.text.en !== 'string' && typeof beat.text.ne !== 'string') {
      return { valid: false, error: 'Beat text must contain at least en or ne string' };
    }
    if (beat.scene && !VALID_SCENE_IDS.includes(beat.scene)) {
      return { valid: false, error: `Invalid sceneId: "${beat.scene}"` };
    }
    if (beat.voice && !VALID_VOICE_ROLES.includes(beat.voice)) {
      return { valid: false, error: `Invalid voiceRole: "${beat.voice}"` };
    }
    if (beat.music && !VALID_SOUND_IDS.includes(beat.music)) {
      return { valid: false, error: `Invalid music soundId: "${beat.music}"` };
    }
    if (beat.sfx && !VALID_SOUND_IDS.includes(beat.sfx)) {
      return { valid: false, error: `Invalid sfx soundId: "${beat.sfx}"` };
    }
    if (beat.rabbit && !VALID_POSES.includes(beat.rabbit)) {
      return { valid: false, error: `Invalid rabbit pose: "${beat.rabbit}"` };
    }
    if (beat.tiger && !VALID_POSES.includes(beat.tiger)) {
      return { valid: false, error: `Invalid tiger pose: "${beat.tiger}"` };
    }
    return { valid: true };
  }

  static validateStory(story) {
    if (!story || typeof story !== 'object') return { valid: false, error: 'Story must be an object' };
    if (!story.id || typeof story.id !== 'string') return { valid: false, error: 'Story missing string id' };
    if (!VALID_CATEGORIES.includes(story.category)) {
      return { valid: false, error: `Invalid category: "${story.category}"` };
    }
    if (story.form && !VALID_FORMS.includes(story.form)) {
      return { valid: false, error: `Invalid form: "${story.form}"` };
    }
    if (!VALID_AGE_BANDS.includes(story.ageBand)) {
      return { valid: false, error: `Invalid ageBand: "${story.ageBand}"` };
    }
    if (!story.title || typeof story.title !== 'object') {
      return { valid: false, error: 'Story missing title object' };
    }
    if (!story.title.en && !story.title.ne) {
      return { valid: false, error: 'Story title must contain en or ne string' };
    }
    if (story.stage && !VALID_STAGE_KINDS.includes(story.stage)) {
      return { valid: false, error: `Invalid stage: "${story.stage}"` };
    }
    if (story.beats) {
      if (!Array.isArray(story.beats)) {
        return { valid: false, error: 'Story beats must be an array' };
      }
      for (let i = 0; i < story.beats.length; i++) {
        const beatRes = this.validateBeat(story.beats[i]);
        if (!beatRes.valid) {
          return { valid: false, error: `Beat at index ${i} invalid: ${beatRes.error}` };
        }
      }
    }
    return { valid: true };
  }
}

// ============================================================================
// 6. ADMIN CMS STATE & TOAST SIMULATOR (PROJECT.md § 6, 8, 9, 10, 11)
// ============================================================================

class AdminCmsSimulator {
  constructor(apiSimulator) {
    this.api = apiSimulator;
    this.catalog = { version: 1, stories: [] };
    this.adminSecret = '';
    this.loading = false;
    this.saving = false;
    this.isDirty = false;
    this.toasts = []; // { id, type: 'success'|'error'|'info'|'warning', message, timestamp }
    this.searchQuery = '';
    this.filterCategory = 'all';
    this.filterAgeBand = 'all';
    this.isOffline = false;
  }

  addToast(type, message) {
    const toast = {
      id: 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type,
      message,
      timestamp: Date.now(),
    };
    this.toasts.push(toast);
    return toast;
  }

  clearToasts() {
    this.toasts = [];
  }

  async loadCatalog() {
    this.loading = true;
    try {
      if (this.isOffline) {
        throw new Error('Network offline: Failed to fetch catalog');
      }
      const res = await this.api.handleRequest('/catalog');
      if (res.status === 200) {
        this.catalog = res.data;
        this.isDirty = false;
        return { success: true, data: this.catalog };
      } else {
        throw new Error(res.data?.error || 'Failed to fetch catalog');
      }
    } catch (err) {
      this.addToast('error', err.message);
      return { success: false, error: err.message };
    } finally {
      this.loading = false;
    }
  }

  async saveCatalog() {
    this.saving = true;
    try {
      if (this.isOffline) {
        throw new Error('Network offline: Cannot publish changes while disconnected');
      }
      const newVersion = (this.catalog.version || 0) + 1;
      const payload = {
        ...this.catalog,
        version: newVersion,
      };

      const res = await this.api.handleRequest('/catalog', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (res.status === 401) {
        this.addToast('error', 'Unauthorized: Invalid or missing Admin Secret key');
        return { success: false, status: 401, error: 'Unauthorized' };
      }
      if (res.status !== 200) {
        const errorMsg = res.data?.error || 'Failed to save catalog to server';
        this.addToast('error', errorMsg);
        return { success: false, status: res.status, error: errorMsg };
      }

      this.catalog = payload;
      this.isDirty = false;
      this.addToast('success', `Successfully published ${payload.stories.length} stories!`);
      return { success: true, status: 200, version: newVersion };
    } catch (err) {
      this.addToast('error', err.message);
      return { success: false, error: err.message };
    } finally {
      this.saving = false;
    }
  }

  async uploadCoverImage(fileBuffer, contentType = 'image/jpeg', filename = 'cover.jpg') {
    try {
      if (this.isOffline) {
        throw new Error('Network offline: Image upload failed');
      }
      const res = await this.api.handleRequest('/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.adminSecret}`,
          'Content-Type': contentType,
        },
        body: { fileBuffer, contentType, filename },
      });

      if (res.status === 401) {
        this.addToast('error', 'Unauthorized: Please check your Admin Secret');
        return { success: false, status: 401, error: 'Unauthorized' };
      }
      if (res.status === 413) {
        this.addToast('error', 'File too large: Cover images must be under 5MB');
        return { success: false, status: 413, error: res.data?.error };
      }
      if (res.status !== 200) {
        this.addToast('error', res.data?.error || 'Image upload failed');
        return { success: false, status: res.status, error: res.data?.error };
      }

      this.addToast('success', 'Cover image uploaded and hosted!');
      return { success: true, url: res.data.url, id: res.data.id };
    } catch (err) {
      this.addToast('error', err.message);
      return { success: false, error: err.message };
    }
  }

  addNewStory() {
    const newStory = {
      id: `story-${Date.now().toString(36)}`,
      category: 'universal',
      form: 'story',
      ageBand: '4-6',
      title: { en: 'New Bedtime Tale', ne: 'नयाँ सुत्ने कथा' },
      subtitle: { en: 'A peaceful night adventure.', ne: 'एक शान्त रातको साहसिक यात्रा।' },
      stage: 'forest',
      beats: [],
      isHidden: true,
    };
    this.catalog.stories.unshift(newStory);
    this.isDirty = true;
    return newStory;
  }

  updateStory(storyId, updates) {
    const idx = this.catalog.stories.findIndex((s) => s.id === storyId);
    if (idx === -1) return false;
    this.catalog.stories[idx] = { ...this.catalog.stories[idx], ...updates };
    this.isDirty = true;
    return true;
  }

  deleteStory(storyId) {
    const initialLen = this.catalog.stories.length;
    this.catalog.stories = this.catalog.stories.filter((s) => s.id !== storyId);
    if (this.catalog.stories.length !== initialLen) {
      this.isDirty = true;
      return true;
    }
    return false;
  }

  getFilteredStories() {
    return this.catalog.stories.filter((story) => {
      // Category filter
      if (this.filterCategory !== 'all' && story.category !== this.filterCategory) {
        return false;
      }
      // AgeBand filter
      if (this.filterAgeBand !== 'all' && story.ageBand !== this.filterAgeBand) {
        return false;
      }
      // Search Query filter (checks EN title, NE title, id)
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const enTitle = (story.title?.en || '').toLowerCase();
        const neTitle = (story.title?.ne || '').toLowerCase();
        const idStr = (story.id || '').toLowerCase();
        if (!enTitle.includes(q) && !neTitle.includes(q) && !idStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }
}

module.exports = {
  colors,
  TestContext,
  MockKV,
  WorkerApiSimulator,
  SmartSplitter,
  SchemaValidator,
  AdminCmsSimulator,
  VALID_AGE_BANDS,
  VALID_CATEGORIES,
  VALID_FORMS,
  VALID_STAGE_KINDS,
  VALID_SCENE_IDS,
  VALID_VOICE_ROLES,
  VALID_SOUND_IDS,
  VALID_POSES,
};
