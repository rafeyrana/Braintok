import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { ChatMessage, SocketInitParams } from '../types/socket.types';
import { fetchPreviousMessages } from '../api/chatbotMessages';
import { useAppSelector } from '../store/hooks';
import { selectUserEmail } from '../store/slices/userSlice';

interface ChatBotProps {
  documentS3Key: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ documentS3Key }) => {
  const userEmail = useAppSelector(selectUserEmail);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Ensure userEmail is present before proceeding
    if (!userEmail) {
      setIsLoading(false);
      setError("User email not found. Cannot initialize chat."); // Or handle appropriately
      return;
    }

    let messageUnsubscribe: (() => void) | undefined;
    let errorUnsubscribe: (() => void) | undefined;
    let connectUnsubscribe: (() => void) | undefined;

    const initializeSocket = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const initParams: SocketInitParams = {
          userEmail,
          documentS3Key
        };
        
        await socketService.initialize(initParams);

        messageUnsubscribe = socketService.onMessage((message: ChatMessage) => {
          setMessages(prev => [...prev, message]);
        });

        errorUnsubscribe = socketService.onError((errorMessage: string) => {
          setError(errorMessage);
          setIsLoading(false);
        });

        connectUnsubscribe = socketService.onConnect(() => {
          setIsLoading(false);
          setError(null);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
        setIsLoading(false);
      }
    };

    const loadPreviousMessages = async () => {
      try {
        setIsLoadingHistory(true);
        console.log('Loading previous messages');
        const previousMessages = await fetchPreviousMessages(userEmail, documentS3Key);
        console.log('Previous messages loaded:', previousMessages);
        setMessages(previousMessages.reverse());
      } catch (err) {
        console.error('Error loading previous messages:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    // Initialize both in parallel
    Promise.all([
      initializeSocket(),
      loadPreviousMessages()
    ]).catch(err => {
      console.error('Error during initialization:', err);
      setError(err instanceof Error ? err.message : 'Error during initialization');
    });

    return () => {
      if (messageUnsubscribe) messageUnsubscribe();
      if (errorUnsubscribe) errorUnsubscribe();
      if (connectUnsubscribe) connectUnsubscribe();
      socketService.disconnect();
    };
  }, [userEmail, documentS3Key]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && userEmail) { // Ensure userEmail is available
      try {
        const newMessage: ChatMessage = {
          content: inputMessage,
          timestamp: Date.now(),
          userId: userEmail, // userEmail from useAppSelector
          isUser: true
        };
        
        setMessages(prev => [...prev, newMessage]);
        await socketService.sendMessage(inputMessage);
        setInputMessage('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-none p-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-purple-400">Connecting...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : (
          <>
            {isLoadingHistory && (
              <div className="flex justify-center items-center py-2">
                <div className="text-purple-400">Loading previous messages...</div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-none p-3 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={isLoading || !!error}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || !!error}
            className="bg-purple-500 text-white rounded-full px-4 py-2 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot; 