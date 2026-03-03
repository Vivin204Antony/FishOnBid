import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
    ArrowLeft, Trophy, Fish, MapPin, Scale, Gavel,
    TrendingUp, Sparkles, Loader2, AlertCircle, Bot
} from "lucide-react";

/**
 * Auction Summary Page — Full post-auction report.
 * Route: /auction/:id/summary
 * Uses GET /api/auctions/{id}/summary  (returns auction + bids + winner)
 */
export default function AuctionSummary() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const maskEmail = (email) => {
        if (!email) return "Anonymous";
        const [local, domain] = email.split("@");
        if (!domain) return email;
        return `${local.slice(0, 2)}***@${domain}`;
    };

    const formatDate = (iso) => {
        if (!iso) return "N/A";
        return new Date(iso).toLocaleString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "numeric", minute: "2-digit", hour12: true
        });
    };

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get(`/auctions/${id}/summary`);
                setSummary(res.data);
            } catch (err) {
                setError("Could not load auction summary. The auction may not exist.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
    );

    if (error || !summary) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md">
                <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Summary Unavailable</h2>
                <p className="text-gray-500 mt-2 mb-6">{error}</p>
                <button onClick={() => navigate("/auctions")}
                    className="bg-blue-600 text-white px-8 py-2 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-700">
                    <ArrowLeft className="w-4 h-4" /> Back to Auctions
                </button>
            </div>
        </div>
    );

    // Unpack the summary response fields
    // GET /api/auctions/{id}/summary returns:
    // { auctionId, FishName, status, totalBids, currentPrice, winningBid, bidHistory }
    const auction = summary;
    const winningBid = summary.winningBid;
    const bidHistory = Array.isArray(summary.bidHistory) ? summary.bidHistory : [];
    const totalBids = summary.totalBids || bidHistory.length;
    const fishName = summary.FishName || summary.fishName || "Fish";
    const finalPrice = summary.currentPrice;
    const isClosed = summary.status === "CLOSED";

    // Price journey: from startPrice to current
    const maxBar = finalPrice || 1;
    const startPrice = bidHistory.length > 0
        ? Math.min(...bidHistory.map(b => b.amount), finalPrice)
        : finalPrice;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 pb-16">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate(`/auction/${id}`)}
                        className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Auction
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-yellow-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">{fishName} — Auction #{id}</h1>
                            <p className="text-indigo-200 text-sm mt-0.5">
                                {isClosed ? "✅ Auction Closed" : "🟢 Auction Active"} · {totalBids} bid{totalBids !== 1 ? "s" : ""} placed
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-6 pt-6">

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Final Price", value: `₹${finalPrice?.toLocaleString("en-IN")}`, color: "emerald" },
                        { label: "Total Bids", value: totalBids, color: "blue" },
                        { label: "Start Price", value: `₹${startPrice?.toLocaleString("en-IN") || "N/A"}`, color: "gray" },
                        { label: "Status", value: isClosed ? "Closed ✓" : "Active", color: isClosed ? "red" : "green" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</p>
                            <p className={`text-2xl font-black text-${color}-600`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Winner Card ── */}
                {winningBid ? (
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl p-8 shadow-xl text-white">
                        <p className="text-yellow-100 text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4" /> Winning Bid
                        </p>
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <p className="text-5xl font-black">₹{winningBid.amount?.toLocaleString("en-IN")}</p>
                                <p className="text-yellow-100 mt-2 text-base">🏅 {maskEmail(winningBid.bidderEmail)}</p>
                                <p className="text-yellow-200 text-xs mt-1">{formatDate(winningBid.bidTime)}</p>
                            </div>
                            <div className="bg-white/20 rounded-2xl p-4 text-center min-w-[140px]">
                                <p className="text-yellow-100 text-xs mb-1">Winning over</p>
                                <p className="text-2xl font-black">{totalBids} bid{totalBids !== 1 ? "s" : ""}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
                        <Fish className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No bids were placed on this auction.</p>
                    </div>
                )}

                {/* ── 2-col: Auction Info + AI Info ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Auction Details */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                            <Fish className="w-5 h-5 text-blue-500" /> Auction Details
                        </h2>
                        <div className="space-y-3">
                            {[
                                { icon: <Fish className="w-4 h-4 text-blue-400" />, label: "Fish", value: fishName },
                                { icon: <MapPin className="w-4 h-4 text-indigo-400" />, label: "Location", value: summary.location || "N/A" },
                                { icon: <Scale className="w-4 h-4 text-teal-400" />, label: "Quantity", value: summary.quantityKg ? `${summary.quantityKg} kg` : "N/A" },
                                { icon: <TrendingUp className="w-4 h-4 text-green-400" />, label: "Freshness", value: summary.freshnessScore ? `${summary.freshnessScore}%` : "N/A" },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3">
                                    {icon}
                                    <span className="text-sm text-gray-400 w-20 shrink-0">{label}</span>
                                    <span className="text-sm font-bold text-gray-700">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 shadow-sm border border-indigo-100">
                        <h2 className="text-lg font-black text-indigo-800 mb-4 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-indigo-500" /> AI Analysis
                        </h2>
                        {summary.aiSuggestedPrice ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white rounded-xl p-3 border">
                                    <span className="text-sm text-gray-500">AI Suggested Price</span>
                                    <span className="text-base font-black text-indigo-700">₹{summary.aiSuggestedPrice}</span>
                                </div>
                                <div className="flex items-center justify-between bg-white rounded-xl p-3 border">
                                    <span className="text-sm text-gray-500">Final vs AI Price</span>
                                    <span className={`text-sm font-black px-2 py-0.5 rounded-full
                    ${finalPrice >= summary.aiSuggestedPrice
                                            ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                        {finalPrice >= summary.aiSuggestedPrice
                                            ? `+₹${(finalPrice - summary.aiSuggestedPrice).toFixed(0)} above`
                                            : `-₹${(summary.aiSuggestedPrice - finalPrice).toFixed(0)} below`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-white rounded-xl p-3 border">
                                    <span className="text-sm text-gray-500">Seller Accepted AI</span>
                                    <span className={`text-sm font-bold ${summary.aiSuggestionAccepted ? "text-green-600" : "text-gray-400"}`}>
                                        {summary.aiSuggestionAccepted ? "✅ Yes" : "No"}
                                    </span>
                                </div>
                                {summary.aiExplanation && (
                                    <div className="bg-white rounded-xl p-3 border">
                                        <p className="text-xs text-indigo-500 font-bold mb-1 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> AI Explanation
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{summary.aiExplanation}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No AI pricing was used for this auction.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Full Bid History ── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-blue-500" /> Complete Bid History
                        </h2>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                            {bidHistory.length} bid{bidHistory.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {bidHistory.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Gavel className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No bids were placed</p>
                        </div>
                    ) : (
                        <>
                            {/* Price journey bar */}
                            <div className="px-6 pt-4 pb-2">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Price Journey</p>
                                <div className="flex items-end gap-1 h-12">
                                    {bidHistory.slice().reverse().map((bid, idx) => {
                                        const pct = Math.round((bid.amount / maxBar) * 100);
                                        return (
                                            <div key={idx}
                                                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-indigo-400 transition-all"
                                                style={{ height: `${Math.max(pct, 10)}%` }}
                                                title={`₹${bid.amount}`} />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Start</span><span>Final: ₹{finalPrice?.toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {/* Bid table */}
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-3 text-left font-bold">#</th>
                                        <th className="px-6 py-3 text-left font-bold">Bidder</th>
                                        <th className="px-6 py-3 text-right font-bold">Amount</th>
                                        <th className="px-6 py-3 text-right font-bold">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bidHistory.map((bid, idx) => (
                                        <tr key={bid.id ?? idx}
                                            className={`transition-colors ${idx === 0 ? "bg-yellow-50" : "hover:bg-gray-50"}`}>
                                            <td className="px-6 py-3 font-black text-gray-400">
                                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                                            </td>
                                            <td className="px-6 py-3 font-bold text-gray-700">{maskEmail(bid.bidderEmail)}</td>
                                            <td className={`px-6 py-3 text-right font-black ${idx === 0 ? "text-yellow-600" : "text-gray-700"}`}>
                                                ₹{bid.amount?.toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-400 text-xs">{formatDate(bid.bidTime)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* ── Back Button ── */}
                <div className="flex justify-center pt-2">
                    <button onClick={() => navigate("/auctions")}
                        className="flex items-center gap-2 px-8 py-3 bg-white rounded-2xl shadow-sm border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
                    </button>
                </div>

            </div>
        </div>
    );
}
