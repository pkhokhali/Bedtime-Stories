/**
 * Tier 4: Real-World CMS Application Scenarios (>=5 tests)
 * 
 * Simulates complete end-to-end user workflows from creator and administrator perspectives:
 * - Scenario 1: Create New Bilingual Bedtime Story for Toddlers (Ages 2-4)
 * - Scenario 2: Create & Publish Multi-Chapter Bedtime Novel for Parents (12+ beats)
 * - Scenario 3: Network Drop & Auth Failure Resilient Recovery Workflow
 * - Scenario 4: Direct Cover Image Upload, Edge Delivery & Invalidation Lifecycle
 * - Scenario 5: Mobile Client Catalog Ingestion & Audio Cascade Simulation
 * - Scenario 6: Full CMS Publishing Lifecycle (Draft -> Beats -> Assets -> Publish -> Archive)
 */

const {
  TestContext,
  MockKV,
  WorkerApiSimulator,
  SmartSplitter,
  SchemaValidator,
  AdminCmsSimulator,
} = require('./harness');

async function runTier4(ctx = new TestContext('Tier 4: Real-World Scenarios')) {
  console.log(`\n  \x1b[1m\x1b[35m=== TIER 4: REAL-WORLD SCENARIOS (6 Comprehensive Journeys) ===\x1b[0m\n`);

  const ADMIN_SECRET = 'saanjh_scenario_secret_2026';
  const kv = new MockKV();
  const api = new WorkerApiSimulator({ kv, adminSecret: ADMIN_SECRET });
  const cms = new AdminCmsSimulator(api);
  cms.adminSecret = ADMIN_SECRET;

  // --------------------------------------------------------------------------
  // SCENARIO 1: CREATE NEW BILINGUAL BEDTIME STORY (AGES 2-4)
  // --------------------------------------------------------------------------
  await ctx.runTest('S01: Create New Bilingual Bedtime Story (Ages 2-4) Journey', async () => {
    // Step 1: Administrator clicks "Add New" in CMS
    const story = cms.addNewStory();
    ctx.expect(story.isHidden).toBe(true);

    // Step 2: Configure title, subtitle, age band, and stage
    cms.updateStory(story.id, {
      id: 'little-cloud-sleep',
      category: 'universal',
      form: 'story',
      ageBand: '2-4',
      stage: 'stars',
      title: { en: 'The Little Cloud That Wanted to Sleep', ne: 'सुत्न चाहेको सानो बादल' },
      subtitle: { en: 'A soft journey across the night sky.', ne: 'रात्रिकालीन आकाशमा एक नरम यात्रा।' },
      theme: { en: 'Even the clouds find rest', ne: 'बादलहरू पनि आराम गर्छन्' },
    });

    // Step 3: Author enters 4-paragraph bilingual bedtime narrative
    const rawEn = `High above the sleeping hills, a little white cloud drifted slowly.

The crescent moon smiled gently and offered a silver lullaby.

The night stars twinkled like tiny nightlights in the dark.

The little cloud closed its eyes and drifted into sweet dreams.`;

    const rawNe = `सुतेका डाँडाहरूमाथि, एउटा सानो सेतो बादल बिस्तारै तैरियो।

अर्धचन्द्रमाले मुस्कुराउँदै चाँदीको लोरी सुनायो।

रातका ताराहरू अँध्यारोमा साना बत्तीझैं चम्किए।

सानो बादलले आफ्ना आँखा बन्द गर्यो र मिठो निद्रामा पर्यो।`;

    const beats = SmartSplitter.splitIntoBeats(rawEn, rawNe, { defaultStage: 'stars' });
    ctx.expect(beats.length).toBe(4);

    // Step 4: Fine-tune beat audio & scene metadata
    beats[0].scene = 'establishing';
    beats[0].music = 'night';

    beats[1].scene = 'moon';
    beats[1].music = 'moon';
    beats[1].voice = 'soft';

    beats[2].scene = 'stars';
    beats[2].sfx = 'chime';

    beats[3].scene = 'peace';
    beats[3].music = 'night';

    cms.updateStory('little-cloud-sleep', { beats });

    // Step 5: Upload high-resolution cover image
    const coverBuffer = Buffer.from('LITTLE_CLOUD_COVER_IMAGE_BYTES');
    const uploadRes = await cms.uploadCoverImage(coverBuffer, 'image/jpeg', 'cloud.jpg');
    ctx.expect(uploadRes.success).toBe(true);

    // Step 6: Attach cover image, set published (isHidden = false) and save to database
    cms.updateStory('little-cloud-sleep', { coverImage: uploadRes.url, isHidden: false });
    const saveRes = await cms.saveCatalog();
    ctx.expect(saveRes.success).toBe(true);

    // Step 7: Verify final database record matches contract
    const remote = await api.handleRequest('/catalog');
    const saved = remote.data.stories.find((s) => s.id === 'little-cloud-sleep');
    ctx.expect(saved).toBeTruthy();
    ctx.expect(saved.ageBand).toBe('2-4');
    ctx.expect(saved.stage).toBe('stars');
    ctx.expect(saved.beats.length).toBe(4);
    ctx.expect(saved.beats[1].voice).toBe('soft');
    ctx.expect(SchemaValidator.validateStory(saved).valid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 2: CREATE & PUBLISH MULTI-CHAPTER NOVEL FOR PARENTS (12+ BEATS)
  // --------------------------------------------------------------------------
  await ctx.runTest('S02: Create & Publish Multi-Chapter Novel (Parents) Journey', async () => {
    // Step 1: Create novel shell
    const novelId = 'midnight-tea-patan';
    const novel = {
      id: novelId,
      category: 'roots',
      form: 'novel',
      ageBand: 'parents',
      stage: 'courtyard',
      title: { en: 'Midnight Tea in Patan', ne: 'पाटनमा मध्यरातको चिया' },
      subtitle: { en: 'Echoes of rain on ancient terracotta bricks.', ne: 'प्राचीन इँटाहरूमा वर्षाको आवाज।' },
      theme: { en: 'Stillness after the day', ne: 'दिनपछिको शान्ति' },
      runtimeMinutes: 12,
    };

    // Step 2: Generate 12-beat rich narrative using SmartSplitter
    const chaptersEn = Array.from({ length: 12 }, (_, i) => `Chapter ${i + 1}: The quiet courtyard in the rain with old memories drifting through the cool night air.`).join('\n\n');
    const chaptersNe = Array.from({ length: 12 }, (_, i) => `अध्याय ${i + 1}: वर्षामा शान्त चोक र चिसो रातिको हावामा पुरानो सम्झनाहरू।`).join('\n\n');

    const beats = SmartSplitter.splitIntoBeats(chaptersEn, chaptersNe, { defaultStage: 'courtyard' });
    ctx.expect(beats.length).toBe(12);

    // Step 3: Assign ambient sound beds and soft narration
    beats.forEach((b, idx) => {
      b.scene = idx < 6 ? 'courtyard' : 'lamp';
      b.music = idx < 6 ? 'courtyard' : 'night';
      b.voice = 'soft';
    });

    novel.beats = beats;
    ctx.expect(SchemaValidator.validateStory(novel).valid).toBe(true);

    // Step 4: Upload novel cover
    const coverRes = await api.handleRequest('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'image/jpeg' },
      body: Buffer.from('NOVEL_COVER_ART'),
    });
    novel.coverImage = coverRes.data.url;

    // Step 5: Ingest into catalog
    cms.catalog.stories.push(novel);
    const saveRes = await cms.saveCatalog();
    ctx.expect(saveRes.success).toBe(true);

    // Step 6: Verify novel properties in remote catalog
    const fetchRes = await api.handleRequest('/catalog');
    const publishedNovel = fetchRes.data.stories.find((s) => s.id === novelId);
    ctx.expect(publishedNovel.form).toBe('novel');
    ctx.expect(publishedNovel.ageBand).toBe('parents');
    ctx.expect(publishedNovel.beats.length).toBe(12);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 3: NETWORK DROP & AUTH FAILURE RESILIENT RECOVERY
  // --------------------------------------------------------------------------
  await ctx.runTest('S03: Offline & Auth Failure Recovery Flow Journey', async () => {
    cms.clearToasts();

    // Step 1: User edits story in offline state
    cms.isOffline = true;
    cms.updateStory('little-cloud-sleep', { subtitle: { en: 'Updated offline subtitle' } });
    ctx.expect(cms.isDirty).toBe(true);

    // Step 2: Attempt save while offline -> Triggers Error Toast
    const offlineSaveRes = await cms.saveCatalog();
    ctx.expect(offlineSaveRes.success).toBe(false);
    ctx.expect(cms.isDirty).toBe(true); // Dirty state preserved
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('offline'))).toBe(true);

    // Step 3: Network comes back online, but admin secret is wrong
    cms.isOffline = false;
    cms.adminSecret = 'expired_admin_key_999';

    const authFailRes = await cms.saveCatalog();
    ctx.expect(authFailRes.status).toBe(401);
    ctx.expect(cms.toasts.some((t) => t.type === 'error' && t.message.includes('Unauthorized'))).toBe(true);

    // Step 4: Administrator inputs correct key and retries
    cms.adminSecret = ADMIN_SECRET;
    const recoveryRes = await cms.saveCatalog();

    ctx.expect(recoveryRes.success).toBe(true);
    ctx.expect(cms.isDirty).toBe(false);
    ctx.expect(cms.toasts[cms.toasts.length - 1].type).toBe('success');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 4: DIRECT COVER IMAGE UPLOAD & INVALIDATION LIFECYCLE
  // --------------------------------------------------------------------------
  await ctx.runTest('S04: Direct Cover Image Upload & Invalidation Lifecycle Journey', async () => {
    // Step 1: Upload initial cover image (PNG)
    const initialPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02, 0x03]);
    const upRes1 = await api.handleRequest('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'image/png' },
      body: initialPng,
    });
    ctx.expect(upRes1.status).toBe(200);
    const imageId1 = upRes1.data.id;

    // Step 2: Retrieve image from edge
    const getRes1 = await api.handleRequest(`/images/${imageId1}`);
    ctx.expect(getRes1.status).toBe(200);
    ctx.expect(getRes1.headers['Content-Type']).toBe('image/png');

    // Step 3: Upload replacement high-res image (WEBP)
    const replacementWebp = Buffer.from('RIFF_NEW_HIGH_RES_WEBP');
    const upRes2 = await api.handleRequest('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'image/webp' },
      body: replacementWebp,
    });
    ctx.expect(upRes2.status).toBe(200);
    const imageId2 = upRes2.data.id;
    ctx.expect(imageId2).not.toBe(imageId1);

    // Step 4: Invalidate old image from KV
    const delRes = await api.handleRequest(`/images/${imageId1}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    ctx.expect(delRes.status).toBe(200);

    // Step 5: Verify old image returns 404 while new image delivers 200
    const oldCheck = await api.handleRequest(`/images/${imageId1}`);
    ctx.expect(oldCheck.status).toBe(404);

    const newCheck = await api.handleRequest(`/images/${imageId2}`);
    ctx.expect(newCheck.status).toBe(200);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 5: MOBILE APP CATALOG CONSUMPTION SIMULATION
  // --------------------------------------------------------------------------
  await ctx.runTest('S05: Mobile App Catalog Consumption Simulation Journey', async () => {
    // Step 1: Mobile client dispatches GET /catalog
    const response = await api.handleRequest('/catalog');
    ctx.expect(response.status).toBe(200);

    const catalog = response.data;
    ctx.expect(typeof catalog.version).toBe('number');
    ctx.expect(Array.isArray(catalog.stories)).toBe(true);

    // Step 2: Mobile client validates and groups stories by age band
    const grouped = {};
    for (const story of catalog.stories) {
      const validation = SchemaValidator.validateStory(story);
      ctx.expect(validation.valid).toBe(true);

      const band = story.ageBand;
      if (!grouped[band]) grouped[band] = [];
      grouped[band].push(story);
    }

    // Step 3: Mobile client simulates audio bed resolution for each beat
    for (const story of catalog.stories) {
      if (story.beats && story.beats.length > 0) {
        for (const beat of story.beats) {
          // Resolve ambient bed: explicit beat music -> stage -> scene -> fallback night
          const resolvedBed = beat.music || story.stage || beat.scene || 'night';
          ctx.expect(typeof resolvedBed).toBe('string');
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // SCENARIO 6: FULL CMS PUBLISHING LIFECYCLE
  // --------------------------------------------------------------------------
  await ctx.runTest('S06: Full CMS Publishing Lifecycle (Draft -> Edit -> Publish -> Delete) Journey', async () => {
    // 1. Create draft story
    const draft = cms.addNewStory();
    draft.title.en = 'The Mountain Spring';
    draft.title.ne = 'पहाडी मुहान';
    draft.ageBand = '6-8';
    draft.category = 'roots';
    draft.stage = 'river';

    // 2. Add beats
    draft.beats = SmartSplitter.splitIntoBeats('Water rushed from the stones.', 'ढुङ्गाबाट पानी बगेर आयो।');
    ctx.expect(draft.beats.length).toBe(1);

    // 3. Upload and attach cover
    const upRes = await cms.uploadCoverImage(Buffer.from('SPRING_COVER'), 'image/jpeg');
    draft.coverImage = upRes.url;

    // 4. Publish to live
    draft.isHidden = false;
    await cms.saveCatalog();

    // 5. Verify published story exists
    let remote = await api.handleRequest('/catalog');
    ctx.expect(remote.data.stories.some((s) => s.id === draft.id && !s.isHidden)).toBe(true);

    // 6. Delete story
    cms.deleteStory(draft.id);
    await cms.saveCatalog();

    // 7. Verify deletion propagated to backend
    remote = await api.handleRequest('/catalog');
    ctx.expect(remote.data.stories.some((s) => s.id === draft.id)).toBe(false);
  });

  return ctx;
}

if (require.main === module) {
  runTier4().then((ctx) => {
    console.log(`\nTier 4 Finished: ${ctx.passedCount}/${ctx.tests.length} passed (${ctx.totalAssertions} assertions)\n`);
    process.exit(ctx.failedCount === 0 ? 0 : 1);
  });
}

module.exports = { runTier4 };
