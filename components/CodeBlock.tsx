import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CopyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };

  // Custom theme to blend okaidia with the app's "electric glass" look
  const customTheme = {
    ...okaidia,
    'pre[class*="language-"]': {
      ...okaidia['pre[class*="language-"]'],
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      margin: '0',
      padding: '1rem',
      fontSize: '0.875rem',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
     'code[class*="language-"]': {
      ...okaidia['code[class*="language-"]'],
       fontFamily: "inherit"
    },
  };

  return (
    <div className="relative group bg-[#070B14] rounded-md border border-[#157d7d]/70 my-3 text-left">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-[#101827]/60 text-[#a0f0f0] rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#15fafa]"
        aria-label={isCopied ? "Copied" : "Copy code"}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <SyntaxHighlighter
        language={language || 'text'}
        style={customTheme}
        wrapLines={true}
        wrapLongLines={true}
      >
        {String(code).trim()}
      </SyntaxHighlighter>
    </div>
  );
};