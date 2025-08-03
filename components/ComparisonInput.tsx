
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
        block w-full p-3 font-mono text-sm text-[#e0ffff] bg-transparent rounded-md shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff] 
        resize-y placeholder:text-[#60c0c0] placeholder:font-sans transition-colors duration-300
        ${code ? 'border border-[#15adad]/70' : 'border border-transparent'}
        ${!code ? 'blinking-placeholder' : ''}
    `.trim().replace(/\s+/g, ' ');

    return (
        <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-center mb-2 text-[#e0ffff] font-heading">{title}</h3>
            <textarea
                rows={15}
                className={textareaClasses}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                aria-label={`${title} code input area`}
                placeholder="❯ "
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

    if (isLoading && !isChatMode) {
        setIsCollapsed(true);
    }
    
    if (isChatMode) {
        return (
            <div className={`bg-[#101827]/60 backdrop-blur-lg rounded-lg shadow-xl shadow-[#156464]/30 h-full flex flex-col transition-all duration-300 animated-border-container ${activeClass}`}>
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
                  Stop Generating
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
        <div className={`p-6 bg-[#101827]/60 backdrop-blur-lg rounded-lg shadow-xl shadow-[#156464]/30 h-full flex flex-col overflow-hidden transition-all duration-300 animated-border-container ${activeClass}`}>
            <div className="flex-shrink-0 flex justify-between items-center mb-2">
                 <h2 className="text-xl font-semibold text-center font-heading">
                    <span style={{
                        background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}>
                        Comparative Analysis
                    </span>
                 </h2>
                 <button
                    onClick={(e) => { e.preventDefault(); onNewReview(); }}
                    className="p-1 text-[#15FFFF] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101827] focus:ring-[#15fafa] rounded-full"
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
                                        label="Select Language"
                                        options={SUPPORTED_LANGUAGES}
                                        value={language}
                                        onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                                        disabled={isLoading}
                                        aria-label="Select programming language for comparison"
                                    />
                                </div>
                                <div title="Briefly describe the common goal of both codebases (optional).">
                                    <label htmlFor="comparison-goal" className="block text-sm font-medium text-[#a0f0f0] mb-1">
                                        Shared Goal (Optional)
                                    </label>
                                    <input
                                        id="comparison-goal"
                                        type="text"
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        disabled={isLoading}
                                        className="block w-full p-2.5 font-sans text-sm text-[#e0ffff] bg-[#101827] border border-[#15adad]/60 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff]"
                                        placeholder="e.g., 'Sort an array of numbers'"
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
                    <div className="w-full flex flex-col items-center space-y-2 border-t border-[#15adad]/30 pt-4">
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