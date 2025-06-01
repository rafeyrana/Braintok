// src/controllers/messagesController.ts
import { Request, Response, NextFunction } from 'express'; // Import NextFunction
import { z } from 'zod'; // Import Zod
import { messagesService } from '../services/messagesService';
import { logInfo, logError } from '../utils/logger';
import { ChatMessage } from '../socket/types/socket.types'; // Import ChatMessage type

// Zod Schema for getAllMessages query parameters
const getAllMessagesQuerySchema = z.object({
  email: z.string().email(),
  s3Key: z.string().min(1),
});

export class MessagesController {
  constructor() {
    this.getAllMessages = this.getAllMessages.bind(this);
  }

  async getAllMessages(req: Request, res: Response, next: NextFunction) { // Add NextFunction for completeness
    try {
      const validationResult = getAllMessagesQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        logError('Invalid query parameters for getAllMessages', undefined, { errors: validationResult.error.flatten(), query: req.query });
        return res.status(400).json({ error: 'Invalid query parameters', details: validationResult.error.flatten() });
      }

      const { email, s3Key } = validationResult.data;

      const messages: ChatMessage[] = await messagesService.getAllMessagesByEmailAndS3key(email, s3Key);

      logInfo('Messages fetched successfully', { 
        email, 
        s3Key, 
        messageCount: messages.length 
      });
      
      res.json(messages);
    } catch (error) {
      logError('Error in getAllMessages', error as Error, { query: req.query });
      // Pass error to global error handler or handle as before
      // next(error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
}

export const messagesController = new MessagesController();