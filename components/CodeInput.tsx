
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, PLACEHOLDER_MARKER, generateDocsTemplate, REVIEW_PROFILES } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VersionHistory } from './VersionHistory';

type LoadingAction = 'review' | 'docs' | null;

const ImportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  reviewProfile: ReviewProfile | 'none';
  setReviewProfile: (profile: ReviewProfile | 'none') => void;
  onSubmit: (fullCode: string) => void;
  onGenerateDocs: (fullCode: string) => void;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  reviewAvailable: boolean;
  isChatMode: boolean;
  onStartFollowUp: (version?: Version) => void;
  onNewReview: () => void;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  versions: Version[];
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onImportClick: () => void;
  onExportSession: () => void;
}

const ChatInterface: React.FC<{
  onEndChat: () => void;
  chatHistory: ChatMessage[];
  onFollowUpSubmit: (message: string) => void;
  isChatLoading: boolean;
}> = ({ onEndChat, chatHistory, onFollowUpSubmit, isChatLoading }) => {
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
    <div className="p-6 bg-[#101827]/80 backdrop-blur-md rounded-lg shadow-xl shadow-[#156464]/30 space-y-4 border border-[#15adad]/40 flex flex-col h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#e0ffff] font-heading">Follow-up Chat</h3>
          <Button onClick={onEndChat} variant="secondary" className="py-1 px-3 text-xs">
            End Chat & Start New
          </Button>
        </div>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-3 bg-[#070B14] rounded-md border border-[#15adad]/70 space-y-4 flex-1 min-h-[300px] max-h-[65vh]">
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

export const CodeInput: React.FC<CodeInputProps> = (props) => {
  const { 
    reviewAvailable, isLoading, onStartFollowUp,
    userCode, language, onSubmit, onGenerateDocs, loadingAction,
    setUserCode, setLanguage, reviewProfile, setReviewProfile, onNewReview,
    isChatMode,
  } = props;

  const [activeTab, setActiveTab] = useState<'editor' | 'versioning'>('editor');
  
  // --- State and logic from former EditorView component ---
  const [isCollapsed, setIsCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeTab === 'versioning') {
      setIsCollapsed(true);
    } else { // activeTab === 'editor'
      // When on the editor tab, the collapsed state should directly reflect
      // whether a review is available for the current code. This makes the
      // state predictable and fixes bugs related to it becoming out of sync.
      setIsCollapsed(reviewAvailable);
    }
  }, [activeTab, reviewAvailable]);


  if (isChatMode) {
    return <ChatInterface 
      onEndChat={onNewReview}
      chatHistory={props.chatHistory}
      onFollowUpSubmit={props.onFollowUpSubmit}
      isChatLoading={props.isChatLoading}
    />;
  }


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

  const getTabClass = (tabName: 'editor' | 'versioning') => {
    return `px-4 py-2 text-sm font-medium rounded-t-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101827] focus:ring-[#15fafa] transition-colors duration-200 ${
      activeTab === tabName 
        ? 'bg-[#070B14] text-[#15fafa] border-b-2 border-[#15fafa]' 
        : 'bg-transparent text-[#a0f0f0] hover:bg-[#15fafa]/10'
    }`;
  };

  const renderEditorView = () => {
    return (
      <div className="flex flex-col h-full">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          aria-controls="code-editor-content"
          onClick={() => setIsCollapsed(!isCollapsed)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCollapsed(!isCollapsed); } }}
          className="text-xl font-semibold text-center flex items-center justify-center cursor-pointer group rounded-md p-1 font-heading"
        >
          <span
            className="transition-all duration-300 ease-in-out group-hover:[text-shadow:0_0_8px_#15fafaAA]"
            style={{
            background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
            Code to Review
          </span>
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ml-2 text-[#15fafa] transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div
          id="code-editor-content"
          className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="w-full sm:w-1/2">
                    <Select
                        id="language-select"
                        label="Select Language"
                        options={SUPPORTED_LANGUAGES}
                        value={language}
                        onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                        disabled={isLoading}
                        aria-label="Select programming language"
                    />
                </div>
                <div className="w-full sm:w-1/2">
                    <Select
                        id="review-profile-select"
                        label="Select Review Profile (Optional)"
                        options={[
                        { value: 'none', label: 'Default Review' },
                        ...REVIEW_PROFILES,
                        ]}
                        value={reviewProfile}
                        onChange={(newProfile) => setReviewProfile(newProfile as ReviewProfile | 'none')}
                        disabled={isLoading}
                        aria-label="Select review profile"
                    />
                </div>
              </div>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="code-input"
                  rows={15}
                  className="block w-full h-full p-3 pr-10 font-mono text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff] resize-y placeholder:text-[#60c0c0] placeholder:text-center placeholder:font-sans"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  disabled={isLoading}
                  aria-label="Code input area"
                  placeholder=">> PASTE YOUR CODE, SELECT LANGUAGE, AND CLICK REVIEW <<"
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#101827]/80 backdrop-blur-md rounded-lg shadow-xl shadow-[#156464]/30 space-y-4 border border-[#15adad]/40 flex flex-col">
       <div className="flex justify-between items-center border-b border-[#15adad]/40 mb-4">
          <div>
            <button onClick={() => setActiveTab('editor')} className={getTabClass('editor')}>Editor</button>
            <button onClick={() => setActiveTab('versioning')} className={getTabClass('versioning')}>Versioning</button>
          </div>
          <div className="flex items-center space-x-1">
             <button 
              onClick={props.onImportClick} 
              title="Import Session" 
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101827] focus:ring-[#15fafa]"
              aria-label="Import Session"
            >
              <ImportIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={props.onExportSession} 
              title="Export Session" 
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101827] focus:ring-[#15fafa]"
              aria-label="Export Session"
            >
              <ExportIcon className="w-5 h-5" />
            </button>
          </div>
       </div>

      <div className="flex-grow">
        {activeTab === 'editor' && renderEditorView()}
        {activeTab === 'versioning' && <VersionHistory {...props} />}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex flex-col items-center space-y-4">
          {activeTab === 'editor' && (
            <div className="w-full flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
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
          )}

          {reviewAvailable && (
            <div className="w-full flex flex-col items-center space-y-2">
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
      </div>
    </div>
  );
};
