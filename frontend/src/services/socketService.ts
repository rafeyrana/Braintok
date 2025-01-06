import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types/socket.types';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];
  private connectionHandlers: (() => void)[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem(`${process.env.SUPABASE_PROJ_NAME}-auth-token`) 
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.connectionHandlers.forEach(handler => handler());
    });

    this.socket.on('chatMessage', (message: ChatMessage) => {
      console.log('Received message:', message);
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      this.errorHandlers.forEach(handler => handler(error));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.errorHandlers.forEach(handler => handler('Failed to connect to server'));
    });
  }

  public sendMessage(content: string) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('chatMessage', content);
  }

  public onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  public onError(handler: (error: string) => void) {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  public onConnect(handler: () => void) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  public disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService(); 