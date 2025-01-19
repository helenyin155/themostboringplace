require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');


// Rest of your code...
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Define allowed place types
const ALLOWED_TYPES = new Set([
    'bar',
    'night_club',
    'casino',
    'liquor_store',
    'place_of_worship'
]);

// Function to fetch nearby landmarks
async function fetchNearbyLandmarks(latitude, longitude) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('Google API key is not configured');
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    let allPlaces = [];
    let pageToken = null;

    const userLocation = { latitude, longitude };

    try {
        do {
            const params = {
                location: `${latitude},${longitude}`,
                radius: 5000, // 5km in meters
                key: apiKey,
                type: Array.from(ALLOWED_TYPES).join('|')
            };

            if (pageToken) {
                params.pagetoken = pageToken;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const response = await axios.get(baseUrl, { params });
            
            if (response.data.status === 'REQUEST_DENIED') {
                throw new Error(`API request denied: ${response.data.error_message}`);
            }

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                throw new Error(`API returned status: ${response.data.status}`);
            }

            const places = response.data.results || [];
            const filteredPlaces = places.filter(place => 
                place.types.some(type => ALLOWED_TYPES.has(type))
            );
            
            // Process each place with scoring
            const processedPlaces = filteredPlaces.map(place => {
                const scores = calculateLocationScore(place, userLocation);
                const distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    place.geometry.location.lat,
                    place.geometry.location.lng
                );

                return {
                    name: place.name,
                    types: place.types.filter(type => ALLOWED_TYPES.has(type)),
                    address: place.vicinity,
                    rating: place.rating,
                    userRatingsTotal: place.user_ratings_total,
                    location: place.geometry.location,
                    score: scores.excitementScore,
                    boringScore: scores.boringScore,
                    scoreDetails: scores.details,
                    distanceFromUser: Math.round(distance * 100) / 100,
                    isWithinRadius: distance <= 10
                };
            });
            
            allPlaces = [...allPlaces, ...processedPlaces];
            pageToken = response.data.next_page_token;

        } while (pageToken);

        // Sort places by score before returning
        const sortedPlaces = allPlaces.sort((a, b) => b.score - a.score);
        // total boring score 

        const totalInterestingScore = allPlaces.reduce((sum, place) => sum +  (100 - place.boringScore), 0)/60;

        // Calculate area's total boring score
        const totalBoringScore = 100 - totalInterestingScore;

        if (allPlaces.length == 0) {
            totalBoringScore = 100;
        }

        return {
            userLocation: {
                latitude,
                longitude
            },
            total: sortedPlaces.length,
            places: sortedPlaces,
            areaStats: {
                totalBoringScore: Math.round(totalBoringScore * 100) / 100,
                numPlaces: sortedPlaces.length,
                averageDistance: Math.round(
                    sortedPlaces.reduce((sum, place) => sum + place.distanceFromUser, 0) / sortedPlaces.length * 100
                ) / 100
            }
        };

    } catch (error) {
        console.error('Error fetching places:', error);
        throw error;
    }
}

// Helper function for calculating distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateLocationScore(place, userLocation) {
    const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
    );
    
    // Score based on distance (closer is better)
    const distanceScore = Math.max(0, 1 - (distance / 10));
    
    // Score based on rating
    const ratingScore = (place.rating || 0) / 5;
    
    // Score based on number of ratings
    const ratingsCountScore = Math.min(1, (place.user_ratings_total || 0) / 100);
    
    // Calculate excitement score (weighted average)
    const excitementScore = (distanceScore * 0.4) + (ratingScore * 0.4) + (ratingsCountScore * 0.2);
    
    // Calculate boring score (inverse of excitement score)
    const boringScore = (1 - excitementScore)*100;
    
    return {
        excitementScore,
        boringScore,
        details: {
            distanceScore,
            ratingScore,
            ratingsCountScore
        }
    };
}

// API endpoint for nearby landmarks
app.get('/api/nearby-landmarks', async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({
            error: 'Missing parameters',
            message: 'Both latitude and longitude are required'
        });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
        });
    }

    try {
        const results = await fetchNearbyLandmarks(lat, lng);
        res.json(results);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

// API endpoint for nearby places
app.get('/nearby-places', async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({
            error: 'Missing parameters',
            message: 'Both latitude and longitude are required'
        });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
        });
    }

    try {
        const results = await fetchNearbyLandmarks(lat, lng);
        res.json({
            userLocation: results.userLocation,
            landmarks: results.places,
            totalLandmarks: results.total,
            areaStats: results.areaStats
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});