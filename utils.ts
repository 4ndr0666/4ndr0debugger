

// Extracts markdown files with filenames from a response.
export const extractGeneratedMarkdownFiles = (responseText: string): { name: string, content: string }[] => {
    const files: { name: string, content: string }[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9-:]*)\n([\sS]*?)\n```/g;
    const matches = [...responseText.matchAll(codeBlockRegex)];

    matches.forEach((match) => {
        const langInfo = match[1] || '';
        const code = match[2].trim();
        const language = langInfo.split(':')[0].trim().toLowerCase();

        if (language === 'markdown' || language === 'md') {
            let filename = langInfo.split(':')[1]?.trim();
            if (!filename) {
                const firstLine = code.split('\n')[0];
                if (firstLine.startsWith('# ')) {
                    filename = firstLine.substring(2).trim().replace(/[<>:"/\\|?*]/g, '').replace(/\s/g, '_') + '.md';
                } else {
                    filename = `document_${Date.now()}.md`;
                }
            }
            if (!filename.toLowerCase().endsWith('.md')) {
                filename += '.md';
            }
            files.push({ name: filename, content: code });
        }
    });
    return files;
};

export const extractFinalCodeBlock = (response: string, isInitialReview: boolean): string | null => {
    const revisedCodeRegex = /###\s*(?:Revised|Updated|Full|Optimized)\s+Code\s*`{3}(?:[a-zA-Z0-9-]*)?\n([\sS]*?)\n`{3}/im;
    const headingMatch = response.match(revisedCodeRegex);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    
    if (isInitialReview) {
      const allCodeBlocksRegex = /`{3}(?:[a-zA-Z0-9-]*)?\n([\sS]*?)\n`{3}/g;
      const matches = [...response.matchAll(allCodeBlocksRegex)];
      
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch && lastMatch[1]) {
          // A simple heuristic to avoid matching small inline code blocks as the final version.
          if (lastMatch[1].trim().split('\n').length >= 3) {
            return lastMatch[1].trim();
          }
        }
      }
    }

    return null;
};
