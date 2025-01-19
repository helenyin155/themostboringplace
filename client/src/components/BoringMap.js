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
    if (score > 80) return '#EF4444';
    if (score > 60) return '#F97316';
    if (score > 40) return '#EAB308';
    if (score > 20) return '#22C55E';
    return '#16A34A';
  };

  const renderProgressBar = (score, max = 100) => {
    const width = (score / max) * 100;
    const color = getProgressBarColor(score);
    return (
      <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
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
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm mb-3">literally nothing. this might be the most boring place on earth</p>
        </div>
      );
    }

    return boringData.landmarks.map((place, index) => (
      <div key={index} className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">{place.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-24 h-1 bg-gray-200 rounded-full">
            <div 
              className="h-full rounded-full"
              style={{
                width: `${(place.boringScore / 100) * 100}%`,
                backgroundColor: getProgressBarColor(place.boringScore),
              }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {place.boringScore.toFixed(1)} boringness
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-1">{place.address}</p>
        <p className="text-xs text-gray-600">{place.distanceFromUser.toFixed(1)}km away</p>
      </div>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-ibm-plex relative">
      <button
        onClick={() => console.log('Close button clicked!')}
        className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 font-balsamiq">the most boring place on earth</h1>
        <p className="text-gray-600 text-sm">discover how boring the world really is</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="space-y-6 md:col-span-8">
          <div className="bg-gray-50 rounded-lg h-[350px] relative">
            <MapComponent onLocationSelect={handleLocationSelect} />
            {boringData?.areaStats && (
              <BoringScoreSound boringScore={boringData.areaStats.totalBoringScore} />
            )}
            {selectedLocation && (
              <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-lg shadow-sm">
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-black shadow-lg">
            {loading ? (
              <h2 className="text-lg font-semibold">calculating boringness...</h2>
            ) : boringData ? (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {boringData.areaStats.totalBoringScore > 50 
                    ? "womp womp! this place is boring... 😴😴"
                    : boringData.areaStats.totalBoringScore > 30
                      ? "meh, it's okay i guess 🤷‍♂️"
                      : "hooray! this place looks fun! 🎉"
                  }
                </h2>
                <div className="mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-full h-6 bg-gray-100 rounded-lg overflow-hidden">
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
                  <span className="text-sm whitespace-nowrap">
                    {boringData.areaStats.totalBoringScore.toFixed(1)} boringness
                  </span>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Places found</p>
                    <p className="text-lg font-semibold">{boringData.areaStats.numPlaces}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average distance</p>
                    <p className="text-lg font-semibold">{boringData.areaStats.averageDistance.toFixed(1)}km</p>
                  </div>
                </div>
              </>
            ) : (
              <h2 className="text-lg font-semibold">click anywhere on the map to find out</h2>
            )}
          </div>
        </div>

        <div className="md:col-span-4 pt-2">
          {loading ? (
            <div className="text-center py-6">
              <p className="text-gray-600 text-sm">calculating boringness...</p>
            </div>
          ) : (boringData && boringData.areaStats) ? (
            <div>
              <h2 className="text-lg font-bold mb-4">Interesting places near me</h2>
              <div className="overflow-y-auto" style={{ height: '500px' }}>
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
