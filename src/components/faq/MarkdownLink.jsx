import React from 'react';

/**
 * Renders text with markdown-style links as clickable <a> tags
 * Format: [text](url)
 */
export function MarkdownLink({ text, colors }) {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add the link
    parts.push({
      type: 'link',
      text: match[1],
      url: match[2]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline transition-all"
              style={{ 
                color: '#0C3B2E',
                fontWeight: 600
              }}
            >
              {part.text}
            </a>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
}