import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

export type Language = 'en' | 'ne';
export type Localized = { en?: string; ne?: string };

export type AgeBand =
  | '2-4'
  | '4-6'
  | '6-8'
  | '9-12'
  | '13-17'
  | '18-25'
  | '25+'
  | 'parents';

export type StoryCategory = 'roots' | 'universal' | 'custom';
export type StoryForm = 'story' | 'novel';
export type StageKind = 'forest' | 'moon' | 'river' | 'courtyard' | 'hills' | 'lamp' | 'stars';
export type SceneId =
  | 'establishing'
  | 'meeting'
  | 'walk'
  | 'roar'
  | 'well'
  | 'leap'
  | 'peace'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

export type VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft';
export type SoundId =
  | 'night'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'roar'
  | 'splash'
  | 'ripple'
  | 'chime'
  | 'wind';

export type Pose =
  | 'hidden'
  | 'idle'
  | 'walk'
  | 'bow'
  | 'sit'
  | 'roar'
  | 'leap'
  | 'lookDown';

export interface Beat {
  id: string;
  text: Localized;
  scene: SceneId;
  rabbit?: Pose;
  tiger?: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
}

export interface Story {
  id: string;
  category?: StoryCategory;
  form?: StoryForm;
  ageBand: AgeBand;
  title: Localized;
  subtitle?: Localized;
  runtimeMinutes?: number;
  theme?: Localized;
  accent?: string;
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  locked?: boolean;
  isPremium?: boolean;
  freeBeatsCount?: number;
  beats?: Beat[];
  mediaType?: 'video' | 'audio' | 'text' | 'youtube';
  youtubeId?: string;
  mediaUrl?: string;
  mediaUrl_ne?: string;
  coverImage?: string;
  isHidden?: boolean;
}

export interface CatalogPayload {
  version: number;
  updatedAt?: string;
  stories: Story[];
}

export interface ImageMetadata {
  contentType: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export const VALID_AGE_BANDS: Set<string> = new Set([
  '2-4',
  '4-6',
  '6-8',
  '9-12',
  '13-17',
  '18-25',
  '25+',
  'parents',
]);

export const VALID_CATEGORIES: Set<string> = new Set(['roots', 'universal', 'custom']);
export const VALID_FORMS: Set<string> = new Set(['story', 'novel']);
export const VALID_STAGES: Set<string> = new Set([
  'forest',
  'moon',
  'river',
  'courtyard',
  'hills',
  'lamp',
  'stars',
]);

export const VALID_SCENES: Set<string> = new Set([
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
]);

export const VALID_VOICE_ROLES: Set<string> = new Set(['narrator', 'tiger', 'rabbit', 'soft']);
export const VALID_SOUND_IDS: Set<string> = new Set([
  'night',
  'moon',
  'river',
  'courtyard',
  'roar',
  'splash',
  'ripple',
  'chime',
  'wind',
]);

export const VALID_POSES: Set<string> = new Set([
  'hidden',
  'idle',
  'walk',
  'bow',
  'sit',
  'roar',
  'leap',
  'lookDown',
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const app = new Hono<{ Bindings: Env }>();

// Global CORS Middleware
app.use(
  '/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Filename',
      'If-None-Match',
    ],
    maxAge: 86400,
  })
);

// Helper: Verify Bearer Token against ADMIN_SECRET
export function isAuthorized(authHeader: string | undefined, expectedSecret?: string): boolean {
  if (!expectedSecret) return true; // Permissive if no secret configured
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : authHeader.trim();
  return token === expectedSecret;
}

// Helper: Deduce MIME type from filename extension
export function inferMimeType(filename: string, fallback: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return fallback;
  }
}

// 1. Health & Welcome
app.get('/', (c) => {
  return c.json({
    service: 'Saanjh Backend API',
    version: '3.0.0',
    status: 'healthy',
  });
});

// 1.5 Admin Login
app.post('/admin/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Hardcoded credentials for now, as requested. In a real app, this should be in DB/KV
    if (email?.trim() === 'admin@saanjh.app' && password?.trim() === 'admin123') {
      // In a real app, generate a secure JWT. For now, we return the ADMIN_SECRET
      const token = c.env.ADMIN_SECRET || 'fallback-secret-for-dev';
      return c.json({ success: true, token });
    }
    
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  } catch (err) {
    return c.json({ success: false, error: 'Bad request' }, 400);
  }
});

// 2. GET Catalog (Public with fallback)
app.get('/catalog', async (c) => {
  try {
    const catalogStr = await c.env.SAANJH_DB.get('catalog');
    if (catalogStr) {
      const parsed = JSON.parse(catalogStr);
      return c.json(parsed);
    }
    return c.json({ version: 1, stories: [] });
  } catch (err: any) {
    return c.json({ success: false, error: 'Failed to fetch catalog' }, 500);
  }
});

// 3. GET Single Story by ID (Public)
app.get('/catalog/:id', async (c) => {
  const storyId = c.req.param('id');
  try {
    const catalogStr = await c.env.SAANJH_DB.get('catalog');
    if (!catalogStr) {
      return c.json({ success: false, error: 'Story not found' }, 404);
    }
    const catalog = JSON.parse(catalogStr);
    const story = catalog.stories?.find((s: any) => s.id === storyId);
    if (!story) {
      return c.json({ success: false, error: 'Story not found' }, 404);
    }
    return c.json({ success: true, story });
  } catch (err: any) {
    return c.json({ success: false, error: 'Failed to retrieve story' }, 500);
  }
});

// 4. POST Catalog (Publish / Update with validation & Bearer auth)
app.post('/catalog', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !Array.isArray(body.stories)) {
      return c.json(
        { success: false, error: "Invalid catalog format: 'stories' must be an array" },
        400
      );
    }

    // Validate story entries
    for (const [index, story] of body.stories.entries()) {
      if (!story || typeof story !== 'object') {
        return c.json({ success: false, error: `Invalid story object at index ${index}` }, 400);
      }
      if (!story.id || typeof story.id !== 'string' || !story.id.trim()) {
        return c.json({ success: false, error: `Story at index ${index} missing valid 'id'` }, 400);
      }
      if (
        !story.title ||
        typeof story.title !== 'object' ||
        (!story.title.en && !story.title.ne)
      ) {
        return c.json(
          { success: false, error: `Story '${story.id}' missing valid bilingual 'title'` },
          400
        );
      }
      if (!story.ageBand || !VALID_AGE_BANDS.has(story.ageBand)) {
        return c.json(
          {
            success: false,
            error: `Story '${story.id}' has invalid or missing ageBand '${story.ageBand}'`,
          },
          400
        );
      }
      if (story.category && !VALID_CATEGORIES.has(story.category)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid category '${story.category}'` },
          400
        );
      }
      if (story.form && !VALID_FORMS.has(story.form)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid form '${story.form}'` },
          400
        );
      }
      if (story.stage && !VALID_STAGES.has(story.stage)) {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid stage '${story.stage}'` },
          400
        );
      }
      if (story.isPremium !== undefined && typeof story.isPremium !== 'boolean') {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid isPremium flag` },
          400
        );
      }
      if (story.freeBeatsCount !== undefined && typeof story.freeBeatsCount !== 'number') {
        return c.json(
          { success: false, error: `Story '${story.id}' has invalid freeBeatsCount` },
          400
        );
      }

      // Validate Beats if present
      if (story.beats !== undefined) {
        if (!Array.isArray(story.beats)) {
          return c.json(
            { success: false, error: `Story '${story.id}' 'beats' must be an array` },
            400
          );
        }
        for (const [beatIdx, beat] of story.beats.entries()) {
          if (!beat || typeof beat !== 'object') {
            return c.json(
              { success: false, error: `Story '${story.id}' beat at index ${beatIdx} is invalid` },
              400
            );
          }
          if (!beat.id || typeof beat.id !== 'string') {
            return c.json(
              { success: false, error: `Story '${story.id}' beat at index ${beatIdx} missing 'id'` },
              400
            );
          }
          if (!beat.text || typeof beat.text !== 'object' || (!beat.text.en && !beat.text.ne)) {
            return c.json(
              { success: false, error: `Story '${story.id}' beat '${beat.id}' missing valid 'text'` },
              400
            );
          }
          if (!beat.scene || !VALID_SCENES.has(beat.scene)) {
            return c.json(
              {
                success: false,
                error: `Story '${story.id}' beat '${beat.id}' has invalid scene '${beat.scene}'`,
              },
              400
            );
          }
          if (beat.voice && !VALID_VOICE_ROLES.has(beat.voice)) {
            return c.json(
              {
                success: false,
                error: `Story '${story.id}' beat '${beat.id}' has invalid voice '${beat.voice}'`,
              },
              400
            );
          }
          if (beat.music && !VALID_SOUND_IDS.has(beat.music)) {
            return c.json(
              {
                success: false,
                error: `Story '${story.id}' beat '${beat.id}' has invalid music '${beat.music}'`,
              },
              400
            );
          }
          if (beat.sfx && !VALID_SOUND_IDS.has(beat.sfx)) {
            return c.json(
              {
                success: false,
                error: `Story '${story.id}' beat '${beat.id}' has invalid sfx '${beat.sfx}'`,
              },
              400
            );
          }
          if (beat.rabbit && !VALID_POSES.has(beat.rabbit)) {
            return c.json(
              {
                success: false,
                error: `Story '${story.id}' beat '${beat.id}' has invalid rabbit pose '${beat.rabbit}'`,
              },
              400
            );
          }
          if (beat.tiger && !VALID_POSES.has(beat.tiger)) {
            return c.json(
              {
                success: false,
                error: `Story '${story.id}' beat '${beat.id}' has invalid tiger pose '${beat.tiger}'`,
              },
              400
            );
          }
        }
      }
    }

    const payload: CatalogPayload = {
      version: typeof body.version === 'number' ? body.version : 1,
      updatedAt: new Date().toISOString(),
      stories: body.stories,
    };

    await c.env.SAANJH_DB.put('catalog', JSON.stringify(payload));
    return c.json({
      success: true,
      message: 'Catalog updated successfully!',
      count: payload.stories.length,
      storyCount: payload.stories.length,
      version: payload.version,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: `Failed to update catalog: ${err?.message || err}` },
      500
    );
  }
});

// 5. POST Upload (Direct Image Uploader)
app.post('/upload', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const contentType = c.req.header('content-type') || '';
    let fileBuffer: ArrayBuffer;
    let mimeType = 'image/jpeg';
    let originalName = `cover-${Date.now()}`;

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return c.json({ success: false, error: 'No file provided in form field "file"' }, 400);
      }
      const blob = file as Blob;
      originalName = (file as any).name || originalName;
      mimeType =
        blob.type && blob.type !== 'application/octet-stream'
          ? blob.type
          : inferMimeType(originalName, 'image/jpeg');
      fileBuffer = await blob.arrayBuffer();
    } else if (
      contentType.startsWith('image/') ||
      contentType === 'application/octet-stream'
    ) {
      if (contentType.startsWith('image/')) {
        mimeType = contentType.split(';')[0].trim().toLowerCase();
      }
      const headerFilename = c.req.header('x-filename');
      const queryFilename = c.req.query('filename');
      originalName = headerFilename || queryFilename || originalName;
      if (mimeType === 'application/octet-stream') {
        mimeType = inferMimeType(originalName, 'image/jpeg');
      }
      fileBuffer = await c.req.arrayBuffer();
    } else {
      return c.json(
        {
          success: false,
          error: 'Unsupported Content-Type. Expected multipart/form-data or image/*',
        },
        415
      );
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return c.json({ success: false, error: 'Empty file payload' }, 400);
    }

    if (fileBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return c.json(
        { success: false, error: 'File size exceeds maximum allowed limit of 5MB' },
        413
      );
    }

    const uniqueId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
    const storageKey = `image:${uniqueId}`;
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

    await c.env.SAANJH_DB.put(storageKey, fileBuffer, {
      metadata: {
        contentType: mimeType,
        filename: sanitizedFilename,
        size: fileBuffer.byteLength,
        uploadedAt: new Date().toISOString(),
      },
    });

    const requestUrl = new URL(c.req.url);
    const imageUrl = `${requestUrl.origin}/images/${uniqueId}`;

    return c.json({
      success: true,
      id: uniqueId,
      url: imageUrl,
      filename: sanitizedFilename,
      size: fileBuffer.byteLength,
      contentType: mimeType,
    });
  } catch (err: any) {
    return c.json({ success: false, error: `Upload failed: ${err?.message || err}` }, 500);
  }
});

// 6. GET Images (Public Edge-Cached Asset Delivery)
app.get('/images/:id', async (c) => {
  const imageId = c.req.param('id');
  if (!imageId) {
    return c.text('Image ID is required', 400);
  }

  try {
    const storageKey = `image:${imageId}`;
    const result = await c.env.SAANJH_DB.getWithMetadata<ImageMetadata>(storageKey, {
      type: 'arrayBuffer',
    });

    if (!result || !result.value) {
      return c.text('Image not found', 404);
    }

    const contentType = result.metadata?.contentType || 'image/jpeg';
    const etag = `W/"${imageId}"`;
    const ifNoneMatch = c.req.header('if-none-match');

    if (
      ifNoneMatch &&
      (ifNoneMatch === etag || ifNoneMatch === `"${imageId}"` || ifNoneMatch === imageId)
    ) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(result.value, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'ETag': etag,
      },
    });
  } catch (err: any) {
    return c.text('Failed to retrieve image', 500);
  }
});

// 7. DELETE Image (Admin Maintenance)
app.delete('/images/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!isAuthorized(authHeader, c.env.ADMIN_SECRET)) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  const imageId = c.req.param('id');
  if (!imageId) {
    return c.json({ success: false, error: 'Image ID is required' }, 400);
  }

  try {
    const storageKey = `image:${imageId}`;
    await c.env.SAANJH_DB.delete(storageKey);
    return c.json({ success: true, message: 'Image deleted successfully', id: imageId });
  } catch (err: any) {
    return c.json({ success: false, error: 'Failed to delete image' }, 500);
  }
});

export default app;
