import React, { useEffect, useRef } from 'react';
import { ChatMessage, SupportedLanguage } from '../types.ts';
import { Button } from './Button.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { ChatContext } from './ChatContext.tsx';

interface ChatInterfaceProps {
  onEndChat: () => void;
  chatHistory: ChatMessage[];
  onFollowUpSubmit: (message: string) => void;
  isChatLoading: boolean;
  chatInputValue: string;
  setChatInputValue: (value: string) => void;
  // Context props
  originalReviewedCode: string | null;
  originalFeedback: string | null;
  appMode: 'single' | 'comparison';
  codeB: string | null;
  language: SupportedLanguage;
  onCodeLineClick: (line: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = (props) => {
  const { 
    onEndChat, chatHistory, onFollowUpSubmit, isChatLoading,
    chatInputValue, setChatInputValue,
    originalReviewedCode, originalFeedback, appMode, codeB,
    language, onCodeLineClick
  } = props;
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = () => {
    if (chatInputValue.trim() && !isChatLoading) {
      onFollowUpSubmit(chatInputValue);
      setChatInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* Left Panel: Chat Flow */}
        <div className="lg:col-span-3 flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-heading">Follow-up Chat</h3>
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
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    className="block w-full p-2 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)] resize-y placeholder:text-[var(--hud-color-darker)]"
                    placeholder="USER_INPUT >>"
                    disabled={isChatLoading}
                    aria-label="Follow-up message input"
                    autoFocus
                />
                <Button onClick={handleSend} isLoading={isChatLoading} disabled={isChatLoading || !chatInputValue.trim()}>
                    Send
                </Button>
            </div>
        </div>
        
        {/* Right Panel: Context */}
        <div className="lg:col-span-2 h-full hidden lg:block animate-fade-in">
          <div className={`hud-container flex flex-col h-full bg-black/30 active`}>
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
            <ChatContext 
                codeA={originalReviewedCode || ''}
                codeB={appMode === 'comparison' ? (codeB || undefined) : undefined}
                originalFeedback={originalFeedback || ''}
                language={language}
                onLineClick={onCodeLineClick}
            />
          </div>
        </div>
    </div>
  );
};
