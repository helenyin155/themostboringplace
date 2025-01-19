import React, { useEffect, useRef, useState } from 'react';
import './MapComponents.css';

const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [geoJSONLoaded, setGeoJSONLoaded] = useState(false);
  const [provinceScores, setProvinceScores] = useState({});

  const fetchProvinceScores = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/province-scores');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProvinceScores(data);
    } catch (error) {
      console.error('Error fetching province scores:', error);
      setError('Failed to load province scores');
    }
  };

  const getColorForScore = (score) => {
    if (score >= 80) return '#52489C'; // purple
    if (score >= 60) return '#1D2D44'; // blue
    if (score >= 40) return '#4A7856'; // green
    if (score >= 20) return '#DC602E'; // orange
    return '#E71D36'; // red
  };

  const fetchGeoJSON = async () => {
    try {
      const response = await fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_1_states_provinces_lakes.geojson');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching GeoJSON:', error);
      throw error;
    }
  };

  const loadGeoJsonLayer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Only create and load the layer if it hasn't been loaded before
      if (!geoJSONLoaded) {
        // Create new Data layer
        boundaryLayerRef.current = new window.google.maps.Data();
        
        // Fetch and load GeoJSON data
        const geoJSONData = await fetchGeoJSON();
    
        // Filter out Brazil and Australia
        const filteredFeatures = geoJSONData.features.filter((feature) => {
          const countryName = feature.properties.admin;
          return countryName !== 'Brazil' && countryName !== 'Australia';
        });
    
        // Create a new GeoJSON object with filtered features
        const filteredGeoJSONData = {
          type: 'FeatureCollection',
          features: filteredFeatures,
        };
    
        boundaryLayerRef.current.addGeoJson(filteredGeoJSONData);
    
        // Style the GeoJSON layer
        boundaryLayerRef.current.setStyle((feature) => {
          const provinceName = feature.getProperty('name');
          const score = provinceScores[provinceName] || 0;
    
          return {
            fillColor: getColorForScore(score),
            fillOpacity: 0.4,
            strokeWeight: 0.5,
            strokeColor: '#000000',
            strokeOpacity: 0.4,
          };
        });
    
        // Add hover effect
        boundaryLayerRef.current.addListener('mouseover', (event) => {
          boundaryLayerRef.current.overrideStyle(event.feature, {
            fillOpacity: 0.8,
            strokeWeight: 2,
          });
        });
    
        boundaryLayerRef.current.addListener('mouseout', (event) => {
          boundaryLayerRef.current.revertStyle();
        });
    
        // Add click event with InfoWindow
        const infoWindow = new window.google.maps.InfoWindow();
        boundaryLayerRef.current.addListener('click', (event) => {
          const provinceName = event.feature.getProperty('name');
          const score = provinceScores[provinceName] || 0;
    
          infoWindow.setContent(
            `<div class="p-2">
              <h3 class="font-bold">${provinceName}</h3>
              <p>Score: ${score}</p>
            </div>`
          );
          infoWindow.setPosition(event.latLng);
          infoWindow.open(mapInstanceRef.current);
        });

        setGeoJSONLoaded(true);
      }

      // Toggle the map visibility
      boundaryLayerRef.current.setMap(showHeatmap ? mapInstanceRef.current : null);
  
      setIsLoading(false);
    } catch (error) {
      console.error('Error in loadGeoJsonLayer:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

    // Add useEffect to fetch province scores when component mounts
    useEffect(() => {
      fetchProvinceScores();
    }, []);
    
    // Modified useEffect to reload GeoJSON layer when provinceScores change
    useEffect(() => {
      if (mapInstanceRef.current && Object.keys(provinceScores).length > 0) {
        loadGeoJsonLayer();
      }
    }, [showHeatmap, provinceScores]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', initMap);

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initMap = () => {
    const defaultLocation = { lat: 43.6607, lng: -79.3966 }; // San Francisco
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });
    
    mapInstanceRef.current = map;

    // Create the search box
    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search for a location';
    searchInput.className = 'map-search-box';
    searchInput.type = 'text';
    
    // Style the search box
    searchInput.style.cssText = `
      box-sizing: border-box;
      border: 1px solid transparent;
      width: 240px;
      height: 40px;
      padding: 0 12px;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      font-size: 14px;
      outline: none;
      text-overflow: ellipses;
      margin: 10px;
    `;

    map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchInput);
    const searchBox = new window.google.maps.places.SearchBox(searchInput);
    searchBoxRef.current = searchBox;

    // Listen for the event when a user selects a prediction
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();

      if (places.length === 0) return;

      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;

      // Center map on the selected place
      map.setCenter(place.geometry.location);
      map.setZoom(14);

      // Create a marker and trigger the location select
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
      }

      selectedMarkerRef.current = new window.google.maps.Marker({
        map,
        position: place.geometry.location,
        animation: window.google.maps.Animation.DROP
      });

      onLocationSelect(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
    });

    // Bias the SearchBox results towards current map's viewport
    map.addListener('bounds_changed', () => {
      searchBox.setBounds(map.getBounds());
    });

    // Handle clicks on the map
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
      }

      selectedMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        animation: window.google.maps.Animation.DROP
      });

      onLocationSelect(lat, lng);
    });
  };

  return (
    <div className="relative w-full h-full rounded-lg">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      <div className="absolute top-2.5 right-12 bg-white p-1 rounded shadow">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded"
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      {isLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
          Loading map data...
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 right-4 bg-red-50 text-red-600 p-2 rounded shadow">
          Error loading map data: {error}
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
        <div className="text-sm font-bold mb-1">Score Legend</div>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#52489C' }}></div>
            <span className="text-xs">80-100</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#1D2D44' }}></div>
            <span className="text-xs">60-79</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#4A7856' }}></div>
            <span className="text-xs">40-59</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#DC602E' }}></div>
            <span className="text-xs">20-39</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#E71D36' }}></div>
            <span className="text-xs">0-19</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;