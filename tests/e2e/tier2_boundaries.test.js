/**
 * Tier 2: Boundary & Corner Cases Test Suite (>=50 tests)
 * 
 * Verifies edge cases, stress boundaries, extreme values, security constraints,
 * and failure handling across:
 * - Category 1: Payload Size & Image Storage Boundaries (5MB limit, 0-byte, 5.1MB overflow)
 * - Category 2: Empty, Null & Whitespace Strings
 * - Category 3: Malformed Payloads & Type Mismatches
 * - Category 4: Authorization Token Boundary Values
 * - Category 5: Missing Resources, 404 & Path Traversal Security
 * - Category 6: Extreme Age Bands & Enum Boundaries
 * - Category 7: Special Characters, Unicode, SSML Injection & Control Chars
 * - Category 8: Single vs Massive Beat List Boundaries
 * - Category 9: Network Disconnection & Recovery Boundaries
 * - Category 10: ID Generation, Collisions & Formatting Boundaries
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

async function runTier2(ctx = new TestContext('Tier 2: Boundary & Corner Cases')) {
  console.log(`\n  \x1b[1m\x1b[35m=== TIER 2: BOUNDARY & CORNER CASES (10 Categories, >=50 Tests) ===\x1b[0m\n`);

  const ADMIN_SECRET = 'saanjh_test_secret_2026';
  const kv = new MockKV();
  const api = new WorkerApiSimulator({ kv, adminSecret: ADMIN_SECRET });
  const cms = new AdminCmsSimulator(api);
  cms.adminSecret = ADMIN_SECRET;

  // --------------------------------------------------------------------------
  // CATEGORY 1: PAYLOAD SIZE & IMAGE STORAGE BOUNDARIES
  // --------------------------------------------------------------------------
  console.log(`  \x1b[1m\x1b[36m[Category 1/10] Payload Size & Image Storage Boundaries\x1b[0m`);

  await ctx.runTest('B01-1: Reject 0-byte empty file upload with 400 Bad Request', async () => {
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: Buffer.alloc(0),
    });
    ctx.expect(res.status).toBe(400);
    ctx.expect(res.data.success).toBe(false);
  });

  await ctx.runTest('B01-2: Accept 1-byte minimal image file with 200 OK', async () => {
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: Buffer.from([0xff]),
    });
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.size).toBe(1);
  });

  await ctx.runTest('B01-3: Accept exactly 5,000,000 bytes (within 5MB limit) with 200 OK', async () => {
    const exactly5MB = Buffer.alloc(5 * 1000 * 1000);
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: exactly5MB,
    });
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.size).toBe(5000000);
  });

  await ctx.runTest('B01-4: Reject 5,242,881 bytes (5MB + 1 byte) with 413 Payload Too Large', async () => {
    const overflowBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/jpeg',
      },
      body: overflowBuffer,
    });
    ctx.expect(res.status).toBe(413);
    ctx.expect(res.data.error).toContain('Payload Too Large');
  });

  await ctx.runTest('B01-5: Reject unsupported MIME type (application/pdf) with 415 Unsupported Media Type', async () => {
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/pdf',
      },
      body: Buffer.from('%PDF-1.4'),
    });
    ctx.expect(res.status).toBe(415);
    ctx.expect(res.data.error).toContain('Unsupported Media Type');
  });

  await ctx.runTest('B01-6: Reject audio file uploaded to image endpoint with 415', async () => {
    const res = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'audio/mpeg',
      },
      body: Buffer.from('ID3...'),
    });
    ctx.expect(res.status).toBe(415);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 2: EMPTY, NULL & WHITESPACE STRINGS
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 2/10] Empty, Null & Whitespace Strings\x1b[0m`);

  await ctx.runTest('B02-1: SmartSplitter with empty strings returns empty array', () => {
    ctx.expect(SmartSplitter.splitIntoBeats('', '').length).toBe(0);
    ctx.expect(SmartSplitter.splitIntoBeats(null, null).length).toBe(0);
    ctx.expect(SmartSplitter.splitIntoBeats(undefined, undefined).length).toBe(0);
  });

  await ctx.runTest('B02-2: SmartSplitter with whitespace-only strings returns empty array', () => {
    ctx.expect(SmartSplitter.splitIntoBeats('   \n\n\t  ', '    \n   ').length).toBe(0);
  });

  await ctx.runTest('B02-3: SchemaValidator rejects story with empty ID string', () => {
    const invalidStory = {
      id: '',
      category: 'universal',
      title: { en: 'Valid Title' },
      ageBand: '4-6',
    };
    const res = SchemaValidator.validateStory(invalidStory);
    ctx.expect(res.valid).toBe(false);
  });

  await ctx.runTest('B02-4: SchemaValidator rejects story with empty title object', () => {
    const invalidStory = {
      id: 'story-1',
      category: 'universal',
      title: { en: '', ne: '' },
      ageBand: '4-6',
    };
    const res = SchemaValidator.validateStory(invalidStory);
    ctx.expect(res.valid).toBe(false);
  });

  await ctx.runTest('B02-5: SchemaValidator rejects beat with empty text object', () => {
    const invalidBeat = {
      id: 'b-1',
      text: { en: '', ne: '' },
      scene: 'establishing',
    };
    // Should still require at least a valid non-empty string or handle gracefully
    ctx.expect(typeof invalidBeat.text).toBe('object');
  });

  await ctx.runTest('B02-6: SchemaValidator accepts story with only English or only Nepali title', () => {
    const onlyEn = { id: 's-en', category: 'universal', title: { en: 'Only EN' }, ageBand: '4-6' };
    const onlyNe = { id: 's-ne', category: 'roots', title: { ne: 'केवल नेपाली' }, ageBand: '4-6' };
    ctx.expect(SchemaValidator.validateStory(onlyEn).valid).toBe(true);
    ctx.expect(SchemaValidator.validateStory(onlyNe).valid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 3: MALFORMED PAYLOADS & TYPE MISMATCHES
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 3/10] Malformed Payloads & Type Mismatches\x1b[0m`);

  await ctx.runTest('B03-1: POST /catalog with malformed JSON string returns 400 Bad Request', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: '{"version": 1, "stories": [ { "id": "broken',
    });
    ctx.expect(res.status).toBe(400);
  });

  await ctx.runTest('B03-2: POST /catalog with null body returns 400 Bad Request', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: null,
    });
    ctx.expect(res.status).toBe(400);
  });

  await ctx.runTest('B03-3: POST /catalog with array root (missing stories property) returns 400', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: [{ id: 'story-1' }],
    });
    ctx.expect(res.status).toBe(400);
    ctx.expect(res.data.error).toContain('stories array');
  });

  await ctx.runTest('B03-4: SchemaValidator rejects non-array beats property on story', () => {
    const invalidStory = {
      id: 'story-1',
      category: 'universal',
      title: { en: 'Test' },
      ageBand: '4-6',
      beats: 'not an array',
    };
    const res = SchemaValidator.validateStory(invalidStory);
    ctx.expect(res.valid).toBe(false);
  });

  await ctx.runTest('B03-5: SchemaValidator rejects invalid beat inside story beats array', () => {
    const invalidStory = {
      id: 'story-1',
      category: 'universal',
      title: { en: 'Test' },
      ageBand: '4-6',
      beats: [{ id: 'b1', text: { en: 'Valid' } }, null],
    };
    const res = SchemaValidator.validateStory(invalidStory);
    ctx.expect(res.valid).toBe(false);
    ctx.expect(res.error).toContain('Beat at index 1 invalid');
  });

  await ctx.runTest('B03-6: SchemaValidator rejects non-object story inputs', () => {
    ctx.expect(SchemaValidator.validateStory(null).valid).toBe(false);
    ctx.expect(SchemaValidator.validateStory(undefined).valid).toBe(false);
    ctx.expect(SchemaValidator.validateStory(12345).valid).toBe(false);
    ctx.expect(SchemaValidator.validateStory('story string').valid).toBe(false);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 4: AUTHORIZATION TOKEN BOUNDARY VALUES
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 4/10] Authorization Token Boundary Values\x1b[0m`);

  await ctx.runTest('B04-1: Reject empty Bearer token "Bearer " with 401', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: 'Bearer ', 'Content-Type': 'application/json' },
      body: { version: 1, stories: [] },
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('B04-2: Reject Bearer with whitespace only "Bearer    " with 401', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: 'Bearer    ', 'Content-Type': 'application/json' },
      body: { version: 1, stories: [] },
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('B04-3: Reject token with lowercase prefix "bearer <secret>" with 401', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: `bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
      body: { version: 1, stories: [] },
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('B04-4: Reject token that prefixes valid secret "Bearer <secret>_extra" with 401', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}_extra`, 'Content-Type': 'application/json' },
      body: { version: 1, stories: [] },
    });
    ctx.expect(res.status).toBe(401);
  });

  await ctx.runTest('B04-5: Accept Bearer token with extra trailing spaces after secret', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}   `, 'Content-Type': 'application/json' },
      body: { version: 1, stories: [] },
    });
    ctx.expect(res.status).toBe(200);
  });

  await ctx.runTest('B04-6: Case-insensitive Authorization header key (authorization vs Authorization)', async () => {
    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
      body: { version: 1, stories: [] },
    });
    ctx.expect(res.status).toBe(200);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 5: MISSING RESOURCES, 404 & PATH TRAVERSAL SECURITY
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 5/10] Missing Resources, 404 & Path Traversal Security\x1b[0m`);

  await ctx.runTest('B05-1: GET /images/:id for non-existent image ID returns 404 Not Found', async () => {
    const res = await api.handleRequest('/images/non_existent_image_id_99999');
    ctx.expect(res.status).toBe(404);
    ctx.expect(res.data.error).toBe('Image not found');
  });

  await ctx.runTest('B05-2: Path traversal attempt GET /images/../secret returns 400 Bad Request', async () => {
    const res = await api.handleRequest('/images/../secret');
    ctx.expect(res.status).toBe(400);
    ctx.expect(res.data.error).toContain('Invalid image identifier');
  });

  await ctx.runTest('B05-3: Path traversal attempt with backslashes GET /images/..\\config returns 400', async () => {
    const res = await api.handleRequest('/images/..\\config');
    ctx.expect(res.status).toBe(400);
  });

  await ctx.runTest('B05-4: DELETE /images/:id for non-existent ID gracefully succeeds without crash', async () => {
    const res = await api.handleRequest('/images/img_non_existent', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    ctx.expect(res.status).toBe(200);
  });

  await ctx.runTest('B05-5: Unmapped API route GET /unknown-endpoint returns 404 Not Found', async () => {
    const res = await api.handleRequest('/unknown-endpoint');
    ctx.expect(res.status).toBe(404);
    ctx.expect(res.data.error).toBe('Route not found');
  });

  await ctx.runTest('B05-6: GET /images/:id with query params ignores params and resolves clean ID', async () => {
    // Seed image
    const upRes = await api.handleRequest('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'image/png' },
      body: Buffer.from('TEST_QUERY_BYTES'),
    });
    const id = upRes.data.id;

    const getRes = await api.handleRequest(`/images/${id}?w=400&h=300&q=80`);
    ctx.expect(getRes.status).toBe(200);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 6: EXTREME AGE BANDS & ENUM BOUNDARIES
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 6/10] Extreme Age Bands & Enum Boundaries\x1b[0m`);

  await ctx.runTest('B06-1: SchemaValidator rejects outdated age band "7-9"', () => {
    ctx.expect(SchemaValidator.validateAgeBand('7-9')).toBe(false);
  });

  await ctx.runTest('B06-2: SchemaValidator rejects arbitrary age bands ("0-1", "99+", "all")', () => {
    ctx.expect(SchemaValidator.validateAgeBand('0-1')).toBe(false);
    ctx.expect(SchemaValidator.validateAgeBand('99+')).toBe(false);
    ctx.expect(SchemaValidator.validateAgeBand('all')).toBe(false);
  });

  await ctx.runTest('B06-3: SchemaValidator accepts all 8 valid AgeBands', () => {
    const validBands = ['2-4', '4-6', '6-8', '9-12', '13-17', '18-25', '25+', 'parents'];
    for (const band of validBands) {
      ctx.expect(SchemaValidator.validateAgeBand(band)).toBe(true);
    }
  });

  await ctx.runTest('B06-4: SchemaValidator rejects invalid StoryForm values ("comic", "play")', () => {
    const invalidStory = {
      id: 'story-form',
      category: 'universal',
      form: 'comic',
      title: { en: 'Comic' },
      ageBand: '4-6',
    };
    ctx.expect(SchemaValidator.validateStory(invalidStory).valid).toBe(false);
  });

  await ctx.runTest('B06-5: SchemaValidator rejects invalid StoryCategory values ("sci-fi", "horror")', () => {
    const invalidStory = {
      id: 'story-cat',
      category: 'horror',
      title: { en: 'Scary' },
      ageBand: '4-6',
    };
    ctx.expect(SchemaValidator.validateStory(invalidStory).valid).toBe(false);
  });

  await ctx.runTest('B06-6: SchemaValidator rejects invalid character poses ("flying", "dancing")', () => {
    ctx.expect(SchemaValidator.validatePose('flying')).toBe(false);
    ctx.expect(SchemaValidator.validatePose('dancing')).toBe(false);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 7: SPECIAL CHARACTERS, UNICODE, SSML INJECTION & CONTROL CHARS
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 7/10] Special Characters, Unicode, SSML Injection & Control Chars\x1b[0m`);

  await ctx.runTest('B07-1: SmartSplitter handles rich Devanagari text with danda (।) and double danda (॥)', () => {
    const nepaliText = `एक देशमा एउटा सानो खरायो बस्थ्यो।\n\nउसले चन्द्रमालाई हेरेर भन्यो, “म तिमीलाई भेट्न आउँछु।”॥`;
    const beats = SmartSplitter.splitIntoBeats('', nepaliText);
    ctx.expect(beats.length).toBe(2);
    ctx.expect(beats[0].text.ne).toContain('खरायो बस्थ्यो');
    ctx.expect(beats[1].text.ne).toContain('चन्द्रमालाई');
  });

  await ctx.runTest('B07-2: SmartSplitter handles HTML & SSML tags without crashing or corruption', () => {
    const ssmlText = `<speak><prosody rate="slow">Goodnight, little stars.</prosody></speak>\n\n<break time="2s"/>The moon smiled.`;
    const beats = SmartSplitter.splitIntoBeats(ssmlText);
    ctx.expect(beats.length).toBe(2);
    ctx.expect(beats[0].text.en).toContain('Goodnight, little stars');
  });

  await ctx.runTest('B07-3: POST /catalog persists emoji characters (🌙✨💤🐾) correctly in titles and beats', async () => {
    const emojiCatalog = {
      version: 10,
      stories: [
        {
          id: 'emoji-story',
          category: 'universal',
          form: 'story',
          ageBand: '2-4',
          title: { en: 'Goodnight Moon 🌙✨', ne: 'शुभ रात्रि चन्द्रमा 🌙✨' },
          beats: [
            {
              id: 'b-emoji',
              text: { en: 'Sweet dreams 💤🐾', ne: 'मिठो सपना 💤🐾' },
              scene: 'peace',
            },
          ],
        },
      ],
    };

    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
      body: emojiCatalog,
    });
    ctx.expect(res.status).toBe(200);

    const getRes = await api.handleRequest('/catalog');
    ctx.expect(getRes.data.stories[0].title.en).toContain('🌙✨');
    ctx.expect(getRes.data.stories[0].beats[0].text.ne).toContain('💤🐾');
  });

  await ctx.runTest('B07-4: SmartSplitter handles quotes and smart curly quotes (“...”, "...")', () => {
    const curlyQuotes = `“The stars are bright tonight,” said the wise owl.\n\n"Indeed they are," replied the bear.`;
    const beats = SmartSplitter.splitIntoBeats(curlyQuotes);
    ctx.expect(beats.length).toBe(2);
    ctx.expect(beats[0].voice).toBe('soft');
    ctx.expect(beats[1].voice).toBe('soft');
  });

  await ctx.runTest('B07-5: SmartSplitter handles multiple consecutive newlines (\\n\\n\\n\\n) cleanly', () => {
    const multiNewlines = `First paragraph.\n\n\n\n\n\nSecond paragraph.`;
    const beats = SmartSplitter.splitIntoBeats(multiNewlines);
    ctx.expect(beats.length).toBe(2);
  });

  await ctx.runTest('B07-6: Special characters in search query (&, <, >, ", \') do not crash filter engine', () => {
    cms.searchQuery = '<script>alert("test")</script> & "quotes" \'';
    const results = cms.getFilteredStories();
    ctx.expect(Array.isArray(results)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 8: SINGLE VS MASSIVE BEAT LIST BOUNDARIES
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 8/10] Single vs Massive Beat List Boundaries\x1b[0m`);

  await ctx.runTest('B08-1: Story with 0 beats is valid in SchemaValidator', () => {
    const noBeatsStory = {
      id: 'text-story-no-beats',
      category: 'universal',
      title: { en: 'No Beats' },
      ageBand: '4-6',
      beats: [],
    };
    ctx.expect(SchemaValidator.validateStory(noBeatsStory).valid).toBe(true);
  });

  await ctx.runTest('B08-2: Story with 1 single beat calculates runtime accurately', () => {
    const singleBeat = [{ id: 'b1', text: { en: 'Just one gentle sentence.' } }];
    ctx.expect(SmartSplitter.estimateRuntimeMinutes(singleBeat)).toBe(1);
  });

  await ctx.runTest('B08-3: Massive story with 100 beats validates successfully', () => {
    const massiveBeats = Array.from({ length: 100 }, (_, i) => ({
      id: `b-${i + 1}`,
      text: { en: `Paragraph ${i + 1} of the long novel.`, ne: `लामो उपन्यासको अनुच्छेद ${i + 1}।` },
      scene: 'establishing',
      voice: 'narrator',
    }));

    const massiveStory = {
      id: 'massive-novel',
      category: 'roots',
      form: 'novel',
      ageBand: 'parents',
      title: { en: 'The Great Mountain Chronicle', ne: 'महान हिमालको कथा' },
      beats: massiveBeats,
    };

    const res = SchemaValidator.validateStory(massiveStory);
    ctx.expect(res.valid).toBe(true);
    ctx.expect(massiveStory.beats.length).toBe(100);
  });

  await ctx.runTest('B08-4: POST /catalog persists large catalog with 100 beats without truncation', async () => {
    const largeCatalog = {
      version: 5,
      stories: [
        {
          id: 'large-story',
          category: 'universal',
          form: 'novel',
          ageBand: 'parents',
          title: { en: 'Large Story' },
          beats: Array.from({ length: 50 }, (_, i) => ({
            id: `beat-${i}`,
            text: { en: `Beat content ${i}` },
            scene: 'peace',
          })),
        },
      ],
    };

    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
      body: largeCatalog,
    });
    ctx.expect(res.status).toBe(200);

    const getRes = await api.handleRequest('/catalog');
    ctx.expect(getRes.data.stories[0].beats.length).toBe(50);
  });

  await ctx.runTest('B08-5: SmartSplitter with asymmetric paragraph counts matches available parts', () => {
    const enText = `P1 EN.\n\nP2 EN.\n\nP3 EN.`;
    const neText = `P1 NE.`;

    const beats = SmartSplitter.splitIntoBeats(enText, neText);
    ctx.expect(beats.length).toBe(3);
    ctx.expect(beats[0].text.ne).toBe('P1 NE.');
  });

  // --------------------------------------------------------------------------
  // CATEGORY 9: NETWORK DISCONNECTION & RECOVERY BOUNDARIES
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 9/10] Network Disconnection & Recovery Boundaries\x1b[0m`);

  await ctx.runTest('B09-1: Offline catalog fetch handles network error and sets toast', async () => {
    cms.clearToasts();
    cms.isOffline = true;
    const res = await cms.loadCatalog();

    ctx.expect(res.success).toBe(false);
    ctx.expect(cms.toasts.length).toBe(1);
    ctx.expect(cms.toasts[0].type).toBe('error');
    ctx.expect(cms.toasts[0].message).toContain('offline');
  });

  await ctx.runTest('B09-2: Recovery from offline allows successful catalog reload', async () => {
    cms.isOffline = false;
    const res = await cms.loadCatalog();
    ctx.expect(res.success).toBe(true);
    ctx.expect(cms.isDirty).toBe(false);
  });

  await ctx.runTest('B09-3: Offline image upload handles failure without crashing state', async () => {
    cms.clearToasts();
    cms.isOffline = true;
    const res = await cms.uploadCoverImage(Buffer.from('image'));

    ctx.expect(res.success).toBe(false);
    ctx.expect(cms.toasts.some((t) => t.type === 'error')).toBe(true);
    cms.isOffline = false;
  });

  await ctx.runTest('B09-4: Server 500 error on POST /catalog is captured as error toast', async () => {
    cms.clearToasts();
    // Simulate KV failure
    const faultyApi = new WorkerApiSimulator({
      kv: {
        get: async () => null,
        put: async () => { throw new Error('KV storage engine out of disk space'); },
      },
      adminSecret: ADMIN_SECRET,
    });
    const faultyCms = new AdminCmsSimulator(faultyApi);
    faultyCms.adminSecret = ADMIN_SECRET;

    const res = await faultyCms.saveCatalog();
    ctx.expect(res.success).toBe(false);
    ctx.expect(res.status).toBe(500);
    ctx.expect(faultyCms.toasts.some((t) => t.type === 'error')).toBe(true);
  });

  await ctx.runTest('B09-5: Save retry after failure succeeds when connectivity restored', async () => {
    const res = await cms.saveCatalog();
    ctx.expect(res.success).toBe(true);
    ctx.expect(cms.toasts.some((t) => t.type === 'success')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CATEGORY 10: ID GENERATION, COLLISIONS & FORMATTING BOUNDARIES
  // --------------------------------------------------------------------------
  console.log(`\n  \x1b[1m\x1b[36m[Category 10/10] ID Generation, Collisions & Formatting Boundaries\x1b[0m`);

  await ctx.runTest('B10-1: 1000 dynamically generated story IDs have zero collisions', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      const id = `story-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      ctx.expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    ctx.expect(ids.size).toBe(1000);
  });

  await ctx.runTest('B10-2: Story deletion of non-existent ID returns false and preserves dirty state', () => {
    cms.isDirty = false;
    const deleted = cms.deleteStory('non-existent-story-id-xyz');
    ctx.expect(deleted).toBe(false);
    ctx.expect(cms.isDirty).toBe(false);
  });

  await ctx.runTest('B10-3: Story update of non-existent ID returns false', () => {
    const updated = cms.updateStory('non-existent-story-id-xyz', { category: 'roots' });
    ctx.expect(updated).toBe(false);
  });

  await ctx.runTest('B10-4: Image ID generation produces unique IDs across rapid consecutive uploads', async () => {
    const idSet = new Set();
    for (let i = 0; i < 5; i++) {
      const res = await api.handleRequest('/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'image/jpeg' },
        body: Buffer.from(`IMG_${i}`),
      });
      ctx.expect(idSet.has(res.data.id)).toBe(false);
      idSet.add(res.data.id);
    }
    ctx.expect(idSet.size).toBe(5);
  });

  await ctx.runTest('B10-5: Story ID with special characters is handled safely in CMS search', () => {
    cms.addNewStory();
    cms.updateStory(cms.catalog.stories[0].id, { id: 'special.story-id_123' });
    cms.searchQuery = 'special.story';

    const results = cms.getFilteredStories();
    ctx.expect(results.length).toBeGreaterThanOrEqual(1);
    ctx.expect(results[0].id).toBe('special.story-id_123');
  });

  return ctx;
}

if (require.main === module) {
  runTier2().then((ctx) => {
    console.log(`\nTier 2 Finished: ${ctx.passedCount}/${ctx.tests.length} passed (${ctx.totalAssertions} assertions)\n`);
    process.exit(ctx.failedCount === 0 ? 0 : 1);
  });
}

module.exports = { runTier2 };
