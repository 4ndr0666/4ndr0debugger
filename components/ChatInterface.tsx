import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatInterfaceProps {
  onEndChat: () => void;
  chatHistory: ChatMessage[];
  onFollowUpSubmit: (message: string) => void;
  isChatLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onEndChat, chatHistory, onFollowUpSubmit, isChatLoading }) => {
  const [followUpMessage, setFollowUpMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = () => {
    if (followUpMessage.trim() && !isChatLoading) {
      onFollowUpSubmit(followUpMessage);
      setFollowUpMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 bg-transparent rounded-lg space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#e0ffff] font-heading">Follow-up Chat</h3>
          <Button onClick={onEndChat} variant="secondary" className="py-1 px-3 text-xs">
            End Chat & Start New
          </Button>
        </div>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 bg-[#070B14] rounded-md border border-[#15adad]/70 space-y-4 flex-1">
          {chatHistory.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-[#070B14] text-[#e0ffff] border border-[#15adad]/80 shadow-lg shadow-[#15fafa]/20' : 'bg-[#1c2c44] text-[#e0ffff]'}`}>
                 <MarkdownRenderer markdown={msg.content} />
              </div>
            </div>
          ))}
          {isChatLoading && (
             <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-[#1c2c44] text-[#e0ffff]">
                  <LoadingSpinner size="w-5 h-5" />
                </div>
             </div>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <textarea
            value={followUpMessage}
            onChange={(e) => setFollowUpMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="block w-full p-2 font-sans text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff] resize-y placeholder:text-[#60c0c0]"
            placeholder="Ask a follow-up question..."
            disabled={isChatLoading}
            aria-label="Follow-up message input"
            autoFocus
          />
          <Button onClick={handleSend} isLoading={isChatLoading} disabled={isChatLoading || !followUpMessage.trim()}>
            Send
          </Button>
        </div>
    </div>
  );
};
