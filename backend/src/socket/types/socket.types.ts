import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId: string;
}

export interface ChatMessage {
  content: string;
  timestamp: number;
  userId: string;
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