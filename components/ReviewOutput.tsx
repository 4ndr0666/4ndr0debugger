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

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ 
    feedback, isLoading, isChatLoading, loadingAction, error, 
    onSaveVersion, isActive, outputType, onShowDiff, canCompare,
    addToast
}) => {
  const showLoading = isLoading || isChatLoading;
  const canSave = !showLoading && !error && feedback;
  const canCopy = !showLoading && !error && feedback;

  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const handleCopy = () => {
    if (!feedback) return;
    navigator.clipboard.writeText(feedback).then(() => {
      addToast('Copied to clipboard!', 'success');
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
              aria-label={"Copy Markdown"}
              title="Copy Markdown"
            >
              <CopyIcon className="w-5 h-5" />
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
      </div>
    </div>
  );
};