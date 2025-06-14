import React, { useState, useCallback } from 'react';
import { Technology, Difficulty, Exercise } from '../types';
import { TECHNOLOGY_MAP, TECHNOLOGIES_ARRAY, DIFFICULTY_MAP, DIFFICULTIES_ARRAY } from '../constants';
import { generateExercises, generateSolutionForExercise, generateSimpleHintForExercise } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import CodeBlock from './CodeBlock';

const ExerciseGenerator = (): JSX.Element => {
  const [selectedTechnology, setSelectedTechnology] = useState<Technology>(Technology.JAVASCRIPT);
  const [topic, setTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [numberOfExercises, setNumberOfExercises] = useState<number>(1);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccessMessage, setCopySuccessMessage] = useState<string>('');


  const handleGenerateExercises = useCallback(async () => {
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề bài tập.');
      return;
    }
    if (numberOfExercises <= 0 || numberOfExercises > 5) {
      setError('Số lượng bài tập phải từ 1 đến 5.');
      return;
    }
    setIsLoading(true);
    setError('');
    setExercises([]);
    setCopySuccessMessage('');
    try {
      const generatedExercisesData = await generateExercises(selectedTechnology, topic, selectedDifficulty, numberOfExercises);
      const newExercises = generatedExercisesData.map(ex => ({
        ...ex,
        id: crypto.randomUUID(),
        isFavorite: false,
        loiGiai: undefined,
        isLoadingSolution: false,
        goiYDonGian: undefined,
        isLoadingHint: false,
      }));
      setExercises(newExercises);
       if (newExercises.length === 0) {
        setError("Không có bài tập nào được tạo. Vui lòng thử lại với chủ đề hoặc cấu hình khác.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tạo bài tập');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTechnology, topic, selectedDifficulty, numberOfExercises, setError, setExercises, setCopySuccessMessage]);

  const handleGenerateSolution = useCallback(async (exerciseId: string) => {
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, isLoadingSolution: true, loiGiai: undefined } : ex));
    setCopySuccessMessage('');
    setError(''); // Clear previous errors
    try {
      const exerciseToSolve = exercises.find(ex => ex.id === exerciseId);
      if (!exerciseToSolve) {
        throw new Error("Không tìm thấy bài tập để tạo lời giải.");
      }
      const solutionText = await generateSolutionForExercise({ 
        tieuDe: exerciseToSolve.tieuDe,
        moTa: exerciseToSolve.moTa,
        deBai: exerciseToSolve.deBai,
      }, selectedTechnology);

      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, loiGiai: solutionText, isLoadingSolution: false } : ex));
    } catch (err) {
      setError(err instanceof Error ? `Lỗi tạo lời giải: ${err.message}` : 'Lỗi không xác định khi tạo lời giải');
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, isLoadingSolution: false } : ex));
    }
  }, [exercises, selectedTechnology, setError, setExercises, setCopySuccessMessage]);

  const handleGenerateSimpleHint = useCallback(async (exerciseId: string) => {
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, isLoadingHint: true, goiYDonGian: undefined } : ex));
    setCopySuccessMessage('');
    setError(''); // Clear previous errors
    try {
      const exerciseToHint = exercises.find(ex => ex.id === exerciseId);
      if (!exerciseToHint) {
        throw new Error("Không tìm thấy bài tập để tạo gợi ý.");
      }
      const hintText = await generateSimpleHintForExercise({
        tieuDe: exerciseToHint.tieuDe,
        moTa: exerciseToHint.moTa,
        deBai: exerciseToHint.deBai,
      }, selectedTechnology);
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, goiYDonGian: hintText, isLoadingHint: false } : ex));
    } catch (err) {
      setError(err instanceof Error ? `Lỗi tạo gợi ý đơn giản: ${err.message}` : 'Lỗi không xác định khi tạo gợi ý đơn giản');
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, isLoadingHint: false } : ex));
    }
  }, [exercises, selectedTechnology, setError, setExercises, setCopySuccessMessage]);

  const toggleFavoriteExercise = (id: string) => {
    setExercises(prevExercises =>
      prevExercises.map(ex =>
        ex.id === id ? { ...ex, isFavorite: !ex.isFavorite } : ex
      )
    );
  };

  const copyExerciseToMarkdown = (exercise: Exercise) => {
    let markdownText = `## Bài tập: ${exercise.tieuDe}\n\n`;
    markdownText += `**Công nghệ:** ${TECHNOLOGY_MAP[selectedTechnology]}\n`;
    markdownText += `**Độ khó:** ${DIFFICULTY_MAP[selectedDifficulty]}\n\n`;
    markdownText += `### Mô tả\n${exercise.moTa}\n\n`;
    markdownText += `### Đề bài\n${exercise.deBai}\n\n`;
    if (exercise.goiYDonGian) {
      markdownText += `### Gợi ý đơn giản\n${exercise.goiYDonGian}\n\n`;
    }
    if (exercise.loiGiai) {
      markdownText += `### Lời giải\n${exercise.loiGiai}\n\n`;
    }
    navigator.clipboard.writeText(markdownText)
      .then(() => setCopySuccessMessage(`Đã sao chép bài tập '${exercise.tieuDe}'!`))
      .catch(err => setError('Không thể sao chép: ' + (err instanceof Error ? err.message : String(err))));
  };

  const renderContentWithEnhancedFormatting = (content: string, baseKey: string): (JSX.Element | null)[] | null => {
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
              elements.push(<ol key={listKey} className="list-decimal list-inside space-y-1 pl-5 my-2 text-gray-300">{listItems}</ul>);
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
                return <code key={segmentKey} className="bg-gray-700 text-purple-300 px-1.5 py-0.5 rounded-sm font-mono text-sm">{segment.substring(1, segment.length - 1)}</code>;
              }
              return segment;
            });
            listItems.push(<li key={`${currentLineKey}-li`}>{formattedItemContent}</li>);

          } else {
            flushList(); 
            if (line.trim()) { 
              const elementKey = `${currentLineKey}-p`;
              if (line.startsWith('# ')) {
                 elements.push(<h2 key={`${currentLineKey}-h2`} className="text-xl font-semibold mt-3 mb-1 text-pink-300">{line.substring(2)}</h2>);
              } else if (line.startsWith('## ')) {
                 elements.push(<h3 key={`${currentLineKey}-h3`} className="text-lg font-semibold mt-2 mb-1 text-pink-200">{line.substring(3)}</h3>);
              } else {
                const segments = line.split(/(\*\*.*?\*\*|\`.*?\`)/g).filter(Boolean);
                const paragraphContent = segments.map((segment, segIndex) => {
                  const segmentKey = `${elementKey}-segment-${segIndex}`;
                  if (segment.startsWith('**') && segment.endsWith('**')) {
                    return <strong key={segmentKey}>{segment.substring(2, segment.length - 2)}</strong>;
                  } else if (segment.startsWith('`') && segment.endsWith('`')) {
                    return <code key={segmentKey} className="bg-gray-700 text-purple-300 px-1.5 py-0.5 rounded-sm font-mono text-sm">{segment.substring(1, segment.length - 1)}</code>;
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
      <h2 className="text-3xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">Tạo Bài Tập Lập Trình</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="technologyExercise" className="block text-sm font-medium text-gray-300 mb-1">Công nghệ:</label>
          <select
            id="technologyExercise"
            value={selectedTechnology}
            onChange={(e) => setSelectedTechnology(e.target.value as Technology)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white"
          >
            {TECHNOLOGIES_ARRAY.map(tech => (
              <option key={tech} value={tech}>{TECHNOLOGY_MAP[tech]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-1">Độ khó:</label>
          <select
            id="difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white"
          >
            {DIFFICULTIES_ARRAY.map(diff => (
              <option key={diff} value={diff}>{DIFFICULTY_MAP[diff]}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="topicExercise" className="block text-sm font-medium text-gray-300 mb-1">Chủ đề bài tập:</label>
           <input
            type="text"
            id="topicExercise"
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setCopySuccessMessage(''); }}
            placeholder="Ví dụ: 'Array methods', 'Component state'"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
          />
        </div>
         <div>
          <label htmlFor="numberOfExercises" className="block text-sm font-medium text-gray-300 mb-1">Số lượng (1-5):</label>
          <input
            type="number"
            id="numberOfExercises"
            value={numberOfExercises}
            onChange={(e) => setNumberOfExercises(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)))}
            min="1"
            max="5"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white"
          />
        </div>
      </div>

      <button
        onClick={handleGenerateExercises}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? <LoadingSpinner /> : 'Tạo Bài Tập'}
      </button>

      <ErrorMessage message={error} />
      {copySuccessMessage && <p className="text-green-400 text-center my-2">{copySuccessMessage}</p>}
      {isLoading && exercises.length === 0 && <LoadingSpinner />}

      {exercises.length > 0 && (
        <div className="mt-8 space-y-8">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="p-6 bg-gray-700 bg-opacity-80 rounded-lg shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-pink-400">{index + 1}. {exercise.tieuDe}</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => copyExerciseToMarkdown(exercise)}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-md transition duration-150"
                        title="Sao chép Markdown"
                        aria-label="Sao chép bài tập dạng Markdown"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m7.332 0M3.498 6.75l2.036-1.854A.75.75 0 016 4.5h12a.75.75 0 01.466.146l2.036 1.854a3.75 3.75 0 01.828 5.372l-.968 1.581a3.75 3.75 0 01-5.74 1.166l-1.042-.942a3.75 3.75 0 00-5.718 0l-1.042.942a3.75 3.75 0 01-5.74-1.166L.43 12.122a3.75 3.75 0 01.828-5.372Z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => toggleFavoriteExercise(exercise.id)}
                        className={`p-2 rounded-md shadow-md transition duration-150 ${exercise.isFavorite ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-500 hover:bg-gray-400'} text-white`}
                        title={exercise.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                        aria-label={exercise.isFavorite ? "Bỏ yêu thích bài tập này" : "Thêm bài tập này vào yêu thích"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill={exercise.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.324h5.372c.559 0 .81.691.419 1.07l-4.36 3.182a.563.563 0 00-.182.557l1.636 5.028a.563.563 0 01-.84.62l-4.506-3.54a.563.563 0 00-.652 0l-4.506 3.54a.563.563 0 01-.84-.62l1.636-5.028a.563.563 0 00-.182-.557l-4.36-3.182c-.39-.28-.14-.1.071-.419 1.07h5.372a.563.563 0 00.475-.324L11.48 3.5z" />
                        </svg>
                    </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-xl font-semibold text-pink-300 mb-2">Mô tả:</h4>
                {renderContentWithEnhancedFormatting(exercise.moTa, `ex-${exercise.id}-mota`)}
              </div>

              <div>
                <h4 className="text-xl font-semibold text-pink-300 mb-2">Đề bài:</h4>
                {renderContentWithEnhancedFormatting(exercise.deBai, `ex-${exercise.id}-debai`)}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {/* Simple Hint Button and Logic */}
                {!exercise.goiYDonGian && !exercise.isLoadingHint && (
                  <button
                    onClick={() => handleGenerateSimpleHint(exercise.id)}
                    disabled={exercise.isLoadingSolution}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
                  >
                    Gợi ý đơn giản
                  </button>
                )}
                 {exercise.isLoadingHint && <div className="w-full sm:w-auto"><LoadingSpinner /></div>}


                {/* Solution Button and Logic */}
                {!exercise.loiGiai && !exercise.isLoadingSolution && (
                  <button
                    onClick={() => handleGenerateSolution(exercise.id)}
                     disabled={exercise.isLoadingHint}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
                  >
                    Tạo lời giải
                  </button>
                )}
                {exercise.isLoadingSolution && !exercise.isLoadingHint && <div className="w-full sm:w-auto"><LoadingSpinner /></div>}
              </div>
              
              {exercise.goiYDonGian && !exercise.isLoadingHint && (
                <div className="mt-4">
                  <h4 className="text-xl font-semibold text-blue-300 mb-2">Gợi ý đơn giản:</h4>
                  {renderContentWithEnhancedFormatting(exercise.goiYDonGian, `ex-${exercise.id}-goiy`)}
                </div>
              )}

              {exercise.loiGiai && !exercise.isLoadingSolution && (
                <div className="mt-4">
                  <h4 className="text-xl font-semibold text-green-300 mb-2">Lời giải:</h4>
                  {renderContentWithEnhancedFormatting(exercise.loiGiai, `ex-${exercise.id}-loigiai`)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExerciseGenerator;