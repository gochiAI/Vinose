import express from 'express';
import cors from 'cors';
import { ensureDatabase } from './db/init';
import { db } from './db/connection';
import charactersRouter from './routes/characters';
import assetsRouter from './routes/assets';
import filesRouter from './routes/files';
import chaptersRouter from './routes/chapters';
import episodesRouter from './routes/episodes';
import sceneNodesRouter from './routes/scene-nodes';
import dashboardRouter from './routes/dashboard';
import scratchpadRouter from './routes/scratchpad';
import projectInfoRouter from './routes/project-info';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database
async function initApp() {
  try {
    await ensureDatabase();
    console.log('[Server] Database ready');
  } catch (error) {
    console.error('[Server] Failed to initialize database:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/characters', charactersRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/files', filesRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/scenenodes', sceneNodesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scratchpad', scratchpadRouter);
app.use('/api/project-info', projectInfoRouter);


// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
async function start() {
  await initApp();
  
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
    console.log(`[Server] API endpoints:`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Server] Shutting down...');
  await db.close();
  process.exit(0);
});

start().catch(error => {
  console.error('[Server] Startup error:', error);
  process.exit(1);
});
