import React from 'react';
import { CodeBlock } from './CodeBlock.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import { AccordionItem } from './AccordionItem.tsx';

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

  // This regex finds headings like "### REVISED CODE" and the code block that immediately follows.
  // It captures the heading and the code block separately.
  const revisedCodeRegex = /(#+\s*(?:REVISED|UPDATED|FULL)\s+CODE)\s*\n(```(?:[a-zA-Z0-9-]*)\n[\s\S]*?\n```)/g;

  // The split method with a capturing group creates an array of:
  // [text_before, captured_heading, captured_code_block, text_after, ...]
  const parts = markdown.split(revisedCodeRegex);

  const renderRegularPart = (part: string, key: string | number) => {
    // This function handles rendering standard text and code blocks.
    const subParts = part.split(/(```(?:[a-zA-Z0-9-]*)\n[\s\S]*?\n```)/g);
    return (
      <React.Fragment key={key}>
        {subParts.map((subPart, subIndex) => {
          if (!subPart) return null;
          const codeBlockMatch = subPart.match(/^```([a-zA-Z0-9-]*)\n([\s\S]*?)\n```$/);
          if (codeBlockMatch) {
            const [, language, code] = codeBlockMatch;
            return (
              <ErrorBoundary key={`sub-${subIndex}`}>
                <CodeBlock code={code.trim()} language={language} />
              </ErrorBoundary>
            );
          }
          return <TextBlock key={`sub-${subIndex}`} text={subPart} />;
        })}
      </React.Fragment>
    );
  };

  return (
    <>
      {parts.map((part, index) => {
        // Every 3rd element starting from 0 is a regular text part.
        if (index % 3 === 0) {
          return renderRegularPart(part, index);
        }
        
        // Every 3rd element starting from 1 is a captured heading.
        if (index % 3 === 1) {
          const title = part.replace(/#+\s*/, '');
          const codeBlockPart = parts[index + 1];
          const codeBlockMatch = codeBlockPart?.match(/^```([a-zA-Z0-9-]*)\n([\s\S]*?)\n```$/);

          if (codeBlockMatch) {
            const [, language, code] = codeBlockMatch;
            return (
              <AccordionItem key={index} title={title} defaultOpen={false}>
                <ErrorBoundary>
                  <CodeBlock code={code.trim()} language={language} />
                </ErrorBoundary>
              </AccordionItem>
            );
          }
        }
        
        // Every 3rd element starting from 2 is a captured code block which is handled
        // with its preceding heading, so we render nothing here.
        return null;
      })}
    </>
  );
};