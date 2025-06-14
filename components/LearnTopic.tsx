
import React, { useState, useCallback } from 'react';
import { Technology } from '../types';
import { TECHNOLOGY_MAP, TECHNOLOGIES_ARRAY } from '../constants';
import { generateLearningContent } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import CodeBlock from './CodeBlock';

const LearnTopic: React.FC = () => {
  const [selectedTechnology, setSelectedTechnology] = useState<Technology>(Technology.JAVASCRIPT);
  const [topic, setTopic] = useState<string>('');
  const [learningContent, setLearningContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccessMessage, setCopySuccessMessage] = useState<string>('');

  const handleGenerateLearningContent = useCallback(async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề bạn muốn tìm hiểu.');
      return;
    }
    setIsLoading(true);
    setError('');
    setLearningContent('');
    setCopySuccessMessage('');
    try {
      const content = await generateLearningContent(selectedTechnology, topic);
      setLearningContent(content);
      if (!content.trim()) {
        setError("Không có nội dung nào được tạo. Vui lòng thử lại với chủ đề khác.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tạo nội dung học tập');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTechnology, topic]);

  const copyToMarkdown = () => {
    if (!learningContent) {
      setError('Không có nội dung để sao chép.');
      return;
    }
    const markdownText = `## Chủ đề: ${topic} - ${TECHNOLOGY_MAP[selectedTechnology]}\n\n${learningContent}`;
    navigator.clipboard.writeText(markdownText)
        .then(() => setCopySuccessMessage('Đã sao chép nội dung vào clipboard!'))
        .catch(err => setError('Không thể sao chép: ' + err));
  };

  const renderMarkdownContent = (content: string, baseKey: string): (JSX.Element | null)[] | null => {
    if (!content) return null;

    const blocks = content.split(/(```[\s\S]*?```)/g);

    return blocks.map((block, blockIndex) => {
      const currentBlockKey = `${baseKey}-block-${blockIndex}`;
      if (block.startsWith('```') && block.endsWith('```')) {
        return <CodeBlock key={currentBlockKey} code={block} />;
      } else {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        const elements: JSX.Element[] = [];
        let currentListType: 'ul' | 'ol' | null = null;
        let listItems: JSX.Element[] = [];

        const flushList = () => {
          if (listItems.length > 0) {
            const listKey = `${currentBlockKey}-list-${elements.length}`;
            if (currentListType === 'ul') {
              elements.push(<ul key={listKey} className="list-disc list-inside space-y-1 pl-5 my-2 text-gray-300">{listItems}</ul>);
            } else if (currentListType === 'ol') {
              elements.push(<ol key={listKey} className="list-decimal list-inside space-y-1 pl-5 my-2 text-gray-300">{listItems}</ol>);
            }
            listItems = [];
          }
          currentListType = null;
        };

        const lines = trimmedBlock.split('\n');
        lines.forEach((line, lineIndex) => {
          const currentLineKey = `${currentBlockKey}-line-${lineIndex}`;
          const listItemMatch = line.match(/^(\s*)(\*|-|\d+\.)\s+(.*)/);

          if (listItemMatch) {
            const itemContent = listItemMatch[3];
            const newListType = (listItemMatch[2] === '*' || listItemMatch[2] === '-') ? 'ul' : 'ol';

            if (currentListType !== newListType && listItems.length > 0) {
              flushList();
            }
            currentListType = newListType;

            const segments = itemContent.split(/(\*\*.*?\*\*|\`.*?\`)/g).filter(Boolean);
            const formattedItemContent = segments.map((segment, segIndex) => {
              const segmentKey = `${currentLineKey}-itemsegment-${segIndex}`;
              if (segment.startsWith('**') && segment.endsWith('**')) {
                return <strong key={segmentKey}>{segment.substring(2, segment.length - 2)}</strong>;
              } else if (segment.startsWith('`') && segment.endsWith('`')) {
                return <code key={segmentKey} className="bg-gray-700 text-teal-300 px-1.5 py-0.5 rounded-sm font-mono text-sm">{segment.substring(1, segment.length - 1)}</code>;
              }
              return segment;
            });
            listItems.push(<li key={`${currentLineKey}-li`}>{formattedItemContent}</li>);
          } else {
            flushList();
            if (line.trim()) {
              const elementKey = `${currentLineKey}-p`;
              if (line.startsWith('# ')) {
                elements.push(<h2 key={`${currentLineKey}-h2`} className="text-2xl font-semibold mt-4 mb-2 text-purple-300">{line.substring(2)}</h2>);
              } else if (line.startsWith('## ')) {
                elements.push(<h3 key={`${currentLineKey}-h3`} className="text-xl font-semibold mt-3 mb-1 text-purple-200">{line.substring(3)}</h3>);
              } else if (line.startsWith('### ')) {
                elements.push(<h4 key={`${currentLineKey}-h4`} className="text-lg font-semibold mt-2 mb-1 text-purple-100">{line.substring(4)}</h4>);
              }
              else {
                const segments = line.split(/(\*\*.*?\*\*|\`.*?\`)/g).filter(Boolean);
                const paragraphContent = segments.map((segment, segIndex) => {
                  const segmentKey = `${elementKey}-segment-${segIndex}`;
                  if (segment.startsWith('**') && segment.endsWith('**')) {
                    return <strong key={segmentKey}>{segment.substring(2, segment.length - 2)}</strong>;
                  } else if (segment.startsWith('`') && segment.endsWith('`')) {
                    return <code key={segmentKey} className="bg-gray-700 text-teal-300 px-1.5 py-0.5 rounded-sm font-mono text-sm">{segment.substring(1, segment.length - 1)}</code>;
                  }
                  return segment;
                });
                elements.push(<p key={elementKey} className="my-2 leading-relaxed text-gray-300">{paragraphContent}</p>);
              }
            }
          }
        });
        flushList();

        return elements.length > 0 ? <div key={`${currentBlockKey}-textwrapper`}>{elements}</div> : null;
      }
    }).filter(Boolean);
  };

  return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-green-400">Tìm Hiểu Chủ Đề</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="technologyLearn" className="block text-sm font-medium text-gray-300 mb-1">Chọn công nghệ:</label>
            <select
                id="technologyLearn"
                value={selectedTechnology}
                onChange={(e) => setSelectedTechnology(e.target.value as Technology)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            >
              {TECHNOLOGIES_ARRAY.map(tech => (
                  <option key={tech} value={tech}>{TECHNOLOGY_MAP[tech]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="topicLearn" className="block text-sm font-medium text-gray-300 mb-1">Nhập chủ đề bạn muốn tìm hiểu:</label>
            <input
                type="text"
                id="topicLearn"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setCopySuccessMessage(''); }}
                placeholder="Ví dụ: 'Higher-Order Functions', 'State Management in React'"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <button
            onClick={handleGenerateLearningContent}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : 'Tìm hiểu ngay'}
        </button>

        <ErrorMessage message={error} />
        {copySuccessMessage && <p className="text-green-400 text-center">{copySuccessMessage}</p>}

        {isLoading && !learningContent && <LoadingSpinner />}

        {learningContent && (
            <div className="mt-8 p-6 bg-gray-700 bg-opacity-70 rounded-lg shadow-xl space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-teal-300">Nội dung tìm hiểu về: {topic} ({TECHNOLOGY_MAP[selectedTechnology]})</h3>
                <button
                    onClick={copyToMarkdown}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-md transition duration-150"
                    title="Sao chép Markdown"
                    aria-label="Sao chép nội dung tìm hiểu dạng Markdown"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m7.332 0M3.498 6.75l2.036-1.854A.75.75 0 016 4.5h12a.75.75 0 01.466.146l2.036 1.854a3.75 3.75 0 01.828 5.372l-.968 1.581a3.75 3.75 0 01-5.74 1.166l-1.042-.942a3.75 3.75 0 00-5.718 0l-1.042.942a3.75 3.75 0 01-5.74-1.166L.43 12.122a3.75 3.75 0 01.828-5.372Z" />
                  </svg>
                </button>
              </div>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                {renderMarkdownContent(learningContent, `learn-${selectedTechnology}-${topic.replace(/\s+/g, '_')}`)}
              </div>
            </div>
        )}
      </div>
  );
};

export default LearnTopic;
