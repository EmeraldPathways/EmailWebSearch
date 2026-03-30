import express from 'express';
import path from 'path';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import v1Router from './routes/index';
import { logger } from './utils/logger';

const app = express();

app.set('trust proxy', 1);

app.use(express.json());

// API routes — rate limited and auth required
app.use('/v1', rateLimiter, authMiddleware, v1Router);

// Serve frontend static files
const clientDir = path.resolve(__dirname, '..', 'client');
app.use(express.static(clientDir));

// Fallback: serve index.html for any non-API route (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Error handler must be last
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info('Server started', { port: config.port });
});

export default app;
