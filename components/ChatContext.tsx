import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CodeBlock } from './CodeBlock';
import { SupportedLanguage } from '../types';
import { LANGUAGE_TAG_MAP } from '../constants';

interface ChatContextProps {
  codeA: string;
  codeB?: string;
  originalFeedback: string;
  language: SupportedLanguage;
  isActive: boolean;
}

export const ChatContext = ({ codeA, codeB, originalFeedback, language, isActive }: ChatContextProps) => {
  
  const activeClass = isActive ? 'active' : '';

  return (
    <div className={`hud-container flex flex-col h-full ${activeClass}`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      <h2 className="text-xl text-center mb-4 flex-shrink-0">
          Chat Context
      </h2>
      <div className="overflow-y-auto pr-2 flex-grow space-y-6">
        <div>
           <h3 className="text-lg text-[var(--hud-color-darker)] mb-2">
            {codeB ? 'Original Inputs' : 'Original Code'}
          </h3>
          {codeB ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-md text-[var(--hud-color-darker)] mb-1">Codebase A</h4>
                <CodeBlock code={codeA} language={LANGUAGE_TAG_MAP[language]} />
              </div>
              <div>
                <h4 className="text-md text-[var(--hud-color-darker)] mb-1">Codebase B</h4>
                <CodeBlock code={codeB} language={LANGUAGE_TAG_MAP[language]} />
              </div>
            </div>
          ) : (
            <CodeBlock code={codeA} language={LANGUAGE_TAG_MAP[language]} />
          )}
        </div>
        <div>
          <h3 className="text-lg text-[var(--hud-color-darker)] mb-2">Initial Analysis</h3>
          <div className="p-3 bg-black/30 border border-[var(--hud-color-darkest)]">
            <MarkdownRenderer markdown={originalFeedback} />
          </div>
        </div>
      </div>
    </div>
  );
};