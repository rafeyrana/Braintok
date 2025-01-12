import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuth } from './middleware/auth';
import { handleConnection } from './events/chatEvents';
import { 
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
} from './types/socket.types';
import logger from '../utils/logger';

export const initializeSocketServer = (httpServer: HttpServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL, process.env.VERCEL_URL].filter((origin): origin is string => !!origin),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  io.use(socketAuth);

  io.on('connection', (socket) => {
    handleConnection(socket as any);
  });

  logger.info('Socket.io server initialized');

  return io;
}; 