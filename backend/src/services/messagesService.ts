import { createClient } from '@supabase/supabase-js';
import { ChatMessage } from '../socket/types/socket.types';
import logger from '../utils/logger';

class MessagesService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required. Check your .env file.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async getAllMessagesByEmailAndS3key(email: string, s3Key: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('content, created_at, user_email, is_user_message')
        .eq('user_email', email)
        .eq('s3_key', s3Key)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase error fetching messages:', error);
        throw error;
      }

      const messages: ChatMessage[] = (data || []).map(msg => ({
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        userId: msg.user_email,
        isUser: msg.is_user_message
      }));

      return messages;
    } catch (error) {
      logger.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async saveMessagePair(
    userEmail: string, 
    s3Key: string, 
    userMessage: ChatMessage, 
    backendResponse: ChatMessage
  ): Promise<void> {
    try {
      const now = new Date();
      const responseTime = new Date(now.getTime() + 1000); // Add 1 second for backend response

      const messages = [
        {
          user_email: userEmail,
          s3_key: s3Key,
          content: userMessage.content,
          is_user_message: true,
          created_at: now.toISOString() // Current time for user message
        },
        {
          user_email: userEmail,
          s3_key: s3Key,
          content: backendResponse.content,
          is_user_message: false,
          created_at: responseTime.toISOString() // Current time + 1 second for backend response
        }
      ];

      // Insert both messages
      const { error } = await this.supabase
        .from('messages')
        .insert(messages);

      if (error) {
        logger.error('Supabase error saving message pair:', error);
        throw error;
      }

      logger.info('Successfully saved message pair', {
        userEmail,
        s3Key,
        userMessageContent: userMessage.content.substring(0, 50) + '...',
        responseContent: backendResponse.content.substring(0, 50) + '...'
      });

    } catch (error) {
      logger.error('Error saving message pair:', error);
      throw new Error('Failed to save message pair');
    }
  }
}

export const messagesService = new MessagesService();