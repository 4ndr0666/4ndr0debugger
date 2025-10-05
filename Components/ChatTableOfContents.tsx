import React, { useState } from 'react';
import { SupportedLanguage, ChatRevision, ChatFile } from '../types.ts';
import { AccordionItem } from './AccordionItem.tsx';
import { CopyIcon, CheckIcon, DeleteIcon } from './Icons.tsx';
import { EditableTitle } from './EditableTitle.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface ChatTableOfContentsProps {
  codeA: string;
  codeB?: string;
  language: SupportedLanguage;
  onLineClick: (line: string) => void;
  revisedCode: string | null;
  chatRevisions: ChatRevision[];
  onClearChatRevisions: () => void;
  onRenameRevision: (id: string, newName: string) => void;
  onDeleteRevision: (id: string) => void;
  chatFiles: ChatFile[];
  onClearChatFiles: () => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
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
                        {line || '\u00A0'}
                    </div>
                ))}
            </pre>
        </div>
    );
};

const FileDisplay: React.FC<{ content: string }> = ({ content }) => {
    return (
        <div className="p-3 bg-black/30 border border-[var(--hud-color-darkest)] text-sm max-h-64 overflow-y-auto">
            <MarkdownRenderer markdown={content} />
        </div>
    )
};

export const ChatTableOfContents = ({ 
    codeA, codeB, onLineClick, revisedCode, chatRevisions, onClearChatRevisions, 
    onRenameRevision, onDeleteRevision, chatFiles, onClearChatFiles, onRenameFile, onDeleteFile 
}: ChatTableOfContentsProps) => {

  const handleClearRevisions = () => {
    if (window.confirm('Are you sure you want to clear all code revisions from this chat? This cannot be undone.')) {
      onClearChatRevisions();
    }
  };

  const handleClearFiles = () => {
    if (window.confirm('Are you sure you want to clear all generated files from this chat? This cannot be undone.')) {
        onClearChatFiles();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto pr-2 flex-grow flex flex-col gap-3 min-h-0">
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
        
        {chatRevisions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-t-[var(--hud-color-darkest)] space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-heading">Code Revisions</h3>
                    <button onClick={handleClearRevisions} className="text-xs uppercase text-[var(--hud-color-darker)] hover:text-[var(--hud-color)] transition-colors font-mono" title="Clear all code revisions">
                        Clear All
                    </button>
                </div>
                {chatRevisions.map((revision, index) => (
                    <AccordionItem 
                        key={revision.id} 
                        title={
                            <div className="flex items-center justify-between w-full gap-2">
                                <EditableTitle 
                                    initialTitle={revision.name} 
                                    onSave={(newName) => onRenameRevision(revision.id, newName)} 
                                    className="font-heading text-base cursor-pointer"
                                    inputClassName="bg-transparent text-base font-heading text-[var(--hud-color)] w-full outline-none border-b border-b-[var(--hud-color-darker)]"
                                />
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
        )}
        
        {chatFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-t-[var(--hud-color-darkest)] space-y-2">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-heading">Generated Files</h3>
                    <button onClick={handleClearFiles} className="text-xs uppercase text-[var(--hud-color-darker)] hover:text-[var(--hud-color)] transition-colors font-mono" title="Clear all generated files">
                        Clear All
                    </button>
                </div>
                {chatFiles.map((file, index) => (
                    <AccordionItem 
                        key={file.id} 
                        title={
                            <div className="flex items-center justify-between w-full gap-2">
                                <EditableTitle 
                                    initialTitle={file.name} 
                                    onSave={(newName) => onRenameFile(file.id, newName)} 
                                    className="font-heading text-base cursor-pointer"
                                    inputClassName="bg-transparent text-base font-heading text-[var(--hud-color)] w-full outline-none border-b border-b-[var(--hud-color-darker)]"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                                    className="p-1 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)] flex-shrink-0"
                                    title="Delete this file"
                                    aria-label={`Delete file ${file.name}`}
                                >
                                    <DeleteIcon className="w-4 h-4" />
                                </button>
                            </div>
                        } 
                        defaultOpen={index === chatFiles.length - 1}
                    >
                        <FileDisplay content={file.content} />
                    </AccordionItem>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};