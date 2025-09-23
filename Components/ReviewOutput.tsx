

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { LoadingAction, Toast, SupportedLanguage, AppMode, Version, Feature, FeatureDecision, FeatureDecisionRecord } from '../types.ts';
import { SaveIcon, CopyIcon, CheckIcon, CompareIcon, ChatIcon, CommitIcon, BugIcon, BoltIcon, ImportIcon } from './Icons.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { Button } from './Button.tsx';
import { FeatureMatrix } from './FeatureMatrix.tsx';

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
  onStartFollowUp: (version?: Version, modeOverride?: AppMode) => void;
  onGenerateCommitMessage: () => void;
  reviewAvailable: boolean;
  appMode: AppMode;
  featureMatrix: Feature[] | null;
  featureDecisions: Record<string, FeatureDecisionRecord>;
  onFeatureDecision: (feature: Feature, decision: FeatureDecision) => void;
  allFeaturesDecided: boolean;
  onFinalize: () => void;
  onDownloadOutput: () => void;
  onSaveGeneratedFile: (filename: string, content: string) => void;
}

const analysisSteps = [
  'INITIATING ANALYSIS PROTOCOL',
  'PARSING ABSTRACT SYNTAX TREE',
  'CROSS-REFERENCING SECURITY VECTORS',
  'IDENTIFYING LOGIC FLAWS',
  'EVALUATING IDIOMATIC CONVENTIONS',
  'COMPILING FEEDBACK MATRIX',
  'GENERATING REVISION',
  'FINALIZING OUTPUT STREAM',
];

const AnalysisLoader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(analysisSteps[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let stepIndex = 0;
    const intervalId = setInterval(() => {
      setFade(false); // Start fade-out
      setTimeout(() => {
        stepIndex = (stepIndex + 1) % analysisSteps.length;
        setCurrentStep(analysisSteps[stepIndex]);
        setFade(true); // Start fade-in
      }, 400); // Animation duration
    }, 1800); // Time each step is visible

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <LoadingSpinner size="w-12 h-12" />
      <p className={`mt-4 uppercase tracking-[0.2em] text-sm text-[var(--hud-color)] transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {currentStep.endsWith('...') ? currentStep : `${currentStep}...`}
      </p>
    </div>
  );
};


export const ReviewOutput = ({ 
    feedback, revisedCode, language, isLoading, isChatLoading, loadingAction, error, 
    onSaveVersion, isActive, outputType, onShowDiff, canCompare,
    addToast, onStartFollowUp, onGenerateCommitMessage, reviewAvailable,
    appMode, featureMatrix, featureDecisions, onFeatureDecision, allFeaturesDecided, onFinalize,
    onDownloadOutput, onSaveGeneratedFile
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

  const title = useMemo(() => {
    const action = showLoading ? loadingAction : outputType;

    if (appMode === 'debug' && (action === 'review' || action === 'review-selection')) {
        return 'Debugger';
    }
    
    switch (action) {
        case 'review': return 'Code Review';
        case 'docs': return 'Generated Documentation';
        case 'tests': return 'Generated Tests';
        case 'commit': return 'Commit Message Suggestion';
        case 'explain-selection': return 'Code Explanation';
        case 'review-selection': return 'Selection Review';
        case 'comparison': return 'Comparative Analysis';
        case 'revise': return 'Comparative Revision';
        case 'finalization': return 'Finalizing Revision';
        default: return 'Analysis';
    }
  }, [showLoading, loadingAction, outputType, appMode]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement || !isLoading) return;

    const isScrolledToBottom = contentElement.scrollHeight - contentElement.scrollTop <= contentElement.clientHeight + 50;
    if (isScrolledToBottom) {
      contentElement.scrollTop = contentElement.scrollHeight;
    }
  }, [feedback, isLoading]);
  
  useEffect(() => { setCopied(false) }, [feedback]);

  const activeClass = isActive ? 'active' : '';
  const followUpButtonText = appMode === 'debug' ? 'Test Results' : 'Follow-up';
  const showBorder = !isLoading || (isLoading && !!feedback);

  return (
    <div className={`min-h-[200px] flex flex-col h-full ${showBorder ? 'hud-container' : 'p-[1.5rem]'} ${activeClass} ${showBorder ? 'animate-fade-in' : ''}`}>
      {showBorder && (
        <>
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
        </>
      )}
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
          <div className="flex flex-col items-center justify-center h-full">
            <AnalysisLoader />
          </div>
        )}
        {error && !isLoading && (
          <div className="p-4 bg-[var(--red-color)]/20 border border-[var(--red-color)] text-[var(--red-color)]">
            <p className="font-semibold uppercase">Error:</p>
            <p className="whitespace-pre-wrap font-mono mt-2">{error}</p>
          </div>
        )}
        
        {showBorder && (
            <div 
            id="review-output-content" 
            ref={contentRef}
            className="overflow-auto h-full pr-2 text-[var(--hud-color-darker)] leading-relaxed"
            >
            {outputType === 'revise' && featureMatrix ? (
              <FeatureMatrix features={featureMatrix} decisions={featureDecisions} onDecision={onFeatureDecision} />
            ) : (
              feedback && <div className="space-y-4"><MarkdownRenderer markdown={feedback} onSaveGeneratedFile={onSaveGeneratedFile} /></div>
            )}
            {isLoading && feedback && outputType !== 'revise' && <LoadingSpinner size="w-5 h-5" className="mx-auto mt-4" />}
            </div>
        )}
      </div>

      {!isLoading && !error && reviewAvailable && (
        <div className="flex-shrink-0 pt-4 mt-4 border-t border-[var(--hud-color-darker)] flex flex-wrap justify-center items-center gap-3 animate-fade-in">
            {outputType === 'revise' ? (
              <>
                {allFeaturesDecided ? (
                    <Button onClick={onFinalize} variant="primary" className="post-review-button w-full">
                        <BoltIcon className="w-4 h-4 mr-2" />
                        Finalize Revision
                    </Button>
                ) : (
                  <p className="text-xs text-center text-[var(--hud-color-darker)] animate-fade-in">
                      Make a decision for each feature to proceed.
                  </p>
                )}
              </>
            ) : (
              <>
                {outputType === 'docs' && (
                  <Button onClick={onDownloadOutput} variant="primary" className="post-review-button">
                    <ImportIcon className="w-4 h-4 mr-2" />
                    Download .md
                  </Button>
                )}
                {appMode === 'single' ? (
                  <Button onClick={() => onStartFollowUp(undefined, 'debug')} disabled={!reviewAvailable} variant="primary" className="post-review-button">
                      <BugIcon className="w-4 h-4 mr-2"/>
                      Debugger
                  </Button>
                ) : (
                  <Button onClick={onShowDiff} disabled={!canCompare} variant="primary" className="post-review-button">
                      <CompareIcon className="w-4 h-4 mr-2"/>
                      Show Diff
                  </Button>
                )}
                <Button onClick={onGenerateCommitMessage} disabled={!canCompare} variant="primary" className="post-review-button">
                    <CommitIcon className="w-4 h-4 mr-2" />
                    Generate Commit
                </Button>
                <Button onClick={() => onStartFollowUp()} variant="primary" className="post-review-button">
                    <ChatIcon className="w-4 h-4 mr-2" />
                    {followUpButtonText}
                </Button>
                <Button onClick={onSaveVersion} variant="primary" className="post-review-button">
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Save Version
                </Button>
              </>
            )}
        </div>
      )}
    </div>
  );
};
