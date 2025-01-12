import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { requestLogger } from './middleware/requestLogger';
import logger from './utils/logger';
import fs from 'fs';
import path from 'path';
import { initializeSocketServer } from './socket/socketServer';
import waitlistRoutes from './routes/waitlist.routes';
import documentRoutes from './routes/documentRoutes';
import dotenv from 'dotenv';

dotenv.config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocketServer(httpServer);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL || ''],
  credentials: true
}));
app.use(express.json());

// Add request logging middleware
app.use(requestLogger);

// Mount routes
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/documents', documentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', undefined, err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket.IO server available at ${process.env.BACKEND_URL || `ws://localhost:${PORT}`}`);
});

export default app;
