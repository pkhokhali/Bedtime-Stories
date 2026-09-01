import type { Catalog, Story } from '../types/story';

export const DEFAULT_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'https://saanjh-api.prabinkhokhali89.workers.dev';

export const ADMIN_SECRET_STORAGE_KEY = 'saanjh_admin_secret';

export class ApiError extends Error {
  public status: number;
  public isOffline: boolean;
  public isUnauthorized: boolean;
  public details?: any;

  constructor(message: string, status = 0, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isOffline =
      status === 0 ||
      message.toLowerCase().includes('offline') ||
      message.toLowerCase().includes('failed to fetch') ||
      message.toLowerCase().includes('network error');
    this.isUnauthorized = status === 401;
    this.details = details;
  }
}

export function getStoredAdminSecret(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || '';
    }
    return '';
  } catch {
    return '';
  }
}

export function setStoredAdminSecret(secret: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (secret) {
        localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
      } else {
        localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
      }
    }
  } catch (err) {
    console.warn('Failed to access localStorage:', err);
  }
}

/**
 * Check network connectivity before making HTTP calls
 */
function checkNetwork(): void {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    throw new ApiError('Network offline: Please check your internet connection.', 0);
  }
}

/**
 * Fetch full story catalog from Cloudflare Workers KV
 */
export async function fetchCatalog(baseUrl = DEFAULT_API_BASE_URL): Promise<Catalog> {
  checkNetwork();
  try {
    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      let errorMsg = `Failed to fetch catalog (HTTP ${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {}
      throw new ApiError(errorMsg, res.status);
    }

    const data = await res.json();
    return {
      version: typeof data.version === 'number' ? data.version : 1,
      stories: Array.isArray(data.stories) ? data.stories : [],
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err?.message?.includes('Failed to fetch')
        ? 'Network error: Failed to reach Cloudflare API server.'
        : `Failed to load catalog: ${err?.message || err}`,
      0
    );
  }
}

/**
 * Fetch a single story by ID
 */
export async function fetchStoryById(id: string, baseUrl = DEFAULT_API_BASE_URL): Promise<Story> {
  checkNetwork();
  try {
    const res = await fetch(`${baseUrl}/catalog/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) throw new ApiError(`Story '${id}' not found.`, 404);
      throw new ApiError(`Failed to fetch story (HTTP ${res.status})`, res.status);
    }
    const data = await res.json();
    return data.story;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Network error fetching story: ${err?.message || err}`, 0);
  }
}

export interface SaveCatalogResponse {
  success: boolean;
  message: string;
  count: number;
  storyCount?: number;
  version: number;
}

/**
 * Publish updated catalog to Cloudflare Workers KV with Bearer auth
 */
export async function saveCatalog(
  catalog: Catalog,
  secret?: string,
  baseUrl = DEFAULT_API_BASE_URL
): Promise<SaveCatalogResponse> {
  checkNetwork();
  const token = secret !== undefined ? secret : getStoredAdminSecret();
  try {
    const payload = {
      version: (catalog.version || 0) + 1,
      stories: catalog.stories,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new ApiError('Unauthorized: Invalid or missing Admin Secret key.', 401);
    }

    if (!res.ok) {
      let errorMsg = `Server error ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {}
      throw new ApiError(errorMsg, res.status);
    }

    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Catalog published successfully!',
      count: data.count ?? data.storyCount ?? payload.stories.length,
      version: payload.version,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err?.message?.includes('Failed to fetch')
        ? 'Network error: Cannot publish changes while offline.'
        : `Publish failed: ${err?.message || err}`,
      0
    );
  }
}

export interface ImageUploadResponse {
  success: boolean;
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

/**
 * Direct Image Uploader: Uploads image file (JPEG, PNG, WEBP, SVG) to Cloudflare KV
 */
export async function uploadImage(
  file: File | Blob,
  secret?: string,
  filename?: string,
  baseUrl = DEFAULT_API_BASE_URL
): Promise<ImageUploadResponse> {
  checkNetwork();
  const token = secret !== undefined ? secret : getStoredAdminSecret();
  try {
    // Client-side file size validation (< 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError('File size exceeds maximum allowed limit of 5MB.', 413);
    }

    const formData = new FormData();
    formData.append('file', file, filename || (file as File).name || 'cover.jpg');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const res = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.status === 401) {
      throw new ApiError('Unauthorized: Invalid Admin Secret for image upload.', 401);
    }
    if (res.status === 413) {
      throw new ApiError('File too large: Image must be under 5MB.', 413);
    }
    if (res.status === 415) {
      throw new ApiError('Unsupported media type: Please upload JPG, PNG, WEBP, or SVG.', 415);
    }

    if (!res.ok) {
      let errorMsg = `Upload failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {}
      throw new ApiError(errorMsg, res.status);
    }

    const data = await res.json();
    return {
      success: true,
      id: data.id,
      url: data.url,
      filename: data.filename || filename || 'cover.jpg',
      size: data.size || file.size,
      contentType: data.contentType || file.type,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Image upload failed: ${err?.message || err}`, 0);
  }
}

/**
 * Delete hosted image by ID
 */
export async function deleteImage(
  imageId: string,
  secret?: string,
  baseUrl = DEFAULT_API_BASE_URL
): Promise<{ success: boolean; message: string }> {
  checkNetwork();
  const token = secret !== undefined ? secret : getStoredAdminSecret();
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const res = await fetch(`${baseUrl}/images/${encodeURIComponent(imageId)}`, {
      method: 'DELETE',
      headers,
    });

    if (res.status === 401) {
      throw new ApiError('Unauthorized to delete image.', 401);
    }
    if (res.status === 404) {
      throw new ApiError('Image not found on server.', 404);
    }
    if (!res.ok) {
      throw new ApiError(`Failed to delete image (HTTP ${res.status})`, res.status);
    }

    const data = await res.json();
    return { success: true, message: data.message || 'Image deleted successfully' };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Delete image failed: ${err?.message || err}`, 0);
  }
}
