import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage, ChatMessage, ReviewProfile, LoadingAction, ChatRevision, Feature, ChatContext, FinalizationSummary } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, generateDebuggerTemplate, PLACEHOLDER_MARKER, REVIEW_PROFILES } from '../constants.ts';
import { ChatInterface } from './ChatInterface.tsx';
import { StopIcon } from './Icons.tsx';

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  errorMessage: string;
  setErrorMessage: (error: string) => void;
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
  onFinalizeFeatureDiscussion: () => void;
  onReturnToOutputView: () => void;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  chatInputValue: string;
  setChatInputValue: (value: string) => void;
  isActive: boolean;
  onStopGenerating: () => void;
  onOpenSaveModal: () => void;
  onLoadRevisionIntoEditor: () => void;
  // Context props for chat
  originalReviewedCode: string | null;
  revisedCode: string | null;
  chatRevisions: ChatRevision[];
  appMode: 'debug' | 'single' | 'comparison';
  codeB: string | null;
  onCodeLineClick: (line: string) => void;
  onClearChatRevisions: () => void;
  onRenameChatRevision: (id: string, newName: string) => void;
  onDeleteChatRevision: (id: string) => void;
  chatContext: ChatContext;
  activeFeatureForDiscussion: Feature | null;
  finalizationSummary: FinalizationSummary | null;
  // Attachment props
  attachments: { file: File; content: string; mimeType: string }[];
  onAttachFileClick: () => void;
  onRemoveAttachment: (file: File) => void;
  onOpenProjectFilesModal: () => void;
}

export const CodeInput: React.FC<CodeInputProps> = (props) => {
  const { 
    isLoading, loadingAction,
    userCode, language, onSubmit,
    setUserCode, setLanguage, reviewProfile, setReviewProfile, onNewReview,
    customReviewProfile, setCustomReviewProfile,
    onExplainSelection, onReviewSelection,
    isChatMode, isActive, onStopGenerating, appMode,
    errorMessage, setErrorMessage, chatContext, activeFeatureForDiscussion, finalizationSummary
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
      let fullCode;
      if (appMode === 'debug') {
        fullCode = generateDebuggerTemplate(language, userCode, errorMessage);
      } else { // 'single' mode
        const template = generateReviewerTemplate(language);
        fullCode = template.replace(PLACEHOLDER_MARKER, userCode);
      }
      onSubmit(fullCode);
    }
  };
  
  const textareaClasses = `
    block w-full h-full p-3 pr-10 font-mono text-sm text-[var(--hud-color)]
    focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)]
    resize-y placeholder:text-transparent bg-black/70 border border-[var(--hud-color-darker)]
    transition-colors duration-300
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
            onFinalizeFeatureDiscussion={props.onFinalizeFeatureDiscussion}
            onReturnToOutputView={props.onReturnToOutputView}
            chatHistory={props.chatHistory}
            onFollowUpSubmit={props.onFollowUpSubmit}
            isChatLoading={props.isChatLoading}
            chatInputValue={props.chatInputValue}
            setChatInputValue={props.setChatInputValue}
            originalReviewedCode={props.originalReviewedCode}
            revisedCode={props.revisedCode}
            chatRevisions={props.chatRevisions}
            appMode={props.appMode}
            codeB={props.codeB}
            language={language}
            onCodeLineClick={props.onCodeLineClick}
            onClearChatRevisions={props.onClearChatRevisions}
            onRenameChatRevision={props.onRenameChatRevision}
            onDeleteChatRevision={props.onDeleteChatRevision}
            chatContext={chatContext}
            activeFeatureForDiscussion={activeFeatureForDiscussion}
            finalizationSummary={finalizationSummary}
            onNewReview={onNewReview}
            onOpenSaveModal={props.onOpenSaveModal}
            onLoadRevisionIntoEditor={props.onLoadRevisionIntoEditor}
            attachments={props.attachments}
            onAttachFileClick={props.onAttachFileClick}
            onRemoveAttachment={props.onRemoveAttachment}
            onOpenProjectFilesModal={props.onOpenProjectFilesModal}
          />
      </div>
    );
  }

  const title = appMode === 'debug' ? 'Debugger' : 'Single Review';

  return (
    <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in`}>
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
                className={`${textareaClasses.replace('h-full', '')}`}
                value={customReviewProfile}
                onChange={(e) => setCustomReviewProfile(e.target.value)}
                disabled={isLoading}
                placeholder=" "
                aria-label="Custom review instructions"
              />
            </div>
          )}

          {appMode === 'debug' && (
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
          )}
          
          <div className="relative flex-grow min-h-[100px]">
            <textarea
              ref={textareaRef}
              id="code-input"
              className={textareaClasses}
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              onSelect={handleSelect}
              onMouseUp={handleSelect}
              onKeyUp={handleSelect}
              disabled={isLoading}
              aria-label="Code input area"
              placeholder=" "
              title="Paste code here."
            />
            {!userCode && !isLoading && (
              <div className="absolute top-3 left-3 pointer-events-none font-mono text-sm text-[var(--hud-color)]" aria-hidden="true">
                <span className="blinking-prompt">❯ </span>
                <span className="text-[var(--hud-color-darker)]">Awaiting input...</span>
              </div>
            )}
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
                      {appMode === 'debug' ? 'Debug Code' : 'Review Code'}
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