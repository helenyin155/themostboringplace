import React, { useState } from 'react';
import MapComponent from './MapComponents';
import BoringScoreSound from './BoringScoreSound';

const BoringMap = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [boringData, setBoringData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocationSelect = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${process.env.REACT_APP_API_URL}/nearby-places?latitude=${lat}&longitude=${lng}`;
      const response = await fetch(url);
      const data = await response.json();

      // If no landmarks found, set boring score to infinity
      if (!data.landmarks || data.landmarks.length === 0) {
        data.areaStats = {
          ...data.areaStats,
          totalBoringScore: Infinity,
          numPlaces: 0,
          averageDistance: 0
        };
      }

      setBoringData(data);
      setSelectedLocation({ lat, lng });
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarColor = (score) => {
    if (score > 80) return '#EF4444'; // red-500
    if (score > 60) return '#F97316'; // orange-500
    if (score > 40) return '#EAB308'; // yellow-500
    if (score > 20) return '#22C55E'; // green-500
    return '#16A34A'; // green-600
  };

  const renderProgressBar = (score, max = 100) => {
    const width = (score / max) * 100;
    const color = getProgressBarColor(score);
    return (
      <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full"
          style={{ 
            width: `${width}%`,
            background: `repeating-linear-gradient(45deg,${color},${color} 10px,${adjustColorBrightness(color, -20)} 10px,${adjustColorBrightness(color, -20)} 20px)`
          }}
        />
      </div>
    );
  };

  // Helper function to darken/lighten color for stripes
  const adjustColorBrightness = (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const renderPlacesList = () => {
    if (!boringData?.landmarks || boringData.landmarks.length === 0) {
      return (
        <div className="bg-white rounded-[24px] p-6 mb-4">
          <p className="text-lg mb-3">literally nothing. this might be the most boring place on earth</p>
        </div>
      );
    }

    return boringData.landmarks.map((place, index) => (
      <div key={index} className="bg-white rounded-[24px] p-6 mb-4">
        <h3 className="text-lg font-bold mb-3">{place.name}</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-32 h-1 bg-gray-200 rounded-full">
          <div 
            className="h-full rounded-full"
            style={{
              width: `${(place.boringScore / 100) * 100}%`,
              backgroundColor: getProgressBarColor(place.boringScore),
            }}
          />

          </div>
          <span className="text-sm text-gray-600">
            {place.boringScore.toFixed(1)} boringness
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">{place.address}</p>
        <p className="text-sm text-gray-600">{place.distanceFromUser.toFixed(1)}km away</p>
      </div>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-ibm-plex relative">
      {/* Close Button */}
      <button
        onClick={() => console.log('Close button clicked!')}
        className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 font-balsamiq">how boring is my location?</h1>
        <p className="text-gray-600">click anywhere on the map to find out</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Map and Area Statistics */}
        <div className="space-y-8 md:col-span-8">
          <div className="bg-gray-50 rounded-2xl h-[600px] relative">
            <MapComponent onLocationSelect={handleLocationSelect} />
            {boringData?.areaStats && (
              <BoringScoreSound boringScore={boringData.areaStats.totalBoringScore} />
            )}
            {selectedLocation && (
              <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-xl shadow-sm">
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] p-8 border-2 border-black shadow-[8px_8px_0_0_#000000]">
            {loading ? (
              <h2 className="text-xl font-semibold">calculating boringness...</h2>
            ) : boringData ? (
              <>
                <h2 className="text-2xl font-semibold mb-6">
                  {boringData.areaStats.totalBoringScore > 50 
                    ? "womp womp! this place is boring... 😴😴"
                    : boringData.areaStats.totalBoringScore > 30
                      ? "meh, it's okay i guess 🤷‍♂️"
                      : "hooray! this place looks fun! 🎉"
                  }
                </h2>
                <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${boringData.areaStats.totalBoringScore}%`,
                        background: `repeating-linear-gradient(45deg, ${getProgressBarColor(
                          boringData.areaStats.totalBoringScore
                        )}, ${getProgressBarColor(boringData.areaStats.totalBoringScore)} 10px, #FFFFFF 10px, #FFFFFF 20px)`,
                      }}
                    />
                  </div>
                  <span className="text-lg whitespace-nowrap">
                    {boringData.areaStats.totalBoringScore.toFixed(1)} boringness
                  </span>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Places found</p>
                    <p className="text-xl font-semibold">{boringData.areaStats.numPlaces}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average distance</p>
                    <p className="text-xl font-semibold">{boringData.areaStats.averageDistance.toFixed(1)}km</p>
                  </div>
                </div>
              </>
            ) : (
              <h2 className="text-xl font-semibold">Click on the map!!</h2>
            )}
          </div>
        </div>

                  {/* Right Column: Scrollable Places List */}
        <div className="md:col-span-4 pt-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">calculating boringness...</p>
            </div>
          ) : (boringData && boringData.areaStats) ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Most interesting places near me</h2>
              <div className="overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>
                {renderPlacesList()}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BoringMap;
