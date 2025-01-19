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
      console.log('Attempting to fetch from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      setBoringData(data);
      setSelectedLocation({ lat, lng });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getBoringScoreColor = (score) => {
    const normalizedScore = Math.min(score / 45, 1);
    if (normalizedScore < 0.2) return 'bg-red-500';
    if (normalizedScore < 0.4) return 'bg-orange-500';
    if (normalizedScore < 0.6) return 'bg-yellow-500';
    if (normalizedScore < 0.8) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  const renderPlacesList = () => {
    if (!boringData?.landmarks) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-600">
                    No interesting places found in this area.
                    This might be the most boring place ever!
                </p>
            </div>
        );
    }
    else {
        return boringData.landmarks.map((place, index) => (
            <div key={index} className="p-3 bg-white rounded-lg shadow mb-2">
              <p className="font-medium text-gray-900">{place.name}</p>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <div 
                  className={`h-2 w-16 rounded ${getBoringScoreColor(place.boringScore)}`}
                />
                <span className="text-gray-600">
                  {place.boringScore.toFixed(1)} boring score
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <p className="line-clamp-1">{place.address}</p>
                <p>{place.distanceFromUser.toFixed(1)}km away</p>
              </div>
            </div>
          ));
        };
    }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">The Most Boring Place on Earth</h1>
        <p className="text-gray-600">click anywhere on the map to check its boring score!</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gray-100 rounded-lg h-[600px] relative">
          <MapComponent onLocationSelect={handleLocationSelect} />
          {boringData?.areaStats && <BoringScoreSound boringScore={boringData.areaStats.totalBoringScore} />}
          {selectedLocation && (
            <div className="absolute top-2 right-2 bg-white p-2 rounded shadow">
              {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </div>
          )}
        </div>

        <div className="space-y-4 h-[600px] flex flex-col">
          {loading ? (
            <div className="p-4 bg-white rounded-lg shadow">
              <p>are you bored...</p>
            </div>
          ) : boringData ? (
            <>
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Area Statistics</h2>
                <div className="space-y-2">
                  {boringData.areaStats && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Area Boring Score</p>
                        <div className="flex items-center space-x-2">
                          <div 
                            className={`h-4 w-full rounded ${getBoringScoreColor(boringData.areaStats.totalBoringScore)}`}
                          />
                          <span className="font-mono">
                            {boringData.areaStats.totalBoringScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p>Places found: {boringData.areaStats.numPlaces}</p>
                      <p>Average distance: {boringData.areaStats.averageDistance.toFixed(1)}km</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">most interest places :(</h2>
                </div>
                <div className="p-2 flex-1 overflow-y-auto bg-gray-50">
                  {renderPlacesList()}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-gray-600">Select a location on the map to see its boring score!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoringMap;