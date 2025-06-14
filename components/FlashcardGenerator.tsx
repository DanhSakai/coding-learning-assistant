
import React, { useState, useCallback } from 'react';
import { Technology, Flashcard } from '../types';
import { TECHNOLOGY_MAP, TECHNOLOGIES_ARRAY } from '../constants';
import { generateFlashcards } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const FlashcardGenerator: React.FC = () => {
  const [selectedTechnology, setSelectedTechnology] = useState<Technology>(Technology.JAVASCRIPT);
  const [concept, setConcept] = useState<string>('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccessMessage, setCopySuccessMessage] = useState<string>('');

  const handleGenerateFlashcards = useCallback(async () => {
    if (!concept.trim()) {
      setError('Vui lòng nhập chủ đề để tạo flashcards.');
      return;
    }
    setIsLoading(true);
    setError('');
    setFlashcards([]);
    setCopySuccessMessage('');
    try {
      const generatedFlashcardsData = await generateFlashcards(selectedTechnology, concept);
      const newFlashcards = generatedFlashcardsData.map(fc => ({
        ...fc,
        id: crypto.randomUUID(),
        isFavorite: false,
      }));
      setFlashcards(newFlashcards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      if (newFlashcards.length === 0) {
        setError("Không có flashcard nào được tạo. Vui lòng thử lại với chủ đề khác.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTechnology, concept]);

  const handleNextCard = () => {
    if (flashcards.length > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
      setIsFlipped(false);
      setCopySuccessMessage('');
    }
  };

  const handlePrevCard = () => {
    if (flashcards.length > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
      setIsFlipped(false);
      setCopySuccessMessage('');
    }
  };

  const toggleFavorite = (id: string) => {
    setFlashcards(prevFlashcards =>
      prevFlashcards.map(card =>
        card.id === id ? { ...card, isFavorite: !card.isFavorite } : card
      )
    );
  };

  const copyToMarkdown = (card: Flashcard) => {
    const markdownText = `## Flashcard: ${concept} - ${TECHNOLOGY_MAP[selectedTechnology]}\n\n### Câu hỏi\n${card.cauHoi}\n\n### Câu trả lời\n${card.cauTraLoi}`;
    navigator.clipboard.writeText(markdownText)
      .then(() => setCopySuccessMessage('Đã sao chép vào clipboard!'))
      .catch(err => setError('Không thể sao chép: ' + err));
  };
  
  const currentFlashcard = flashcards[currentCardIndex];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Tạo Flashcard (ít nhất 5)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="technologyFlashcard" className="block text-sm font-medium text-gray-300 mb-1">Chọn công nghệ:</label>
          <select
            id="technologyFlashcard"
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
          <label htmlFor="concept" className="block text-sm font-medium text-gray-300 mb-1">Nhập chủ đề/khái niệm:</label>
          <input
            type="text"
            id="concept"
            value={concept}
            onChange={(e) => { setConcept(e.target.value); setCopySuccessMessage(''); }}
            placeholder="Ví dụ: 'closures trong JavaScript', 'React hooks'"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
          />
        </div>
      </div>

      <button
        onClick={handleGenerateFlashcards}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? <LoadingSpinner /> : 'Tạo Flashcards'}
      </button>

      <ErrorMessage message={error} />
      {copySuccessMessage && <p className="text-green-400 text-center">{copySuccessMessage}</p>}

      {isLoading && !flashcards.length && <LoadingSpinner />}

      {flashcards.length > 0 && currentFlashcard && (
        <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-xl">
          <div 
            className="relative w-full h-64 md:h-80 [perspective:1000px] group cursor-pointer"
            onClick={() => { setIsFlipped(!isFlipped); setCopySuccessMessage('');}}
            aria-live="polite"
            aria-label={`Flashcard: ${isFlipped ? 'Câu trả lời cho ' + currentFlashcard.cauHoi : 'Câu hỏi: ' + currentFlashcard.cauHoi}. Nhấn để lật.`}
          >
            <div 
              className={`absolute inset-0 w-full h-full rounded-lg shadow-lg p-6 flex flex-col justify-center items-center text-center transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >
              {/* Front of card */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 flex flex-col justify-center items-center backface-hidden">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Câu hỏi:</h3>
                <p className="text-lg md:text-xl text-indigo-100">{currentFlashcard.cauHoi}</p>
                <p className="absolute bottom-4 text-xs text-indigo-200">(Nhấn để xem câu trả lời)</p>
              </div>
              {/* Back of card */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-lg p-6 flex flex-col justify-center items-center backface-hidden rotate-y-180">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Câu trả lời:</h3>
                <p className="text-lg md:text-xl text-teal-100 whitespace-pre-line">{currentFlashcard.cauTraLoi}</p>
                 <p className="absolute bottom-4 text-xs text-teal-200">(Nhấn để xem câu hỏi)</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-between items-center gap-2">
            <button 
              onClick={handlePrevCard}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md shadow-md transition duration-150"
              aria-label="Flashcard trước"
            >
              Trước
            </button>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => copyToMarkdown(currentFlashcard)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-md transition duration-150"
                    title="Sao chép Markdown"
                    aria-label="Sao chép nội dung flashcard dạng Markdown"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m7.332 0M3.498 6.75l2.036-1.854A.75.75 0 016 4.5h12a.75.75 0 01.466.146l2.036 1.854a3.75 3.75 0 01.828 5.372l-.968 1.581a3.75 3.75 0 01-5.74 1.166l-1.042-.942a3.75 3.75 0 00-5.718 0l-1.042.942a3.75 3.75 0 01-5.74-1.166L.43 12.122a3.75 3.75 0 01.828-5.372Z" />
                    </svg>
                </button>
                <button
                    onClick={() => toggleFavorite(currentFlashcard.id)}
                    className={`p-2 rounded-md shadow-md transition duration-150 ${currentFlashcard.isFavorite ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-500 hover:bg-gray-400'} text-white`}
                    title={currentFlashcard.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    aria-label={currentFlashcard.isFavorite ? "Bỏ yêu thích flashcard này" : "Thêm flashcard này vào yêu thích"}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" fill={currentFlashcard.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.324h5.372c.559 0 .81.691.419 1.07l-4.36 3.182a.563.563 0 00-.182.557l1.636 5.028a.563.563 0 01-.84.62l-4.506-3.54a.563.563 0 00-.652 0l-4.506 3.54a.563.563 0 01-.84-.62l1.636-5.028a.563.563 0 00-.182-.557l-4.36-3.182c-.39-.28-.14-.1.071-.419 1.07h5.372a.563.563 0 00.475-.324L11.48 3.5z" />
                    </svg>
                </button>
                <p className="text-gray-300">{currentCardIndex + 1} / {flashcards.length}</p>
            </div>
            <button 
              onClick={handleNextCard}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md shadow-md transition duration-150"
              aria-label="Flashcard kế tiếp"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;
