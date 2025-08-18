

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { LoadingAction, Toast, SupportedLanguage } from '../types.ts';
import { SaveIcon, CopyIcon, CheckIcon, CompareIcon, ChatIcon, CommitIcon } from './Icons.tsx';
import { LANGUAGE_TAG_MAP } from '../constants.ts';
import ErrorBoundary from './ErrorBoundary.tsx';
import { CodeBlock } from './CodeBlock.tsx';
import { Button } from './Button.tsx';

interface ReviewOutputProps {
  feedback: string | null;
  revisedCode: string | null;
  language: SupportedLanguage;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  outputType: LoadingAction;
  error: string | null;
  onSaveVersion: () => void;
  onShowDiff: () => void;
  canCompare: boolean;
  isActive: boolean;
  addToast: (message: string, type: Toast['type']) => void;
  onStartFollowUp: () => void;
  onGenerateCommitMessage: () => void;
  reviewAvailable: boolean;
}

export const ReviewOutput = ({ 
    feedback, revisedCode, language, isLoading, isChatLoading, loadingAction, error, 
    onSaveVersion, isActive, outputType, onShowDiff, canCompare,
    addToast, onStartFollowUp, onGenerateCommitMessage, reviewAvailable
}: ReviewOutputProps) => {
  const [copied, setCopied] = useState(false);
  const showLoading = isLoading || isChatLoading;
  const canCopy = !showLoading && !error && feedback;

  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleCopy = () => {
    if (!feedback) return;
    navigator.clipboard.writeText(feedback).then(() => {
      setCopied(true);
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy markdown: ', err);
      addToast('Failed to copy to clipboard.', 'error');
    });
  };

  const analysisText = useMemo(() => {
      if (!feedback) return null;
      // During streaming, show everything to avoid layout jumps
      if (isLoading && feedback) return feedback;
      
      // Once complete, if there's revised code, strip it from the main analysis body
      if (revisedCode) {
        const finalCodeRegex = new RegExp("```(?:"+ (LANGUAGE_TAG_MAP[language] || '') +")?\\n[\\s\\S]*?\\n```$", "m");
        return feedback.replace(finalCodeRegex, '').trim();
      }
      
      return feedback;
  }, [feedback, revisedCode, isLoading, language]);

  const title = useMemo(() => {
    const action = showLoading ? loadingAction : outputType;
    
    switch (action) {
        case 'review': return 'Code Review';
        case 'docs': return 'Generated Documentation';
        case 'tests': return 'Generated Tests';
        case 'commit': return 'Commit Message Suggestion';
        case 'explain-selection': return 'Code Explanation';
        case 'review-selection': return 'Selection Review';
        case 'comparison': return 'Comparative Analysis';
        default: return 'Analysis';
    }
  }, [showLoading, loadingAction, outputType]);

  // This effect handles auto-scrolling for streaming responses
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement || !isLoading) return;

    // If user has scrolled up, don't force scroll down. Otherwise, follow the stream.
    const isScrolledToBottom = contentElement.scrollHeight - contentElement.scrollTop <= contentElement.clientHeight + 50;
    if (isScrolledToBottom) {
      contentElement.scrollTop = contentElement.scrollHeight;
    }
  }, [feedback, isLoading]);
  
  // Reset copied state if feedback changes
  useEffect(() => { setCopied(false) }, [feedback]);

  const activeClass = isActive ? 'active' : '';

  return (
    <div className={`hud-container min-h-[200px] flex flex-col h-full ${activeClass}`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      <div className="relative flex justify-center items-center mb-4 flex-shrink-0">
        <h2 className="text-xl text-center">
            {title}
        </h2>
        <div className="absolute right-0 flex items-center space-x-1">
          {canCopy && (
            <button
              onClick={handleCopy}
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
              aria-label={copied ? "Copied!" : "Copy Full Output"}
              title={copied ? "Copied!" : "Copy Full Output"}
            >
              {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-hidden relative">
        {isLoading && !feedback && (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <LoadingSpinner size="w-12 h-12" />
            <p className="mt-4 uppercase tracking-widest text-sm animate-pulse">Analyzing...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="p-4 bg-[var(--red-color)]/20 border border-[var(--red-color)] text-[var(--red-color)]">
            <p className="font-semibold uppercase">Error:</p>
            <p className="whitespace-pre-wrap font-mono mt-2">{error}</p>
          </div>
        )}
        
        {/* Requirement #6: Contained output stream */}
        <div 
          id="review-output-content" 
          ref={contentRef}
          className="overflow-auto h-full pr-2 text-[var(--hud-color-darker)] leading-relaxed space-y-4"
        >
          {analysisText && <MarkdownRenderer markdown={analysisText} />}

          {/* Requirement #7: Collapsed pane for revised code */}
          {!isLoading && revisedCode && (
            <details className="mt-6 pt-4 border-t border-[var(--hud-color-darkest)] animate-fade-in">
              <summary className="font-heading text-lg text-[var(--hud-color)] cursor-pointer hover:text-white transition-colors">
                View Revised Code
              </summary>
              <ErrorBoundary>
                <CodeBlock code={revisedCode} language={LANGUAGE_TAG_MAP[language]} />
              </ErrorBoundary>
            </details>
          )}

          {isLoading && feedback && <LoadingSpinner size="w-6 h-6" className="mx-auto pt-4" />}
        </div>
      </div>

      {/* Requirement #8: Contextual actions populate below the review */}
      {!isLoading && !error && reviewAvailable && (
        <div className="flex-shrink-0 pt-4 mt-4 border-t border-[var(--hud-color-darker)] flex flex-wrap justify-center items-center gap-3 animate-fade-in">
            <Button onClick={onShowDiff} disabled={!canCompare} variant="primary" className="post-review-button">
                <CompareIcon className="w-4 h-4 mr-2"/>
                Show Diff
            </Button>
            <Button onClick={onGenerateCommitMessage} disabled={!canCompare} variant="primary" className="post-review-button">
                <CommitIcon className="w-4 h-4 mr-2" />
                Generate Commit
            </Button>
            <Button onClick={() => onStartFollowUp()} variant="primary" className="post-review-button">
                <ChatIcon className="w-4 h-4 mr-2" />
                Follow-up
            </Button>
            <Button onClick={onSaveVersion} variant="primary" className="post-review-button">
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Version
            </Button>
        </div>
      )}
    </div>
  );
};