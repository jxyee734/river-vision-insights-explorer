import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateStateWaterQuality } from '@/utils/stateWaterQuality';

const NavigationBar: React.FC = () => {
  const [showWaterQuality, setShowWaterQuality] = useState(false);

  const toggleWaterQuality = () => {
    setShowWaterQuality(!showWaterQuality);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link to="/weather" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Weather
            </Link>
            <Link to="/analysis" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium">
              Analysis
            </Link>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleWaterQuality}
              className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium"
            >
              Water Quality Index
            </button>
          </div>
        </div>
      </div>
      {showWaterQuality && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 overflow-auto" style={{ maxHeight: '80vh' }}>
            <h2 className="text-2xl font-bold mb-4">Malaysia States Water Quality Index</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generateStateWaterQuality().map((stateData) => (
                <div key={stateData.state} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">{stateData.state}</h3>
                  <div className={`mt-2 px-3 py-1 rounded-full inline-block ${stateData.waterQualityIndex.color}`}>
                    {stateData.waterQualityIndex.label} ({stateData.waterQualityIndex.index})
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>pH: {stateData.phValue.toFixed(2)}</p>
                    <p>BOD: {stateData.bodLevel.toFixed(2)} mg/L</p>
                    <p>NH3-N: {stateData.ammoniacalNitrogen.toFixed(2)} mg/L</p>
                    <p>SS: {stateData.suspendedSolids.toFixed(2)} mg/L</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={toggleWaterQuality}
              className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;