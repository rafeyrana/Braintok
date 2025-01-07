import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
  s3Key: string;
}

export interface ChatMessage {
  content: string;
  timestamp: number;
  userId: string;
  isUser: boolean
}

export interface ServerToClientEvents {
  chatMessage: (message: ChatMessage) => void;
  error: (error: string) => void;
}

export interface ClientToServerEvents {
  chatMessage: (message: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
} 