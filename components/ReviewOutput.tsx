import React, { useRef, useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { MarkdownRenderer } from './MarkdownRenderer';

type LoadingAction = 'review' | 'docs' | null;

interface ReviewOutputProps {
  feedback: string | null;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  error: string | null;
  onSaveVersion: () => void;
  isChatMode: boolean;
}

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline strokeLinecap="round" strokeLinejoin="round" points="17 21 17 13 7 13 7 21" />
    <polyline strokeLinecap="round" strokeLinejoin="round" points="7 3 7 8 15 8" />
  </svg>
);


export const ReviewOutput: React.FC<ReviewOutputProps> = ({ feedback, isLoading, isChatLoading, loadingAction, error, onSaveVersion, isChatMode }) => {
  const showLoading = isLoading || isChatLoading;
  const canSave = !showLoading && !error && feedback && !isChatMode;

  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // This effect handles both auto-scrolling for streaming responses and
  // attaching the scroll listener for the dynamic blur effect.
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // --- Auto-scroll during streaming ---
    // We only auto-scroll if the component is in a loading state, which indicates
    // a streaming response is in progress.
    if (isLoading || isChatLoading) {
      contentElement.scrollTop = contentElement.scrollHeight;
    }

    // --- Dynamic blur effect ---
    const handleScroll = () => {
      // Show the blur effect if the user has scrolled more than 10px down.
      setIsScrolled(contentElement.scrollTop > 10);
    };

    contentElement.addEventListener('scroll', handleScroll);
    
    // Run once on setup to check initial scroll position
    handleScroll();

    // Cleanup: remove the listener when the component/effect re-runs or unmounts.
    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
    };
    // This effect depends on 'feedback' to re-evaluate for auto-scrolling
    // as new chunks arrive. It also depends on loading states.
  }, [feedback, isLoading, isChatLoading]);


  const getLoadingText = () => {
    if (isChatLoading) return "Getting response...";
    if (isLoading) {
      if (loadingAction === 'docs') return "Generating documentation with Gemini...";
      return "Analyzing your code with Gemini...";
    }
    return "";
  }

  return (
    <div className="p-6 min-h-[200px] flex flex-col">
      <div className="relative flex justify-center items-center mb-4">
        <h2 className="text-xl font-semibold text-center">
          <span style={{
              background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
            {isChatMode ? 'Live Response' : 'Analysis'}
          </span>
        </h2>
        {canSave && (
          <button
            onClick={onSaveVersion}
            className="absolute right-0 p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#15fafa]"
            aria-label="Save this output as a version"
            title="Save Version"
          >
            <SaveIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-grow overflow-hidden relative">
        {showLoading && (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <LoadingSpinner size="w-12 h-12" />
            <p className="mt-4 text-[#a0f0f0]">
              {getLoadingText()}
            </p>
          </div>
        )}
        {error && !showLoading && (
          <div className="p-4 bg-red-600/50 border border-red-400 text-red-200 rounded-md">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}
        {!showLoading && !error && feedback && (
          <>
            <div 
              id="review-output-content" 
              ref={contentRef}
              className="overflow-auto h-full max-h-[calc(100vh-320px)] sm:max-h-[60vh] pr-2 text-[#e0ffff] leading-relaxed space-y-4"
            >
              <MarkdownRenderer markdown={feedback} />
            </div>
            <div 
              className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0A0F1A] via-[#0A0F1A]/90 to-transparent pointer-events-none backdrop-blur-[2px] transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
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