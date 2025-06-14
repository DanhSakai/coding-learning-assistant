
import React from 'react';
import { Feature } from '../types';
import { FEATURE_MAP } from '../constants';

interface NavbarProps {
  currentFeature: Feature;
  setCurrentFeature: (feature: Feature) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentFeature, setCurrentFeature }) => {
  return (
    <nav className="flex justify-center space-x-2 md:space-x-4 bg-gray-800 bg-opacity-50 p-3 rounded-lg shadow-md mb-6">
      {Object.values(Feature).map((feature) => (
        <button
          key={feature}
          onClick={() => setCurrentFeature(feature)}
          className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500
            ${currentFeature === feature
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
        >
          {FEATURE_MAP[feature]}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
