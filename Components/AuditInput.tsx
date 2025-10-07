import React from 'react';
import { useAppContext } from '../AppContext.tsx';
import { useSessionContext } from '../contexts/SessionContext.tsx';
import { SupportedLanguage } from '../types.ts';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { SUPPORTED_LANGUAGES } from '../constants.ts';
import { StopIcon } from './Icons.tsx';
import { ContextFilesSelector } from './ContextFilesSelector.tsx';

interface AuditInputProps {
  isActive: boolean;
}

export const AuditInput: React.FC<AuditInputProps> = ({ isActive }) => {
  const { 
    isLoading, handleAuditSubmit, handleStopGenerating, 
    contextFileIds, handleContextFileSelectionChange 
  } = useSessionContext();
  const { userOnlyCode, setUserOnlyCode, language, setLanguage } = useAppContext();
  
  const activeClass = isActive ? 'active' : '';
  const canSubmit = userOnlyCode.trim() !== '';

  const textareaClasses = `
    block w-full h-full p-3 pr-10 font-mono text-sm text-[var(--hud-color)]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)]
    resize-y placeholder:text-transparent bg-black/70 border border-[var(--hud-color-darker)]
    transition-all duration-150
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
            <Select
                id="language-select-audit"
                label="Language"
                options={SUPPORTED_LANGUAGES}
                value={language}
                onChange={(newLang) => setLanguage(newLang as SupportedLanguage)}
                disabled={isLoading}
            />
            
            <ContextFilesSelector 
                selectedFileIds={contextFileIds}
                onSelectionChange={handleContextFileSelectionChange}
            />

            <div className="relative flex-grow min-h-[250px] mt-4">
                <textarea
                id="code-input-audit"
                className={textareaClasses}
                value={userOnlyCode}
                onChange={(e) => setUserOnlyCode(e.target.value)}
                disabled={isLoading}
                aria-label="Code input area for audit"
                placeholder=" "
                />
                {!userOnlyCode && !isLoading && (
                <div className="absolute top-3 left-3 pointer-events-none font-mono text-sm text-[var(--hud-color)]" aria-hidden="true">
                    <span className="blinking-prompt">❯ </span>
                    <span className="text-[var(--hud-color-darker)]">Awaiting input...</span>
                </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 pt-4 mt-auto">
        <div className="min-h-[60px] flex flex-col justify-center">
            {isLoading ? (
              <div className="w-full flex justify-center animate-fade-in">
                  <Button 
                      onClick={handleStopGenerating} 
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
                      onClick={handleAuditSubmit}
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