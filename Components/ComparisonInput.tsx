import React from 'react';
import { useAppContext } from '../AppContext.tsx';
import { useSessionContext } from '../contexts/SessionContext.tsx';
import { SupportedLanguage } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES } from '../constants.ts';
import { ChatInterface } from './ChatInterface.tsx';
import { StopIcon } from './Icons.tsx';
import { ContextFilesSelector } from './ContextFilesSelector.tsx';

interface ComparisonInputProps {
  isActive: boolean;
  onAttachFileClick: () => void;
  onOpenProjectFilesModal: () => void;
}

const CodeEditor: React.FC<{
  title: string;
  code: string;
  setCode: (code: string) => void;
  isLoading: boolean;
}> = ({ title, code, setCode, isLoading }) => {
    const textareaClasses = `
        block w-full h-full p-3 font-mono text-sm text-[var(--hud-color)] bg-black/70
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)]
        resize-y placeholder:text-transparent transition-all duration-150
        border border-[var(--hud-color-darker)]
    `.trim().replace(/\s+/g, ' ');

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg text-center mb-2">{title}</h3>
            <div className="relative flex-grow">
                <textarea
                    className={textareaClasses}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading}
                    aria-label={`${title} code input area`}
                    placeholder=" "
                    title="Paste code here."
                />
                {!code && !isLoading && (
                    <div className="absolute top-3 left-3 pointer-events-none font-mono text-sm text-[var(--hud-color)]" aria-hidden="true">
                        <span className="blinking-prompt">❯ </span>
                        <span className="text-[var(--hud-color-darker)]">Awaiting input...</span>
                    </div>
                )}
            </div>
        </div>
    );
};


export const ComparisonInput: React.FC<ComparisonInputProps> = ({ isActive, onAttachFileClick, onOpenProjectFilesModal }) => {
    const { 
        isLoading, isChatMode, handleStopGenerating,
        handleCompareAndOptimize, handleCompareAndRevise, 
        contextFileIds, handleContextFileSelectionChange,
    } = useSessionContext();
    
    const { 
      userOnlyCode, setUserOnlyCode, codeB, setCodeB, language, setLanguage, 
      comparisonGoal, setComparisonGoal, appMode
    } = useAppContext();

    const activeClass = isActive ? 'active' : '';
    const canSubmit = userOnlyCode.trim() && codeB.trim();
        
    if (isChatMode) {
        return (
            <div className={`hud-container h-full flex flex-col ${activeClass}`}>
                <div className="hud-corner corner-top-left"></div>
                <div className="hud-corner corner-top-right"></div>
                <div className="hud-corner corner-bottom-left"></div>
                <div className="hud-corner corner-bottom-right"></div>
                <ChatInterface onAttachFileClick={onAttachFileClick} onOpenProjectFilesModal={onOpenProjectFilesModal} />
            </div>
        );
    }
    
    return (
        <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in`}>
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
            
            <div className="flex items-center justify-center relative flex-shrink-0">
                <h2 className="text-xl text-center">Comparative Analysis</h2>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60%]">
                    <CodeEditor title="Codebase A" code={userOnlyCode} setCode={setUserOnlyCode} isLoading={isLoading} />
                    <CodeEditor title="Codebase B" code={codeB} setCode={setCodeB} isLoading={isLoading} />
                </div>
                
                <div className="pt-4">
                    <Select
                        id="language-select-comp"
                        label="Language"
                        options={SUPPORTED_LANGUAGES}
                        value={language}
                        onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                        disabled={isLoading}
                        aria-label="Select programming language for comparison"
                    />
                </div>
                
                <ContextFilesSelector 
                  selectedFileIds={contextFileIds}
                  onSelectionChange={handleContextFileSelectionChange}
                />

                <div>
                    <label htmlFor="comparison-goal" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                        Shared Goal (Optional)
                    </label>
                    <input
                        id="comparison-goal"
                        type="text"
                        value={comparisonGoal}
                        onChange={(e) => setComparisonGoal(e.target.value)}
                        className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] placeholder:text-[var(--hud-color-darker)] transition-all duration-150"
                        placeholder="e.g., 'A function to sort an array of numbers'"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="w-full flex flex-wrap items-center justify-center gap-3">
                     {isLoading ? (
                        <Button 
                          onClick={handleStopGenerating} 
                          variant="danger"
                          className="w-full"
                          aria-label="Stop generating comparison"
                        >
                          <StopIcon className="w-5 h-5 mr-2" />
                          Stop
                        </Button>
                      ) : (
                        <div className="w-full flex gap-3">
                            <Button
                                onClick={handleCompareAndOptimize}
                                disabled={!canSubmit}
                                className="flex-1"
                            >
                                Compare & Optimize
                            </Button>
                            <Button
                                onClick={handleCompareAndRevise}
                                disabled={!canSubmit}
                                className="flex-1"
                                variant="secondary"
                            >
                                Compare & Revise
                            </Button>
                        </div>
                      )}
                </div>
            </div>
        </div>
    );
};