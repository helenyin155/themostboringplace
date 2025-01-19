import React, { useEffect, useRef, useState } from 'react';
import './MapComponents.css';

const MapComponent = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    // Load Google Maps script
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
      border-radius: 4px;
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
    <div ref={mapRef} className="w-full h-full rounded-lg" />
  );
};

export default MapComponent;