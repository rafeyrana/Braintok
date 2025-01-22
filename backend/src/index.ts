import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import waitlistRoutes from './routes/waitlist.routes';
import documentRoutes from './routes/documentRoutes';
import { requestLogger } from './middleware/requestLogger';
import { initializeSocketServer } from './socket/socketServer';
import logger from './utils/logger';
import messageRoutes from './routes/messageRoutes';
import tiktokRoutes from './routes/tiktokRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocketServer(httpServer);

app.use(cors({
  origin: [process.env.FRONTEND_URL || "", process.env.VERCEL_URL || ""],
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tiktok', tiktokRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket.IO server available at ws://localhost:${PORT}`);
});

export default app;
