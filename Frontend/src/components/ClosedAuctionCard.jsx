import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    MapPin, Scale, Clock, ChevronDown, Trophy, TrendingUp,
    Gavel, Users, ExternalLink, Sparkles, Zap
} from "lucide-react";
import api from "../api/axios";

/**
 * ClosedAuctionCard — only renders if the auction has ≥1 bid.
 * Shows an "Overview ▾" dropdown instead of "View Result".
 * Dropdown reveals inline summary: winner, bid range, bid count → Full Summary link.
 */
export default function ClosedAuctionCard({ auction }) {
    const [bids, setBids] = useState(null);   // null = loading
    const [winner, setWinner] = useState(null);
    const [dropOpen, setDropOpen] = useState(false);
    const dropRef = useRef(null);

    /* ── Fetch bids + winner on mount ── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [bidsRes, winnerRes] = await Promise.all([
                    api.get(`/auctions/${auction.id}/bids`),
                    api.get(`/auctions/${auction.id}/winner`).catch(() => ({ data: null })),
                ]);
                if (!cancelled) {
                    setBids(bidsRes.data);
                    setWinner(winnerRes.data);
                }
            } catch {
                if (!cancelled) setBids([]);
            }
        })();
        return () => { cancelled = true; };
    }, [auction.id]);

    /* ── Close dropdown on outside click ── */
    useEffect(() => {
        const h = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    /* ── Don't render until bids loaded ── */
    if (bids === null) return null;           // still loading — hide
    if (bids.length === 0) return null;       // zero bids — skip entirely

    /* ── Derived stats ── */
    const bidCount = bids.length;
    const amounts = bids.map(b => b.amount);
    const minBid = Math.min(...amounts);
    const maxBid = Math.max(...amounts);
    const finalPrice = auction.currentPrice ?? maxBid;
    const hasImage = !!auction.imageBase64;
    const freshScore = auction.freshnessScore;
    const freshColor = freshScore >= 80 ? "bg-green-500/80 text-white"
        : freshScore >= 50 ? "bg-yellow-400/90 text-gray-900"
            : "bg-red-500/80 text-white";

    const formatINR = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;
    const formatDate = (d) => d
        ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
        : "—";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden
                    hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col group">

            {/* ── Fish Image / Placeholder ── */}
            <div className="relative h-44 overflow-hidden flex-shrink-0">
                {hasImage ? (
                    <img
                        src={`data:image/jpeg;base64,${auction.imageBase64}`}
                        alt={auction.fishName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="text-7xl select-none drop-shadow-2xl">🐟</span>
                    </div>
                )}

                {/* CLOSED badge */}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px]
                          font-black uppercase tracking-widest flex items-center gap-1 shadow-lg
                          bg-slate-700/80 backdrop-blur-sm text-white">
                    CLOSED
                </span>

                {/* Freshness badge */}
                {!!freshScore && (
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px]
                             font-black backdrop-blur-sm flex items-center gap-1 ${freshColor}`}>
                        <Sparkles className="w-3 h-3" />
                        {freshScore}% Fresh
                    </span>
                )}

                {/* Bid count pill — always visible */}
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px]
                          font-semibold bg-white/90 text-slate-700 flex items-center gap-1 shadow">
                    <Gavel className="w-3 h-3" /> {bidCount} bid{bidCount !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Card Body ── */}
            <div className="p-5 flex-1 flex flex-col gap-3">
                <div>
                    <h3 className="text-xl font-black text-gray-800 group-hover:text-slate-600
                         transition-colors line-clamp-1">
                        {auction.fishName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            {auction.location || "Unknown Harbor"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3 text-teal-400" />
                            {auction.quantityKg ?? "??"} kg
                        </span>
                    </div>
                </div>

                {/* Final price box */}
                <div className="bg-slate-50 border-l-4 border-slate-400 rounded-xl p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Final Price
                    </p>
                    <p className="text-3xl font-black text-slate-700">
                        {formatINR(finalPrice)}
                        <span className="text-xs font-normal text-gray-400 ml-1">/kg</span>
                    </p>
                </div>

                {/* Ended timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Ended: {formatDate(auction.endTime)}</span>
                </div>

                {/* ── Overview dropdown button ── */}
                <div className="relative mt-auto" ref={dropRef}>
                    <button
                        onClick={() => setDropOpen(v => !v)}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold
                       transition-all shadow-sm text-white
                       ${dropOpen
                                ? "bg-slate-800 shadow-slate-300 shadow-md"
                                : "bg-slate-600 hover:bg-slate-700"}`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Overview
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* ── Inline Summary Dropdown ── */}
                    {dropOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl
                            border border-gray-200 p-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">

                            {/* Winner row */}
                            {winner && (
                                <div className="flex items-start gap-2 mb-3 pb-3 border-b border-gray-100">
                                    <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                                        <Trophy className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Winner</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{winner.bidderEmail}</p>
                                        <p className="text-xs text-amber-600 font-semibold">Winning bid: {formatINR(winner.amount)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Bid range + count */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="bg-blue-50 rounded-xl p-2 text-center">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase">Opening</p>
                                    <p className="text-sm font-black text-blue-700">{formatINR(minBid)}</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-2 text-center">
                                    <p className="text-[10px] text-green-400 font-bold uppercase">Final</p>
                                    <p className="text-sm font-black text-green-700">{formatINR(maxBid)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Bids</p>
                                    <p className="text-sm font-black text-slate-700">{bidCount}</p>
                                </div>
                            </div>

                            {/* How it ended note */}
                            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                {bidCount === 1
                                    ? "Only one bid was placed — auction closed at the opening price."
                                    : `${bidCount} bids drove the price from ${formatINR(minBid)} up to ${formatINR(maxBid)}, a gain of ${formatINR(maxBid - minBid)}.`}
                            </p>

                            {/* Full summary link */}
                            <Link
                                to={`/auction/${auction.id}/summary`}
                                onClick={() => setDropOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold
                           bg-slate-800 text-white hover:bg-slate-900 transition"
                            >
                                Full Summary <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
