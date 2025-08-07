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
    <div className="p-6 bg-transparent space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg">Follow-up Chat</h3>
          <Button onClick={onEndChat} variant="secondary" className="py-1 px-3 text-xs">
            End Chat
          </Button>
        </div>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 bg-black/50 border border-[var(--hud-color-darkest)] space-y-4 flex-1">
          {chatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 text-sm ${msg.role === 'user' ? 'bg-transparent border border-[var(--hud-color-darker)] text-[var(--hud-color)]' : 'bg-[var(--hud-color-darkest)] text-[var(--hud-color-darker)]'}`}>
                 <MarkdownRenderer markdown={msg.content} />
              </div>
            </div>
          ))}
          {isChatLoading && (
             <div className="flex justify-start">
                <div className="max-w-[80%] p-3 bg-[var(--hud-color-darkest)] text-[var(--hud-color)]">
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
            className="block w-full p-2 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)] resize-y placeholder:text-[var(--hud-color-darker)]"
            placeholder="USER_INPUT >>"
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