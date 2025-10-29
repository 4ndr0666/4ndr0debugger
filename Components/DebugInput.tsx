import React, { useState, useRef } from 'react';
import { useConfigContext, useInputContext, useActionsContext } from '../AppContext.tsx';
import { useLoadingStateContext, useChatStateContext, useSessionActionsContext } from '../contexts/SessionContext.tsx';
import { SupportedLanguage, ReviewProfile } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES, generateDebuggerTemplate, REVIEW_PROFILES } from '../constants.ts';
import { ChatInterface } from './ChatInterface.tsx';
import { StopIcon } from './Icons.tsx';
import { ContextFilesSelector } from './ContextFilesSelector.tsx';
import { Tooltip } from './Tooltip.tsx';

interface DebugInputProps {
  isActive: boolean;
  onOpenSaveModal: () => void;
  onSaveChatSession: () => void;
  onAttachFileClick: () => void;
  onOpenProjectFilesModal: () => void;
}

export const DebugInput: React.FC<DebugInputProps> = (props) => {
  const { isActive, onSaveChatSession, onAttachFileClick, onOpenProjectFilesModal } = props;
  const { isLoading, loadingAction } = useLoadingStateContext();
  const { isChatMode, contextFileIds } = useChatStateContext();
  const { 
    handleReviewSubmit, handleExplainSelection, handleReviewSelection,
    handleStopGenerating, handleContextFileSelectionChange
  } = useSessionActionsContext();
  
  const {
    language, setLanguage, reviewProfile, setReviewProfile,
    customReviewProfile, setCustomReviewProfile
  } = useConfigContext();
  const { 
    userOnlyCode, setUserOnlyCode, errorMessage, setErrorMessage
  } = useInputContext();
  const { resetAndSetMode } = useActionsContext();

  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const selection = target.value.substring(target.selectionStart, target.selectionEnd);
    setSelectedText(selection);
  };

  const handleSubmit = () => {
    if (userOnlyCode.trim()) {
      const fullCode = generateDebuggerTemplate(language, userOnlyCode, errorMessage);
      handleReviewSubmit(fullCode);
    }
  };
  
  const textareaClasses = `
    block w-full h-full p-3 pr-10 font-mono text-sm text-[var(--hud-color)]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)]
    resize-y placeholder:text-transparent bg-black/70 border border-[var(--hud-color-darker)]
    transition-all duration-150
  `.trim().replace(/\s+/g, ' ');

  const activeClass = isActive ? 'active' : '';

  if (isChatMode) {
    return (
      <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in min-h-0`}>
          <div className="hud-corner corner-top-left"></div>
          <div className="hud-corner corner-top-right"></div>
          <div className="hud-corner corner-bottom-left"></div>
          <div className="hud-corner corner-bottom-right"></div>
          <ChatInterface 
            onSaveChatSession={onSaveChatSession} 
            onAttachFileClick={onAttachFileClick}
            onOpenProjectFilesModal={onOpenProjectFilesModal}
          />
      </div>
    );
  }

  const title = 'Debugger';

  return (
    <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in min-h-0`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      
      <div className="flex items-center justify-center relative flex-shrink-0">
        <h2 className="text-xl text-center">
          {title}
        </h2>
      </div>
          
      <div className="flex-grow flex flex-col overflow-y-auto pr-2 mt-4">
        <div className="flex flex-col space-y-4 flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <Tooltip text="Selecting the correct language enables the AI to provide a more accurate and idiomatic analysis.">
                <div className="w-full">
                  <Select
                    id="language-select-debug"
                    label="Language"
                    options={SUPPORTED_LANGUAGES}
                    value={language}
                    onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                    disabled={isLoading}
                    aria-label="Select programming language"
                  />
                </div>
              </Tooltip>
            </div>
            <div title="Select an optional profile to focus the AI's analysis on specific criteria.">
              <Select
                id="review-profile-select-debug"
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
              <label htmlFor="custom-profile-input-debug" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                Custom Instructions
              </label>
              <textarea
                id="custom-profile-input-debug"
                className={`${textareaClasses.replace('h-full', '')}`}
                value={customReviewProfile}
                onChange={(e) => setCustomReviewProfile(e.target.value)}
                disabled={isLoading}
                placeholder=" "
                aria-label="Custom review instructions"
              />
            </div>
          )}
          
          <ContextFilesSelector 
            selectedFileIds={contextFileIds}
            onSelectionChange={handleContextFileSelectionChange}
          />

          <div className="mt-2 animate-fade-in">
            <label htmlFor="error-message-input" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
              Error Message / Context
            </label>
            <textarea
              id="error-message-input"
              className={`${textareaClasses.replace('h-full', '')}`}
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              disabled={isLoading}
              placeholder="e.g., Paste console logs or error stack trace here."
              aria-label="Error message input"
            />
          </div>
          
          <div className="relative flex-grow min-h-0">
            <textarea
              ref={textareaRef}
              id="code-input-debug"
              className={textareaClasses}
              value={userOnlyCode}
              onChange={(e) => setUserOnlyCode(e.target.value)}
              onSelect={handleSelect}
              onMouseUp={handleSelect}
              onKeyUp={handleSelect}
              disabled={isLoading}
              aria-label="Code input area"
              placeholder=" "
              title="Paste code here."
            />
            {!userOnlyCode && !isLoading && (
              <div className="absolute top-3 left-3 pointer-events-none font-mono text-sm text-[var(--hud-color)]" aria-hidden="true">
                <span className="blinking-prompt">❯ </span>
                <span className="text-[var(--hud-color-darker)]">Awaiting input...</span>
              </div>
            )}
            {userOnlyCode && !isLoading && (
              <button
                onClick={(e) => { e.preventDefault(); resetAndSetMode('debug'); }}
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
      
      <div className="flex-shrink-0 pt-4 mt-auto">
        <div className="min-h-[60px] flex flex-col justify-center">
            {!isLoading && userOnlyCode.trim() && (
              <div className="w-full flex justify-center animate-fade-in">
                  <Button 
                      onClick={handleSubmit} 
                      className="w-full sm:w-auto flex-grow"
                      aria-label="Submit code for review"
                      title="Submit your code and error message for debugging."
                  >
                      Debug Code
                  </Button>
              </div>
            )}

            {isLoading && (loadingAction === 'review' || loadingAction === 'review-selection') && (
              <div className="w-full flex justify-center animate-fade-in">
                  <Button 
                      onClick={handleStopGenerating} 
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
        
        {selectedText && !isLoading && (
          <div className="bg-black/50 border border-[var(--hud-color-darkest)] p-3 space-y-2 animate-fade-in mt-3">
            <p className="text-xs text-center text-[var(--hud-color-darker)] uppercase tracking-wider">Action for selection:</p>
            <div className="flex items-center justify-center space-x-3">
              <Button 
                onClick={() => handleExplainSelection(selectedText)} 
                variant="secondary" 
                className="text-xs py-1.5 px-3"
                isLoading={isLoading && loadingAction === 'explain-selection'}
              >
                Explain
              </Button>
              <Button 
                onClick={() => handleReviewSelection(selectedText)} 
                variant="secondary" 
                className="text-xs py-1.5 px-3"
                isLoading={isLoading && loadingAction === 'review-selection'}
              >
                Review
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
