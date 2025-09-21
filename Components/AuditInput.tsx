import React from 'react';
import { SupportedLanguage } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES } from '../constants.ts';
import { StopIcon } from './Icons.tsx';

interface AuditInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStopGenerating: () => void;
  isActive: boolean;
}

export const AuditInput: React.FC<AuditInputProps> = ({
  userCode, setUserCode, language, setLanguage, 
  onSubmit, isLoading, onStopGenerating, isActive,
}) => {
  const activeClass = isActive ? 'active' : '';
  const canSubmit = userCode.trim() !== '';

  const textareaClasses = `
    block w-full h-full p-3 pr-10 font-mono text-sm text-[var(--hud-color)]
    focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)]
    resize-y placeholder:text-transparent bg-black/70 border border-[var(--hud-color-darker)]
    transition-colors duration-300
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`hud-container h-full flex flex-col ${activeClass} animate-fade-in`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      
      <div className="flex items-center justify-center relative flex-shrink-0">
        <h2 className="text-xl text-center">Code Audit</h2>
      </div>
          
      <div className="flex-grow flex flex-col overflow-y-auto pr-2 mt-4 space-y-4">
        
        <div>
            <p className="text-sm text-center text-[var(--hud-color-darker)] mb-4">
                Provide your code for a comprehensive security audit based on industry best practices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <Select
                        id="language-select-audit"
                        label="Language"
                        options={SUPPORTED_LANGUAGES}
                        value={language}
                        onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                        disabled={isLoading}
                    />
                </div>
                <div className="md:col-span-2 relative min-h-[200px]">
                    <textarea
                    id="code-input-audit"
                    className={textareaClasses}
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    disabled={isLoading}
                    aria-label="Code input area for audit"
                    placeholder=" "
                    />
                    {!userCode && !isLoading && (
                    <div className="absolute top-3 left-3 pointer-events-none font-mono text-sm text-[var(--hud-color)]" aria-hidden="true">
                        <span className="blinking-prompt">❯ </span>
                        <span className="text-[var(--hud-color-darker)]">Awaiting input...</span>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 pt-4 mt-auto">
        <div className="min-h-[60px] flex flex-col justify-center">
            {isLoading ? (
              <div className="w-full flex justify-center animate-fade-in">
                  <Button 
                      onClick={onStopGenerating} 
                      variant="danger"
                      className="w-full sm:w-auto flex-grow"
                      aria-label="Stop generating audit"
                      title="Stop the current audit."
                  >
                      <StopIcon className="w-5 h-5 mr-2" />
                      Stop
                  </Button>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                  <Button 
                      onClick={onSubmit}
                      disabled={!canSubmit} 
                      className="w-full sm:w-auto flex-grow"
                      aria-label="Submit code for audit"
                      title="Submit your code for an audit against industry best practices."
                  >
                      Audit Code
                  </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};