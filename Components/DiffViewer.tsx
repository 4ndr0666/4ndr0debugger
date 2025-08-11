import React, { useMemo } from 'react';
import { SupportedLanguage } from '../types.ts';
import { LANGUAGE_TAG_MAP } from '../constants.ts';

declare const hljs: any;

// Basic line-by-line diffing algorithm (LCS based)
const diffLines = (oldStr: string, newStr: string) => {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const oldLen = oldLines.length;
  const newLen = newLines.length;

  const dp = Array(oldLen + 1).fill(0).map(() => Array(newLen + 1).fill(0));

  for (let i = 1; i <= oldLen; i++) {
    for (let j = 1; j <= newLen; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = oldLen;
  let j = newLen;
  const result = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'common', line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', line: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', line: oldLines[i - 1] });
      i--;
    } else {
        break; // Should not happen
    }
  }

  const oldDiff: { type: string; content: string }[] = [];
  const newDiff: { type: string; content: string }[] = [];

  result.forEach(item => {
    if (item.type === 'common') {
      oldDiff.push({ type: 'common', content: item.line });
      newDiff.push({ type: 'common', content: item.line });
    } else if (item.type === 'removed') {
      oldDiff.push({ type: 'removed', content: item.line });
    } else if (item.type === 'added') {
      newDiff.push({ type: 'added', content: item.line });
    }
  });

  // Pad the shorter diff array with empty lines to make them equal length
  while (oldDiff.length < newDiff.length) {
      oldDiff.push({ type: 'empty', content: '' });
  }
  while (newDiff.length < oldDiff.length) {
      newDiff.push({ type: 'empty', content: '' });
  }

  return { oldDiff, newDiff };
};


interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  onClose: () => void;
  language: SupportedLanguage;
}

const HighlightedLine: React.FC<{ line: string; language: SupportedLanguage }> = ({ line, language }) => {
    const highlighted = useMemo(() => {
        const langTag = LANGUAGE_TAG_MAP[language] || 'plaintext';
        try {
            if (hljs.getLanguage(langTag)) {
                return hljs.highlight(line, { language: langTag, ignoreIllegals: true }).value;
            }
        } catch(e) { console.error(e); }
        // Fallback for safety
        return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }, [line, language]);
    
    return <code className={`language-${LANGUAGE_TAG_MAP[language] || 'plaintext'}`} dangerouslySetInnerHTML={{ __html: highlighted }} />;
};


export const DiffViewer = ({ oldCode, newCode, onClose, language }: DiffViewerProps) => {
  const { oldDiff, newDiff } = React.useMemo(() => diffLines(oldCode, newCode), [oldCode, newCode]);
  
  const renderLines = (diffs: { type: string; content: string }[]) => {
    let lineCounter = 0;
    return diffs.map((diff, index) => {
        let bgColor = 'bg-transparent';
        if (diff.type === 'removed') bgColor = 'bg-red-900/40';
        if (diff.type === 'added') bgColor = 'bg-green-900/40';
        if (diff.type === 'empty') bgColor = 'bg-gray-800/20';

        const showLineNumber = diff.type !== 'empty';
        if (showLineNumber) lineCounter++;

        return (
            <div key={index} className={`flex ${bgColor}`}>
                <span className="w-10 text-right pr-4 text-[var(--hud-color-darker)] select-none flex-shrink-0">
                  {showLineNumber ? lineCounter : ' '}
                </span>
                <pre className="whitespace-pre-wrap flex-grow break-all">
                  <HighlightedLine line={diff.content || ' '} language={language} />
                </pre>
            </div>
        );
    });
  };

  const renderedOld = useMemo(() => renderLines(oldDiff), [oldDiff, language]);
  const renderedNew = useMemo(() => renderLines(newDiff), [newDiff, language]);

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
    >
      <div
        className="hud-container w-full max-w-6xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="diff-modal-title" className="text-xl text-center">
            Code Comparison
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
            aria-label="Close diff view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden font-mono text-sm text-[var(--hud-color)] hljs">
          {/* Original Code */}
          <div className="flex flex-col h-full bg-black/50 border border-[var(--hud-color-darkest)]">
             <h3 className="text-center text-lg mb-2 pt-2 flex-shrink-0">Original Code</h3>
             <div className="overflow-auto p-2 h-full">
                {renderedOld}
             </div>
          </div>

          {/* Revised Code */}
          <div className="flex flex-col h-full bg-black/50 border border-[var(--hud-color-darkest)]">
            <h3 className="text-center text-lg mb-2 pt-2 flex-shrink-0">Revised Code</h3>
            <div className="overflow-auto p-2 h-full">
                {renderedNew}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
