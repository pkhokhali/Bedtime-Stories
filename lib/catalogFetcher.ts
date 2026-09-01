import { useDownloadsStore } from '@/store/useDownloadsStore';
import { Story } from '@/types/story';
const CATALOG_URL = 'https://saanjh-api.prabinkhokhali89.workers.dev/catalog';

interface CatalogResponse {
  version: number;
  stories: Story[];
}

export async function fetchRemoteCatalog(): Promise<void> {
  const store = useDownloadsStore.getState();
  store.setIsLoadingCatalog(true);
  store.setCatalogError(null);
  
  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error('Failed to fetch catalog from Cloudflare API');
    
    const data: CatalogResponse = await response.json();
    
    // Filter out hidden stories so they don't appear in the app
    const visibleStories = data.stories.filter(story => !story.isHidden);
    
    store.setRemoteStories(visibleStories);
    store.setIsLoadingCatalog(false);
  } catch (error: any) {
    console.warn('Error fetching remote catalog:', error);
    store.setCatalogError(error?.message || 'Failed to connect to catalog');
    store.setIsLoadingCatalog(false);
  }
}
