import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS so the Admin Panel and Mobile App can fetch data
app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Welcome to the Saanjh API' });
});

// Mock Catalog Endpoint - We will connect this to Cloudflare KV or D1 next!
app.get('/catalog', async (c) => {
  // In the future, this will read from: await c.env.SAANJH_DB.get('catalog');
  const catalog = {
    version: 1,
    stories: [
      {
        id: 'sleepy-cloud',
        title: { en: 'The Sleepy Little Cloud', ne: 'निद्रालु सानो बादल' },
        mediaType: 'video',
        // Example of how the R2 CDN subdomain will look
        mediaUrl: 'https://cdn.saanjh.prabinkhokhali.com.np/videos/sleepy_cloud.mp4'
      }
    ]
  };
  
  return c.json(catalog);
});

export default app;
