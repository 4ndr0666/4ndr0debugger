import React, { useState } from 'react';
import { SupportedLanguage, ChatMessage, Version } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ChatInterface } from './ChatInterface';
import { StopIcon } from './Icons';

interface ComparisonInputProps {
  codeA: string;
  setCodeA: (code: string) => void;
  codeB: string;
  setCodeB: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  goal: string;
  setGoal: (g: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isChatLoading: boolean;
  isActive: boolean;
  onNewReview: () => void;
  isChatMode: boolean;
  onStartFollowUp: (version?: Version) => void;
  reviewAvailable: boolean;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  onStopGenerating: () => void;
}

const CodeEditor: React.FC<{
  title: string;
  code: string;
  setCode: (code: string) => void;
  isLoading: boolean;
  language: SupportedLanguage;
}> = ({ title, code, setCode, isLoading, language }) => {
    const textareaClasses = `
        block w-full p-3 font-mono text-sm text-[var(--hud-color)] bg-black/70
        focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]
        resize-y placeholder:text-[var(--hud-color-darker)] transition-colors duration-300
        border border-[var(--hud-color-darker)]
        ${!code ? 'blinking-placeholder' : ''}
    `.trim().replace(/\s+/g, ' ');

    return (
        <div className="flex flex-col">
            <h3 className="text-lg text-center mb-2">{title}</h3>
            <textarea
                rows={15}
                className={textareaClasses}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                aria-label={`${title} code input area`}
                placeholder="Awaiting data stream..."
                title="Paste code here."
            />
        </div>
    );
};


export const ComparisonInput: React.FC<ComparisonInputProps> = (props) => {
    const {
        codeA, setCodeA, codeB, setCodeB, language, setLanguage, goal, setGoal,
        onSubmit, isLoading, isActive, onNewReview, isChatMode, reviewAvailable,
        onStartFollowUp, onStopGenerating
    } = props;

    const [isCollapsed, setIsCollapsed] = useState(false);
    const activeClass = isActive ? 'active' : '';
    const canSubmit = codeA.trim() && codeB.trim();
    
    const handleSubmit = () => {
        if (canSubmit && !isLoading) {
            setIsCollapsed(true);
            onSubmit();
        }
    };
    
    if (isChatMode) {
        return (
            <div className={`hud-container h-full flex flex-col ${activeClass}`}>
                <div className="hud-corner corner-top-left"></div>
                <div className="hud-corner corner-top-right"></div>
                <div className="hud-corner corner-bottom-left"></div>
                <div className="hud-corner corner-bottom-right"></div>
                <ChatInterface
                    onEndChat={onNewReview}
                    chatHistory={props.chatHistory}
                    onFollowUpSubmit={props.onFollowUpSubmit}
                    isChatLoading={props.isChatLoading}
                />
            </div>
        );
    }
    
    const renderPrimaryAction = () => {
        if (isLoading) {
             return (
                <Button 
                  onClick={onStopGenerating} 
                  variant="danger"
                  className="w-full"
                  aria-label="Stop generating analysis"
                  title="Stop the current analysis."
                >
                  <StopIcon className="w-5 h-5 mr-2" />
                  Stop
                </Button>
             )
        }
        return (
            <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || isLoading}
                className="w-full"
                aria-label={isLoading ? 'Analyzing...' : 'Compare and optimize the codebases'}
            >
                Compare & Optimize
            </Button>
        )
    }

    return (
        <div className={`hud-container h-full flex flex-col overflow-hidden ${activeClass}`}>
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
            <div className="flex-shrink-0 flex justify-between items-center mb-2">
                 <h2 className="text-xl text-center">
                    Comparative Analysis
                 </h2>
                 <button
                    onClick={(e) => { e.preventDefault(); onNewReview(); }}
                    className="p-1 text-[var(--hud-color)] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[var(--hud-color)] rounded-full"
                    aria-label="Back to Single Review"
                    title="Back to Single Review"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                <div 
                    className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
                >
                    <div className="overflow-hidden">
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                <div title="Select the language for an accurate comparison.">
                                    <Select
                                        id="language-select"
                                        label="Language"
                                        options={SUPPORTED_LANGUAGES}
                                        value={language}
                                        onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                                        disabled={isLoading}
                                        aria-label="Select programming language for comparison"
                                    />
                                </div>
                                <div title="Briefly describe the common goal of both codebases (optional).">
                                    <label htmlFor="comparison-goal" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                                        Shared Goal (Optional)
                                    </label>
                                    <input
                                        id="comparison-goal"
                                        type="text"
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        disabled={isLoading}
                                        className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)]"
                                        placeholder="e.g., 'Sort an array'"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <CodeEditor title="Codebase A" code={codeA} setCode={setCodeA} isLoading={isLoading} language={language} />
                                <CodeEditor title="Codebase B" code={codeB} setCode={setCodeB} isLoading={isLoading} language={language} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex-shrink-0 pt-4 space-y-4">
                {renderPrimaryAction()}
                {reviewAvailable && (
                    <div className="w-full flex flex-col items-center space-y-2 border-t border-[var(--hud-color-darker)] pt-4">
                      <Button
                        onClick={() => onStartFollowUp()}
                        disabled={!reviewAvailable || isLoading}
                        variant="primary"
                        className="w-full"
                        aria-label="Ask follow-up questions about the analysis"
                      >
                        Follow-up on Analysis
                      </Button>
                    </div>
                )}
            </div>
        </div>
    );
};