


import React from 'react';
import { CodeBlock } from './CodeBlock.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import { AccordionItem } from './AccordionItem.tsx';
import { GeneratedFile } from './GeneratedFile.tsx';

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
  const elements: React.ReactNode[] = [];
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
    } else if (line.startsWith('#### ')) {
      flushList(`ul-before-${key}`);
      elements.push(<h4 key={key} className="text-base font-semibold mt-3 mb-1 text-white">{parseInlineMarkdown(line.substring(5))}</h4>);
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

export const MarkdownRenderer: React.FC<{ 
  markdown: string;
  onSaveGeneratedFile?: (filename: string, content: string) => void; 
}> = ({ markdown, onSaveGeneratedFile }) => {
  if (!markdown) return null;

  const revisedCodeRegex = /(#+\s*(?:REVISED|UPDATED|FULL|OPTIMIZED|ENHANCED)[\s\w]*(?:CODE|REVISION))\s*\n(```(?:[a-zA-Z0-9-]*)\n[\s\S]*?\n```)/gi;
  const parts = markdown.split(revisedCodeRegex);

  const renderRegularPart = (part: string, key: string | number) => {
    const subParts = part.split(/(```(?:[a-zA-Z0-9-:]*)\n[\s\S]*?\n```)/g);
    return (
      <React.Fragment key={key}>
        {subParts.map((subPart, subIndex) => {
          if (!subPart) return null;
          const codeBlockMatch = subPart.match(/^```([a-zA-Z0-9-:]*)\n([\s\S]*?)\n```$/);
          if (codeBlockMatch) {
            const [, langInfo, code] = codeBlockMatch;
            const language = (langInfo || '').split(':')[0].trim().toLowerCase();
            const filenameFromInfo = (langInfo || '').split(':')[1]?.trim();
            
            if ((language === 'markdown' || language === 'md') && onSaveGeneratedFile) {
                let filename = filenameFromInfo;
                if (!filename) {
                  const firstLine = code.trim().split('\n')[0];
                  if (firstLine.startsWith('# ')) {
                    // Sanitize filename
                    filename = firstLine.substring(2).trim().replace(/[<>:"/\\|?*]/g, '').replace(/\s/g, '_');
                  } else {
                    filename = `document-${Date.now()}.md`;
                  }
                }
                 if (!filename.toLowerCase().endsWith('.md')) {
                    filename += '.md';
                }
                return (
                  <ErrorBoundary key={`sub-${subIndex}`}>
                    <GeneratedFile filename={filename} content={code.trim()} onSave={onSaveGeneratedFile} />
                  </ErrorBoundary>
                );
            }

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
        if (index % 3 === 0) {
          return renderRegularPart(part, index);
        }
        
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
        
        return null;
      })}
    </>
  );
};
