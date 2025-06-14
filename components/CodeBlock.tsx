import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    hljs: any;
  }
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  let actualCode = code;
  let lang = language;

  const match = code.match(fenceRegex);
  if (match) {
    if (match[1] && !lang) lang = match[1];
    actualCode = match[2].trim();
  } else {
    actualCode = code.trim();
  }
  
  useEffect(() => {
    if (codeRef.current && window.hljs) {
      window.hljs.highlightElement(codeRef.current);
    }
  }, [actualCode, lang]);

  const langClass = lang ? `language-${lang}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(actualCode);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="code-block-container relative bg-gray-900 rounded-md shadow-lg my-4 overflow-hidden">
      {lang && (
        <div className="bg-gray-700 text-gray-300 px-4 py-2 text-xs font-mono">
          {lang}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="code-block-copy-button z-10"
        aria-label={copyStatus === 'copied' ? 'Đã sao chép code' : 'Sao chép code'}
        title={copyStatus === 'copied' ? 'Đã sao chép!' : copyStatus === 'error' ? 'Lỗi sao chép' : 'Sao chép code'}
      >
        {copyStatus === 'copied' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : copyStatus === 'error' ? (
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m7.332 0M3.498 6.75l2.036-1.854A.75.75 0 016 4.5h12a.75.75 0 01.466.146l2.036 1.854a3.75 3.75 0 01.828 5.372l-.968 1.581a3.75 3.75 0 01-5.74 1.166l-1.042-.942a3.75 3.75 0 00-5.718 0l-1.042.942a3.75 3.75 0 01-5.74-1.166L.43 12.122a3.75 3.75 0 01.828-5.372z" />
          </svg>
        )}
      </button>
      <pre className="p-0 text-sm text-gray-200 overflow-x-auto">
        <code ref={codeRef} className={`block p-4 ${langClass} font-jetbrains-mono`}>
          {actualCode}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
