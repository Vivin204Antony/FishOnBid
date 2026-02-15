import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import aiService from '../api/aiService';
import { AuthContext } from '../context/AuthContext';
import {
    Fish, MapPin, Scale, Camera, FileText, Clock, Sparkles,
    CheckCircle2, AlertCircle, Loader2, Rocket,
    Info, ThumbsUp
} from 'lucide-react';

/**
 * Create Auction Page with Complete AI-Assisted Workflow
 * Professional Lucide Icons throughout
 */
export default function CreateAuction() {
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [form, setForm] = useState({
        fishName: '',
        startPrice: '',
        location: '',
        quantityKg: '',
        durationHours: 24,
        sellerNotes: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setAiResult(null);
        }
    };

    const handleAiAnalysis = async () => {
        if (!form.fishName) {
            setAiError('Please enter the fish type first');
            return;
        }

        setAiLoading(true);
        setAiError('');

        try {
            const response = await aiService.getCompletePriceSuggestion({
                fishName: form.fishName,
                quantityKg: parseFloat(form.quantityKg) || 10,
                location: form.location || 'Unknown',
                freshnessScore: 85
            });

            console.log('AI Response:', response); // Debug log

            // Backend returns flat structure, not nested priceResult/visionResult
            setAiResult({
                suggestedPrice: response.suggestedPrice,
                minPrice: response.minPrice,
                maxPrice: response.maxPrice,
                bidIncrement: response.bidIncrement,
                explanation: response.explanation,
                dataPointsUsed: response.dataPointsUsed,
                breakdown: response.breakdown || null
            });

        } catch (err) {
            console.error('AI Analysis failed:', err);
            setAiError('AI analysis unavailable. You can still set price manually.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAcceptAiPrice = () => {
        if (aiResult?.suggestedPrice) {
            setForm(prev => ({ ...prev, startPrice: aiResult.suggestedPrice.toFixed(2) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + form.durationHours * 60 * 60 * 1000);

            const auctionData = {
                fishName: form.fishName,
                startPrice: parseFloat(form.startPrice),
                currentPrice: parseFloat(form.startPrice),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                active: true,
                location: form.location || null,
                quantityKg: form.quantityKg ? parseFloat(form.quantityKg) : null,
                sellerNotes: form.sellerNotes || null,
                freshnessScore: aiResult?.freshnessScore || null,
                aiSuggestedPrice: aiResult?.suggestedPrice || null,
                aiSuggestionAccepted: aiResult?.suggestedPrice &&
                    parseFloat(form.startPrice) === aiResult.suggestedPrice,
                aiExplanation: aiResult?.explanation || null
            };

            await api.post('/auctions', auctionData);
            setSuccess(true);

            setTimeout(() => {
                navigate('/auctions');
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create auction');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
                    <p className="text-red-600 font-bold">Please login to create an auction</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Fish className="w-8 h-8" /> Create New Auction
                        </h1>
                        <p className="mt-2 text-blue-100">
                            Upload your catch photo and let AI help you set the perfect price
                        </p>
                    </div>

                    <div className="p-6">
                        {success ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                                <h2 className="text-2xl font-bold text-green-600">Auction Created!</h2>
                                <p className="text-gray-500 mt-2">Redirecting to auctions...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Image Upload */}
                                <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Camera className="w-4 h-4" /> Fish Image (Optional but recommended)
                                    </label>

                                    <div className="flex flex-col md:flex-row gap-4 items-center">
                                        <div className="w-full md:w-1/2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="fishImage"
                                            />
                                            <label
                                                htmlFor="fishImage"
                                                className="block w-full p-6 text-center border-2 border-dashed 
                                                           border-blue-300 rounded-xl cursor-pointer 
                                                           hover:bg-blue-50 transition-colors"
                                            >
                                                {imagePreview ? (
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="max-h-40 mx-auto rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="text-gray-500">
                                                        <Camera className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                                        <p>Click to upload fish photo</p>
                                                        <p className="text-xs mt-1">For AI quality analysis</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>

                                        {imagePreview && (
                                            <div className="text-center">
                                                <CheckCircle2 className="w-6 h-6 mx-auto text-green-500 mb-1" />
                                                <p className="text-sm text-green-600 font-medium">Image ready</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Fish Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Fish className="w-4 h-4" /> Fish Type *
                                    </label>
                                    <select
                                        name="fishName"
                                        value={form.fishName}
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select fish type</option>
                                        <option value="Tuna">Tuna</option>
                                        <option value="Salmon">Salmon</option>
                                        <option value="Mackerel">Mackerel</option>
                                        <option value="Pomfret">Pomfret</option>
                                        <option value="Sardine">Sardine</option>
                                        <option value="Kingfish">Kingfish</option>
                                        <option value="Seer Fish">Seer Fish</option>
                                        <option value="Prawns">Prawns</option>
                                        <option value="Lobster">Lobster</option>
                                        <option value="Crab">Crab</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Location & Quantity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Harbor / Location *
                                        </label>
                                        <select
                                            name="location"
                                            value={form.location}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select location</option>
                                            <option value="Chennai Harbor">Chennai Harbor</option>
                                            <option value="Vizag Harbor">Vizag Harbor</option>
                                            <option value="Kochi Harbor">Kochi Harbor</option>
                                            <option value="Mumbai Harbor">Mumbai Harbor</option>
                                            <option value="Goa Harbor">Goa Harbor</option>
                                            <option value="Mangalore Harbor">Mangalore Harbor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Scale className="w-4 h-4" /> Quantity (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            name="quantityKg"
                                            value={form.quantityKg}
                                            onChange={handleChange}
                                            placeholder="50"
                                            min="0.1"
                                            step="0.1"
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Seller Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Seller Notes (Optional)
                                    </label>
                                    <textarea
                                        name="sellerNotes"
                                        value={form.sellerNotes}
                                        onChange={handleChange}
                                        placeholder="e.g., Caught this morning, very fresh, ice preserved..."
                                        rows={2}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* AI Analysis Section */}
                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5" /> AI Price Intelligence
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleAiAnalysis}
                                            disabled={aiLoading || !form.fishName}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg 
                                                       font-bold text-sm hover:bg-indigo-700 
                                                       disabled:opacity-50 disabled:cursor-not-allowed
                                                       flex items-center gap-2"
                                        >
                                            {aiLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" /> Get AI Suggestion
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {aiError && (
                                        <p className="text-red-500 text-sm mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {aiError}
                                        </p>
                                    )}

                                    {aiResult && (
                                        <div className="space-y-4 mt-4">
                                            {/* Price Recommendation */}
                                            <div className="bg-white rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-500">AI Recommended Price</p>
                                                        <p className="text-3xl font-black text-green-700">
                                                            ₹{aiResult.suggestedPrice?.toFixed(2)}
                                                            <span className="text-sm font-normal text-gray-400 ml-1">/kg</span>
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Range: ₹{aiResult.minPrice?.toFixed(0)} - ₹{aiResult.maxPrice?.toFixed(0)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAcceptAiPrice}
                                                        className="px-6 py-3 bg-green-600 text-white rounded-xl
                                                                   font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                                    >
                                                        <ThumbsUp className="w-4 h-4" /> Accept Price
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Structured AI Breakdown */}
                                            {aiResult.breakdown && (
                                                <div className="bg-white rounded-xl p-4 border border-indigo-100 space-y-3">
                                                    <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                                                        <Info className="w-3 h-3" /> AI Price Breakdown
                                                    </p>

                                                    {/* Source Split */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                                                🏛️ Govt Market (OGD)
                                                            </p>
                                                            <p className="text-xl font-black text-emerald-700">
                                                                {aiResult.breakdown.govtAvgPrice > 0
                                                                    ? `₹${aiResult.breakdown.govtAvgPrice.toFixed(0)}`
                                                                    : 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-emerald-500">
                                                                {aiResult.breakdown.govtRecords} records (1.5x trust)
                                                            </p>
                                                        </div>
                                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                            <p className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                                                📈 Platform History
                                                            </p>
                                                            <p className="text-xl font-black text-blue-700">
                                                                {aiResult.breakdown.historicalAvgPrice > 0
                                                                    ? `₹${aiResult.breakdown.historicalAvgPrice.toFixed(0)}`
                                                                    : 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-blue-500">
                                                                {aiResult.breakdown.historicalRecords} records (1.0x)
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Metadata Row */}
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div className="bg-gray-50 rounded-lg p-2">
                                                            <p className="text-xs text-gray-500">📍 Location</p>
                                                            <p className="text-sm font-bold text-gray-700">
                                                                {aiResult.breakdown.locationContext || 'All'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-2">
                                                            <p className="text-xs text-gray-500">📅 Period</p>
                                                            <p className="text-sm font-bold text-gray-700">
                                                                {aiResult.breakdown.dateRange || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-2">
                                                            <p className="text-xs text-gray-500">🎯 Confidence</p>
                                                            <p className={`text-sm font-bold ${aiResult.breakdown.confidenceLevel === 'HIGH' ? 'text-green-600'
                                                                : aiResult.breakdown.confidenceLevel === 'MEDIUM' ? 'text-yellow-600'
                                                                    : 'text-red-600'
                                                                }`}>
                                                                {aiResult.breakdown.confidenceLevel}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Data Freshness */}
                                                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 text-center">
                                                        {aiResult.breakdown.dataFreshness}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fallback: legacy explanation */}
                                            {!aiResult.breakdown && aiResult.explanation && (
                                                <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                                                    <p className="text-xs text-gray-500 uppercase mb-1 font-bold flex items-center gap-1">
                                                        <Info className="w-3 h-3" /> AI Explanation
                                                    </p>
                                                    <p className="text-sm text-gray-700">{aiResult.explanation}</p>
                                                </div>
                                            )}

                                            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-2">
                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Dynamic Trust Weighted
                                                </span> — AI recommendation using {aiResult.dataPointsUsed} verified records
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Starting Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Starting Price (₹/kg) *
                                        {form.startPrice && aiResult?.suggestedPrice &&
                                            parseFloat(form.startPrice) === aiResult.suggestedPrice && (
                                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> AI Suggested
                                                </span>
                                            )}
                                    </label>
                                    <input
                                        type="number"
                                        id="startPrice"
                                        name="startPrice"
                                        value={form.startPrice}
                                        onChange={handleChange}
                                        placeholder="Enter price or use AI suggestion"
                                        min="1"
                                        step="0.01"
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Auction Duration
                                    </label>
                                    <select
                                        name="durationHours"
                                        value={form.durationHours}
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={1}>1 Hour</option>
                                        <option value={6}>6 Hours</option>
                                        <option value={12}>12 Hours</option>
                                        <option value={24}>24 Hours</option>
                                        <option value={48}>48 Hours</option>
                                    </select>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-red-600">{error}</p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 
                                             text-white rounded-xl font-bold text-lg
                                             hover:from-blue-700 hover:to-indigo-700 
                                             transition-all transform hover:scale-[1.02]
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="w-5 h-5" /> Create Auction
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
