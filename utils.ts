
// Unicode-safe Base64 encoding/decoding to prevent DOMException on special characters
export const b64EncodeUnicode = (str: string): string => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
};

export const b64DecodeUnicode = (str: string): string => {
    try {
        return decodeURIComponent(atob(str).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        // Fallback for legacy ASCII-only exports
        return atob(str);
    }
};

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

/**
 * Hardened extraction logic to identify AI-suggested code modifications.
 * Prioritizes explicitly labeled blocks over line-count heuristics.
 */
export const extractFinalCodeBlock = (response: string, isInitialReview: boolean): string | null => {
    // Priority 1: Explicitly tagged revision blocks (HUD Standard)
    const revisedCodeRegex = /###\s*(?:Revised|Updated|Full|Optimized|Final)\s+(?:Code|Script|Revision)\s*`{3}(?:[a-zA-Z0-9-]*)?\n([\sS]*?)\n`{3}/im;
    const headingMatch = response.match(revisedCodeRegex);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    
    // Priority 2: Fallback for initial reviews (the last significant code block)
    if (isInitialReview) {
      const allCodeBlocksRegex = /`{3}(?:[a-zA-Z0-9-]*)?\n([\sS]*?)\n`{3}/g;
      const matches = [...response.matchAll(allCodeBlocksRegex)];
      
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch && lastMatch[1]) {
          const content = lastMatch[1].trim();
          // Smarter heuristic: must look like code (contain common syntax markers) or be significant length
          const looksLikeCode = /[{};()=>]/.test(content) || content.split('\n').length > 1;
          if (looksLikeCode) {
            return content;
          }
        }
      }
    }

    return null;
};
