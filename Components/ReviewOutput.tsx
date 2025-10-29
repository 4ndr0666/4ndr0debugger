import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useConfigContext, useInputContext } from '../AppContext.tsx';
import { useOutputContext, useLoadingStateContext, useSessionActionsContext } from '../contexts/SessionContext.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { AppMode, ReviewProfile } from '../types.ts';
import { SaveIcon, CopyIcon, CheckIcon, CompareIcon, ChatIcon, CommitIcon, BugIcon, BoltIcon, ImportIcon, RootCauseIcon } from './Icons.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { Button } from './Button.tsx';
import { FeatureMatrix } from './FeatureMatrix.tsx';
import { Tooltip } from './Tooltip.tsx';

interface ReviewOutputProps {
  onSaveVersion: () => void;
  onShowDiff: () => void;
  isActive: boolean;
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
    onSaveVersion, isActive, onShowDiff
}: ReviewOutputProps) => {
  const { appMode } = useConfigContext();
  const { 
      reviewFeedback: feedback, error, featureMatrix, outputType, 
      reviewAvailable, commitMessageAvailable
  } = useOutputContext();
  const { isLoading, isChatLoading, loadingAction } = useLoadingStateContext();
  const { 
      handleStartFollowUp, handleGenerateCommitMessage, setFeatureDecisions, 
      allFeaturesDecided, handleFinalizeComparison, handleDownloadOutput, 
      onSaveGeneratedFile, handleAnalyzeRootCause, featureDecisions
  } = useSessionActionsContext();

  const [copied, setCopied] = useState(false);
  const showLoading = isLoading || isChatLoading;
  const canCopy = !showLoading && !error && feedback;

  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleCopy = () => {
    if (!feedback) return;
    navigator.clipboard.writeText(feedback).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy markdown: ', err);
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
        case 'root-cause': return 'Root Cause Analysis';
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
  const showLoadingPlaceholder = isLoading && !feedback;
  const loadingPulseClass = isLoading && feedback ? 'is-loading-streaming' : '';

  return (
    <div className={`hud-container flex flex-col h-full min-h-0 ${activeClass} ${loadingPulseClass} animate-fade-in ${showLoadingPlaceholder ? 'border-transparent bg-transparent shadow-none' : ''}`}>
      {!showLoadingPlaceholder && (
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
            <Tooltip text={copied ? "Copied!" : "Copy Full Output"}>
                <button
                onClick={handleCopy}
                className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label={copied ? "Copied!" : "Copy Full Output"}
                >
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-hidden relative">
        {showLoadingPlaceholder ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AnalysisLoader />
          </div>
        ) : error ? (
          <div className="p-4 bg-[var(--red-color)]/20 border border-[var(--red-color)] text-[var(--red-color)]">
            <p className="font-semibold uppercase">Error:</p>
            <p className="whitespace-pre-wrap font-mono mt-2">{error}</p>
          </div>
        ) : (
            <div 
            id="review-output-content" 
            ref={contentRef}
            className="overflow-auto h-full pr-2 text-[var(--hud-color-darker)] leading-relaxed"
            >
            {outputType === 'revise' && featureMatrix ? (
              <FeatureMatrix features={featureMatrix} decisions={featureDecisions} onDecision={(feature, decision) => setFeatureDecisions(prev => ({ ...prev, [feature.name]: { decision } }))} />
            ) : (
              feedback && <div className="space-y-4"><MarkdownRenderer markdown={feedback} onSaveGeneratedFile={onSaveGeneratedFile} />{isLoading && <span className="animate-blink inline-block">_</span>}</div>
            )}
            </div>
        )}
      </div>

      {!isLoading && !error && reviewAvailable && (
        <div className="flex-shrink-0 pt-4 mt-4 border-t border-[var(--hud-color-darker)] flex flex-wrap justify-center items-center gap-3 animate-fade-in">
            {outputType === 'revise' ? (
              <>
                {allFeaturesDecided ? (
                    <Tooltip text="Instruct the AI to generate a final, unified codebase based on your decisions.">
                        <Button onClick={handleFinalizeComparison} variant="primary" className="post-review-button w-full">
                            <BoltIcon className="w-4 h-4 mr-2" />
                            Finalize Revision
                        </Button>
                    </Tooltip>
                ) : (
                  <p className="text-xs text-center text-[var(--hud-color-darker)] animate-fade-in">
                      Make a decision for each feature to proceed.
                  </p>
                )}
              </>
            ) : (
              <>
                {outputType === 'docs' && (
                  <Tooltip text="Download the generated documentation as a Markdown file.">
                    <Button onClick={handleDownloadOutput} variant="primary" className="post-review-button">
                        <ImportIcon className="w-4 h-4 mr-2" />
                        Download .md
                    </Button>
                  </Tooltip>
                )}
                {appMode === 'debug' && reviewAvailable && (
                  <Tooltip text="Ask the AI to analyze the underlying architectural or logical flaw that caused the bug.">
                    <Button onClick={handleAnalyzeRootCause} variant="primary" className="post-review-button">
                        <RootCauseIcon className="w-4 h-4 mr-2"/>
                        Analyze Root Cause
                    </Button>
                  </Tooltip>
                )}
                {appMode === 'single' ? (
                  <Tooltip text="Move the code and analysis to the Debugger for further iteration.">
                    <Button onClick={() => handleStartFollowUp()} disabled={!reviewAvailable} variant="primary" className="post-review-button">
                        <BugIcon className="w-4 h-4 mr-2"/>
                        Debugger
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip text="Show a side-by-side comparison of the original and revised code.">
                    <Button onClick={onShowDiff} disabled={!commitMessageAvailable} variant="primary" className="post-review-button">
                        <CompareIcon className="w-4 h-4 mr-2"/>
                        Show Diff
                    </Button>
                  </Tooltip>
                )}
                <Tooltip text="Generate a conventional commit message based on the code changes.">
                    <Button onClick={handleGenerateCommitMessage} disabled={!commitMessageAvailable} variant="primary" className="post-review-button">
                        <CommitIcon className="w-4 h-4 mr-2" />
                        Generate Commit
                    </Button>
                </Tooltip>
                <Tooltip text="Start an interactive chat session to ask questions or request modifications.">
                    <Button onClick={() => handleStartFollowUp()} variant="primary" className="post-review-button">
                        <ChatIcon className="w-4 h-4 mr-2" />
                        {followUpButtonText}
                    </Button>
                </Tooltip>
                <Tooltip text="Save this entire review session as a named version to load later.">
                    <Button onClick={onSaveVersion} variant="primary" className="post-review-button">
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save Version
                    </Button>
                </Tooltip>
              </>
            )}
        </div>
      )}
    </div>
  );
};
