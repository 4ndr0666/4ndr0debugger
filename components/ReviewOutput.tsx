import React, { useRef, useState, useEffect, useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LoadingAction, Toast } from '../types';
import { SaveIcon, CopyIcon, CheckIcon, CompareIcon } from './Icons';

interface ReviewOutputProps {
  feedback: string | null;
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
}

export const ReviewOutput = ({ 
    feedback, isLoading, isChatLoading, loadingAction, error, 
    onSaveVersion, isActive, outputType, onShowDiff, canCompare,
    addToast
}: ReviewOutputProps) => {
  const [copied, setCopied] = useState(false);
  const showLoading = isLoading || isChatLoading;
  const canSave = !showLoading && !error && feedback;
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

  const title = useMemo(() => {
    const action = showLoading ? loadingAction : outputType;
    
    switch (action) {
        case 'review':
            return 'Code Review';
        case 'docs':
            return 'Generated Documentation';
        case 'tests':
            return 'Generated Tests';
        case 'commit':
            return 'Commit Message Suggestion';
        case 'explain-selection':
            return 'Code Explanation';
        case 'review-selection':
            return 'Selection Review';
        case 'comparison':
            return 'Comparative Analysis';
        default:
            return 'Analysis';
    }
  }, [showLoading, loadingAction, outputType]);

  // This effect handles auto-scrolling for streaming responses
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    if (isLoading || isChatLoading) {
      if (contentElement.scrollHeight - contentElement.scrollTop < contentElement.clientHeight + 100) {
        contentElement.scrollTop = contentElement.scrollHeight;
      }
    }
  }, [feedback, isLoading, isChatLoading]);
  
  // Reset copied state if feedback changes
  useEffect(() => {
      setCopied(false);
  },[feedback]);

  const activeClass = isActive ? 'active' : '';

  return (
    <div className={`hud-container min-h-[200px] flex flex-col ${activeClass}`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      <div className="relative flex justify-center items-center mb-4 flex-shrink-0">
        <h2 className="text-xl text-center">
            {title}
        </h2>
        <div className="absolute right-0 flex items-center space-x-1">
          {canCompare && (
             <button
              onClick={onShowDiff}
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
              aria-label="Compare changes"
              title="Compare Changes"
            >
              <CompareIcon className="w-5 h-5" />
            </button>
          )}
          {canCopy && (
            <button
              onClick={handleCopy}
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
              aria-label={copied ? "Copied!" : "Copy Markdown"}
              title={copied ? "Copied!" : "Copy Markdown"}
            >
              {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          )}
          {canSave && (
            <button
              onClick={onSaveVersion}
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
              aria-label="Save this output as a version"
              title="Save Version"
            >
              <SaveIcon className="w-5 h-5" />
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
        {!error && (feedback || isLoading) && (
          <>
            <div 
              id="review-output-content" 
              ref={contentRef}
              className="overflow-auto h-full pr-2 text-[var(--hud-color-darker)] leading-relaxed space-y-4"
            >
              <MarkdownRenderer markdown={feedback || ''} />
              {isLoading && feedback && <LoadingSpinner size="w-6 h-6" className="mx-auto pt-4" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};