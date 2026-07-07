import React, { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownMessage.css';

const CodeBlock = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children || '').replace(/\n$/, '');
  const language = className?.replace('language-', '') || '';
  const languageLabel = language ? language.toUpperCase() : 'CODE';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  if (inline) {
    return <code className={className || 'inline-code'}>{code}</code>;
  }

  return (
    <div className="code-block-container" data-language={language}>
      <div className="code-block-toolbar">
        <span className="code-block-language" aria-hidden="true">
          {languageLabel}
        </span>
        <button
          type="button"
          className={`code-copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className={className}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MarkdownMessage = ({ content, className }) => {
  const markdownClassName = ['markdown-message-surface', className].filter(Boolean).join(' ');

  return (
    <ReactMarkdown
      className={markdownClassName}
      remarkPlugins={[remarkGfm]}
      components={{
        code: CodeBlock,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;
