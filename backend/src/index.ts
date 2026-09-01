import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

const app = new Hono<{ Bindings: Env }>();

// Enable CORS so the Admin Panel and Mobile App can fetch data
app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Welcome to the Saanjh API' });
});

// GET the active catalog for the mobile app
app.get('/catalog', async (c) => {
  try {
    const catalogStr = await c.env.SAANJH_DB.get('catalog');
    
    if (catalogStr) {
      return c.json(JSON.parse(catalogStr));
    }
    
    // Fallback if the database is empty
    return c.json({ version: 1, stories: [] });
  } catch (err) {
    return c.json({ error: 'Failed to fetch catalog' }, 500);
  }
});

// POST to update the catalog (Called by your Admin Panel)
app.post('/catalog', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const expectedSecret = c.env.ADMIN_SECRET;

  if (expectedSecret && token !== expectedSecret) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or missing admin secret' }, 401);
  }

  try {
    const body = await c.req.json();
    
    // Save the new JSON tree to the KV Database
    await c.env.SAANJH_DB.put('catalog', JSON.stringify(body));
    
    return c.json({ success: true, message: 'Catalog updated successfully!' });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to update catalog' }, 500);
  }
});

export default app;
