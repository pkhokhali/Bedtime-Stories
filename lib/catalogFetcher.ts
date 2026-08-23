import { useDownloadsStore } from '@/store/useDownloadsStore';
import { Story } from '@/types/story';
const CATALOG_URL = 'https://saanjh-api.prabinkhokhali89.workers.dev/catalog';

interface CatalogResponse {
  version: number;
  stories: Story[];
}

export async function fetchRemoteCatalog(): Promise<void> {
  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error('Failed to fetch catalog from Cloudflare API');
    
    const data: CatalogResponse = await response.json();
    useDownloadsStore.getState().setRemoteStories(data.stories);
    
    
  } catch (error) {
    console.warn('Error fetching remote catalog:', error);
  }
}
