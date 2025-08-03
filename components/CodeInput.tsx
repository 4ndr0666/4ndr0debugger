

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, PLACEHOLDER_MARKER, generateDocsTemplate, REVIEW_PROFILES } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VersionHistory } from './VersionHistory';
import { ChatInterface } from './ChatInterface';

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
}

export const CodeInput: React.FC<CodeInputProps> = (props) => {
  const { 
    reviewAvailable, isLoading, onStartFollowUp, commitMessageAvailable,
    userCode, language, onSubmit, onGenerateDocs, onStartComparison, loadingAction,
    setUserCode, setLanguage, reviewProfile, setReviewProfile, onNewReview,
    onGenerateCommitMessage, onExplainSelection, onReviewSelection,
    isChatMode, isActive
  } = props;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      setIsCollapsed(true);
    }
  };

  const activeClass = isActive ? 'active' : '';
  
  const containerClasses = isCollapsed
    ? `h-full flex flex-col transition-all duration-300`
    : `bg-[#101827]/60 backdrop-blur-lg rounded-lg shadow-xl shadow-[#156464]/30 h-full flex flex-col transition-all duration-300 animated-border-container ${activeClass}`;

  const innerPaddingClasses = isCollapsed ? 'p-3' : 'p-6';

  return (
    <div className={containerClasses}>
       {isChatMode ? (
         <ChatInterface 
            onEndChat={onNewReview}
            chatHistory={props.chatHistory}
            onFollowUpSubmit={props.onFollowUpSubmit}
            isChatLoading={props.isChatLoading}
          />
       ) : (
        <div className={`${innerPaddingClasses} flex flex-col flex-grow overflow-hidden transition-all duration-300`}>
          <div className={`${isCollapsed ? 'flex-grow-0' : 'flex-grow'} overflow-y-auto pr-2 transition-all duration-300 ease-in-out`}>
            <div className="flex flex-col">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <Select
                            id="language-select"
                            label="Select Language"
                            options={SUPPORTED_LANGUAGES}
                            value={language}
                            onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                            disabled={isLoading}
                            aria-label="Select programming language"
                        />
                        <Select
                            id="review-profile-select"
                            label="Select Optional Profile"
                            options={[
                            { value: 'none', label: 'Standard' },
                            ...REVIEW_PROFILES,
                            ]}
                            value={reviewProfile}
                            onChange={(newProfile) => setReviewProfile(newProfile as ReviewProfile | 'none')}
                            disabled={isLoading}
                            aria-label="Select review profile"
                        />
                    </div>
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        id="code-input"
                        rows={15}
                        className="block w-full h-full p-3 pr-10 font-mono text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff] resize-y placeholder:text-[#60c0c0] placeholder:font-sans"
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value)}
                        onSelect={handleSelect}
                        onMouseUp={handleSelect} // Capture selection on mouse up as well
                        onKeyUp={handleSelect} // Capture selection on key up
                        disabled={isLoading}
                        aria-label="Code input area"
                        placeholder="Paste your code here, or start typing..."
                      />
                      {userCode && !isLoading && (
                        <button
                          onClick={(e) => { e.preventDefault(); onNewReview(); }}
                          className="absolute top-3 right-3 p-1 text-[#15FFFF] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070B14] focus:ring-[#15fafa] rounded-full"
                          aria-label="Clear and start new review"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                     {selectedText && !isLoading && (
                          <div className="bg-[#070B14]/50 border border-[#15adad]/50 rounded-lg p-3 space-y-2 animate-fade-in-up">
                              <p className="text-xs text-center text-[#a0f0f0]">Action for selected code:</p>
                              <div className="flex items-center justify-center space-x-3">
                                  <Button onClick={() => { onExplainSelection(selectedText); setIsCollapsed(true); }} variant="secondary" className="text-xs py-1.5 px-3">
                                      Explain Selection
                                  </Button>
                                  <Button onClick={() => { onReviewSelection(selectedText); setIsCollapsed(true); }} variant="secondary" className="text-xs py-1.5 px-3">
                                      Review Selection
                                  </Button>
                              </div>
                          </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {!isCollapsed && (
              <div className="flex-shrink-0 pt-4 space-y-4 animate-fade-in-up">
                  <div className="w-full flex flex-wrap items-center justify-center gap-3">
                      <Button 
                          onClick={handleReviewSubmit} 
                          isLoading={isLoading && loadingAction === 'review'}
                          disabled={!userCode.trim() || isLoading}
                          className="w-full sm:w-auto flex-grow"
                          aria-label={isLoading ? 'Reviewing code...' : 'Submit code for review'}
                      >
                          {isLoading && loadingAction === 'review' ? 'Reviewing...' : 'Review Code'}
                      </Button>
                      <Button
                          onClick={onStartComparison}
                          variant="primary"
                          disabled={isLoading}
                          className="w-full sm:w-auto flex-grow"
                          aria-label="Switch to comparative analysis mode"
                      >
                          Comparative Analysis
                      </Button>
                  </div>
                  {/* --- Additional Tools --- */}
                  {commitMessageAvailable && (
                      <div className="border-t border-[#15adad]/30 pt-4 space-y-3">
                          <h4 className="text-center text-sm font-semibold text-[#a0f0f0] font-heading">Additional Tools</h4>
                          <div className="w-full flex flex-wrap items-center justify-center gap-3">
                              <Button
                                  onClick={() => { onGenerateCommitMessage(); setIsCollapsed(true); }}
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
                    <div className="w-full flex flex-col items-center space-y-2 border-t border-[#15adad]/30 pt-4">
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
                        <p className="text-xs text-center text-[#70c0c0]/80 pt-1" aria-live="polite">
                          Tip: Select text in the output before clicking Follow-up to ask about a specific section.
                        </p>
                      )}
                    </div>
                  )}
              </div>
          )}
        </div>
       )}
    </div>
  );
};