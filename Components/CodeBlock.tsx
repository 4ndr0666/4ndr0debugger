import React, { useState, useMemo } from 'react';
import { CopyIcon, CheckIcon, LoadIntoEditorIcon } from './Icons.tsx';
import { LANGUAGE_TAG_MAP } from '../constants.ts';

// Informs TypeScript that `hljs` is available on the global window object
declare const hljs: any;

interface CodeBlockProps {
  code: string;
  language: string;
  onLoadCodeIntoWorkbench?: (code: string) => void;
}

// A more robust HTML escaper to ensure the fallback is safe.
const escapeHtml = (unsafe: string): string => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// Helper to normalize language strings to valid highlight.js tags
const normalizeLanguage = (lang: string): string => {
    if (!lang) return 'plaintext';
    const lowerLang = lang.toLowerCase().trim();
    
    // Check if it's a direct match or an alias in hljs
    if (hljs.getLanguage(lowerLang)) return lowerLang;

    // Check our internal map (Values -> Keys -> Tag)
    // This handles cases where 'JavaScript' (Enum Value) is passed instead of 'javascript' (Tag)
    const entry = Object.entries(LANGUAGE_TAG_MAP).find(([key, tag]) => {
        return key.toLowerCase() === lowerLang || tag === lowerLang;
    });

    if (entry) return entry[1];

    // Common manual overrides if not in map
    if (lowerLang === 'c++') return 'cpp';
    if (lowerLang === 'c#') return 'csharp';
    if (lowerLang === 'js') return 'javascript';
    if (lowerLang === 'ts') return 'typescript';
    if (lowerLang === 'py') return 'python';
    if (lowerLang === 'sh') return 'bash';
    if (lowerLang === 'yml') return 'yaml';

    return 'plaintext';
};

export const CodeBlock = ({ code, language, onLoadCodeIntoWorkbench }: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);

  // useMemo hook to perform the highlighting only when code or language changes.
  const highlightedCode = useMemo(() => {
    try {
      const normalizedLang = normalizeLanguage(language);
      // Use highlight.js to get the HTML string with syntax highlighting
      return hljs.highlight(code, { language: normalizedLang, ignoreIllegals: true }).value;
    } catch (error) {
      console.error("Highlight.js error:", error, { language, codeSnippet: code.substring(0, 100) });
      return escapeHtml(code);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };
  
  const normalizedLang = normalizeLanguage(language);
  const langClass = `language-${normalizedLang}`;

  return (
    <div className="relative group text-left my-4 bg-[#1e1e1e] rounded-md border border-[var(--hud-color-darkest)]">
        <div className="absolute top-0 right-0 p-2 z-10 flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] text-[var(--hud-color-darker)] mr-2 uppercase font-mono select-none">{normalizedLang}</span>
            {onLoadCodeIntoWorkbench && (
                <button
                    onClick={() => onLoadCodeIntoWorkbench(code)}
                    className="p-1.5 bg-black/50 text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-black focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] flex items-center gap-1.5 text-xs font-mono rounded"
                    title="Load into Editor"
                    aria-label="Load code into editor"
                >
                    <LoadIntoEditorIcon className="h-4 w-4" />
                </button>
            )}
            <button
                onClick={handleCopy}
                className="p-1.5 bg-black/50 text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-black focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] rounded"
                aria-label={isCopied ? "Copied" : "Copy code"}
            >
                {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            </button>
        </div>
        <pre className="overflow-x-auto p-4 custom-scrollbar">
            <code
            className={langClass}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
        </pre>
    </div>
  );
};