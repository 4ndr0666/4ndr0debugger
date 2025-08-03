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

export const ChatContext: React.FC<ChatContextProps> = ({ codeA, codeB, originalFeedback, language, isActive }) => {
  
  const activeClass = isActive ? 'active' : '';

  return (
    <div className={`p-6 flex flex-col bg-[#101827]/60 backdrop-blur-lg rounded-lg shadow-xl shadow-[#156464]/30 h-full transition-all duration-300 animated-border-container ${activeClass}`}>
      <h2 className="text-xl font-semibold text-center mb-4 font-heading">
        <span style={{
            background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
          Chat Context
        </span>
      </h2>
      <div className="overflow-y-auto pr-2 flex-grow space-y-6">
        <div>
           <h3 className="text-lg font-semibold text-[#a0f0f0] mb-2 font-heading">
            {codeB ? 'Original Inputs' : 'Original Code'}
          </h3>
          {codeB ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-[#80e0e0] mb-1">Codebase A</h4>
                <CodeBlock code={codeA} language={LANGUAGE_TAG_MAP[language]} />
              </div>
              <div>
                <h4 className="text-md font-semibold text-[#80e0e0] mb-1">Codebase B</h4>
                <CodeBlock code={codeB} language={LANGUAGE_TAG_MAP[language]} />
              </div>
            </div>
          ) : (
            <CodeBlock code={codeA} language={LANGUAGE_TAG_MAP[language]} />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#a0f0f0] mb-2 font-heading">Initial Analysis</h3>
          <div className="p-3 bg-[#070B14] rounded-md border border-[#15adad]/40">
            <MarkdownRenderer markdown={originalFeedback} />
          </div>
        </div>
      </div>
    </div>
  );
};