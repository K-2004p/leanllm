import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Database } from './server/db.js';
import { SemanticCache } from './server/semanticCache.js';
import { OptimizationController } from './server/controller.js';
import { KNOWLEDGE_BASE } from './server/knowledgeBase.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Persistence & Controller
const db = new Database();
const cache = new SemanticCache(db.getCacheEntries());
const controller = new OptimizationController(cache);

// Synchronize cache changes back to DB
function syncCache() {
  db.saveCacheEntries(cache.getAll());
}

// ==========================================
// API ROUTES (Must be registered FIRST)
// ==========================================

// Run query through pipeline
app.post('/api/query', async (req, res) => {
  try {
    const { query, config, promptType, attachment, imageGenConfig } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const mergedConfig = config ? { ...db.getConfig(), ...config } : db.getConfig();
    const result = await controller.processQuery(
      query.trim(),
      mergedConfig,
      { promptType, attachment, imageGenConfig }
    );

    db.saveQuery(result);
    syncCache();

    res.json(result);
  } catch (err: any) {
    console.error('Error processing query:', err);
    res.status(500).json({ error: err?.message || 'Failed to process query' });
  }
});

// Aggregated Metrics
app.get('/api/metrics', (req, res) => {
  const metrics = db.getAggregatedMetrics();
  res.json(metrics);
});

// Query History list
app.get('/api/queries', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = (req.query.search as string) || '';

  const data = db.getQueries(page, limit, search);
  res.json(data);
});

// Per-query drill down
app.get('/api/queries/:id', (req, res) => {
  const query = db.getQueryById(req.params.id);
  if (!query) {
    return res.status(404).json({ error: 'Query not found' });
  }
  res.json(query);
});

// Get Config
app.get('/api/config', (req, res) => {
  res.json(db.getConfig());
});

// Update Config
app.post('/api/config', (req, res) => {
  const updated = db.updateConfig(req.body);
  res.json(updated);
});

// Clear Cache
app.get('/api/cache', (req, res) => {
  res.json(cache.getAll());
});

app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  db.clearCache();
  res.json({ status: 'ok', message: 'Semantic cache cleared successfully.' });
});

// Reset Metrics & Queries
app.post('/api/metrics/reset', (req, res) => {
  cache.clear();
  db.resetAll();
  res.json({ status: 'ok', message: 'All queries and cache cleared.' });
});

// Knowledge Base list
app.get('/api/kb', (req, res) => {
  res.json(KNOWLEDGE_BASE);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    cachedEntries: cache.getAll().length,
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LeanLLM] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
