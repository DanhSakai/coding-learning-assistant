
import React, { useState } from 'react';
import { Feature } from './types';
import { FEATURE_MAP } from './constants';
import Navbar from './components/Navbar';
import LearnTopic from './components/LearnTopic'; // Import the new component
import FlashcardGenerator from './components/FlashcardGenerator';
import ExerciseGenerator from './components/ExerciseGenerator';
import ProjectIdeaGenerator from './components/ProjectIdeaGenerator';

const App: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState<Feature>(
    Feature.LEARN // Set LEARN as the default feature
  );

  const renderFeatureComponent = () => {
    switch (currentFeature) {
      case Feature.LEARN:
        return <LearnTopic />; // Render LearnTopic component
      case Feature.FLASHCARDS:
        return <FlashcardGenerator />;
      case Feature.EXERCISES:
        return <ExerciseGenerator />;
      case Feature.PROJECT_IDEAS:
        return <ProjectIdeaGenerator />;
      default:
        // Fallback to LEARN if something unexpected happens, or choose another sensible default
        return <LearnTopic />; 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-gray-100 flex flex-col items-center p-4">
      <header className="w-full max-w-5xl mb-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            AI Hỗ Trợ Học Lập Trình
          </h1>
          <p className="text-lg text-gray-300 mt-2">Nâng cao kỹ năng lập trình của bạn với sự trợ giúp từ AI</p>
        </div>
        <Navbar currentFeature={currentFeature} setCurrentFeature={setCurrentFeature} />
      </header>
      <main className="w-full max-w-5xl bg-gray-800 bg-opacity-70 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10">
        {renderFeatureComponent()}
      </main>
      <footer className="w-full max-w-5xl mt-12 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Learning Assistant. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;