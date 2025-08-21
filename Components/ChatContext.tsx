

import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage, ChatRevision } from '../types.ts';
import { AccordionItem } from './AccordionItem.tsx';
import { CopyIcon, CheckIcon } from './Icons.tsx';

interface ChatContextProps {
  codeA: string;
  codeB?: string;
  language: SupportedLanguage;
  onLineClick: (line: string) => void;
  initialRevisedCode: string | null;
  chatRevisions: ChatRevision[];
  onClearChatRevisions: () => void;
  onRenameRevision: (id: string, newName: string) => void;
  appMode: 'debug' | 'single' | 'comparison';
}

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

export const ChatContext = ({ codeA, codeB, onLineClick, initialRevisedCode, chatRevisions, onClearChatRevisions, onRenameRevision, appMode }: ChatContextProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check for overflow. The dependency array ensures this runs when revisions change.
    const checkOverflow = () => {
        const hasOverflow = container.scrollHeight > container.clientHeight;
        setIsOverflowing(hasOverflow);
    };

    // Use ResizeObserver to handle window resizing or other dynamic layout changes
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(container);
    
    // Initial check and check after revisions update
    checkOverflow();

    // Cleanup observer on component unmount or when container changes
    return () => resizeObserver.disconnect();
  }, [chatRevisions]); // Dependency on chatRevisions is key

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl text-center font-heading">
            Revision History
        </h2>
        {isOverflowing && appMode === 'debug' && (
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
        {initialRevisedCode && (
            <AccordionItem title="v1.0" defaultOpen={false}>
                <ClickableCodeBlock code={initialRevisedCode} onLineClick={onLineClick} />
            </AccordionItem>
        )}
        {chatRevisions.map((revision, index) => (
            <AccordionItem 
                key={revision.id} 
                title={<EditableTitle initialTitle={revision.name} onSave={(newName) => onRenameRevision(revision.id, newName)} />} 
                defaultOpen={index === chatRevisions.length - 1}
            >
                <ClickableCodeBlock code={revision.code} onLineClick={onLineClick} />
            </AccordionItem>
        ))}
      </div>
    </div>
  );
};