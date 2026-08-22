import { useDownloadsStore } from '@/store/useDownloadsStore';
import { Story } from '@/types/story';

// Replace with your actual cloud catalog URL (e.g., S3, GitHub Pages, Firebase Hosting)
const CATALOG_URL = 'https://raw.githubusercontent.com/example/catalog/main/catalog.json';

interface CatalogResponse {
  version: number;
  stories: Story[];
}

export async function fetchRemoteCatalog(): Promise<void> {
  try {
    // In development, you might just want to use a mock delay to simulate fetching,
    // or provide the actual URL if you have one.
    // For now, we will try to fetch, but quietly fail if it doesn't exist,
    // so we don't break the app.
    
    /* 
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error('Failed to fetch catalog');
    
    const data: CatalogResponse = await response.json();
    useDownloadsStore.getState().setRemoteStories(data.stories);
    */
    
    // MOCK DATA for testing:
    const mockRemoteStories: Story[] = [
      {
        id: 'remote_magic_forest',
        title: { en: 'The Magic Forest (Video)', ne: 'जादुई जङ्गल (Video)' },
        subtitle: { en: 'An animated adventure', ne: 'एक एनिमेटेड साहसिक' },
        theme: { en: 'Courage', ne: 'साहस' },
        category: 'universal',
        form: 'story',
        ageBand: '4-6',
        runtimeMinutes: 3,
        accent: '#5E8B7E',
        stage: 'forest', // fallback for UI styling
        mediaType: 'video',
        // Example Big Buck Bunny video for testing expo-video
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
        coverImage: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      },
      {
        id: 'remote_calm_river',
        title: { en: 'The Calm River (Audio)', ne: 'शान्त नदी (Audio)' },
        subtitle: { en: 'A relaxing soundscape', ne: 'एक आरामदायी ध्वनि' },
        theme: { en: 'Peace', ne: 'शान्ति' },
        category: 'roots',
        form: 'story',
        ageBand: '2-4',
        runtimeMinutes: 2,
        accent: '#4A6FA5',
        stage: 'river',
        mediaType: 'audio',
        // Example MP3
        mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      }
    ];
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    useDownloadsStore.getState().setRemoteStories(mockRemoteStories);
    
  } catch (error) {
    console.warn('Error fetching remote catalog:', error);
  }
}
