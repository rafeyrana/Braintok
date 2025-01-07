import { AuthenticatedSocket, ChatMessage } from '../types/socket.types';
import logger from '../../utils/logger';
import { messagesService } from '../../services/messagesService';

const activeConnections = new Map<string, AuthenticatedSocket>();

export const handleConnection = (socket: AuthenticatedSocket) => {
  const userId = socket.userId;
  const userEmail = socket.handshake.query.userEmail as string;
  const s3Key = socket.handshake.query.s3Key as string;
  
  socket.userEmail = userEmail;
  socket.s3Key = s3Key;
  
  // Store the enhanced socket object
  activeConnections.set(userId, socket);
  
  logger.info(`User connected: ${userId}`, {
    userEmail,
    s3Key
  });

  socket.on('disconnect', () => {
    activeConnections.delete(userId);
    logger.info(`User disconnected: ${userId}`);
  });

  socket.on('chatMessage', async (content: string) => {
    try {
        const userEmail = socket.userEmail;
        const s3Key = socket.s3Key;
        const userMessage: ChatMessage = {
            content,
            timestamp: Date.now(),
            userId,
            isUser: true
          };
    let response = "this is the response from the backend"

      const backendResponse: ChatMessage = {
        content: response, 
        timestamp: Date.now(),
        userId,
        isUser: false
      };
      
      await messagesService.saveMessagePair(
        socket.userEmail,
        socket.s3Key,
        userMessage,
        backendResponse
      );
      socket.emit('chatMessage', backendResponse);
      
      logger.info(`Chat message processed for user: ${userId}`, {
        userEmail,
        s3Key
      });
    } catch (error) {
      logger.error('Error processing chat message:', error);
      socket.emit('error', 'Failed to process message');
    }
  });
};

export const getActiveConnections = () => activeConnections; 