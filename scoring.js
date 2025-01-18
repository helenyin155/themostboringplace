const axios = require('axios');

// Place type base scores
const PLACE_TYPE_SCORES = {
  bar: 80,
  night_club: 90,
  casino: 60,
  liquor_store: 40,
  place_of_worship: 50
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

// Helper function to convert degrees to radians
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Function to calculate weighted score
function calculateLocationScore(location, userLocation) {
  // First, check if the place type exists in our scoring system
  if (!location.types || !PLACE_TYPE_SCORES.hasOwnProperty(location.types[0])) {
    return 0; // If place type not in our list, return 0
  }

  // Base score from place type
  let baseScore = PLACE_TYPE_SCORES[location.types[0]];

  // Calculate distance
  const distance = calculateDistance(
    userLocation.latitude, 
    userLocation.longitude, 
    location.geometry.location.lat, 
    location.geometry.location.lng
  );

  // Weight score based on distance (within 10km radius)
  if (distance > 10) {
    return 0; // Outside radius
  }

  // Distance weighting: closer locations get full score, 
  // locations further away get progressively lower scores
  const distanceWeight = 1 - (distance / 10);
  const weightedScore = baseScore * distanceWeight;

  return Math.round(weightedScore);
}

module.exports = {
  calculateLocationScore,
  PLACE_TYPE_SCORES
};