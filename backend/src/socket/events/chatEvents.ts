import { AuthenticatedSocket, ChatMessage } from '../types/socket.types';
import logger from '../../utils/logger';
import { messagesService } from '../../services/messagesService';
import RAGService from '../../services/ragService';

const activeConnections = new Map<string, AuthenticatedSocket>();
const ragInstances = new Map<string, RAGService>();

export const handleConnection = async (socket: AuthenticatedSocket) => {
  const userId = socket.userId;
  const userEmail = socket.handshake.query.userEmail as string;
  const s3Key = socket.handshake.query.s3Key as string;
  
  socket.userEmail = userEmail;
  socket.s3Key = s3Key;
  
  try {
    // Initialize RAG service for this connection
    const rag = new RAGService(s3Key, userEmail);
    ragInstances.set(userId, rag);
    
    // Store the socket
    activeConnections.set(userId, socket);
    
    logger.info(`User connected and RAG initialized: ${userId}`, {
      userEmail,
      s3Key
    });
  } catch (error) {
    logger.error('Failed to initialize RAG:', error);
    socket.emit('error', 'Failed to initialize document processing');
    socket.disconnect();
    return;
  }

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
    
    const rag = ragInstances.get(userId);
    if (!rag) {
      throw new Error('RAG instance not found');
    }
    
    const response = await rag.queryDocument(content);

      const backendResponse: ChatMessage = {
        content: response,
        timestamp: Date.now(),
        userId,
        isUser: false
      };
      socket.emit('chatMessage', backendResponse);
      
      await messagesService.saveMessagePair(
        socket.userEmail,
        socket.s3Key,
        userMessage,
        backendResponse
      );
      
      
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