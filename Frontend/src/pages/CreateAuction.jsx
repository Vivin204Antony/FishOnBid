import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import aiService from '../api/aiService';
import visionService from '../api/visionService';
import { AuthContext } from '../context/AuthContext';
import {
    Fish, MapPin, Scale, Camera, FileText, Clock, Sparkles,
    CheckCircle2, AlertCircle, Loader2, Rocket,
    Info, ThumbsUp, Eye, X, ImagePlus, Zap
} from 'lucide-react';

/**
 * Create Auction Page — Camera-First "Scan & Sell" Workflow
 * 
 * Step 1: CAPTURE (Mandatory) — Camera or gallery upload
 * Step 2: AI VISION (Automatic) — GPT-4o detects fish type + freshness
 * Step 3: CONFIRM (Minimal typing) — GPS location, quantity, AI price
 */
export default function CreateAuction() {
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // ──── Form State ────
    const [form, setForm] = useState({
        fishName: '',
        startPrice: '',
        location: '',
        quantityKg: '',
        durationHours: 24,
        sellerNotes: ''
    });

    // ──── Metadata from backend ────
    const [metadata, setMetadata] = useState({
        fishTypes: [],
        locations: [],
        loading: true
    });

    // ──── Camera & Image State ────
    const [imageBase64, setImageBase64] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');

    // ──── Vision Analysis State ────
    const [visionLoading, setVisionLoading] = useState(false);
    const [visionResult, setVisionResult] = useState(null);
    const [visionError, setVisionError] = useState('');

    // ──── AI Price State ────
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState('');

    // ──── Submission State ────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // ──── GPS State ────
    const [gpsDetecting, setGpsDetecting] = useState(false);
    const [gpsDetected, setGpsDetected] = useState(false);

    // ──────────────────────────────────────────────
    // LIFECYCLE: Fetch metadata + auto-detect GPS
    // ──────────────────────────────────────────────
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await api.get('/auctions/metadata');
                setMetadata({
                    fishTypes: response.data.fishTypes || [],
                    locations: response.data.locations || [],
                    loading: false
                });
            } catch (err) {
                console.error('Failed to fetch auction metadata:', err);
                setMetadata({
                    fishTypes: ['Tuna', 'Salmon', 'Mackerel', 'Pomfret', 'Sardine', 'Prawns', 'Kingfish', 'Seer Fish', 'Lobster', 'Crab'],
                    locations: ['Chennai Harbor', 'Vizag Harbor', 'Kochi Harbor', 'Mumbai Harbor', 'Jhargram Harbor'],
                    loading: false
                });
            }
        };
        fetchMetadata();
        autoDetectGPS();

        // Cleanup camera stream on unmount
        return () => stopCamera();
    }, []);

    // ──────────────────────────────────────────────
    // GPS: Auto-detect location
    // ──────────────────────────────────────────────
    const autoDetectGPS = () => {
        if (!navigator.geolocation) return;

        setGpsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Map GPS coordinates to nearest known harbor
                const nearestHarbor = findNearestHarbor(latitude, longitude);
                if (nearestHarbor) {
                    setForm(prev => ({ ...prev, location: nearestHarbor }));
                    setGpsDetected(true);
                }
                setGpsDetecting(false);
            },
            (err) => {
                console.warn('GPS detection failed:', err.message);
                setGpsDetecting(false);
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    };

    const findNearestHarbor = (lat, lng) => {
        // Known harbor coordinates (approximate)
        const harbors = [
            { name: 'Chennai Harbor', lat: 13.0827, lng: 80.2707 },
            { name: 'Vizag Harbor', lat: 17.6868, lng: 83.2185 },
            { name: 'Kochi Harbor', lat: 9.9312, lng: 76.2673 },
            { name: 'Mumbai Harbor', lat: 18.9220, lng: 72.8347 },
            { name: 'Jhargram Harbor', lat: 22.4545, lng: 86.9946 },
        ];

        let nearest = null;
        let minDist = Infinity;
        harbors.forEach(h => {
            const dist = Math.sqrt((h.lat - lat) ** 2 + (h.lng - lng) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = h.name;
            }
        });
        return nearest;
    };

    // ──────────────────────────────────────────────
    // CAMERA: MediaDevices API (back camera)
    // ──────────────────────────────────────────────
    const openCamera = async () => {
        setCameraError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            setCameraOpen(true);
            // Wait for next render to attach video
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error('Camera access failed:', err);
            setCameraError('Camera access denied. Use "Upload from Gallery" instead.');
        }
    };

    // ──────────────────────────────────────────────
    // IMAGE: Compress to max 640px / quality 0.65
    // Keeps base64 payload under ~100KB for reliable DB storage
    // ──────────────────────────────────────────────
    const compressImage = (sourceCanvas) => {
        const MAX_WIDTH = 640;
        let { width, height } = sourceCanvas;
        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }
        const comp = document.createElement('canvas');
        comp.width = width;
        comp.height = height;
        comp.getContext('2d').drawImage(sourceCanvas, 0, 0, width, height);
        return comp.toDataURL('image/jpeg', 0.65);
    };

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        // Compress before storing
        const dataUrl = compressImage(canvas);
        const base64Data = dataUrl.split(',')[1];

        setImageBase64(base64Data);
        setImagePreview(dataUrl);
        stopCamera();

        // Auto-trigger vision analysis
        runVisionAnalysis(base64Data);
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraOpen(false);
    };

    // ──────────────────────────────────────────────
    // IMAGE: Gallery upload fallback (also compressed)
    // ──────────────────────────────────────────────
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            // Draw onto canvas then compress
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            URL.revokeObjectURL(objectUrl);

            const dataUrl = compressImage(canvas);
            const base64Data = dataUrl.split(',')[1];

            setImageBase64(base64Data);
            setImagePreview(dataUrl);
            setVisionResult(null);
            setAiResult(null);

            // Auto-trigger vision analysis
            runVisionAnalysis(base64Data);
        };
        img.src = objectUrl;
    };

    const clearImage = () => {
        setImageBase64(null);
        setImagePreview(null);
        setVisionResult(null);
        setVisionError('');
        setAiResult(null);
    };

    // ──────────────────────────────────────────────
    // VISION: AI Image Analysis (GPT-4o)
    // ──────────────────────────────────────────────
    const runVisionAnalysis = async (base64Data) => {
        setVisionLoading(true);
        setVisionError('');
        setVisionResult(null);

        try {
            const result = await visionService.analyzeImage(base64Data);
            setVisionResult(result);

            // Auto-populate form from vision response
            if (result.detectedFishType && result.detectedFishType !== 'Unknown') {
                setForm(prev => ({ ...prev, fishName: result.detectedFishType }));
            }

            console.log('Vision Result:', result);
        } catch (err) {
            console.error('Vision analysis failed:', err);
            setVisionError('Vision analysis unavailable. Please select fish type manually.');
        } finally {
            setVisionLoading(false);
        }
    };

    // ──────────────────────────────────────────────
    // AI PRICING: RAG + Vision combined
    // ──────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAiAnalysis = async () => {
        if (!form.fishName) {
            setAiError('Please select fish type first (or capture a photo for auto-detect)');
            return;
        }

        setAiLoading(true);
        setAiError('');

        try {
            const requestData = {
                fishName: form.fishName,
                quantityKg: parseFloat(form.quantityKg) || 10,
                location: form.location || 'Unknown',
                freshnessScore: visionResult?.freshnessScore || 85
            };

            // Include image if available for complete analysis
            if (imageBase64) {
                requestData.images = [imageBase64];
            }

            const response = await aiService.getCompletePriceSuggestion(requestData);
            console.log('AI Response:', response);

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

    // ──────────────────────────────────────────────
    // SUBMIT: Create auction
    // ──────────────────────────────────────────────
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
                freshnessScore: visionResult?.freshnessScore || null,
                aiSuggestedPrice: aiResult?.suggestedPrice || null,
                aiSuggestionAccepted: aiResult?.suggestedPrice &&
                    parseFloat(form.startPrice) === aiResult.suggestedPrice,
                aiExplanation: aiResult?.explanation || null,
                imageBase64: imageBase64 || null
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

    // ──────────────────────────────────────────────
    // GUARDS
    // ──────────────────────────────────────────────
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

    // ──────────────────────────────────────────────
    // DERIVED STATE
    // ──────────────────────────────────────────────
    const hasImage = !!imagePreview;
    const freshnessColor = visionResult?.freshnessScore >= 90 ? 'text-emerald-600'
        : visionResult?.freshnessScore >= 70 ? 'text-green-600'
            : visionResult?.freshnessScore >= 50 ? 'text-yellow-600'
                : 'text-red-600';

    const gradeColor = visionResult?.qualityGrade === 'PREMIUM' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : visionResult?.qualityGrade === 'GOOD' ? 'bg-green-100 text-green-700 border-green-200'
            : visionResult?.qualityGrade === 'ACCEPTABLE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-red-100 text-red-700 border-red-200';

    // ──────────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Camera className="w-8 h-8" /> Scan & Sell
                        </h1>
                        <p className="mt-2 text-blue-100">
                            📷 Snap a photo of your catch — AI detects fish type, freshness & price
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

                                {/* ═══════════════════════════════════════════ */}
                                {/* STEP 1: CAPTURE (Mandatory)                */}
                                {/* ═══════════════════════════════════════════ */}
                                <div className="rounded-2xl overflow-hidden border-2 border-dashed border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                        <h2 className="text-base font-bold text-cyan-800 flex items-center gap-2">
                                            <Camera className="w-4 h-4" />
                                            Step 1 — Capture Your Catch
                                        </h2>
                                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            REQUIRED
                                        </span>
                                    </div>

                                    {/* ─── CAMERA LIVE VIEW ─── */}
                                    {cameraOpen && (
                                        <div className="relative bg-black">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full max-h-72 object-cover"
                                            />
                                            <canvas ref={canvasRef} className="hidden" />
                                            {/* Close button */}
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm
                                                           text-white rounded-full flex items-center justify-center"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            {/* Shutter button */}
                                            <div className="absolute bottom-0 left-0 right-0 pb-6 flex justify-center bg-gradient-to-t from-black/50 to-transparent">
                                                <button
                                                    type="button"
                                                    onClick={capturePhoto}
                                                    className="w-18 h-18 relative"
                                                    style={{ width: '72px', height: '72px' }}
                                                >
                                                    {/* Outer ring */}
                                                    <span className="absolute inset-0 rounded-full border-4 border-white opacity-80" />
                                                    {/* Inner fill */}
                                                    <span className="absolute inset-2 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── IMAGE PREVIEW ─── */}
                                    {imagePreview && !cameraOpen && (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Captured fish"
                                                className="w-full max-h-72 object-cover"
                                            />
                                            {/* Vision analysis overlay */}
                                            {visionLoading && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                    <div className="text-center text-white">
                                                        <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                                                        <p className="font-bold text-lg">Analyzing...</p>
                                                        <p className="text-sm opacity-75 mt-1">AI detecting fish type & freshness</p>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Retake / Clear action bar */}
                                            {!visionLoading && (
                                                <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                                    <button
                                                        type="button"
                                                        onClick={() => { clearImage(); openCamera(); }}
                                                        className="flex-1 py-2 bg-white/20 backdrop-blur-sm text-white 
                                                                   rounded-lg text-sm font-bold flex items-center justify-center gap-2
                                                                   hover:bg-white/30 transition-colors"
                                                    >
                                                        <Camera className="w-4 h-4" /> Retake
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={clearImage}
                                                        className="flex-1 py-2 bg-red-500/80 backdrop-blur-sm text-white 
                                                                   rounded-lg text-sm font-bold flex items-center justify-center gap-2
                                                                   hover:bg-red-600/80 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" /> Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ─── EMPTY STATE: prompt to capture ─── */}
                                    {!imagePreview && !cameraOpen && (
                                        <div className="p-5 space-y-3">
                                            {/* Big camera button */}
                                            <button
                                                type="button"
                                                onClick={openCamera}
                                                className="w-full py-7 flex flex-col items-center gap-3
                                                           bg-white rounded-xl border-2 border-cyan-300
                                                           hover:bg-cyan-50 hover:border-cyan-500
                                                           hover:shadow-md hover:shadow-cyan-100
                                                           transition-all duration-200 group/cam"
                                            >
                                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600
                                                                rounded-2xl flex items-center justify-center
                                                                group-hover/cam:scale-110 transition-transform shadow-lg">
                                                    <Camera className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-base font-bold text-cyan-800">📷 Open Camera</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Uses back camera · Point at your catch</p>
                                                </div>
                                            </button>

                                            {/* Divider */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-gray-200" />
                                                <span className="text-xs text-gray-400 font-medium">or</span>
                                                <div className="flex-1 h-px bg-gray-200" />
                                            </div>

                                            {/* Gallery upload — same size/treatment as camera */}
                                            <label className="w-full py-7 flex flex-col items-center gap-3
                                                              bg-white rounded-xl border-2 border-indigo-200
                                                              hover:bg-indigo-50 hover:border-indigo-400
                                                              hover:shadow-md hover:shadow-indigo-100
                                                              transition-all duration-200 cursor-pointer group/gal">
                                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600
                                                                rounded-2xl flex items-center justify-center
                                                                group-hover/gal:scale-110 transition-transform shadow-lg">
                                                    <ImagePlus className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-base font-bold text-indigo-800">🖼 Upload from Gallery</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · Pick an existing photo</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {/* Camera error */}
                                    {cameraError && (
                                        <div className="mx-5 mb-5 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                            <p className="text-red-600 text-sm">{cameraError}</p>
                                        </div>
                                    )}
                                </div>

                                {/* ═══════════════════════════════════════════ */}
                                {/* STEP 2: AI VISION RESULT (Auto after capture) */}
                                {/* ═══════════════════════════════════════════ */}
                                {visionResult && (
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                                        <h2 className="text-lg font-bold text-purple-800 flex items-center gap-2 mb-4">
                                            <Eye className="w-5 h-5" />
                                            Step 2: AI Vision Analysis
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold border ml-2 ${gradeColor}`}>
                                                {visionResult.qualityGrade}
                                            </span>
                                        </h2>

                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="bg-white rounded-lg p-3 text-center border">
                                                <p className="text-xs text-gray-500">🐟 Detected</p>
                                                <p className="text-lg font-black text-indigo-700">
                                                    {visionResult.detectedFishType || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 text-center border">
                                                <p className="text-xs text-gray-500">✨ Freshness</p>
                                                <p className={`text-lg font-black ${freshnessColor}`}>
                                                    {visionResult.freshnessScore}%
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 text-center border">
                                                <p className="text-xs text-gray-500">🎯 Confidence</p>
                                                <p className="text-lg font-black text-blue-700">
                                                    {(visionResult.confidence * 100).toFixed(0)}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-bold text-purple-700">📋 Analysis: </span>
                                                {visionResult.explanation}
                                            </p>
                                        </div>

                                        {visionResult.isMocked && (
                                            <p className="text-xs text-purple-400 mt-2 text-center">
                                                ⚡ Mock mode — Set OPENAI_API_KEY for real GPT-4o analysis
                                            </p>
                                        )}
                                    </div>
                                )}

                                {visionError && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                        <p className="text-sm text-yellow-700">{visionError}</p>
                                    </div>
                                )}

                                {/* ═══════════════════════════════════════════ */}
                                {/* STEP 3: CONFIRM DETAILS (Minimal typing)   */}
                                {/* ═══════════════════════════════════════════ */}
                                <div className={`space-y-4 ${!hasImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-orange-500" />
                                        Step 3: Confirm Details
                                        {!hasImage && <span className="text-xs text-gray-400 font-normal ml-2">↑ Capture a photo first</span>}
                                    </h2>

                                    {/* Fish Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Fish className="w-4 h-4" /> Fish Type *
                                            {visionResult?.detectedFishType && visionResult.detectedFishType !== 'Unknown' && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> AI Detected
                                                </span>
                                            )}
                                        </label>
                                        <select
                                            name="fishName"
                                            value={form.fishName}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                            disabled={metadata.loading}
                                        >
                                            <option value="">
                                                {metadata.loading ? 'Loading fish types...' : 'Select fish type'}
                                            </option>
                                            {metadata.fishTypes.map(fish => (
                                                <option key={fish} value={fish}>{fish}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Location & Quantity */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> Harbor / Location *
                                                {gpsDetected && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                        📍 GPS
                                                    </span>
                                                )}
                                                {gpsDetecting && (
                                                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                                )}
                                            </label>
                                            <select
                                                name="location"
                                                value={form.location}
                                                onChange={handleChange}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                required
                                                disabled={metadata.loading}
                                            >
                                                <option value="">
                                                    {metadata.loading ? 'Loading...' : 'Select location'}
                                                </option>
                                                {metadata.locations.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
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
                                </div>

                                {/* ═══════════════════════════════════════════ */}
                                {/* AI PRICE INTELLIGENCE                      */}
                                {/* ═══════════════════════════════════════════ */}
                                {hasImage && (
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
                                                        <Sparkles className="w-4 h-4" /> Get AI Price
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

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                                <p className="text-xs text-emerald-600 font-bold">🏛️ Govt Market (OGD)</p>
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
                                                                <p className="text-xs text-blue-600 font-bold">📈 Platform History</p>
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

                                                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 text-center">
                                                            {aiResult.breakdown.dataFreshness}
                                                        </div>
                                                    </div>
                                                )}

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
                                                    </span>
                                                    — AI using {aiResult.dataPointsUsed} verified records
                                                    {visionResult && ` + Vision (${visionResult.freshnessScore}% freshness)`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Starting Price */}
                                {hasImage && (
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
                                            placeholder="Enter price or use AI suggestion above"
                                            min="1"
                                            step="0.01"
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Duration */}
                                {hasImage && (
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
                                )}

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
                                    disabled={loading || !hasImage}
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
                                    ) : !hasImage ? (
                                        <>
                                            <Camera className="w-5 h-5" /> Capture Photo to Continue
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
