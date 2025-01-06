import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { ChatMessage } from '../types/socket.types';

interface Message {
  content: string;
  isUser: boolean;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Setup socket event handlers
    const messageUnsubscribe = socketService.onMessage((message: ChatMessage) => {
      setMessages(prev => [...prev, { content: message.content, isUser: false }]);
    });

    const errorUnsubscribe = socketService.onError((errorMessage: string) => {
      setError(errorMessage);
      setIsLoading(false);
    });

    const connectUnsubscribe = socketService.onConnect(() => {
      setIsLoading(false);
      setError(null);
    });

    // Cleanup
    return () => {
      messageUnsubscribe();
      errorUnsubscribe();
      connectUnsubscribe();
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      try {
        // Add user message to state immediately
        setMessages(prev => [...prev, { content: inputMessage, isUser: true }]);
        
        // Send message through socket
        await socketService.sendMessage(inputMessage);
        
        // Clear input
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
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Chat</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading || !!error}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || !!error}
            className="bg-purple-500 text-white rounded-full px-6 py-2 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot; 