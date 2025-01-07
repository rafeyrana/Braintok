import { io, Socket } from 'socket.io-client';
import { ChatMessage, SocketInitParams } from '../types/socket.types';
import { supabase } from '../lib/supabase';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];
  private connectionHandlers: (() => void)[] = [];

  public async initialize(params: SocketInitParams) {
    if (this.socket) {
      console.warn('Socket connection already exists');
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
    
    console.log('Initializing socket connection to:', SOCKET_URL);

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    this.socket = io(SOCKET_URL, {
      query: {
        userEmail: params.userEmail,
        s3Key: params.documentS3Key
      },
      auth: {
        token: `Bearer ${session.access_token}`
      },
      withCredentials: true,
      transports: ['polling', 'websocket'], 
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.connectionHandlers.forEach(handler => handler());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
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
      this.errorHandlers.forEach(handler => 
        handler(`Failed to connect to server: ${error.message}`)
      );
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect... (attempt ${attemptNumber})`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      this.errorHandlers.forEach(handler => 
        handler('Failed to reconnect after multiple attempts')
      );
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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.messageHandlers = [];
      this.errorHandlers = [];
      this.connectionHandlers = [];
    }
  }
}

export const socketService = new SocketService(); 