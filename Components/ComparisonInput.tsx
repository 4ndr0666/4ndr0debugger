import React, { useState, useEffect } from 'react';
import { SupportedLanguage, ChatMessage, Version, ChatRevision, LoadingAction, Feature, ChatContext, FinalizationSummary } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES } from '../constants.ts';
import { ChatInterface } from './ChatInterface.tsx';
import { StopIcon } from './Icons.tsx';

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
  onCompareAndRevise: () => void;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  isActive: boolean;
  onNewReview: () => void;
  onFinalizeFeatureDiscussion: () => void;
  onReturnToOutputView: () => void;
  isChatMode: boolean;
  onFollowUpSubmit: (message: string) => void;
  chatHistory: ChatMessage[];
  chatInputValue: string;
  setChatInputValue: (value: string) => void;
  onStopGenerating: () => void;
  onOpenSaveModal: () => void;
  onLoadRevisionIntoEditor: () => void;
  originalReviewedCode: string | null;
  revisedCode: string | null;
  chatRevisions: ChatRevision[];
  appMode: 'single' | 'comparison' | 'debug';
  onCodeLineClick: (line: string) => void;
  onClearChatRevisions: () => void;
  onRenameChatRevision: (id: string, newName: string) => void;
  onDeleteChatRevision: (id: string) => void;
  chatContext: ChatContext;
  activeFeatureForDiscussion: Feature | null;
  finalizationSummary: FinalizationSummary | null;
  // Attachment props
  attachments: { file: File; content: string; mimeType: string }[];
  onAttachFileClick: () => void;
  onRemoveAttachment: (file: File) => void;
  onOpenProjectFilesModal: () => void;
  onSaveGeneratedFile: (filename: string, content: string) => void;
}

const CodeEditor: React.FC<{
  title: string;
  code: string;
  setCode: (code: string) => void;
  isLoading: boolean;
  language: SupportedLanguage;
}> = ({ title, code, setCode, isLoading }) => {
    const textareaClasses = `
        block w-full h-full p-3 font-mono text-sm text-[var(--hud-color)] bg-black/70
        focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]
        resize-y placeholder:text-transparent transition-colors duration-300
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


export const ComparisonInput: React.FC<ComparisonInputProps> = (props) => {
    const {
        codeA, setCodeA, codeB, setCodeB, language, setLanguage, goal, setGoal,
        onSubmit, onCompareAndRevise, isLoading, isActive, onNewReview, isChatMode,
        onStopGenerating, loadingAction, chatContext, activeFeatureForDiscussion, finalizationSummary
    } = props;

    const activeClass = isActive ? 'active' : '';
    const canSubmit = codeA.trim() && codeB.trim();
        
    if (isChatMode) {
        return (
            <div className={`hud-container h-full flex flex-col ${activeClass}`}>
                <div className="hud-corner corner-top-left"></div>
                <div className="hud-corner corner-top-right"></div>
                <div className="hud-corner corner-bottom-left"></div>
                <div className="hud-corner corner-bottom-right"></div>
                <ChatInterface
                    onFinalizeFeatureDiscussion={props.onFinalizeFeatureDiscussion}
                    onReturnToOutputView={props.onReturnToOutputView}
                    chatHistory={props.chatHistory}
                    onFollowUpSubmit={props.onFollowUpSubmit}
                    isChatLoading={props.isChatLoading}
                    chatInputValue={props.chatInputValue}
                    setChatInputValue={props.setChatInputValue}
                    originalReviewedCode={props.originalReviewedCode}
                    revisedCode={props.revisedCode}
                    chatRevisions={props.chatRevisions}
                    appMode={props.appMode}
                    codeB={codeB}
                    language={language}
                    onCodeLineClick={props.onCodeLineClick}
                    onClearChatRevisions={props.onClearChatRevisions}
                    onRenameChatRevision={props.onRenameChatRevision}
                    onDeleteChatRevision={props.onDeleteChatRevision}
                    chatContext={chatContext}
                    activeFeatureForDiscussion={activeFeatureForDiscussion}
                    finalizationSummary={finalizationSummary}
                    onNewReview={onNewReview}
                    onOpenSaveModal={props.onOpenSaveModal}
                    onLoadRevisionIntoEditor={props.onLoadRevisionIntoEditor}
                    attachments={props.attachments}
                    onAttachFileClick={props.onAttachFileClick}
                    onRemoveAttachment={props.onRemoveAttachment}
                    onOpenProjectFilesModal={props.onOpenProjectFilesModal}
                    onSaveGeneratedFile={props.onSaveGeneratedFile}
                />
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
                    <CodeEditor title="Codebase A" code={codeA} setCode={setCodeA} isLoading={isLoading} language={language} />
                    <CodeEditor title="Codebase B" code={codeB} setCode={setCodeB} isLoading={isLoading} language={language} />
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
                
                <div>
                    <label htmlFor="comparison-goal" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                        Shared Goal (Optional)
                    </label>
                    <input
                        id="comparison-goal"
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)] placeholder:text-[var(--hud-color-darker)]"
                        placeholder="e.g., 'A function to sort an array of numbers'"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="w-full flex flex-wrap items-center justify-center gap-3">
                     {isLoading ? (
                        <Button 
                          onClick={onStopGenerating} 
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
                                onClick={onSubmit}
                                disabled={!canSubmit}
                                className="flex-1"
                            >
                                Compare & Optimize
                            </Button>
                            <Button
                                onClick={onCompareAndRevise}
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
