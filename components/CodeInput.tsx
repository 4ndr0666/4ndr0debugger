
import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { Button } from './Button';
import { Select } from './Select';
import { SUPPORTED_LANGUAGES } from '../constants';

interface CodeInputProps {
  userCode: string; // Renamed from 'code' to clarify it's only user's portion
  setUserCode: (code: string) => void; // Renamed from 'setCode'
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  onSubmit: (fullCode: string) => void; // Now expects the full templated code
  isLoading: boolean;
}

const fullTemplate = `\`\`\`shell

PASTE CODE HERE

\`\`\`

## Summary

Proceed to meticulously revise the code and fully implement all of your recommendations--from variable names to logic flows--with no placeholders or omitted lines directly within your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Work around the existing code flow without leaving anything out. Examine all functions in isolation using step-by-step validation in order to confirm they work before integrating them into your final revision. Last, ensure to reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted. To minimally guide your thought processes, ensure the following can be said about your proposed revision: 

- Well-defined and thoroughly fleshed out. 

- All imports and paths are clearly defined. 

- Accessible. 

- Idempotent. 

- Locally scoped. 

- Declaration and assignment are separate to avoid masking return values.

- \`local\` may only be used inside functions, use \`declare\` or plain assignment outside functions. 

- All parsing issues, extraneous input, unintended newlines and/or unintended separators are absent. 

- No bad splitting. 

- Unambiguous variables and values. 

- Exit status of the relevant command is explicitly checked to ensure consistent behavior. 

- \`&>\` for redirecting both stdout and stderr (use \`>file 2>&1\` instead). 

- Exports are properly recognized. 

- No cyclomatic complexity.

**Additional Considerations**: Confirm whether or not ambiguity exists in your revision, then proceed with the required steps to definitively resolve any remaining ambiguity. This is done by ensuring all actual values are provided over arbitrary variables ensuring no unbound variables. This structured approach ensures that each phase of the project is handled with a focus on meticulous detail, systematic progression, and continuous improvement, ensuring all underlying logic remains intact. Finally, precisely parse the complete, fully-functional, error-free and production ready revision to stdout for testing.`;

const PLACEHOLDER_MARKER = "PASTE CODE HERE";
const templateParts = fullTemplate.split(PLACEHOLDER_MARKER);
const templatePrefix = templateParts[0];
const templateSuffix = templateParts.length > 1 ? templateParts.slice(1).join(PLACEHOLDER_MARKER) : "";


export const CodeInput: React.FC<CodeInputProps> = ({
  userCode,
  setUserCode,
  language,
  setLanguage,
  onSubmit,
  isLoading,
}) => {
  const [selection, setSelection] = useState<{start: number, end: number} | null>(null);

  useEffect(() => {
    if (selection) {
      const textarea = document.getElementById('code-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.setSelectionRange(selection.start, selection.end);
      }
    }
  }, [selection, userCode]); // Re-apply selection if userCode changes, to keep cursor position

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentTextareaValue = e.target.value;
    const currentSelectionStart = e.target.selectionStart;
    // const currentSelectionEnd = e.target.selectionEnd; // Not directly used but good to have if needed

    if (currentTextareaValue.startsWith(templatePrefix) && currentTextareaValue.endsWith(templateSuffix)) {
      const extractedUserCode = currentTextareaValue.substring(
        templatePrefix.length,
        currentTextareaValue.length - templateSuffix.length
      );

      if (extractedUserCode === PLACEHOLDER_MARKER && userCode === '') {
        // This case means placeholder was focused, no actual change to user code
        // Or user deleted everything back to placeholder
        if (userCode !== '') setUserCode(''); // only update if it was not already empty
      } else if (extractedUserCode !== userCode) {
         setUserCode(extractedUserCode === PLACEHOLDER_MARKER ? '' : extractedUserCode);
      }
      
      // Preserve cursor position within the editable area
      const newCursorPos = Math.min(
        Math.max(currentSelectionStart, templatePrefix.length), 
        templatePrefix.length + (extractedUserCode === PLACEHOLDER_MARKER ? PLACEHOLDER_MARKER.length : extractedUserCode.length)
      );
       setSelection({ start: newCursorPos, end: newCursorPos });

    } else {
      // User tried to edit the template prefix or suffix. Revert.
      // Force re-render with current valid userCode to snap back.
      const prevUserCodeDisplay = userCode || PLACEHOLDER_MARKER;
      const prevCursorStartInUserCode = (selection?.start || templatePrefix.length) - templatePrefix.length;
      
      const safePrevCursorStartInUserCode = Math.min(Math.max(0, prevCursorStartInUserCode), prevUserCodeDisplay.length);
      const newCursorPos = templatePrefix.length + safePrevCursorStartInUserCode;
      setSelection({ start: newCursorPos, end: newCursorPos });
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
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
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
          onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => { // Ensure cursor is in editable area on click
            const target = e.target as HTMLTextAreaElement;
            const clickPos = target.selectionStart;
            const userCodeLength = (userCode || PLACEHOLDER_MARKER).length;
            if (clickPos < templatePrefix.length) {
              target.setSelectionRange(templatePrefix.length, templatePrefix.length);
            } else if (clickPos > templatePrefix.length + userCodeLength) {
              target.setSelectionRange(templatePrefix.length + userCodeLength, templatePrefix.length + userCodeLength);
            }
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