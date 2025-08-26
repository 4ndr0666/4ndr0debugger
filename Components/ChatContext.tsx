import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage, ChatRevision, Feature, ChatContext as ChatContextType, FinalizationSummary } from '../types.ts';
import { AccordionItem } from './AccordionItem.tsx';
import { CopyIcon, CheckIcon, DeleteIcon } from './Icons.tsx';

interface ChatContextProps {
  codeA: string;
  codeB?: string;
  language: SupportedLanguage;
  onLineClick: (line: string) => void;
  revisedCode: string | null;
  chatRevisions: ChatRevision[];
  onClearChatRevisions: () => void;
  onRenameRevision: (id: string, newName: string) => void;
  onDeleteRevision: (id: string) => void;
  appMode: 'debug' | 'single' | 'comparison';
  chatContext: ChatContextType;
  activeFeatureForDiscussion: Feature | null;
  finalizationSummary: FinalizationSummary | null;
}

const getSourceChipColor = (source: Feature['source']) => {
  switch (source) {
    case 'Unique to A':
      return 'border-sky-400 text-sky-400';
    case 'Unique to B':
      return 'border-purple-400 text-purple-400';
    case 'Common':
      return 'border-green-400 text-green-400';
    default:
      return 'border-[var(--hud-color-darker)] text-[var(--hud-color-darker)]';
  }
};

const FeatureDiscussionContext: React.FC<{ feature: Feature }> = ({ feature }) => {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl text-center font-heading flex-shrink-0 mb-4">
                FEATURE CONTEXT
            </h2>
            <div className="overflow-y-auto pr-2 flex-grow flex flex-col gap-3 min-h-0 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                <div className="flex items-center justify-between w-full">
                    <h3 className="font-heading text-base truncate text-[var(--hud-color)]" title={feature.name}>{feature.name}</h3>
                    <span className={`text-xs font-mono border rounded-full px-2 py-0.5 ${getSourceChipColor(feature.source)}`}>
                        {feature.source}
                    </span>
                </div>
                <p className="text-sm text-[var(--hud-color-darker)]">{feature.description}</p>
            </div>
        </div>
    );
};

const FinalizationContext: React.FC<{ summary: FinalizationSummary }> = ({ summary }) => {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl text-center font-heading flex-shrink-0 mb-4">
                FINALIZATION PLAN
            </h2>
            <div className="overflow-y-auto pr-2 flex-grow flex flex-col gap-4 min-h-0 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                {summary.included.length > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="text-green-400 font-bold uppercase text-sm tracking-wider mb-2">Included Features</h3>
                        <ul className="space-y-2 text-xs text-[var(--hud-color-darker)]">
                            {summary.included.map(f => <li key={f.name}><strong className="text-green-300 font-normal">{f.name}</strong>: {f.description}</li>)}
                        </ul>
                    </div>
                )}
                 {summary.revised.length > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="text-sky-400 font-bold uppercase text-sm tracking-wider mb-2">Revised Features</h3>
                        <ul className="space-y-2 text-xs text-[var(--hud-color-darker)]">
                            {summary.revised.map(f => <li key={f.name}><strong className="text-sky-300 font-normal">{f.name}</strong>: Discussion context & revised snippets provided to AI.</li>)}
                        </ul>
                    </div>
                )}
                {summary.removed.length > 0 && (
                     <div className="animate-fade-in">
                        <h3 className="text-red-400 font-bold uppercase text-sm tracking-wider mb-2">Removed Features</h3>
                        <ul className="space-y-2 text-xs text-[var(--hud-color-darker)]">
                            {summary.removed.map(f => <li key={f.name}><strong className="text-red-300 font-normal">{f.name}</strong>: {f.description}</li>)}
                        </ul>
                    </div>
                )}
                 {summary.included.length === 0 && summary.removed.length === 0 && summary.revised.length === 0 && (
                    <p className="text-center text-xs text-[var(--hud-color-darker)]">No specific features were marked for inclusion or removal. The AI will perform a general merge.</p>
                 )}
            </div>
        </div>
    );
};

const ClickableCodeBlock: React.FC<{
  code: string;
  onLineClick: (line: string) => void;
}> = ({ code, onLineClick }) => {
    const [isCopied, setIsCopied] = useState(false);
    if (!code) return null;
    const lines = code.split('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
        });
    };

    return (
        <div className="relative group p-3 bg-black/30 border border-[var(--hud-color-darkest)] font-mono text-sm">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 text-[var(--hud-color)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:bg-[var(--hud-color)] hover:text-black focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label={isCopied ? "Copied" : "Copy code"}
                title={isCopied ? "Copied" : "Copy code"}
            >
                {isCopied ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
            </button>
            <pre className="whitespace-pre-wrap">
                {lines.map((line, i) => (
                    <div 
                      key={i} 
                      onClick={() => line.trim() && onLineClick(line)} 
                      className="cursor-pointer hover:bg-[var(--hud-color)]/20 rounded-sm px-1 -mx-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { line.trim() && onLineClick(line) }}}
                      title={line.trim() ? "Click to ask AI about this line" : undefined}
                    >
                        {/* Add a non-breaking space to render empty lines correctly */}
                        {line || '\u00A0'}
                    </div>
                ))}
            </pre>
        </div>
    );
};

const EditableTitle: React.FC<{ initialTitle: string; onSave: (newTitle: string) => void }> = ({ initialTitle, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const handleSave = () => {
        if (title.trim()) {
            onSave(title.trim());
        } else {
            setTitle(initialTitle); // Revert if empty
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setTitle(initialTitle);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-base font-heading text-[var(--hud-color)] w-full outline-none border-b border-b-[var(--hud-color-darker)]"
            />
        );
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className="font-heading text-base cursor-pointer"
            title="Click to rename"
        >
            {title}
        </span>
    );
};

export const ChatContext = ({ 
    codeA, codeB, onLineClick, revisedCode, chatRevisions, onClearChatRevisions, 
    onRenameRevision, onDeleteRevision, appMode, chatContext, activeFeatureForDiscussion, finalizationSummary
}: ChatContextProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
      return <FeatureDiscussionContext feature={activeFeatureForDiscussion} />;
  }

  if (chatContext === 'finalizing' && finalizationSummary) {
      return <FinalizationContext summary={finalizationSummary} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl text-center font-heading">
            Revision History
        </h2>
        {chatRevisions.length > 0 && (
          <button 
              onClick={onClearChatRevisions}
              className="text-xs uppercase text-[var(--hud-color-darker)] hover:text-[var(--hud-color)] transition-colors animate-fade-in font-mono pr-2"
              title="Clear chat revision history"
          >
              Clear History
          </button>
        )}
      </div>
      <div ref={scrollContainerRef} className="overflow-y-auto pr-2 flex-grow flex flex-col gap-3 min-h-0">
        <AccordionItem title={codeB ? 'Original Inputs' : 'Original Code'} defaultOpen={false}>
            {codeB ? (
                <div className="space-y-4">
                <div>
                    <h4 className="text-md text-[var(--hud-color-darker)] mb-1">Codebase A</h4>
                    <ClickableCodeBlock code={codeA} onLineClick={onLineClick} />
                </div>
                <div>
                    <h4 className="text-md text-[var(--hud-color-darker)] mb-1">Codebase B</h4>
                    <ClickableCodeBlock code={codeB} onLineClick={onLineClick} />
                </div>
                </div>
            ) : (
                <ClickableCodeBlock code={codeA} onLineClick={onLineClick} />
            )}
        </AccordionItem>
        {revisedCode && (
            <AccordionItem title="Initial Revision" defaultOpen={false}>
                <ClickableCodeBlock code={revisedCode} onLineClick={onLineClick} />
            </AccordionItem>
        )}
        {chatRevisions.map((revision, index) => (
            <AccordionItem 
                key={revision.id} 
                title={
                    <div className="flex items-center justify-between w-full gap-2">
                        <EditableTitle initialTitle={revision.name} onSave={(newName) => onRenameRevision(revision.id, newName)} />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteRevision(revision.id); }}
                            className="p-1 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)] flex-shrink-0"
                            title="Delete this revision"
                            aria-label={`Delete revision ${revision.name}`}
                        >
                            <DeleteIcon className="w-4 h-4" />
                        </button>
                    </div>
                } 
                defaultOpen={index === chatRevisions.length - 1}
            >
                <ClickableCodeBlock code={revision.code} onLineClick={onLineClick} />
            </AccordionItem>
        ))}
      </div>
    </div>
  );
};