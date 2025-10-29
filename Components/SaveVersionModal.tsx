import React, { useMemo, useState, useEffect } from 'react';
import { useConfigContext } from '../AppContext.tsx';
import { Button } from './Button.tsx';
import { SparklesIcon } from './Icons.tsx';
import { ReviewProfile, LoadingAction } from '../types.ts';

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  versionName: string;
  setVersionName: (name: string) => void;
  onAutoGenerate: () => void;
  isGeneratingName: boolean;
  outputType: LoadingAction;
  isSavingChat: boolean;
  disabled?: boolean;
}

export const SaveVersionModal = ({ 
    isOpen, onClose, onSave, versionName, setVersionName, onAutoGenerate, isGeneratingName,
    outputType, isSavingChat, disabled = false
}: SaveVersionModalProps) => {
  const { language, reviewProfile } = useConfigContext();
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSuggestionsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const suggestions = useMemo(() => {
    const examples: string[] = [];
    if (isSavingChat) {
      examples.push(`Chat: ${new Date().toLocaleDateString()}`);
      examples.push('Debugging Auth Flow');
      examples.push('Refactoring Session');
    } else if (outputType === 'docs') {
      examples.push(`Docs: ${language} Service`);
      examples.push(`API Documentation for ${language}`);
    } else if (outputType === 'tests') {
      examples.push(`Tests: ${language} Utilities`);
      examples.push(`Unit Tests for Auth Logic`);
    } else if (outputType === 'audit') {
        examples.push(`OSCP Audit: ${language}`);
        examples.push(`Security Audit: ${new Date().toLocaleDateString()}`);
        examples.push(`Code Hardening Review`);
    } else if (outputType === 'finalization' || outputType === 'revise') {
      examples.push('Finalized Revision');
      examples.push('Unified Feature Set');
    } else { // 'review', 'review-selection', etc.
      if (reviewProfile !== 'none' && reviewProfile !== ReviewProfile.CUSTOM) {
        examples.push(`${reviewProfile} Review: ${language}`);
      }
      examples.push(`Initial ${language} Refactor`);
      examples.push(`${language} Logic Cleanup`);
    }
    return examples.slice(0, 3); // Max 3 suggestions
  }, [outputType, language, reviewProfile, isSavingChat]);


  const handleSaveClick = () => {
    if (versionName.trim()) {
      onSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
    >
      <div 
        className="hud-container w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>

        <h2 id="save-modal-title" className="text-xl text-center mb-4">
            Save Version
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="version-name" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-2">
              Version Name
            </label>
            <div className="relative">
              <input
                id="version-name"
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="block w-full p-3 pr-12 font-mono text-base text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] transition-all duration-150"
                placeholder="e.g., Initial Refactor"
                autoFocus
                disabled={isGeneratingName || disabled}
              />
              <Button
                  onClick={onAutoGenerate}
                  isLoading={isGeneratingName}
                  disabled={isGeneratingName || disabled}
                  variant="secondary"
                  className="absolute right-1 top-1/2 -translate-y-1/2 py-2 px-2 h-auto text-xs"
                  title="Auto-generate name"
                  aria-label="Auto-generate version name"
              >
                  {!isGeneratingName && <SparklesIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {suggestionsVisible && suggestions.length > 0 && (
            <div className="pt-2 animate-fade-in">
              <p className="text-xs text-center text-[var(--hud-color-darker)] mb-2 uppercase tracking-wider">Suggestions</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setVersionName(s);
                      setSuggestionsVisible(false);
                    }}
                    className="px-2 py-1 font-mono text-xs border border-[var(--hud-color-darkest)] text-[var(--hud-color-darker)] transition-all duration-150 hover:border-[var(--hud-color)] hover:text-[var(--hud-color)] hover:bg-[var(--hud-color)]/10"
                    disabled={disabled}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={disabled}>
            Cancel
          </Button>
          <Button onClick={handleSaveClick} disabled={!versionName.trim() || isGeneratingName || disabled}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};