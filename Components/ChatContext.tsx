import React from 'react';
import { SupportedLanguage } from '../types.ts';
import { AccordionItem } from './AccordionItem.tsx';

interface ChatContextProps {
  codeA: string;
  codeB?: string;
  language: SupportedLanguage;
  onLineClick: (line: string) => void;
}

const ClickableCodeBlock: React.FC<{
  code: string;
  onLineClick: (line: string) => void;
}> = ({ code, onLineClick }) => {
    if (!code) return null;
    const lines = code.split('\n');
    return (
        <div className="p-3 bg-black/30 border border-[var(--hud-color-darkest)] font-mono text-sm">
            <pre className="whitespace-pre-wrap">
                {lines.map((line, i) => (
                    <div 
                      key={i} 
                      onClick={() => line.trim() && onLineClick(line)} 
                      className="cursor-pointer hover:bg-[var(--hud-color)]/20 rounded-sm px-1 -mx-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { line.trim() && onLineClick(line) }}}
                    >
                        {/* Add a non-breaking space to render empty lines correctly */}
                        {line || '\u00A0'}
                    </div>
                ))}
            </pre>
        </div>
    );
};

export const ChatContext = ({ codeA, codeB, onLineClick }: ChatContextProps) => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl text-center mb-4 flex-shrink-0 font-heading">
          Revision History
      </h2>
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
      </div>
    </div>
  );
};