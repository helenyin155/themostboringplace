// src/pages/boringmap.js
import React from 'react';
import BoringMap from './../components/BoringMap'; // Import BoringMap component
import './../App.css'; // Custom styles (if necessary)

const BoringMapPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* Page Title
      <h1 className="text-4xl font-bold text-center mb-6">How Boring is My Location?</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">
        Click anywhere on the map below to find out how boring it is!
      </p> */}

      {/* The BoringMap Component */}
      <div className="w-full max-w-6xl">
        <BoringMap />
      </div>
    </div>
  );
};

export default BoringMapPage;
