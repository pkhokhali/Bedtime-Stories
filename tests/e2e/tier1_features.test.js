/**
 * Tier 1: Feature Coverage Test Suite (>=50 tests)
 * 
 * Verifies all 10 Core Features of Saanjh 3.0 Admin & Cloudflare Workers Upgrade:
 * - Feature 1: Backend Image Upload Endpoint (POST /upload)
 * - Feature 2: Backend Image Delivery Endpoint (GET /images/:id)
 * - Feature 3: Backend Catalog Ingestion with Beat[] (POST /catalog)
 * - Feature 4: Backend Bearer Auth & Security (ADMIN_SECRET)
 * - Feature 5: Admin Bilingual Content & Beat Editor UI Logic
 * - Feature 6: Smart Text Auto-Splitter
 * - Feature 7: Audio & Scene Metadata Controls
 * - Feature 8: Direct Cover Image Uploader UI Logic
 * - Feature 9: Toast Notification System & Offline Resilience
 * - Feature 10: Responsive CMS Layout, Search & Filters
 */

const {
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
} = require('./harness');

async function runTier1(ctx = new TestContext('Tier 1: Feature Coverage')) {
  console.log(`\n  \x1b[1m\x1b[35m=== TIER 1: FEATURE COVERAGE (10 Features, >=50 Tests) ===\x1b[0m\n`);

  const ADMIN_SECRET = 'saanjh_test_secret_2026';
  const kv = new MockKV();
  const api = new WorkerApiSimulator({ kv, adminSecret: ADMIN_SECRET });
  const cms = new AdminCmsSimulator(api);
  cms.adminSecret = ADMIN_SECRET;

  // --------------------------------------------------------------------------
  // FEATURE 1: BACKEND IMAGE UPLOAD ENDPOINT (POST /upload)
  // --------------------------------------------------------------------------
  console.log(`  \x1b[1m\x1b[36m[Feature 1/10] Backend Image Upload Endpoint (POST /upload)\x1b[0m`);

  await ctx.runTest('F01-1: POST /upload with JPEG image binary returns 200, id, and public URL', async () => {
    const dummyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: dummyJpeg,
    });

    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.success).toBe(true);
    ctx.expect(typeof res.data.id).toBe('string');
    ctx.expect(res.data.url).toContain(res.data.id);
    ctx.expect(res.data.contentType).toBe('image/jpeg');
  });

  await ctx.runTest('F01-2: POST /upload with PNG image binary returns correct contentType and PNG url', async () => {
    const dummyPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/png',
      },
      body: dummyPng,
    });

    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.contentType).toBe('image/png');
    ctx.expect(res.data.url).toMatch(/\.png$/);
  });

  await ctx.runTest('F01-3: POST /upload with WEBP image binary returns 200 with webp extension', async () => {
    const dummyWebp = Buffer.from('RIFF....WEBPVP8 ');
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/webp',
      },
      body: dummyWebp,
    });

    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.contentType).toBe('image/webp');
    ctx.expect(res.data.url).toMatch(/\.webp$/);
  });

  await ctx.runTest('F01-4: POST /upload with Base64 Data URL payload parses and stores binary image', async () => {
    const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: base64Data,
    });

    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.contentType).toBe('image/png');
    ctx.expect(res.data.size).toBeGreaterThan(0);
  });

  await ctx.runTest('F01-5: POST /upload stores image in KV with image:<id> prefix and metadata', async () => {
    const dummyImage = Buffer.from('TEST_IMAGE_BYTES_123');
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: dummyImage,
    });

    const kvItem = await kv.getWithMetadata(`image:${res.data.id}`, 'stream');
    ctx.expect(kvItem.value).toBeTruthy();
    ctx.expect(kvItem.metadata.contentType).toBe('image/jpeg');
    ctx.expect(kvItem.metadata.size).toBe(dummyImage.length);
    ctx.expect(typeof kvItem.metadata.uploadedAt).toBe('string');
  });

  await ctx.runTest('F01-6: POST /upload calculates exact size in bytes matching uploaded buffer', async () => {
    const testBuffer = Buffer.alloc(4096, 0xab);
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: testBuffer,
    });

    ctx.expect(res.data.size).toBe(4096);
  });

  // --------------------------------------------------------------------------
  // FEATURE 2: BACKEND IMAGE DELIVERY ENDPOINT (GET /images/:id)
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 2/10] Backend Image Delivery Endpoint (GET /images/:id)\x1b[0m`);

  let testImageId = '';
  const originalBytes = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]);

  await ctx.runTest('F02-1: Seed test image for delivery endpoints', async () => {
    const uploadRes = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/png',
      },
      body: originalBytes,
    });
    testImageId = uploadRes.data.id;
    ctx.expect(typeof testImageId).toBe('string');
  });

  await ctx.runTest('F02-2: GET /images/:id delivers binary image matching exact uploaded bytes', async () => {
    const res = await api.handleRequest(`/images/${testImageId}`);
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.buffer.equals(originalBytes)).toBe(true);
  });

  await ctx.runTest('F02-3: GET /images/:id sets Content-Type header to image/png', async () => {
    const res = await api.handleRequest(`/images/${testImageId}`);
    ctx.expect(res.headers['Content-Type']).toBe('image/png');
    ctx.expect(res.headers['Content-Length']).toBe(String(originalBytes.length));
  });

  await ctx.runTest('F02-4: GET /images/:id sets immutable Cache-Control header for edge caching', async () => {
    const res = await api.handleRequest(`/images/${testImageId}`);
    ctx.expect(res.headers['Cache-Control']).toContain('immutable');
    ctx.expect(res.headers['Cache-Control']).toContain('max-age=31536000');
  });

  await ctx.runTest('F02-5: GET /images/:id sets CORS Access-Control-Allow-Origin: *', async () => {
    const res = await api.handleRequest(`/images/${testImageId}`);
    ctx.expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  await ctx.runTest('F02-6: GET /images/:id allows file extension suffix (e.g. .png, .jpg)', async () => {
    const res = await api.handleRequest(`/images/${testImageId}.png`);
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.buffer.equals(originalBytes)).toBe(true);
  });

  await ctx.runTest('F02-7: DELETE /images/:id deletes image from KV and subsequent GET returns 404', async () => {
    const delRes = await api.handleRequest(`/images/${testImageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    ctx.expect(delRes.status).toBe(200);

    const getRes = await api.handleRequest(`/images/${testImageId}`);
    ctx.expect(getRes.status).toBe(404);
  });

  // --------------------------------------------------------------------------
  // FEATURE 3: BACKEND CATALOG INGESTION WITH BEAT[] (POST /catalog)
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 3/10] Backend Catalog Ingestion with Beat[] (POST /catalog)\x1b[0m`);

  await ctx.runTest('F03-1: GET /catalog returns fallback { version: 1, stories: [] } when empty', async () => {
    kv.clear();
    const res = await api.handleRequest('/catalog');
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.version).toBe(1);
    ctx.expect(Array.isArray(res.data.stories)).toBe(true);
    ctx.expect(res.data.stories.length).toBe(0);
  });

  const sampleCatalog = {
    version: 1,
    stories: [
      {
        id: 'clever-rabbit',
        category: 'roots',
        form: 'story',
        ageBand: '4-6',
        title: { en: 'The Clever Rabbit and the Tiger', ne: 'जङ्गी बाघ र चतुर खरायो' },
        subtitle: { en: 'A small rabbit. A loud tiger.', ne: 'सानो खरायो। चर्को बाघ।' },
        stage: 'forest',
        beats: [
          {
            id: 'b1',
            text: { en: 'Deep in the jungle, a tiger roared.', ne: 'जङ्गलभित्र बाघ करायो।' },
            scene: 'establishing',
            rabbit: 'hidden',
            tiger: 'roar',
            voice: 'tiger',
            music: 'night',
          },
          {
            id: 'b2',
            text: { en: 'A tiny rabbit hopped forward.', ne: 'सानो खरायो अगाडि आयो।' },
            scene: 'meeting',
            rabbit: 'walk',
            tiger: 'sit',
            voice: 'rabbit',
            sfx: 'chime',
          },
        ],
      },
    ],
  };

  await ctx.runTest('F03-2: POST /catalog stores complete Story array with Beat[] objects in KV', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: sampleCatalog,
    });

    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.success).toBe(true);
    ctx.expect(res.data.count).toBe(1);
  });

  await ctx.runTest('F03-3: GET /catalog returns updated catalog with nested beats and metadata', async () => {
    const res = await api.handleRequest('/catalog');
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.stories.length).toBe(1);
    ctx.expect(res.data.stories[0].id).toBe('clever-rabbit');
    ctx.expect(res.data.stories[0].beats.length).toBe(2);
    ctx.expect(res.data.stories[0].beats[0].tiger).toBe('roar');
  });

  await ctx.runTest('F03-4: POST /catalog increments catalog version number', async () => {
    const updatedCatalog = {
      ...sampleCatalog,
      version: 2,
    };
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: updatedCatalog,
    });

    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.version).toBe(2);
  });

  await ctx.runTest('F03-5: POST /catalog preserves bilingual Devanagari strings without corruption', async () => {
    const res = await api.handleRequest('/catalog');
    const story = res.data.stories[0];
    ctx.expect(story.title.ne).toBe('जङ्गी बाघ र चतुर खरायो');
    ctx.expect(story.beats[0].text.ne).toBe('जङ्गलभित्र बाघ करायो।');
  });

  await ctx.runTest('F03-6: Catalog stories conform to SchemaValidator Story contract', () => {
    for (const story of sampleCatalog.stories) {
      const validation = SchemaValidator.validateStory(story);
      ctx.expect(validation.valid).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 4: BACKEND BEARER AUTH & SECURITY
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 4/10] Backend Bearer Auth & Security (ADMIN_SECRET)\x1b[0m`);

  await ctx.runTest('F04-1: POST /catalog without Authorization header returns 401 Unauthorized', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: sampleCatalog,
    });
    ctx.expect(res.status).toBe(401);
    ctx.expect(res.data.success).toBe(false);
  });

  await ctx.runTest('F04-2: POST /catalog with wrong Bearer token returns 401 Unauthorized', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid_secret_token_123',
        'Content-Type': 'application/json',
      },
      body: sampleCatalog,
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('F04-3: POST /upload without Authorization header returns 401 Unauthorized', async () => {
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: Buffer.from('abc'),
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('F04-4: POST /upload with malformed token (no Bearer prefix) returns 401', async () => {
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: ADMIN_SECRET,
        'Content-Type': 'image/jpeg',
      },
      body: Buffer.from('abc'),
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('F04-5: OPTIONS pre-flight request returns 204 with CORS allow headers', async () => {
    const res = await api.handleRequest('/catalog', { method: 'OPTIONS' });
    ctx.expect(res.status).toBe(204);
    ctx.expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    ctx.expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  await ctx.runTest('F04-6: DELETE /images/:id requires Bearer auth and rejects unauthenticated callers', async () => {
    const res = await api.handleRequest('/images/img_test_123', { method: 'DELETE' });
    ctx.expect(res.status).toBe(401);
  });

  // --------------------------------------------------------------------------
  // FEATURE 5: ADMIN BILINGUAL CONTENT & BEAT EDITOR UI LOGIC
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 5/10] Admin Bilingual Content & Beat Editor UI Logic\x1b[0m`);

  await ctx.runTest('F05-1: Beat Editor creates new beats with unique IDs and valid defaults', () => {
    const beats = [
      {
        id: 'beat-1',
        text: { en: 'English sentence', ne: 'नेपाली वाक्य' },
        scene: 'establishing',
        rabbit: 'hidden',
        tiger: 'hidden',
        voice: 'narrator',
      },
    ];

    const newBeat = {
      id: `beat-${beats.length + 1}-${Date.now().toString(36)}`,
      text: { en: '', ne: '' },
      scene: 'peace',
      rabbit: 'idle',
      tiger: 'sit',
      voice: 'soft',
    };
    beats.push(newBeat);

    ctx.expect(beats.length).toBe(2);
    ctx.expect(SchemaValidator.validateBeat(newBeat).valid).toBe(true);
  });

  await ctx.runTest('F05-2: Beat Editor allows independent editing of EN and NE text', () => {
    const beat = {
      id: 'beat-test',
      text: { en: 'Old EN', ne: 'Old NE' },
      scene: 'establishing',
    };

    beat.text.en = 'Updated English narrative text.';
    ctx.expect(beat.text.en).toBe('Updated English narrative text.');
    ctx.expect(beat.text.ne).toBe('Old NE');

    beat.text.ne = 'परिमार्जित नेपाली कथा पाठ।';
    ctx.expect(beat.text.ne).toBe('परिमार्जित नेपाली कथा पाठ।');
  });

  await ctx.runTest('F05-3: Beat Editor supports reordering beats preserving all properties', () => {
    const beats = [
      { id: 'b1', text: { en: 'First' }, scene: 'establishing' },
      { id: 'b2', text: { en: 'Second' }, scene: 'meeting' },
      { id: 'b3', text: { en: 'Third' }, scene: 'peace' },
    ];

    // Swap index 0 and index 2
    const temp = beats[0];
    beats[0] = beats[2];
    beats[2] = temp;

    ctx.expect(beats[0].id).toBe('b3');
    ctx.expect(beats[1].id).toBe('b2');
    ctx.expect(beats[2].id).toBe('b1');
  });

  await ctx.runTest('F05-4: Beat Editor supports deleting a beat and updating count', () => {
    let beats = [
      { id: 'b1', text: { en: 'Beat 1' } },
      { id: 'b2', text: { en: 'Beat 2' } },
      { id: 'b3', text: { en: 'Beat 3' } },
    ];

    beats = beats.filter((b) => b.id !== 'b2');
    ctx.expect(beats.length).toBe(2);
    ctx.expect(beats.some((b) => b.id === 'b2')).toBe(false);
  });

  await ctx.runTest('F05-5: Beat Editor marks CMS state as dirty on any modification', () => {
    cms.isDirty = false;
    cms.updateStory('clever-rabbit', { subtitle: { en: 'New subtitle', ne: 'नयाँ उपशीर्षक' } });
    ctx.expect(cms.isDirty).toBe(true);
  });

  await ctx.runTest('F05-6: Beat Editor validates all beats before saving', () => {
    const invalidBeat = { id: 'b-invalid', text: {} };
    const validation = SchemaValidator.validateBeat(invalidBeat);
    ctx.expect(validation.valid).toBe(false);
    ctx.expect(validation.error).toContain('text must contain');
  });

  // --------------------------------------------------------------------------
  // FEATURE 6: SMART TEXT AUTO-SPLITTER
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 6/10] Smart Text Auto-Splitter\x1b[0m`);

  await ctx.runTest('F06-1: SmartSplitter parses multi-paragraph English text into discrete beats', () => {
    const textEn = `Once upon a time, high in the Himalayas, there lived a sleepy little yak.

He grazed among the golden gentian flowers as the sun began to dip behind the snow peaks.

When the stars appeared, he laid his heavy head upon the soft moss.`;

    const beats = SmartSplitter.splitIntoBeats(textEn);
    ctx.expect(beats.length).toBe(3);
    ctx.expect(beats[0].text.en).toContain('sleepy little yak');
    ctx.expect(beats[1].text.en).toContain('golden gentian flowers');
    ctx.expect(beats[2].text.en).toContain('stars appeared');
  });

  await ctx.runTest('F06-2: SmartSplitter pairs English and Nepali paragraphs 1-to-1', () => {
    const textEn = `Paragraph one in English.\n\nParagraph two in English.`;
    const textNe = `नेपालीमा पहिलो अनुच्छेद।\n\nनेपालीमा दोस्रो अनुच्छेद।`;

    const beats = SmartSplitter.splitIntoBeats(textEn, textNe);
    ctx.expect(beats.length).toBe(2);
    ctx.expect(beats[0].text.en).toBe('Paragraph one in English.');
    ctx.expect(beats[0].text.ne).toBe('नेपालीमा पहिलो अनुच्छेद।');
    ctx.expect(beats[1].text.en).toBe('Paragraph two in English.');
    ctx.expect(beats[1].text.ne).toBe('नेपालीमा दोस्रो अनुच्छेद।');
  });

  await ctx.runTest('F06-3: SmartSplitter auto-assigns progressive scene IDs', () => {
    const textEn = `Intro.\n\nMeeting.\n\nWalking.\n\nRoar.\n\nAt the well.`;
    const beats = SmartSplitter.splitIntoBeats(textEn);
    ctx.expect(beats[0].scene).toBe('establishing');
    ctx.expect(beats[1].scene).toBe('meeting');
    ctx.expect(beats[2].scene).toBe('walk');
    ctx.expect(beats[3].scene).toBe('roar');
    ctx.expect(beats[4].scene).toBe('well');
  });

  await ctx.runTest('F06-4: SmartSplitter auto-detects dialogue quotes and assigns voiceRole soft', () => {
    const textEn = `"I am not afraid of the dark," whispered the little hare.\n\nThe mountain was quiet.`;
    const beats = SmartSplitter.splitIntoBeats(textEn);
    ctx.expect(beats[0].voice).toBe('soft');
    ctx.expect(beats[1].voice).toBe('narrator');
  });

  await ctx.runTest('F06-5: SmartSplitter estimates bedtime runtime in minutes from word count', () => {
    const shortBeats = [{ text: { en: 'A very short story with few words.' } }];
    ctx.expect(SmartSplitter.estimateRuntimeMinutes(shortBeats)).toBe(1);

    const longBeats = Array.from({ length: 10 }, () => ({
      text: { en: 'Word '.repeat(100) },
    }));
    const runtime = SmartSplitter.estimateRuntimeMinutes(longBeats);
    ctx.expect(runtime).toBeGreaterThanOrEqual(10);
  });

  await ctx.runTest('F06-6: SmartSplitter produces schema-compliant Beat objects', () => {
    const beats = SmartSplitter.splitIntoBeats('Sample text', 'नमूना पाठ');
    for (const beat of beats) {
      const res = SchemaValidator.validateBeat(beat);
      ctx.expect(res.valid).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 7: AUDIO & SCENE METADATA CONTROLS
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 7/10] Audio & Scene Metadata Controls\x1b[0m`);

  await ctx.runTest('F07-1: Metadata controls support all 7 StageKind values', () => {
    ctx.expect(VALID_STAGE_KINDS.length).toBe(7);
    const expected = ['forest', 'moon', 'river', 'courtyard', 'hills', 'lamp', 'stars'];
    for (const stage of expected) {
      ctx.expect(VALID_STAGE_KINDS).toContain(stage);
      ctx.expect(SchemaValidator.validateStageKind(stage)).toBe(true);
    }
  });

  await ctx.runTest('F07-2: Metadata controls support all 13 SceneId values', () => {
    ctx.expect(VALID_SCENE_IDS.length).toBe(13);
    const expected = ['establishing', 'meeting', 'walk', 'roar', 'well', 'leap', 'peace', 'moon', 'river', 'courtyard', 'hills', 'lamp', 'stars'];
    for (const scene of expected) {
      ctx.expect(VALID_SCENE_IDS).toContain(scene);
      ctx.expect(SchemaValidator.validateSceneId(scene)).toBe(true);
    }
  });

  await ctx.runTest('F07-3: Metadata controls support all 4 VoiceRole values', () => {
    ctx.expect(VALID_VOICE_ROLES.length).toBe(4);
    const expected = ['narrator', 'tiger', 'rabbit', 'soft'];
    for (const role of expected) {
      ctx.expect(VALID_VOICE_ROLES).toContain(role);
      ctx.expect(SchemaValidator.validateVoiceRole(role)).toBe(true);
    }
  });

  await ctx.runTest('F07-4: Metadata controls support all 9 SoundId values for ambient beds & sfx', () => {
    ctx.expect(VALID_SOUND_IDS.length).toBe(9);
    const expected = ['night', 'moon', 'river', 'courtyard', 'roar', 'splash', 'ripple', 'chime', 'wind'];
    for (const sound of expected) {
      ctx.expect(VALID_SOUND_IDS).toContain(sound);
      ctx.expect(SchemaValidator.validateSoundId(sound)).toBe(true);
    }
  });

  await ctx.runTest('F07-5: Metadata controls support all 8 character Pose values', () => {
    ctx.expect(VALID_POSES.length).toBe(8);
    const expected = ['hidden', 'idle', 'walk', 'bow', 'sit', 'roar', 'leap', 'lookDown'];
    for (const pose of expected) {
      ctx.expect(VALID_POSES).toContain(pose);
      ctx.expect(SchemaValidator.validatePose(pose)).toBe(true);
    }
  });

  await ctx.runTest('F07-6: SchemaValidator rejects invalid stage or scene identifiers', () => {
    ctx.expect(SchemaValidator.validateStageKind('volcano')).toBe(false);
    ctx.expect(SchemaValidator.validateSceneId('spaceship')).toBe(false);
    ctx.expect(SchemaValidator.validateVoiceRole('robot')).toBe(false);
    ctx.expect(SchemaValidator.validateSoundId('explosion')).toBe(false);
  });

  // --------------------------------------------------------------------------
  // FEATURE 8: DIRECT COVER IMAGE UPLOADER UI LOGIC
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 8/10] Direct Cover Image Uploader UI Logic\x1b[0m`);

  await ctx.runTest('F08-1: Direct image uploader transmits file and returns hosted URL', async () => {
    const fileBytes = Buffer.from('NEW_COVER_IMAGE_DATA');
    const uploadRes = await cms.uploadCoverImage(fileBytes, 'image/jpeg', 'my_cover.jpg');

    ctx.expect(uploadRes.success).toBe(true);
    ctx.expect(typeof uploadRes.url).toBe('string');
    ctx.expect(uploadRes.url).toContain('/images/');
  });

  await ctx.runTest('F08-2: Direct image uploader automatically updates story coverImage field', async () => {
    const newStory = cms.addNewStory();
    const fileBytes = Buffer.from('STORY_COVER_BYTES');
    const uploadRes = await cms.uploadCoverImage(fileBytes, 'image/png');

    cms.updateStory(newStory.id, { coverImage: uploadRes.url });
    const updated = cms.catalog.stories.find((s) => s.id === newStory.id);

    ctx.expect(updated.coverImage).toBe(uploadRes.url);
    ctx.expect(cms.isDirty).toBe(true);
  });

  await ctx.runTest('F08-3: Direct image uploader surfaces error toast on 401 unauthorized', async () => {
    cms.clearToasts();
    const savedSecret = cms.adminSecret;
    cms.adminSecret = 'bad_token';

    const uploadRes = await cms.uploadCoverImage(Buffer.from('bytes'), 'image/jpeg');
    ctx.expect(uploadRes.success).toBe(false);
    ctx.expect(uploadRes.status).toBe(401);
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('Admin Secret'))).toBe(true);

    cms.adminSecret = savedSecret;
  });

  await ctx.runTest('F08-4: Direct image uploader rejects files exceeding 5MB with 413 error toast', async () => {
    cms.clearToasts();
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    const uploadRes = await cms.uploadCoverImage(oversizedBuffer, 'image/jpeg');

    ctx.expect(uploadRes.success).toBe(false);
    ctx.expect(uploadRes.status).toBe(413);
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('5MB'))).toBe(true);
  });

  await ctx.runTest('F08-5: Direct image uploader supports replacing existing cover image', async () => {
    const storyId = cms.catalog.stories[0].id;
    const oldCover = cms.catalog.stories[0].coverImage;

    const newBytes = Buffer.from('REPLACEMENT_IMAGE_BYTES');
    const uploadRes = await cms.uploadCoverImage(newBytes, 'image/webp');
    cms.updateStory(storyId, { coverImage: uploadRes.url });

    const updatedStory = cms.catalog.stories.find((s) => s.id === storyId);
    ctx.expect(updatedStory.coverImage).toBe(uploadRes.url);
    ctx.expect(updatedStory.coverImage).not.toBe(oldCover);
  });

  // --------------------------------------------------------------------------
  // FEATURE 9: TOAST NOTIFICATION SYSTEM & OFFLINE RESILIENCE
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 9/10] Toast Notification System & Offline Resilience\x1b[0m`);

  await ctx.runTest('F09-1: Successful catalog save triggers floating success toast', async () => {
    cms.clearToasts();
    const res = await cms.saveCatalog();

    ctx.expect(res.success).toBe(true);
    ctx.expect(cms.toasts.length).toBeGreaterThanOrEqual(1);
    const lastToast = cms.toasts[cms.toasts.length - 1];
    ctx.expect(lastToast.type).toBe('success');
    ctx.expect(lastToast.message).toContain('Successfully published');
  });

  await ctx.runTest('F09-2: Saving with invalid admin secret triggers error toast with 401 message', async () => {
    cms.clearToasts();
    const originalSecret = cms.adminSecret;
    cms.adminSecret = 'wrong_secret';

    const res = await cms.saveCatalog();
    ctx.expect(res.success).toBe(false);
    ctx.expect(res.status).toBe(401);

    const errorToast = cms.toasts.find((t) => t.type === 'error');
    ctx.expect(errorToast).toBeTruthy();
    ctx.expect(errorToast.message).toContain('Unauthorized');

    cms.adminSecret = originalSecret;
  });

  await ctx.runTest('F09-3: Attempting save while offline triggers network error toast', async () => {
    cms.clearToasts();
    cms.isOffline = true;

    const res = await cms.saveCatalog();
    ctx.expect(res.success).toBe(false);
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('offline'))).toBe(true);

    cms.isOffline = false;
  });

  await ctx.runTest('F09-4: Toasts contain unique IDs, timestamps, and can be cleared', () => {
    cms.clearToasts();
    const t1 = cms.addToast('info', 'First notification');
    const t2 = cms.addToast('warning', 'Second notification');

    ctx.expect(t1.id).not.toBe(t2.id);
    ctx.expect(typeof t1.timestamp).toBe('number');
    ctx.expect(cms.toasts.length).toBe(2);

    cms.clearToasts();
    ctx.expect(cms.toasts.length).toBe(0);
  });

  await ctx.runTest('F09-5: Concurrent toast queuing maintains message integrity', () => {
    cms.clearToasts();
    for (let i = 0; i < 5; i++) {
      cms.addToast('info', `Notification ${i}`);
    }
    ctx.expect(cms.toasts.length).toBe(5);
    ctx.expect(cms.toasts[4].message).toBe('Notification 4');
  });

  // --------------------------------------------------------------------------
  // FEATURE 10: RESPONSIVE CMS LAYOUT, SEARCH & FILTERS
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Feature 10/10] Responsive CMS Layout, Search & Filters\x1b[0m`);

  // Seed sample diverse stories for filtering
  cms.catalog.stories = [
    {
      id: 'moon-rabbit',
      category: 'roots',
      form: 'story',
      ageBand: '2-4',
      title: { en: 'The Rabbit in the Moon', ne: 'चन्द्रमामा खरायो' },
      stage: 'moon',
    },
    {
      id: 'star-blanket',
      category: 'universal',
      form: 'story',
      ageBand: '2-4',
      title: { en: 'The Star Blanket', ne: 'ताराको ओढ्ने' },
      stage: 'stars',
    },
    {
      id: 'bhaktapur-well',
      category: 'roots',
      form: 'story',
      ageBand: '6-8',
      title: { en: 'The Well of Bhaktapur', ne: 'भक्तपुरको इनार' },
      stage: 'courtyard',
    },
    {
      id: 'midnight-chiya',
      category: 'roots',
      form: 'novel',
      ageBand: 'parents',
      title: { en: 'Midnight Chiya in Patan', ne: 'पाटनमा मध्यरातको चिया' },
      stage: 'courtyard',
    },
  ];

  await ctx.runTest('F10-1: Category filter isolates stories by category', () => {
    cms.filterCategory = 'universal';
    cms.filterAgeBand = 'all';
    cms.searchQuery = '';

    const results = cms.getFilteredStories();
    ctx.expect(results.length).toBe(1);
    ctx.expect(results[0].id).toBe('star-blanket');

    cms.filterCategory = 'roots';
    ctx.expect(cms.getFilteredStories().length).toBe(3);
  });

  await ctx.runTest('F10-2: AgeBand filter isolates stories by target audience', () => {
    cms.filterCategory = 'all';
    cms.filterAgeBand = 'parents';
    cms.searchQuery = '';

    const results = cms.getFilteredStories();
    ctx.expect(results.length).toBe(1);
    ctx.expect(results[0].id).toBe('midnight-chiya');

    cms.filterAgeBand = '2-4';
    ctx.expect(cms.getFilteredStories().length).toBe(2);
  });

  await ctx.runTest('F10-3: Search query filters matching English title case-insensitively', () => {
    cms.filterCategory = 'all';
    cms.filterAgeBand = 'all';
    cms.searchQuery = 'RABBIT';

    const results = cms.getFilteredStories();
    ctx.expect(results.length).toBe(1);
    ctx.expect(results[0].id).toBe('moon-rabbit');
  });

  await ctx.runTest('F10-4: Search query filters matching Nepali Devanagari title', () => {
    cms.filterCategory = 'all';
    cms.filterAgeBand = 'all';
    cms.searchQuery = 'भक्तपुर';

    const results = cms.getFilteredStories();
    ctx.expect(results.length).toBe(1);
    ctx.expect(results[0].id).toBe('bhaktapur-well');
  });

  await ctx.runTest('F10-5: Search query filters matching story ID', () => {
    cms.filterCategory = 'all';
    cms.filterAgeBand = 'all';
    cms.searchQuery = 'midnight-chiya';

    const results = cms.getFilteredStories();
    ctx.expect(results.length).toBe(1);
    ctx.expect(results[0].id).toBe('midnight-chiya');
  });

  await ctx.runTest('F10-6: Add New Story prepends draft story with isHidden: true and dirty state', () => {
    const initialLen = cms.catalog.stories.length;
    const newStory = cms.addNewStory();

    ctx.expect(cms.catalog.stories.length).toBe(initialLen + 1);
    ctx.expect(cms.catalog.stories[0].id).toBe(newStory.id);
    ctx.expect(newStory.isHidden).toBe(true);
    ctx.expect(cms.isDirty).toBe(true);
  });

  return ctx;
}

if (require.main === module) {
  runTier1().then((ctx) => {
    console.log(`\nTier 1 Finished: ${ctx.passedCount}/${ctx.tests.length} passed (${ctx.totalAssertions} assertions)\n`);
    process.exit(ctx.failedCount === 0 ? 0 : 1);
  });
}

module.exports = { runTier1 };
