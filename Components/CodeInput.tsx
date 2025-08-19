

import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage, ChatMessage, ReviewProfile, LoadingAction } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, PLACEHOLDER_MARKER, REVIEW_PROFILES } from '../constants.ts';
import { ChatInterface } from './ChatInterface.tsx';
import { StopIcon } from './Icons.tsx';

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  reviewProfile: ReviewProfile | 'none';
  setReviewProfile: (profile: ReviewProfile | 'none') => void;
  customReviewProfile: string;
  setCustomReviewProfile: (value: string) => void;
  onSubmit: (fullCode: string) => void;
  onExplainSelection: (selection: string) => void;
  onReviewSelection: (selection: string) => void;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  isChatMode: boolean;
  onNewReview: () => void;
  onEndChat: () => void;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  chatInputValue: string;
  setChatInputValue: (value: string) => void;
  isActive: boolean;
  onStopGenerating: () => void;
  // Context props for chat
  originalReviewedCode: string | null;
  appMode: 'single' | 'comparison';
  codeB: string | null;
  onCodeLineClick: (line: string) => void;
}

export const CodeInput: React.FC<CodeInputProps> = (props) => {
  const { 
    isLoading, loadingAction,
    userCode, language, onSubmit,
    setUserCode, setLanguage, reviewProfile, setReviewProfile, onNewReview,
    customReviewProfile, setCustomReviewProfile,
    onExplainSelection, onReviewSelection,
    isChatMode, isActive, onStopGenerating, onEndChat
  } = props;
  
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const activeClass = isActive ? 'active' : '';

  if (isChatMode) {
    return (
      <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in`}>
          <div className="hud-corner corner-top-left"></div>
          <div className="hud-corner corner-top-right"></div>
          <div className="hud-corner corner-bottom-left"></div>
          <div className="hud-corner corner-bottom-right"></div>
          <ChatInterface 
            onEndChat={onEndChat}
            chatHistory={props.chatHistory}
            onFollowUpSubmit={props.onFollowUpSubmit}
            isChatLoading={props.isChatLoading}
            chatInputValue={props.chatInputValue}
            setChatInputValue={props.setChatInputValue}
            originalReviewedCode={props.originalReviewedCode}
            appMode={props.appMode}
            codeB={props.codeB}
            language={language}
            onCodeLineClick={props.onCodeLineClick}
          />
      </div>
    );
  }

  return (
    <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      
      <div className="flex items-center justify-center relative flex-shrink-0">
        <h2 className="text-xl text-center">
          Code Input
        </h2>
      </div>
          
      <div className="flex-grow flex flex-col overflow-y-auto pr-2 mt-4">
        <div className="flex flex-col space-y-4 flex-grow">
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

          {reviewProfile === ReviewProfile.CUSTOM && (
            <div className="mt-2 animate-fade-in">
              <label htmlFor="custom-profile-input" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                Custom Instructions
              </label>
              <textarea
                id="custom-profile-input"
                rows={3}
                className={`${textareaClasses.replace('h-full', '')}`}
                value={customReviewProfile}
                onChange={(e) => setCustomReviewProfile(e.target.value)}
                disabled={isLoading}
                placeholder="e.g., Focus on refactoring for performance."
                aria-label="Custom review instructions"
              />
            </div>
          )}
          
          <div className="relative flex-grow">
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
              placeholder="❯ Awaiting input..."
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
        </div>
      </div>
      
      {/* Action Footer underneath the text area */}
      <div className="flex-shrink-0 pt-4 mt-auto">
        <div className="min-h-[60px] flex flex-col justify-center">
            {/* Requirement #4: Conditional "Review Code" button appears only when text is input */}
            {!isLoading && userCode.trim() && (
              <div className="w-full flex justify-center animate-fade-in">
                  <Button 
                      onClick={handleReviewSubmit} 
                      className="w-full sm:w-auto flex-grow"
                      aria-label="Submit code for review"
                      title="Submit your code for a standard analysis of quality, bugs, and style."
                  >
                      Review Code
                  </Button>
              </div>
            )}

            {/* Stop button appears during generation */}
            {isLoading && (loadingAction === 'review' || loadingAction === 'review-selection' || loadingAction === 'comparison') && (
              <div className="w-full flex justify-center animate-fade-in">
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
              </div>
            )}
        </div>
        
        {/* Selection-based actions appear when text is highlighted */}
        {selectedText && !isLoading && (
          <div className="bg-black/50 border border-[var(--hud-color-darkest)] p-3 space-y-2 animate-fade-in mt-3">
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
  );
};