import * as FileSystem from 'expo-file-system/legacy';
import { useDownloadsStore } from '@/store/useDownloadsStore';

// We'll keep active resumable downloads in memory
const activeDownloads: Record<string, FileSystem.DownloadResumable> = {};

export async function downloadStoryMedia(storyId: string, url: string) {
  const store = useDownloadsStore.getState();
  
  // Ensure document directory exists
  if (!FileSystem.documentDirectory) {
    store.setDownloadStatus(storyId, 'error', 0, undefined, 'File system not ready');
    return;
  }
  
  // Extract extension from URL, defaulting to .mp4 if unknown
  let extension = '.mp4';
  if (url.includes('.mp3')) extension = '.mp3';
  
  const localUri = `${FileSystem.documentDirectory}story_${storyId}${extension}`;
  
  store.setDownloadStatus(storyId, 'downloading', 0);
  
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      useDownloadsStore.getState().setDownloadStatus(storyId, 'downloading', progress);
    }
  );
  
  activeDownloads[storyId] = downloadResumable;
  
  try {
    const result = await downloadResumable.downloadAsync();
    if (result && result.uri) {
      store.setDownloadStatus(storyId, 'completed', 1, result.uri);
    } else {
      throw new Error('Download failed');
    }
  } catch (e: any) {
    store.setDownloadStatus(storyId, 'error', 0, undefined, e.message);
  } finally {
    delete activeDownloads[storyId];
  }
}

export async function deleteStoryMedia(storyId: string) {
  const store = useDownloadsStore.getState();
  const download = store.downloads[storyId];
  
  if (download?.localUri) {
    try {
      const info = await FileSystem.getInfoAsync(download.localUri);
      if (info.exists) {
        await FileSystem.deleteAsync(download.localUri);
      }
    } catch (e) {
      console.warn('Error deleting file:', e);
    }
  }
  
  store.removeDownload(storyId);
}
