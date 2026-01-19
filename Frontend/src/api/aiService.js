import api from './axios';

/**
 * AI Service - Handles AI-powered price suggestion API calls
 */

/**
 * Get AI-assisted price suggestion for auction listing
 * @param {Object} request - Price suggestion request
 * @param {string} request.fishName - Type of fish
 * @param {number} request.quantityKg - Weight in kg
 * @param {string} request.location - Market/harbor location
 * @param {number} [request.freshnessScore] - Optional quality score (0-100)
 * @returns {Promise<Object>} Price suggestion response
 */
export const getAiPriceSuggestion = async (request) => {
  try {
    const response = await api.post('/ai/price-suggestion', request);
    return response.data;
  } catch (error) {
    console.error('AI Price Suggestion Error:', error);
    throw error;
  }
};

/**
 * Get AI price suggestion with image analysis
 * @param {Object} request - Complete suggestion request
 * @param {string} request.fishName - Type of fish
 * @param {number} request.quantityKg - Weight in kg
 * @param {string} request.location - Market/harbor location
 * @param {string[]} [request.images] - Base64 encoded images
 * @returns {Promise<Object>} Price suggestion with vision analysis
 */
export const getAiCompleteSuggestion = async (request) => {
  try {
    const response = await api.post('/ai/price-suggestion/complete', request);
    return response.data;
  } catch (error) {
    console.error('AI Complete Suggestion Error:', error);
    throw error;
  }
};

/**
 * Check AI service health
 * @returns {Promise<Object>} Health status
 */
export const checkAiHealth = async () => {
  try {
    const response = await api.get('/ai/health');
    return response.data;
  } catch (error) {
    console.error('AI Health Check Error:', error);
    return { status: 'DOWN', error: error.message };
  }
};

/**
 * Get AI price suggestion with image analysis (alias for frontend consistency)
 */
export const getCompletePriceSuggestion = getAiCompleteSuggestion;

export default {
  getAiPriceSuggestion,
  getAiCompleteSuggestion,
  getCompletePriceSuggestion,
  checkAiHealth
};
