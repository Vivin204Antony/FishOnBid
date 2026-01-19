import { useState } from 'react';
import { getAiPriceSuggestion } from '../api/aiService';

/**
 * AI Price Suggestion Component
 * Displays AI-recommended pricing with accept/edit options
 */
export default function AiPriceSuggestion({
    fishName,
    quantityKg,
    location,
    onAccept,
    onEdit
}) {
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const fetchSuggestion = async () => {
        if (!fishName) {
            setError('Please enter fish name first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getAiPriceSuggestion({
                fishName,
                quantityKg: quantityKg || 1,
                location: location || ''
            });
            setSuggestion(result);
        } catch (err) {
            setError('Failed to get AI suggestion. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = () => {
        if (suggestion && onAccept) {
            onAccept(suggestion.suggestedPrice);
        }
    };

    const handleEdit = () => {
        if (suggestion && onEdit) {
            onEdit(suggestion.suggestedPrice);
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <span>🤖</span> AI Price Assistant
                </h3>

                {!loading && (
                    <button
                        onClick={fetchSuggestion}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <span>✨</span> Get AI Suggestion
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-blue-600">Analyzing market data...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-red-600 text-sm">❌ {error}</p>
                </div>
            )}

            {suggestion && !loading && (
                <div className="space-y-4">
                    {/* Main Price Display */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Suggested Starting Price</p>
                            <p className="text-4xl font-bold text-green-600">
                                ₹{suggestion.suggestedPrice.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">per kg</p>
                        </div>

                        {/* Price Range */}
                        <div className="flex justify-center gap-8 mt-4 pt-4 border-t">
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Min</p>
                                <p className="text-lg font-semibold text-orange-500">
                                    ₹{suggestion.minPrice.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Max</p>
                                <p className="text-lg font-semibold text-blue-500">
                                    ₹{suggestion.maxPrice.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Bid Step</p>
                                <p className="text-lg font-semibold text-purple-500">
                                    ₹{suggestion.bidIncrement.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 
                       flex items-center gap-2"
                    >
                        <span>{showDetails ? '▼' : '▶'}</span>
                        {showDetails ? 'Hide' : 'Show'} AI Reasoning
                    </button>

                    {showDetails && (
                        <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{suggestion.explanation}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Based on {suggestion.dataPointsUsed} historical auction(s)
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleAccept}
                            className="flex-1 py-3 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700 transition-colors font-medium
                         flex items-center justify-center gap-2"
                        >
                            <span>✓</span> Accept Price
                        </button>
                        <button
                            onClick={handleEdit}
                            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg 
                         hover:bg-gray-300 transition-colors font-medium
                         flex items-center justify-center gap-2"
                        >
                            <span>✎</span> Edit Price
                        </button>
                    </div>
                </div>
            )}

            {!suggestion && !loading && !error && (
                <p className="text-sm text-gray-500 text-center py-4">
                    Click "Get AI Suggestion" to receive a data-driven price recommendation
                </p>
            )}
        </div>
    );
}
