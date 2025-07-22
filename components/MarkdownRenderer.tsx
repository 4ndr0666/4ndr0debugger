
import React from 'react';
import { CodeBlock } from './CodeBlock';

// This function is a simplified markdown-to-HTML converter.
// It is NOT a full-featured, secure markdown parser. It's designed
// for the specific, trusted output format of the Gemini API in this app.
const renderTextAsHtml = (markdown: string): (JSX.Element | null) => {
    if (!markdown.trim()) return null;

    let html = markdown;

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-1 text-[#e0ffff]">$1</h3>')
               .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-1.5 text-[#e8ffff]">$1</h2>')
               .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-2 text-[#f0ffff]">$1</h1>');

    // Bold, Italic, Inline Code
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#f8ffff]">$1</strong>')
               .replace(/\*(.*?)\*/g, '<em class="italic text-[#e0fafa]">$1</em>')
               .replace(/`([^`]+)`/g, '<code class="bg-[#157d7d]/50 px-1.5 py-0.5 rounded text-sm text-[#15fafa] font-mono">$1</code>');

    // Lists (basic handling for unordered lists)
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul class="themed-list list-disc list-outside pl-5 my-2 space-y-1 text-[#d0fafa]">${match}</ul>`);
    
    // Convert remaining newlines in text blocks to <br> for preservation of spacing.
    // This regex looks for text between block elements or at the start/end
    // and replaces newlines within those chunks.
    const sections = html.split(/(<(?:ul|h[1-3])[\s\S]*?<\/(?:ul|h[1-3])>)/g);
    html = sections.map(section => {
        if (section.match(/<(?:ul|h[1-3])[\s\S]*?<\/(?:ul|h[1-3])>/)) {
            return section; // Return block elements as is
        }
        return section.split('\n').filter(line => line.trim() !== '').map(p => `<p>${p}</p>`).join('');
    }).join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
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
          return <CodeBlock key={index} code={code.trim()} language={language} />;
        }
        // Render the non-code parts using our text-to-HTML renderer
        return <div key={index}>{renderTextAsHtml(part)}</div>;
      })}
    </>
  );
};
