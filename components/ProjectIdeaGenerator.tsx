
import React, { useState, useCallback } from 'react';
import { Technology, ProjectIdea } from '../types';
import { TECHNOLOGY_MAP, TECHNOLOGIES_ARRAY } from '../constants';
import { generateProjectIdea, generateProjectDetails, generateProjectSuggestions } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import CodeBlock from './CodeBlock';


const ProjectIdeaGenerator: React.FC = () => {
  const [selectedTechnologies, setSelectedTechnologies] = useState<Technology[]>([Technology.REACT]);
  const [topic, setTopic] = useState<string>('');
  const [projectIdea, setProjectIdea] = useState<ProjectIdea | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccessMessage, setCopySuccessMessage] = useState<string>('');

  const handleTechnologyToggle = (tech: Technology) => {
    setSelectedTechnologies(prev =>
        prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
    setCopySuccessMessage('');
  };

  const handleGenerateProjectIdea = useCallback(async () => {
    if (selectedTechnologies.length === 0) {
      setError('Vui lòng chọn ít nhất một công nghệ.');
      return;
    }
    setIsLoading(true);
    setError('');
    setProjectIdea(null);
    setCopySuccessMessage('');
    try {
      const ideaData = await generateProjectIdea(selectedTechnologies, topic);
      setProjectIdea({
        ...ideaData,
        id: crypto.randomUUID(),
        isFavorite: false,
        huongDanChiTiet: undefined,
        goiYThem: undefined,
        isLoadingDetails: false,
        isLoadingSuggestions: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tạo ý tưởng dự án');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTechnologies, topic]);

  const toggleFavoriteProject = () => {
    if (projectIdea) {
      setProjectIdea(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const copyProjectToMarkdown = (idea: ProjectIdea) => {
    let markdownText = `## Ý tưởng dự án: ${idea.tenDuAn}\n\n`;
    if (topic.trim()) {
      markdownText += `**Chủ đề:** ${topic}\n`;
    }
    markdownText += `**Công nghệ chính:** ${selectedTechnologies.map(t => TECHNOLOGY_MAP[t]).join(', ')}\n\n`;
    markdownText += `### Mô tả ngắn gọn\n${idea.moTaNganGon}\n\n`;
    markdownText += `### Tính năng chính\n${idea.tinhNangChinh.map(f => `- ${f}`).join('\n')}\n\n`;
    if (idea.congNgheGoiY && idea.congNgheGoiY.length > 0) {
      markdownText += `### Công nghệ gợi ý thêm\n${idea.congNgheGoiY.join(', ')}\n\n`;
    }
    if (idea.huongDanChiTiet) {
      markdownText += `### Hướng dẫn chi tiết\n${idea.huongDanChiTiet}\n\n`;
    }
    if (idea.goiYThem && idea.goiYThem.length > 0) {
      markdownText += `### Gợi ý thêm\n${idea.goiYThem.map(s => `- ${s}`).join('\n')}\n\n`;
    }
    navigator.clipboard.writeText(markdownText)
        .then(() => setCopySuccessMessage('Đã sao chép ý tưởng dự án!'))
        .catch(err => setError('Không thể sao chép: ' + err));
  };

  const handleGenerateDetails = async () => {
    if (!projectIdea) return;
    setProjectIdea(prev => prev ? { ...prev, isLoadingDetails: true, huongDanChiTiet: undefined } : null);
    setCopySuccessMessage('');
    try {
      const details = await generateProjectDetails({
        tenDuAn: projectIdea.tenDuAn,
        moTaNganGon: projectIdea.moTaNganGon,
        congNgheGoiY: projectIdea.congNgheGoiY
      });
      setProjectIdea(prev => prev ? { ...prev, huongDanChiTiet: details, isLoadingDetails: false } : null);
    } catch (err) {
      setError(err instanceof Error ? `Lỗi tạo hướng dẫn: ${err.message}` : 'Lỗi không xác định');
      setProjectIdea(prev => prev ? { ...prev, isLoadingDetails: false } : null);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!projectIdea) return;
    setProjectIdea(prev => prev ? { ...prev, isLoadingSuggestions: true, goiYThem: undefined } : null);
    setCopySuccessMessage('');
    try {
      const suggestions = await generateProjectSuggestions({ tenDuAn: projectIdea.tenDuAn });
      setProjectIdea(prev => prev ? { ...prev, goiYThem: suggestions, isLoadingSuggestions: false } : null);
    } catch (err) {
      setError(err instanceof Error ? `Lỗi tạo gợi ý: ${err.message}` : 'Lỗi không xác định');
      setProjectIdea(prev => prev ? { ...prev, isLoadingSuggestions: false } : null);
    }
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
                return <code key={segmentKey} className="bg-gray-700 text-sky-300 px-1.5 py-0.5 rounded-sm font-mono text-sm">{segment.substring(1, segment.length - 1)}</code>;
              }
              return segment;
            });
            listItems.push(<li key={`${currentLineKey}-li`}>{formattedItemContent}</li>);
          } else {
            flushList();
            if (line.trim()) {
              const elementKey = `${currentLineKey}-p`;
              if (line.startsWith('# ')) {
                elements.push(<h2 key={`${currentLineKey}-h2`} className="text-xl font-semibold mt-3 mb-1 text-sky-200">{line.substring(2)}</h2>);
              } else if (line.startsWith('## ')) {
                elements.push(<h3 key={`${currentLineKey}-h3`} className="text-lg font-semibold mt-2 mb-1 text-sky-300">{line.substring(3)}</h3>);
              } else {
                const segments = line.split(/(\*\*.*?\*\*|\`.*?\`)/g).filter(Boolean);
                const paragraphContent = segments.map((segment, segIndex) => {
                  const segmentKey = `${elementKey}-segment-${segIndex}`;
                  if (segment.startsWith('**') && segment.endsWith('**')) {
                    return <strong key={segmentKey}>{segment.substring(2, segment.length - 2)}</strong>;
                  } else if (segment.startsWith('`') && segment.endsWith('`')) {
                    return <code key={segmentKey} className="bg-gray-700 text-sky-300 px-1.5 py-0.5 rounded-sm font-mono text-sm">{segment.substring(1, segment.length - 1)}</code>;
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
        <h2 className="text-3xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">Tạo Ý Tưởng Dự Án</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Chọn công nghệ (có thể chọn nhiều):</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
            {TECHNOLOGIES_ARRAY.map(tech => (
                <button
                    key={tech}
                    onClick={() => handleTechnologyToggle(tech)}
                    className={`p-3 rounded-md text-sm font-medium transition-all duration-200 ease-in-out border-2
                ${selectedTechnologies.includes(tech)
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                    }`}
                >
                  {TECHNOLOGY_MAP[tech]}
                </button>
            ))}
          </div>
          <div>
            <label htmlFor="projectTopic" className="block text-sm font-medium text-gray-300 mb-1">Chủ đề gợi ý (tùy chọn):</label>
            <input
                type="text"
                id="projectTopic"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setCopySuccessMessage(''); }}
                placeholder="Ví dụ: 'API authentication', 'real-time chat features', 'data visualization'"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <button
            onClick={handleGenerateProjectIdea}
            disabled={isLoading || selectedTechnologies.length === 0}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : 'Tạo Ý Tưởng'}
        </button>

        <ErrorMessage message={error} />
        {copySuccessMessage && <p className="text-green-400 text-center my-2">{copySuccessMessage}</p>}
        {isLoading && !projectIdea && <LoadingSpinner />}

        {projectIdea && (
            <div className="mt-8 p-6 bg-gray-700 bg-opacity-80 rounded-lg shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-cyan-400">{projectIdea.tenDuAn}</h3>
                <div className="flex space-x-2">
                  <button
                      onClick={() => copyProjectToMarkdown(projectIdea)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-md transition duration-150"
                      title="Sao chép Markdown"
                      aria-label="Sao chép ý tưởng dự án dạng Markdown"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m7.332 0M3.498 6.75l2.036-1.854A.75.75 0 016 4.5h12a.75.75 0 01.466.146l2.036 1.854a3.75 3.75 0 01.828 5.372l-.968 1.581a3.75 3.75 0 01-5.74 1.166l-1.042-.942a3.75 3.75 0 00-5.718 0l-1.042.942a3.75 3.75 0 01-5.74-1.166L.43 12.122a3.75 3.75 0 01.828-5.372Z" />
                    </svg>
                  </button>
                  <button
                      onClick={toggleFavoriteProject}
                      className={`p-2 rounded-md shadow-md transition duration-150 ${projectIdea.isFavorite ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-500 hover:bg-gray-400'} text-white`}
                      title={projectIdea.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                      aria-label={projectIdea.isFavorite ? "Bỏ yêu thích dự án này" : "Thêm dự án này vào yêu thích"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={projectIdea.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.324h5.372c.559 0 .81.691.419 1.07l-4.36 3.182a.563.563 0 00-.182.557l1.636 5.028a.563.563 0 01-.84.62l-4.506-3.54a.563.563 0 00-.652 0l-4.506 3.54a.563.563 0 01-.84-.62l1.636-5.028a.563.563 0 00-.182-.557l-4.36-3.182c-.39-.28-.14-.1.071-.419 1.07h5.372a.563.563 0 00.475-.324L11.48 3.5z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-cyan-300 mb-1">Mô tả:</h4>
                <p className="text-gray-300 leading-relaxed">{projectIdea.moTaNganGon}</p>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-cyan-300 mb-1">Tính năng chính:</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-4">
                  {projectIdea.tinhNangChinh.map((feature, index) => (
                      <li key={`feature-${index}`}>{feature}</li>
                  ))}
                </ul>
              </div>

              {projectIdea.congNgheGoiY && projectIdea.congNgheGoiY.length > 0 && (
                  <div>
                    <h4 className="text-xl font-semibold text-cyan-300 mb-1">Công nghệ gợi ý thêm:</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {projectIdea.congNgheGoiY.map((tech, index) => (
                          <span key={`suggested-tech-${index}`} className="px-3 py-1 bg-gray-600 text-cyan-200 text-sm rounded-full shadow">
                    {tech}
                  </span>
                      ))}
                    </div>
                  </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                    onClick={handleGenerateDetails}
                    disabled={projectIdea.isLoadingDetails || !!projectIdea.huongDanChiTiet}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-60"
                >
                  {projectIdea.isLoadingDetails ? <LoadingSpinner/> : (projectIdea.huongDanChiTiet ? 'Đã có Hướng dẫn' : 'Hướng dẫn chi tiết')}
                </button>
                <button
                    onClick={handleGenerateSuggestions}
                    disabled={projectIdea.isLoadingSuggestions || !!projectIdea.goiYThem}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-60"
                >
                  {projectIdea.isLoadingSuggestions ? <LoadingSpinner/> : (projectIdea.goiYThem ? 'Đã có Gợi ý' : 'Gợi ý thêm')}
                </button>
              </div>

              {projectIdea.isLoadingDetails && <LoadingSpinner />}
              {projectIdea.huongDanChiTiet && (
                  <div className="mt-4 p-4 border border-gray-600 rounded-md bg-gray-700/50">
                    <h4 className="text-xl font-semibold text-sky-300 mb-2">Hướng dẫn chi tiết:</h4>
                    {renderMarkdownContent(projectIdea.huongDanChiTiet, `project-${projectIdea.id}-details`)}
                  </div>
              )}

              {projectIdea.isLoadingSuggestions && <LoadingSpinner />}
              {projectIdea.goiYThem && projectIdea.goiYThem.length > 0 && (
                  <div className="mt-4 p-4 border border-gray-600 rounded-md bg-gray-700/50">
                    <h4 className="text-xl font-semibold text-emerald-300 mb-2">Gợi ý thêm:</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1 pl-4">
                      {projectIdea.goiYThem.map((suggestion, index) => (
                          <li key={`suggestion-${index}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
              )}
            </div>
        )}
      </div>
  );
};

export default ProjectIdeaGenerator;
