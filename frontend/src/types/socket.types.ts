export interface ChatMessage {
    content: string;
    timestamp: number;
    userId: string;
    isUser: boolean
  }

export interface SocketInitParams {
  userEmail: string;
  documentS3Key: string;
} 