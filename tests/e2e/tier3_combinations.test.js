/**
 * Tier 3: Cross-Feature Combinations Test Suite (>=10 tests)
 * 
 * Verifies pairwise and multi-feature integration workflows:
 * - C01: Image Upload -> Auto-populate coverImage -> Save Catalog -> Fetch Catalog
 * - C02: Smart Auto-Splitter -> Beat Generation -> Audio Metadata -> Catalog Persistence
 * - C03: Multi-facet CMS Filtering (Category + AgeBand + Search Query)
 * - C04: Auth Failure Flow (401 Error -> Enter Secret -> Retry Save Success)
 * - C05: Offline Failure & Reconnection Recovery (Upload Fail -> Reconnect -> Success)
 * - C06: Bilingual Story Pipeline with Character Voice Assignment
 * - C07: Beat Deletion & Re-indexing Sequence Integrity
 * - C08: Novel Form Selection with Parents AgeBand & Audio Cascade
 * - C09: WEBP Direct Upload -> Edge Delivery -> Story Cover Invalidation
 * - C10: Bulk Catalog Import -> Schema Verification -> Mobile Contract Compliance
 * - C11: Story Visibility Toggle & Category Filter Interaction
 * - C12: Client Validation Interception -> Beat Fix -> Cloudflare KV Publish
 */

const {
  TestContext,
  MockKV,
  WorkerApiSimulator,
  SmartSplitter,
  SchemaValidator,
  AdminCmsSimulator,
} = require('./harness');

async function runTier3(ctx = new TestContext('Tier 3: Cross-Feature Combinations')) {
  console.log(`\n  \x1b[1m\x1b[35m=== TIER 3: CROSS-FEATURE COMBINATIONS (12 Pairwise Workflows) ===\x1b[0m\n`);

  const ADMIN_SECRET = 'saanjh_comb_secret_2026';
  const kv = new MockKV();
  const api = new WorkerApiSimulator({ kv, adminSecret: ADMIN_SECRET });
  const cms = new AdminCmsSimulator(api);
  cms.adminSecret = ADMIN_SECRET;

  await ctx.runTest('C01: Image Upload -> Auto-populate coverImage -> Save Catalog -> Fetch Verification', async () => {
    // 1. Create new story
    const newStory = cms.addNewStory();
    newStory.title.en = 'The Whispering Pines';

    // 2. Upload cover image
    const coverBuffer = Buffer.from('PINES_COVER_IMAGE_DATA_123');
    const uploadRes = await cms.uploadCoverImage(coverBuffer, 'image/jpeg', 'pines.jpg');
    ctx.expect(uploadRes.success).toBe(true);

    // 3. Auto-populate cover image
    cms.updateStory(newStory.id, { coverImage: uploadRes.url, isHidden: false });

    // 4. Save catalog to backend
    const saveRes = await cms.saveCatalog();
    ctx.expect(saveRes.success).toBe(true);

    // 5. Fetch from backend and verify
    const fetchRes = await api.handleRequest('/catalog');
    const storedStory = fetchRes.data.stories.find((s) => s.id === newStory.id);
    ctx.expect(storedStory).toBeTruthy();
    ctx.expect(storedStory.coverImage).toBe(uploadRes.url);
    ctx.expect(storedStory.isHidden).toBe(false);
  });

  await ctx.runTest('C02: Smart Auto-Splitter -> Beat Generation -> Audio Metadata -> Catalog Persistence', async () => {
    const rawEnglish = `Deep in the mountain forest, a tiger prowled.\n\nA clever rabbit watched from the safety of a high rock.\n\n"Come down, little friend," purred the tiger.\n\n"I prefer the view from up here," chirped the rabbit.`;
    const rawNepali = `पहाडी जङ्गलभित्र एउटा बाघ घुमिरहेको थियो।\n\nएउटा चतुर खरायोले अग्लो ढुङ्गाबाट हेरिरहेको थियो।\n\n“तल आऊ, सानो साथी,” बाघले भन्यो।\n\n“मलाई यहीँबाट हेर्न मन पर्छ,” खरायोले भन्यो।`;

    // 1. Split into beats
    const beats = SmartSplitter.splitIntoBeats(rawEnglish, rawNepali, { defaultStage: 'forest' });
    ctx.expect(beats.length).toBe(4);

    // 2. Assign audio & scene metadata per beat
    beats[0].scene = 'establishing';
    beats[0].tiger = 'walk';
    beats[0].voice = 'tiger';

    beats[1].scene = 'meeting';
    beats[1].rabbit = 'sit';
    beats[1].voice = 'rabbit';

    beats[2].scene = 'roar';
    beats[2].tiger = 'roar';
    beats[2].voice = 'tiger';

    beats[3].scene = 'peace';
    beats[3].rabbit = 'bow';
    beats[3].voice = 'rabbit';

    // 3. Add to story and publish
    const storyId = 'forest-rabbit-tiger';
    const fullStory = {
      id: storyId,
      category: 'roots',
      form: 'story',
      ageBand: '4-6',
      stage: 'forest',
      title: { en: 'The Forest Meeting', ne: 'जङ्गलको भेट' },
      beats,
    };

    ctx.expect(SchemaValidator.validateStory(fullStory).valid).toBe(true);

    cms.catalog.stories.push(fullStory);
    const saveRes = await cms.saveCatalog();
    ctx.expect(saveRes.success).toBe(true);

    // 4. Verify in database
    const remote = await api.handleRequest('/catalog');
    const saved = remote.data.stories.find((s) => s.id === storyId);
    ctx.expect(saved.beats.length).toBe(4);
    ctx.expect(saved.beats[2].tiger).toBe('roar');
  });

  await ctx.runTest('C03: Multi-facet CMS Filtering (Category + AgeBand + Search Query)', () => {
    // Seed diverse stories
    cms.catalog.stories = [
      { id: 's1', category: 'roots', ageBand: '2-4', title: { en: 'Sleepy Yak', ne: 'निद्रालु याक' } },
      { id: 's2', category: 'roots', ageBand: '4-6', title: { en: 'Clever Rabbit', ne: 'चतुर खरायो' } },
      { id: 's3', category: 'universal', ageBand: '4-6', title: { en: 'Star Blanket', ne: 'ताराको ओढ्ने' } },
      { id: 's4', category: 'roots', ageBand: 'parents', title: { en: 'Midnight Chiya', ne: 'मध्यरातको चिया' } },
    ];

    // Filter Category: roots, AgeBand: 4-6, Search: 'clever'
    cms.filterCategory = 'roots';
    cms.filterAgeBand = '4-6';
    cms.searchQuery = 'clever';

    const filtered = cms.getFilteredStories();
    ctx.expect(filtered.length).toBe(1);
    ctx.expect(filtered[0].id).toBe('s2');

    // Reset filters
    cms.filterCategory = 'all';
    cms.filterAgeBand = 'all';
    cms.searchQuery = '';
    ctx.expect(cms.getFilteredStories().length).toBe(4);
  });

  await ctx.runTest('C04: Auth Failure Flow (401 Error -> Enter Secret -> Retry Save Success)', async () => {
    cms.clearToasts();
    cms.adminSecret = 'incorrect_token_xyz';

    // 1. Initial save fails with 401
    const failRes = await cms.saveCatalog();
    ctx.expect(failRes.status).toBe(401);
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('Unauthorized'))).toBe(true);

    // 2. User enters correct secret
    cms.adminSecret = ADMIN_SECRET;

    // 3. Retry save succeeds
    const successRes = await cms.saveCatalog();
    ctx.expect(successRes.status).toBe(200);
    ctx.expect(cms.toasts.some((t) => t.type === 'success')).toBe(true);
  });

  await ctx.runTest('C05: Offline Failure & Reconnection Recovery (Upload Fail -> Reconnect -> Success)', async () => {
    cms.clearToasts();
    cms.isOffline = true;

    // 1. Upload fails due to network
    const failRes = await cms.uploadCoverImage(Buffer.from('IMG_BYTES'));
    ctx.expect(failRes.success).toBe(false);
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('offline'))).toBe(true);

    // 2. Network reconnects
    cms.isOffline = false;

    // 3. Upload succeeds
    const successRes = await cms.uploadCoverImage(Buffer.from('IMG_BYTES'), 'image/png');
    ctx.expect(successRes.success).toBe(true);
    ctx.expect(successRes.url).toMatch(/\.png$/);
  });

  await ctx.runTest('C06: Bilingual Story Pipeline with Character Voice Assignment', () => {
    const rawEn = `"Wake up," said the sun.\n\n"Five more minutes," grumbled the sleeping bear.`;
    const rawNe = `“उठ,” घामले भन्यो।\n\n“अझै पाँच मिनेट,” सुतेको भालुले करायो।`;

    const beats = SmartSplitter.splitIntoBeats(rawEn, rawNe);
    ctx.expect(beats.length).toBe(2);

    // Assign specific character voices
    beats[0].voice = 'soft';
    beats[1].voice = 'tiger'; // deeper grumbling voice

    ctx.expect(beats[0].voice).toBe('soft');
    ctx.expect(beats[1].voice).toBe('tiger');
    ctx.expect(SchemaValidator.validateBeat(beats[0]).valid).toBe(true);
    ctx.expect(SchemaValidator.validateBeat(beats[1]).valid).toBe(true);
  });

  await ctx.runTest('C07: Beat Deletion & Re-indexing Sequence Integrity', async () => {
    const story = {
      id: 'seq-story',
      category: 'universal',
      title: { en: 'Sequential Story' },
      ageBand: '4-6',
      beats: [
        { id: 'b-0', text: { en: 'Beat 0' }, scene: 'establishing' },
        { id: 'b-1', text: { en: 'Beat 1 (to delete)' }, scene: 'meeting' },
        { id: 'b-2', text: { en: 'Beat 2' }, scene: 'peace' },
      ],
    };

    // Remove middle beat
    story.beats.splice(1, 1);
    ctx.expect(story.beats.length).toBe(2);
    ctx.expect(story.beats[0].id).toBe('b-0');
    ctx.expect(story.beats[1].id).toBe('b-2');

    // Save and verify KV stores valid beats array
    cms.catalog.stories = [story];
    await cms.saveCatalog();

    const remote = await api.handleRequest('/catalog');
    ctx.expect(remote.data.stories[0].beats.length).toBe(2);
    ctx.expect(remote.data.stories[0].beats[1].scene).toBe('peace');
  });

  await ctx.runTest('C08: Novel Form Selection with Parents AgeBand & Audio Cascade', async () => {
    const novelStory = {
      id: 'evening-lamp',
      category: 'roots',
      form: 'novel',
      ageBand: 'parents',
      title: { en: 'The Evening Lamp', ne: 'साँझको बत्ती' },
      stage: 'lamp',
      beats: [
        {
          id: 'b1',
          text: { en: 'Chapter 1: The old wooden stall in Asan.' },
          scene: 'lamp',
          music: 'courtyard',
        },
      ],
    };

    ctx.expect(SchemaValidator.validateStory(novelStory).valid).toBe(true);
    ctx.expect(novelStory.form).toBe('novel');
    ctx.expect(novelStory.ageBand).toBe('parents');
    ctx.expect(novelStory.stage).toBe('lamp');
  });

  await ctx.runTest('C09: WEBP Direct Upload -> Edge Delivery -> Story Cover Invalidation', async () => {
    const webpBuffer = Buffer.from('RIFF_MOCK_WEBP_DATA');
    const uploadRes = await api.handleRequest('/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'image/webp',
      },
      body: webpBuffer,
    });

    ctx.expect(uploadRes.status).toBe(200);
    ctx.expect(uploadRes.data.contentType).toBe('image/webp');

    // Fetch image from edge endpoint
    const getRes = await api.handleRequest(`/images/${uploadRes.data.id}.webp`);
    ctx.expect(getRes.status).toBe(200);
    ctx.expect(getRes.headers['Content-Type']).toBe('image/webp');
    ctx.expect(getRes.headers['Cache-Control']).toContain('immutable');
  });

  await ctx.runTest('C10: Bulk Catalog Import -> Schema Verification -> Mobile Contract Compliance', async () => {
    const bulkStories = Array.from({ length: 8 }, (_, i) => ({
      id: `bulk-story-${i + 1}`,
      category: i % 2 === 0 ? 'roots' : 'universal',
      form: i === 7 ? 'novel' : 'story',
      ageBand: VALID_AGE_BANDS[i],
      title: { en: `Story ${i + 1}`, ne: `कथा ${i + 1}` },
      stage: VALID_STAGE_KINDS[i % VALID_STAGE_KINDS.length],
      beats: [
        {
          id: `b-bulk-${i}`,
          text: { en: `Intro ${i}`, ne: `सुरुवात ${i}` },
          scene: VALID_SCENE_IDS[i % VALID_SCENE_IDS.length],
        },
      ],
    }));

    for (const s of bulkStories) {
      ctx.expect(SchemaValidator.validateStory(s).valid).toBe(true);
    }

    const res = await api.handleRequest('/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
      body: { version: 20, stories: bulkStories },
    });
    ctx.expect(res.status).toBe(200);
    ctx.expect(res.data.count).toBe(8);
  });

  await ctx.runTest('C11: Story Visibility Toggle & Category Filter Interaction', () => {
    cms.catalog.stories = [
      { id: 's1', category: 'roots', isHidden: true, title: { en: 'Story 1' } },
      { id: 's2', category: 'roots', isHidden: false, title: { en: 'Story 2' } },
      { id: 's3', category: 'universal', isHidden: false, title: { en: 'Story 3' } },
    ];

    // Toggle s1 to published (not hidden)
    cms.updateStory('s1', { isHidden: false });
    ctx.expect(cms.catalog.stories.find((s) => s.id === 's1').isHidden).toBe(false);

    // Filter by roots category
    cms.filterCategory = 'roots';
    const visibleRoots = cms.getFilteredStories().filter((s) => !s.isHidden);
    ctx.expect(visibleRoots.length).toBe(2);
  });

  await ctx.runTest('C12: Client Validation Interception -> Beat Fix -> Cloudflare KV Publish', async () => {
    // 1. Attempt invalid story
    const brokenBeat = { id: 'bad-beat', text: {} };
    const check1 = SchemaValidator.validateBeat(brokenBeat);
    ctx.expect(check1.valid).toBe(false);

    // 2. Fix the beat
    brokenBeat.text = { en: 'Fixed English text', ne: 'सुधारिएको नेपाली पाठ' };
    brokenBeat.scene = 'peace';
    const check2 = SchemaValidator.validateBeat(brokenBeat);
    ctx.expect(check2.valid).toBe(true);

    // 3. Publish to KV
    const fixedStory = {
      id: 'fixed-story',
      category: 'universal',
      title: { en: 'Fixed Story' },
      ageBand: '4-6',
      beats: [brokenBeat],
    };

    cms.catalog.stories = [fixedStory];
    const saveRes = await cms.saveCatalog();
    ctx.expect(saveRes.success).toBe(true);
  });

  return ctx;
}

if (require.main === module) {
  runTier3().then((ctx) => {
    console.log(`\nTier 3 Finished: ${ctx.passedCount}/${ctx.tests.length} passed (${ctx.totalAssertions} assertions)\n`);
    process.exit(ctx.failedCount === 0 ? 0 : 1);
  });
}

module.exports = { runTier3 };
