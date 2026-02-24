import api from './axios';

/**
 * Vision Service - Handles AI Vision (GPT-4o) API calls for fish image analysis
 */

/**
 * Analyze a fish image using AI Vision.
 * Returns detected fish type, freshness score, quality grade, and explanation.
 * 
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} [fishType] - Optional hint for context
 * @returns {Promise<Object>} Vision analysis response
 */
export const analyzeImage = async (imageBase64, fishType = null) => {
    try {
        const response = await api.post('/ai/vision/analyze', {
            imageBase64,
            fishType
        });
        return response.data;
    } catch (error) {
        console.error('Vision Analysis Error:', error);
        throw error;
    }
};

/**
 * Get vision service status
 * @returns {Promise<Object>} Vision service status
 */
export const getVisionStatus = async () => {
    try {
        const response = await api.get('/ai/vision/status');
        return response.data;
    } catch (error) {
        console.error('Vision Status Error:', error);
        return { enabled: false, mode: 'UNAVAILABLE' };
    }
};

export default {
    analyzeImage,
    getVisionStatus
};
