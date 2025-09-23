import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { CopyIcon, CheckIcon, SaveIcon } from './Icons.tsx';

interface GeneratedFileProps {
  filename: string;
  content: string;
  onSave: (filename: string, content: string) => void;
}

export const GeneratedFile = ({ filename, content, onSave }: GeneratedFileProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy file content: ', err);
    });
  };

  const handleSave = () => {
    onSave(filename, content);
  };

  return (
    <div className="border border-[var(--hud-color-darkest)] my-4 bg-black/30 text-left animate-fade-in">
      <div className="flex justify-between items-center p-2 bg-[var(--hud-color-darkest)] border-b border-[var(--hud-color-darkest)]">
        <p className="font-mono text-sm text-[var(--hud-color)]" aria-label={`Generated file: ${filename}`}>{filename}</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-[var(--hud-color)] transition-all duration-200 hover:bg-[var(--hud-color)]/30"
            title={isCopied ? "Copied!" : "Copy content"}
            aria-label={isCopied ? "Copied file content" : "Copy file content"}
          >
            {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={handleSave}
            className="p-1.5 text-[var(--hud-color)] transition-all duration-200 hover:bg-[var(--hud-color)]/30"
            title="Save to Project Files"
            aria-label="Save file to project files"
          >
            <SaveIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-[var(--hud-color-darker)]">
        <code className="whitespace-pre">{content}</code>
      </pre>
    </div>
  );
};
