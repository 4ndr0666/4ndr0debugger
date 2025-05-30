import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ReviewOutputProps {
  feedback: string | null;
  isLoading: boolean;
  error: string | null;
}

const SimpleMarkdownRenderer: React.FC<{ markdown: string }> = ({ markdown }) => {
  if (!markdown) return null;

  let html = markdown;

  // Code blocks: Must be processed first and with highest specificity for newlines
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_match, lang, code) => {
    const langClass = lang ? `language-${lang}` : '';
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-[#070B14] p-4 rounded-md overflow-x-auto my-3 text-sm ${langClass} border border-[#157d7d]/70"><code class="text-[#d0fafa] whitespace-pre">${safeCode}</code></pre>`;
  });
  
  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-2 mb-1 text-[#e0ffff]">$1</h3>')
             .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-3 mb-1.5 text-[#e8ffff]">$1</h2>')
             .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2 text-[#f0ffff]">$1</h1>');

  // Bold, Italic, Inline Code
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#f8ffff]">$1</strong>')
             .replace(/\*(.*?)\*/g, '<em class="italic text-[#e0fafa]">$1</em>')
             .replace(/`([^`]+)`/g, '<code class="bg-[#157d7d]/50 px-1.5 py-0.5 rounded text-sm text-[#15fafa] font-mono">$1</code>');

  // Lists (basic handling for unordered lists)
  // Process list items first, then wrap them.
  html = html.replace(/^- (.*$)/gim, '<li class="ml-1">$1</li>'); // Temporary class for replacement
  html = html.replace(/(<li class="ml-1">.*?<\/li>)+/gs, (match) => `<ul class="themed-list list-disc list-outside pl-5 mb-2 space-y-1 text-[#d0fafa]">${match.replace(/ml-1/g, '')}</ul>`);


  // Newlines to <br /> (only if not already in <pre> or other block elements)
  // This is tricky. A simpler approach might be to rely on CSS `white-space: pre-line` for the container,
  // but that might affect spacing within custom elements.
  // For now, let's apply it more globally and ensure <pre> overrides it.
  html = html.split('\n').map(line => {
    // Avoid adding <br> inside <pre> or for lines that become block elements like <li>, <h>
    if (line.trim().startsWith('<pre') || line.trim().startsWith('<ul') || line.trim().startsWith('<li') || line.trim().startsWith('<h')) {
      return line;
    }
    return line === '' ? '<br />' : line; // Convert empty lines to <br>, others as is if they are part of paragraph.
  }).join('\n').replace(/<br \/>\n?/g, '<br />'); // Consolidate <br />

  // A final pass to ensure paragraphs are spaced if not handled by other block elements
   html = html.replace(/([^>])\n([^<])/g, '$1<br />$2');


  return <div className="text-[#e0ffff] leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: html }} />;
};


export const ReviewOutput: React.FC<ReviewOutputProps> = ({ feedback, isLoading, error }) => {
  return (
    <div className="p-6 bg-[#101827] rounded-lg shadow-xl shadow-[#156464]/30 min-h-[200px] border border-[#15adad]/60">
      <h2 className="text-xl font-semibold mb-4 text-center">
         <span style={{
            background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
           Review Feedback
        </span>
      </h2>
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full py-10">
          <LoadingSpinner size="w-12 h-12" />
          <p className="mt-4 text-[#a0f0f0]">Analyzing your code with Gemini...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="p-4 bg-red-600/50 border border-red-400 text-red-200 rounded-md">
          <p className="font-semibold">Error:</p>
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}
      {!isLoading && !error && feedback && (
        <div className="overflow-auto max-h-[calc(100vh-300px)] sm:max-h-[60vh] pr-2">
           <SimpleMarkdownRenderer markdown={feedback} />
        </div>
      )}
      {!isLoading && !error && !feedback && (
        <p className="text-gray-400 italic text-center">Submit code for review to see feedback here.</p>
      )}
    </div>
  );
};