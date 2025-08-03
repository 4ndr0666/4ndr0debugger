

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LoadingAction } from '../types';

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
}

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline strokeLinecap="round" strokeLinejoin="round" points="17 21 17 13 7 13 7 21" />
    <polyline strokeLinecap="round" strokeLinejoin="round" points="7 3 7 8 15 8" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const CompareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);


export const ReviewOutput: React.FC<ReviewOutputProps> = ({ feedback, isLoading, isChatLoading, loadingAction, error, onSaveVersion, isActive, outputType, onShowDiff, canCompare }) => {
  const showLoading = isLoading || isChatLoading;
  const canSave = !showLoading && !error && feedback;
  const canCopy = !showLoading && !error && feedback;

  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!feedback) return;
    navigator.clipboard.writeText(feedback).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy markdown: ', err);
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

  // This effect handles both auto-scrolling for streaming responses and
  // attaching the scroll listener for the dynamic blur effect.
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    if (isLoading || isChatLoading) {
      contentElement.scrollTop = contentElement.scrollHeight;
    }

    const handleScroll = () => {
      setIsScrolled(contentElement.scrollTop > 10);
    };

    contentElement.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
    };
  }, [feedback, isLoading, isChatLoading]);

  const activeClass = isActive ? 'active' : '';

  return (
    <div className={`p-6 min-h-[200px] flex flex-col bg-[#101827]/60 backdrop-blur-lg rounded-lg shadow-xl shadow-[#156464]/30 transition-all duration-300 animated-border-container ${activeClass}`}>
      <div className="relative flex justify-center items-center mb-4">
        <h2 className="text-xl font-semibold text-center font-heading">
          <span style={{
              background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
            {title}
          </span>
        </h2>
        <div className="absolute right-0 flex items-center space-x-1">
          {canCompare && (
             <button
              onClick={onShowDiff}
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#15fafa]"
              aria-label="Compare changes"
              title="Compare Changes"
            >
              <CompareIcon className="w-5 h-5" />
            </button>
          )}
          {canCopy && (
            <button
              onClick={handleCopy}
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#15fafa]"
              aria-label={isCopied ? "Copied" : "Copy Markdown"}
              title="Copy Markdown"
            >
              {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          )}
          {canSave && (
            <button
              onClick={onSaveVersion}
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#15fafa]"
              aria-label="Save this output as a version"
              title="Save Version"
            >
              <SaveIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-hidden relative">
        {showLoading && !feedback && (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <LoadingSpinner size="w-12 h-12" />
          </div>
        )}
        {error && !showLoading && (
          <div className="p-4 bg-red-600/50 border border-red-400 text-red-200 rounded-md">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}
        {!error && (feedback || showLoading) && (
          <>
            <div 
              id="review-output-content" 
              ref={contentRef}
              className="overflow-auto h-full pr-2 text-[#e0ffff] leading-relaxed space-y-4"
            >
              <MarkdownRenderer markdown={feedback} />
              {showLoading && feedback && <LoadingSpinner size="w-6 h-6" className="mx-auto pt-4" />}
            </div>
            <div 
              className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#101827]/80 via-[#101827]/70 to-transparent pointer-events-none backdrop-blur-[2px] transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden="true"
            />
          </>
        )}
        {!showLoading && !error && !feedback && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic text-center">Submit code to see results.</p>
          </div>
        )}
      </div>
    </div>
  );
};