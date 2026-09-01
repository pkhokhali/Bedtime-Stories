const fetch = require('node-fetch');

const newStories = [
  {
    id: 'big-buck-bunny',
    title: { en: 'Big Buck Bunny', ne: '???? ?????' },
    subtitle: { en: 'A giant rabbit gets his revenge.', ne: '???? ??????? ???? ??????' },
    category: 'universal',
    ageBand: '4-6',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/640px-Big_buck_bunny_poster_big.jpg',
    runtimeMinutes: 10,
    isHidden: false
  },
  {
    id: 'sintel',
    title: { en: 'Sintel', ne: '???????' },
    subtitle: { en: 'A girl and her dragon.', ne: '???? ???? ? ???? ?????????' },
    category: 'universal',
    ageBand: '9-12',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Sintel_poster.jpg/640px-Sintel_poster.jpg',
    runtimeMinutes: 15,
    isHidden: false
  },
  {
    id: 'elephants-dream',
    title: { en: 'Elephants Dream', ne: '???????? ????' },
    subtitle: { en: 'A surreal journey.', ne: '???? ????? ???????' },
    category: 'universal',
    ageBand: '13-17',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Elephants_Dream_poster.jpg/640px-Elephants_Dream_poster.jpg',
    runtimeMinutes: 11,
    isHidden: false
  },
  {
    id: 'sherlock-holmes-1',
    title: { en: 'A Scandal in Bohemia', ne: '?????????? ??????????' },
    subtitle: { en: 'Sherlock Holmes Audiobook', ne: '?????? ????? ????????' },
    category: 'universal',
    ageBand: 'parents',
    mediaType: 'audio',
    mediaUrl: 'https://archive.org/download/adventures_holmes_0707_librivox/adventuresofsherlockholmes_01_doyle_64kb.mp3',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Strand_Magazine_A_Scandal_In_Bohemia.jpg/640px-Strand_Magazine_A_Scandal_In_Bohemia.jpg',
    runtimeMinutes: 45,
    isHidden: false
  },
  {
    id: 'pride-and-prejudice-1',
    title: { en: 'Pride and Prejudice', ne: '???? ? ??????????' },
    subtitle: { en: 'Classic Novel Audiobook', ne: '??????? ??????? ????????' },
    category: 'universal',
    ageBand: 'parents',
    mediaType: 'audio',
    mediaUrl: 'https://archive.org/download/pride_prejudice_librivox/prideandprejudice_01_austen_64kb.mp3',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/PrideAndPrejudiceTitlePage.jpg/640px-PrideAndPrejudiceTitlePage.jpg',
    runtimeMinutes: 20,
    isHidden: false
  }
];

async function addFreeContent() {
  try {
    const res = await fetch('https://saanjh-api.prabinkhokhali89.workers.dev/catalog');
    const data = await res.json();
    
    // Check if we already added them
    const existingIds = data.stories.map(s => s.id);
    const storiesToAdd = newStories.filter(s => !existingIds.includes(s.id));
    
    if (storiesToAdd.length === 0) {
      console.log('Content already exists in the database.');
      return;
    }
    
    const updatedStories = [...storiesToAdd, ...data.stories];
    
    const postRes = await fetch('https://saanjh-api.prabinkhokhali89.workers.dev/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: (data.version || 1) + 1, stories: updatedStories })
    });
    
    const postData = await postRes.json();
    console.log(postData);
  } catch (error) {
    console.error(error);
  }
}

addFreeContent();
