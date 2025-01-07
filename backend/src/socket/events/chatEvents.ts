import { AuthenticatedSocket, ChatMessage } from '../types/socket.types';
import logger from '../../utils/logger';

const activeConnections = new Map<string, AuthenticatedSocket>();

export const handleConnection = (socket: AuthenticatedSocket) => {
  const userId = socket.userId;
  activeConnections.set(userId, socket);
  
  logger.info(`User connected: ${userId}`);

  socket.on('disconnect', () => {
    activeConnections.delete(userId);
    logger.info(`User disconnected: ${userId}`);
  });

  socket.on('chatMessage', async (content: string) => {
    try {
      const message: ChatMessage = {
        content,
        timestamp: Date.now(),
        userId
      };
     console.log('message', message);
      // TODO: Save message to database
      message.content = 'test';
      // Send message back to user
      socket.emit('chatMessage', message);
      
      logger.info(`Chat message processed for user: ${userId}`);
    } catch (error) {
      logger.error('Error processing chat message:', error);
      socket.emit('error', 'Failed to process message');
    }
  });
};

export const getActiveConnections = () => activeConnections; 