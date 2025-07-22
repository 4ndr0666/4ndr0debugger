
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { SupportedLanguage, ChatMessage, Version } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, PLACEHOLDER_MARKER, generateDocsTemplate } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VersionHistory } from './VersionHistory';

type CodeInputTab = 'editor' | 'chat' | 'history';
type LoadingAction = 'review' | 'docs' | null;

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  onSubmit: (fullCode: string) => void;
  onGenerateDocs: (fullCode: string) => void;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  reviewAvailable: boolean;
  activeTab: CodeInputTab;
  setActiveTab: (tab: CodeInputTab) => void;
  onStartFollowUp: (version?: Version) => void;
  onNewReview: () => void;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  versions: Version[];
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
}

const ChatView: React.FC<{
  onNewReview: () => void;
  chatHistory: ChatMessage[];
  onFollowUpSubmit: (message: string) => void;
  isChatLoading: boolean;
}> = ({ onNewReview, chatHistory, onFollowUpSubmit, isChatLoading }) => {
  const [followUpMessage, setFollowUpMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#e0ffff]">Follow-up Chat</h3>
        <Button onClick={onNewReview} variant="secondary" className="py-1 px-3 text-xs">
          New Review
        </Button>
      </div>
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 bg-[#070B14] rounded-md border border-[#15adad]/70 min-h-[300px] space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-[#157d7d] text-white' : 'bg-[#1c2c44] text-[#e0ffff]'}`}>
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
      <div className="flex items-center space-x-2">
        <textarea
          value={followUpMessage}
          onChange={(e) => setFollowUpMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="block w-full p-2 font-sans text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff] resize-y placeholder:text-[#60c0c0]"
          placeholder="Ask a follow-up question..."
          disabled={isChatLoading}
          aria-label="Follow-up message input"
        />
        <Button onClick={handleSend} isLoading={isChatLoading} disabled={isChatLoading || !followUpMessage.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

const EditorView: React.FC<Omit<CodeInputProps, 'activeTab' | 'setActiveTab' | 'versions' | 'onLoadVersion' | 'onDeleteVersion' | 'chatHistory' | 'onFollowUpSubmit' | 'isChatLoading'>> = ({
  userCode,
  setUserCode,
  language,
  setLanguage,
  onSubmit,
  onGenerateDocs,
  isLoading,
  loadingAction,
  onNewReview,
}) => {
  
  const handleReviewSubmit = () => {
    if (userCode.trim()) {
      const template = generateReviewerTemplate(language);
      const fullCode = template.replace(PLACEHOLDER_MARKER, userCode);
      onSubmit(fullCode);
    }
  };

  const handleDocsSubmit = () => {
    if (userCode.trim()) {
      const template = generateDocsTemplate(language);
      const fullCode = template.replace(PLACEHOLDER_MARKER, userCode);
      onGenerateDocs(fullCode);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <h2 className="text-xl font-semibold text-center">
        <span style={{
          background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          Code to Review
        </span>
      </h2>
      <Select
        id="language-select"
        label="Select Language"
        options={SUPPORTED_LANGUAGES}
        value={language}
        onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
        disabled={isLoading}
        aria-label="Select programming language"
      />
      <div className="flex-grow relative">
        <textarea
          id="code-input"
          rows={15}
          className="block w-full h-full p-3 pr-10 font-mono text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff] resize-y placeholder:text-[#60c0c0] placeholder:text-center"
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          disabled={isLoading}
          aria-label="Code input area"
          placeholder=">> PASTE CODE HERE <<"
        />
        {userCode && !isLoading && (
          <button
            onClick={onNewReview}
            className="absolute top-3 right-3 p-1 text-[#15FFFF] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070B14] focus:ring-[#15fafa] rounded-full"
            aria-label="Clear and start new review"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
       <div className="pt-2 flex items-center space-x-3">
         <Button 
            onClick={handleReviewSubmit} 
            isLoading={isLoading && loadingAction === 'review'}
            disabled={!userCode.trim() || isLoading}
            className="w-full"
            aria-label={isLoading ? 'Reviewing code...' : 'Submit code for review'}
          >
            {isLoading && loadingAction === 'review' ? 'Reviewing...' : 'Review Code'}
          </Button>
          <Button 
            onClick={handleDocsSubmit}
            isLoading={isLoading && loadingAction === 'docs'}
            disabled={!userCode.trim() || isLoading}
            className="w-full"
            variant="secondary"
            aria-label={isLoading ? 'Generating docs...' : 'Generate documentation for the code'}
          >
            {isLoading && loadingAction === 'docs' ? 'Generating...' : 'Generate Docs'}
          </Button>
       </div>
    </div>
  );
};


export const CodeInput: React.FC<CodeInputProps> = (props) => {
  const { 
    activeTab, setActiveTab, reviewAvailable, isLoading, onStartFollowUp,
  } = props;

  const getTabClass = (tabName: CodeInputTab) => {
    return `px-4 py-2 text-sm font-medium rounded-t-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101827] focus:ring-[#15fafa] transition-colors duration-200 ${
      activeTab === tabName 
        ? 'bg-[#070B14] text-[#15fafa] border-b-2 border-[#15fafa]' 
        : 'bg-transparent text-[#a0f0f0] hover:bg-[#15fafa]/10'
    }`;
  };
  
  const showChatTab = props.chatHistory.length > 0 || props.isChatLoading;

  return (
    <div className="p-6 bg-[#101827] rounded-lg shadow-xl shadow-[#156464]/30 space-y-4 border border-[#15adad]/60 flex flex-col">
       <div className="flex border-b border-[#15adad]/40 mb-4">
          <button onClick={() => setActiveTab('editor')} className={getTabClass('editor')}>Editor</button>
          {showChatTab && (
            <button onClick={() => setActiveTab('chat')} className={getTabClass('chat')}>Chat</button>
          )}
          <button onClick={() => setActiveTab('history')} className={getTabClass('history')}>History</button>
       </div>

      <div className="flex-grow">
        {activeTab === 'editor' && <EditorView {...props} />}
        {activeTab === 'chat' && showChatTab && <ChatView {...props} />}
        {activeTab === 'history' && <VersionHistory {...props} />}
      </div>

      {activeTab !== 'chat' && (
        <div className="mt-auto pt-4 flex flex-col items-center space-y-2">
          <Button
            onClick={() => onStartFollowUp()}
            disabled={!reviewAvailable || isLoading}
            variant="secondary"
            className="w-full"
            aria-label="Ask follow-up questions about the review"
          >
            Follow-up on Current Output
          </Button>
          {reviewAvailable && activeTab === 'editor' && !isLoading && (
            <p className="text-xs text-center text-[#70c0c0]/80 pt-1" aria-live="polite">
              Tip: Select text in the output before clicking Follow-up to ask about a specific section.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
