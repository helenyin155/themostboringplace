import React, { useEffect, useRef } from 'react';

const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', initMap);

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initMap = () => {
    const defaultLocation = { lat: 43.660697, lng: -79.396812}; // San Francisco
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
    <div ref={mapRef} className="w-full h-full rounded-lg" />
  );
};

export default MapComponent;