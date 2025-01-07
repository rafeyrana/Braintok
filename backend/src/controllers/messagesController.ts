// src/controllers/messagesController.ts
import { Request, Response } from 'express';
import { messagesService } from '../services/messagesService';
import { logInfo, logError } from '../utils/logger';

export class MessagesController {
  constructor() {
    // Bind methods to ensure correct 'this' context
    this.getAllMessages = this.getAllMessages.bind(this);
  }

  async getAllMessages(req: any, res: any) {
    try {
      const email = req.query.email as string;
      const s3Key = req.query.s3Key as string;

      if (!email) {
        logError('Email is required', undefined, { query: req.query });
        return res.status(400).json({ error: 'Email is required' });
      }

      if (!s3Key) {
        logError('s3Key is required', undefined, { query: req.query });
        return res.status(400).json({ error: 's3Key is required' });
      }

      const messages = await messagesService.getAllMessagesByEmailAndS3key(email, s3Key);

      logInfo('Messages fetched successfully', { 
        email, 
        s3Key, 
        messageCount: messages.length 
      });
      
      res.json(messages);
    } catch (error) {
      logError('Error in getAllMessages', error as Error, { query: req.query });
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
}

export const messagesController = new MessagesController();