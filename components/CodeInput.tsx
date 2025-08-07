import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, PLACEHOLDER_MARKER, generateDocsTemplate, REVIEW_PROFILES } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { ChatInterface } from './ChatInterface';
import { StopIcon } from './Icons';

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  reviewProfile: ReviewProfile | 'none';
  setReviewProfile: (profile: ReviewProfile | 'none') => void;
  onSubmit: (fullCode: string) => void;
  onGenerateDocs: (fullCode: string) => void;
  onStartComparison: () => void;
  onGenerateCommitMessage: () => void;
  onExplainSelection: (selection: string) => void;
  onReviewSelection: (selection: string) => void;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  reviewAvailable: boolean;
  commitMessageAvailable: boolean;
  isChatMode: boolean;
  onStartFollowUp: (version?: Version) => void;
  onNewReview: () => void;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  isActive: boolean;
  onStopGenerating: () => void;
}

export const CodeInput: React.FC<CodeInputProps> = (props) => {
  const { 
    reviewAvailable, isLoading, onStartFollowUp, commitMessageAvailable,
    userCode, language, onSubmit, onGenerateDocs, onStartComparison, loadingAction,
    setUserCode, setLanguage, reviewProfile, setReviewProfile, onNewReview,
    onGenerateCommitMessage, onExplainSelection, onReviewSelection,
    isChatMode, isActive, onStopGenerating
  } = props;
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // When switching to chat mode, ensure the panel is expanded
    if(isChatMode && isCollapsed) {
      setIsCollapsed(false);
    }
    // Collapse when loading starts, unless it's a selection action
    if(isLoading && !isChatMode && !['explain-selection', 'review-selection'].includes(loadingAction || '')) {
        setIsCollapsed(true);
    }
  }, [isChatMode, isCollapsed, isLoading, loadingAction]);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const selection = target.value.substring(target.selectionStart, target.selectionEnd);
    setSelectedText(selection);
  };

  const handleReviewSubmit = () => {
    if (userCode.trim()) {
      const template = generateReviewerTemplate(language);
      const fullCode = template.replace(PLACEHOLDER_MARKER, userCode);
      onSubmit(fullCode);
    }
  };
  
  const textareaClasses = `
    block w-full h-full p-3 pr-10 font-mono text-sm text-[var(--hud-color)]
    focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)]
    resize-y placeholder:text-[var(--hud-color-darker)] bg-black/70 border border-[var(--hud-color-darker)]
    transition-colors duration-300
    ${!userCode ? 'blinking-placeholder' : ''}
  `.trim().replace(/\s+/g, ' ');

  // --- Collapsed State View ---
  if (isCollapsed && !isChatMode) {
    return (
      <div key="collapsed-view" className="h-full flex items-center justify-center hud-container">
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        <div 
          onClick={() => setIsCollapsed(false)} 
          className="flex flex-col items-center cursor-pointer group p-6"
          title="Expand and start review"
          role="button"
          aria-label="Expand code editor"
        >
          <h2 className="text-xl text-center mb-4">
            Awaiting Input
          </h2>
          <span className="text-2xl font-mono transition-transform duration-200 group-hover:scale-110 blinking-prompt">
            &gt;
          </span>
        </div>
      </div>
    );
  }

  // --- Expanded State View (or Chat Mode) ---
  const activeClass = isActive ? 'active' : '';

  const renderPrimaryAction = () => {
      if (isLoading && loadingAction === 'review') {
          return (
            <Button 
              onClick={onStopGenerating} 
              variant="danger"
              className="w-full sm:w-auto flex-grow"
              aria-label="Stop generating review"
              title="Stop the current analysis."
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </Button>
          )
      }
      return (
        <Button 
          onClick={handleReviewSubmit} 
          isLoading={false}
          disabled={!userCode.trim() || isLoading}
          className="w-full sm:w-auto flex-grow"
          aria-label="Submit code for review"
          title="Submit your code for a standard analysis of quality, bugs, and style."
        >
          Review Code
        </Button>
      )
  }

  return (
    <div key="expanded-view" className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      {isChatMode ? (
        <ChatInterface 
          onEndChat={onNewReview}
          chatHistory={props.chatHistory}
          onFollowUpSubmit={props.onFollowUpSubmit}
          isChatLoading={props.isChatLoading}
        />
      ) : (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="flex items-center justify-center relative flex-shrink-0">
            <h2 className="text-xl text-center">
              Code Input
            </h2>
            <button
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse code editor"
              title="Collapse"
              className="absolute right-0 p-1 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
              
          <div className="flex-grow overflow-y-auto pr-2 mt-4">
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div title="Select the language of your code for an accurate review.">
                  <Select
                    id="language-select"
                    label="Language"
                    options={SUPPORTED_LANGUAGES}
                    value={language}
                    onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                    disabled={isLoading}
                    aria-label="Select programming language"
                  />
                </div>
                <div title="Select an optional profile to focus the AI's analysis on specific criteria.">
                  <Select
                    id="review-profile-select"
                    label="Profile"
                    options={[{ value: 'none', label: 'Standard' }, ...REVIEW_PROFILES]}
                    value={reviewProfile}
                    onChange={(newProfile) => setReviewProfile(newProfile as ReviewProfile | 'none')}
                    disabled={isLoading}
                    aria-label="Select review profile"
                  />
                </div>
              </div>
              
              <div className="w-full flex flex-wrap items-center justify-center gap-3">
                {renderPrimaryAction()}
                <Button
                  onClick={onStartComparison}
                  variant="secondary"
                  disabled={isLoading}
                  className="w-full sm:w-auto flex-grow"
                  aria-label="Switch to comparative analysis mode"
                  title="Switch to a side-by-side view to compare and optimize two codebases."
                >
                  Comparative Analysis
                </Button>
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="code-input"
                  rows={15}
                  className={textareaClasses}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  onSelect={handleSelect}
                  onMouseUp={handleSelect}
                  onKeyUp={handleSelect}
                  disabled={isLoading}
                  aria-label="Code input area"
                  placeholder="Awaiting data stream..."
                  title="Paste code here."
                />
                {userCode && !isLoading && (
                  <button
                    onClick={(e) => { e.preventDefault(); onNewReview(); }}
                    className="absolute top-3 right-3 p-1 text-[var(--hud-color)] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[var(--hud-color)] rounded-full"
                    aria-label="Clear and start new review"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
              
              {selectedText && !isLoading && (
                <div className="bg-black/50 border border-[var(--hud-color-darkest)] p-3 space-y-2 animate-fade-in">
                  <p className="text-xs text-center text-[var(--hud-color-darker)] uppercase tracking-wider">Action for selection:</p>
                  <div className="flex items-center justify-center space-x-3">
                    <Button onClick={() => onExplainSelection(selectedText)} variant="secondary" className="text-xs py-1.5 px-3">
                      {isLoading && loadingAction === 'explain-selection' ? '...' : 'Explain'}
                    </Button>
                    <Button onClick={() => onReviewSelection(selectedText)} variant="secondary" className="text-xs py-1.5 px-3">
                      {isLoading && loadingAction === 'review-selection' ? '...' : 'Review'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0 pt-4 space-y-4 animate-fade-in">
            {(commitMessageAvailable || reviewAvailable) && (
              <div className="border-t border-[var(--hud-color-darker)] pt-4 space-y-4">
                {commitMessageAvailable && (
                  <div className="space-y-3">
                    <h4 className="text-center text-sm font-semibold text-[var(--hud-color-darker)]">Additional Tools</h4>
                    <div className="w-full flex flex-wrap items-center justify-center gap-3">
                      <Button
                        onClick={() => onGenerateCommitMessage()}
                        isLoading={isLoading && loadingAction === 'commit'}
                        disabled={isLoading}
                        variant="secondary"
                        className="w-full sm:w-auto flex-grow"
                        title="Generate a commit message from the last review's changes"
                      >
                        {isLoading && loadingAction === 'commit' ? 'Generating...' : 'Generate Commit Msg'}
                      </Button>
                    </div>
                  </div>
                )}
                {reviewAvailable && (
                  <div className="w-full flex flex-col items-center space-y-2">
                    <Button
                      onClick={() => onStartFollowUp()}
                      disabled={!reviewAvailable || isLoading}
                      variant="primary"
                      className="w-full"
                      aria-label="Ask follow-up questions about the review"
                    >
                      Follow-up on Current Output
                    </Button>
                    {reviewAvailable && !isLoading && (
                      <p className="text-xs text-center text-[var(--hud-color-darker)] pt-1" aria-live="polite">
                        Tip: Select text in the output before clicking Follow-up to ask about a specific section.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};