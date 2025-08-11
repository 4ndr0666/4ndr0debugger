import React from 'react';
import { CodeBlock } from './CodeBlock.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';

// Helper to parse simple inline markdown (bold, italic, code) into React nodes.
const parseInlineMarkdown = (text: string): React.ReactNode => {
  // Split the text by markdown delimiters, keeping them to check against.
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index} className="italic text-[var(--hud-color)]">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-[var(--hud-color-darkest)] px-1.5 py-0.5 text-sm text-[var(--hud-color)] font-mono">{part.slice(1, -1)}</code>;
        }
        return part; // Return plain text as is
      })}
    </>
  );
};


// This component parses a block of text line-by-line and converts it to React elements.
// It safely handles headings, paragraphs, and unordered lists, avoiding dangerouslySetInnerHTML.
const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  if (!text.trim()) return null;

  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="list-disc list-outside pl-5 my-2 space-y-1 text-[var(--hud-color-darker)]">
          {listItems.map((item, i) => (
            <li key={i}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const key = `line-${index}`;

    if (line.startsWith('# ')) {
      flushList(`ul-before-${key}`);
      elements.push(<h1 key={key} className="text-2xl font-bold mt-6 mb-2 text-white">{parseInlineMarkdown(line.substring(2))}</h1>);
    } else if (line.startsWith('## ')) {
      flushList(`ul-before-${key}`);
      elements.push(<h2 key={key} className="text-xl font-semibold mt-5 mb-1.5 text-white">{parseInlineMarkdown(line.substring(3))}</h2>);
    } else if (line.startsWith('### ')) {
      flushList(`ul-before-${key}`);
      elements.push(<h3 key={key} className="text-lg font-semibold mt-4 mb-1 text-white">{parseInlineMarkdown(line.substring(4))}</h3>);
    } else if (line.startsWith('- ')) {
      listItems.push(line.substring(2));
    } else {
      flushList(`ul-before-${key}`);
      if (line.trim()) {
        elements.push(<p key={key}>{parseInlineMarkdown(line)}</p>);
      }
    }
  });

  flushList(`ul-final`);

  return <>{elements}</>;
};

export const MarkdownRenderer: React.FC<{ markdown: string }> = ({ markdown }) => {
  if (!markdown) return null;

  // Split the content by code blocks, keeping the delimiters
  const parts = markdown.split(/(```(?:[a-zA-Z0-9-]*)\n[\s\S]*?\n```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const codeBlockMatch = part.match(/^```([a-zA-Z0-9-]*)\n([\s\S]*?)\n```$/);
        if (codeBlockMatch) {
          const [, language, code] = codeBlockMatch;
          return (
            <ErrorBoundary key={index}>
              <CodeBlock code={code.trim()} language={language} />
            </ErrorBoundary>
          );
        }
        // Render the non-code parts using our new, safer TextBlock component
        return <TextBlock key={index} text={part} />;
      })}
    </>
  );
};