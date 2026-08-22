import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types/story';

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error';

export interface DownloadState {
  localUri?: string;
  status: DownloadStatus;
  progress: number;
  error?: string;
}

interface DownloadsStore {
  remoteStories: Story[];
  setRemoteStories: (stories: Story[]) => void;
  
  downloads: Record<string, DownloadState>;
  
  setDownloadStatus: (storyId: string, status: DownloadStatus, progress?: number, localUri?: string, error?: string) => void;
  removeDownload: (storyId: string) => void;
}

export const useDownloadsStore = create<DownloadsStore>()(
  persist(
    (set) => ({
      remoteStories: [],
      setRemoteStories: (stories) => set({ remoteStories: stories }),
      
      downloads: {},
      setDownloadStatus: (storyId, status, progress = 0, localUri, error) =>
        set((state) => ({
          downloads: {
            ...state.downloads,
            [storyId]: {
              ...state.downloads[storyId],
              status,
              progress,
              ...(localUri ? { localUri } : {}),
              ...(error ? { error } : {}),
            },
          },
        })),
        
      removeDownload: (storyId) =>
        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[storyId];
          return { downloads: newDownloads };
        }),
    }),
    {
      name: 'saanjh.downloads.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        downloads: Object.fromEntries(
          Object.entries(state.downloads).filter(([_, dl]) => dl.status === 'completed')
        )
      }),
    }
  )
);
