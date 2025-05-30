
import React, { useState, useEffect, useMemo } from 'react';
import { SupportedLanguage } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES, generateReviewerTemplate, PLACEHOLDER_MARKER } from '../constants';

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  onSubmit: (fullCode: string) => void;
  isLoading: boolean;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  userCode,
  setUserCode,
  language,
  setLanguage,
  onSubmit,
  isLoading,
}) => {
  const [selection, setSelection] = useState<{start: number, end: number} | null>(null);

  const { currentFullTemplate, templatePrefix, templateSuffix } = useMemo(() => {
    const template = generateReviewerTemplate(language);
    const parts = template.split(PLACEHOLDER_MARKER);
    const prefix = parts[0];
    // If PLACEHOLDER_MARKER is not found, suffix will be empty or template itself if split yields one part.
    // This assumes PLACEHOLDER_MARKER is always present in the generated template.
    const suffix = parts.length > 1 ? parts.slice(1).join(PLACEHOLDER_MARKER) : ""; 
    return { currentFullTemplate: template, templatePrefix: prefix, templateSuffix: suffix };
  }, [language]);


  useEffect(() => {
    // When template changes due to language switch, reset userCode if it's not empty
    // to avoid carrying over code from one language template to another.
    // However, if the user is just typing, we don't want to reset.
    // This might need more nuanced handling if user switches language with code already entered.
    // For now, let's assume if language changes, we might want to clear user code.
    // A better UX might be to confirm with the user or try to adapt.
    // For simplicity, we'll let the user manage this.
    // The main concern is that templatePrefix/Suffix change, which affects cursor logic.
  }, [language, templatePrefix, templateSuffix]);


  useEffect(() => {
    if (selection) {
      const textarea = document.getElementById('code-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.setSelectionRange(selection.start, selection.end);
      }
    }
  }, [selection, userCode, templatePrefix, templateSuffix]); // Re-apply selection if userCode or template changes

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentTextareaValue = e.target.value;
    const currentSelectionStart = e.target.selectionStart;

    if (currentTextareaValue.startsWith(templatePrefix) && currentTextareaValue.endsWith(templateSuffix)) {
      const extractedUserCode = currentTextareaValue.substring(
        templatePrefix.length,
        currentTextareaValue.length - templateSuffix.length
      );

      if (extractedUserCode === PLACEHOLDER_MARKER && userCode === '') {
         // User might have clicked into placeholder or deleted everything back to it.
         // Only update if userCode was not already empty to avoid unnecessary re-renders.
        if (userCode !== '') setUserCode('');
      } else if (extractedUserCode !== userCode) {
         setUserCode(extractedUserCode === PLACEHOLDER_MARKER ? '' : extractedUserCode);
      }
      
      const newCursorPos = Math.min(
        Math.max(currentSelectionStart, templatePrefix.length), 
        templatePrefix.length + (extractedUserCode === PLACEHOLDER_MARKER ? PLACEHOLDER_MARKER.length : extractedUserCode.length)
      );
       setSelection({ start: newCursorPos, end: newCursorPos });

    } else {
      // User tried to edit the template prefix or suffix. Revert.
      const prevUserCodeDisplay = userCode || PLACEHOLDER_MARKER;
      // Attempt to restore cursor to a logical position within the previous user code part.
      const prevCursorStartInUserCode = (selection?.start || templatePrefix.length) - templatePrefix.length;
      const safePrevCursorStartInUserCode = Math.min(Math.max(0, prevCursorStartInUserCode), prevUserCodeDisplay.length);
      const newCursorPos = templatePrefix.length + safePrevCursorStartInUserCode;
      setSelection({ start: newCursorPos, end: newCursorPos });
      // Force re-render by updating a state or simply let the controlled component snap back.
      // The value prop will enforce the correct display with current userCode and dynamic template parts.
    }
  };

  const handleSubmit = () => {
    if (userCode.trim()) {
      onSubmit(templatePrefix + userCode + templateSuffix);
    }
  };
  
  const displayedValue = templatePrefix + (userCode || PLACEHOLDER_MARKER) + templateSuffix;

  return (
    <div className="p-6 bg-[#101827] rounded-lg shadow-xl shadow-[#156464]/30 space-y-4 border border-[#15adad]/60">
      <h2 className="text-xl font-semibold text-center">
        <span style={{
          background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          Paste Code Here
        </span>
      </h2>
      
      <Select
        id="language-select"
        label="Select Language"
        options={SUPPORTED_LANGUAGES}
        value={language}
        onChange={(e) => {
          // Optionally clear userCode when language changes to avoid confusion
          // setUserCode(''); 
          setLanguage(e.target.value as SupportedLanguage);
        }}
        disabled={isLoading}
        aria-label="Select programming language"
      />

      <div>
        <label htmlFor="code-input" className="block text-sm font-medium text-[#a0f0f0] mb-1">
          Paste between the code fences:
        </label>
        <textarea
          id="code-input"
          rows={15}
          className="block w-full p-3 font-mono text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:ring-2 focus:ring-[#15fafa] focus:border-[#15fafa] resize-y placeholder-[#60c0c0]"
          value={displayedValue}
          onChange={handleChange}
          onSelect={(e: React.SyntheticEvent<HTMLTextAreaElement>) => {
            const target = e.target as HTMLTextAreaElement;
            setSelection({ start: target.selectionStart, end: target.selectionEnd });
          }}
          onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => {
            const target = e.target as HTMLTextAreaElement;
            const clickPos = target.selectionStart;
            const userCodeLength = (userCode || PLACEHOLDER_MARKER).length;
            
            const editableAreaStart = templatePrefix.length;
            const editableAreaEnd = templatePrefix.length + userCodeLength;

            if (clickPos < editableAreaStart) {
              target.setSelectionRange(editableAreaStart, editableAreaStart);
            } else if (clickPos > editableAreaEnd) {
              target.setSelectionRange(editableAreaEnd, editableAreaEnd);
            }
            // Update selection state after potentially moving the cursor
            setSelection({start: target.selectionStart, end: target.selectionEnd});
          }}
          disabled={isLoading}
          aria-label="Code input area"
        />
      </div>
      
      <Button 
        onClick={handleSubmit} 
        isLoading={isLoading}
        disabled={!userCode.trim() || isLoading}
        className="w-full"
        aria-label={isLoading ? 'Reviewing code' : 'Submit code for review'}
      >
        {isLoading ? 'Reviewing...' : 'Review Code'}
      </Button>
    </div>
  );
};
