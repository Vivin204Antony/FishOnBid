import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import {
    Trophy, TrendingUp, Gavel, ExternalLink, Sparkles,
    MapPin, Scale, Clock, Fish, Search, SlidersHorizontal,
    Filter, ChevronDown, Loader2, Ship, X, ArrowRight
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Overview Modal — mounted at page level, centered with backdrop animation.
   Fetches bids + winner lazily only when opened.
───────────────────────────────────────────────────────────────────────── */
function OverviewModal({ auction, onClose }) {
    const [bids, setBids] = useState(null);  // null = loading
    const [winner, setWinner] = useState(null);

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Fetch on open — lazy, only for this auction
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [bR, wR] = await Promise.all([
                    api.get(`/auctions/${auction.id}/bids`),
                    api.get(`/auctions/${auction.id}/winner`).catch(() => ({ data: null })),
                ]);
                if (alive) { setBids(bR.data); setWinner(wR.data); }
            } catch { if (alive) setBids([]); }
        })();
        return () => { alive = false; };
    }, [auction.id]);

    const fmt = v => `₹${(v || 0).toLocaleString("en-IN")}`;
    const fmtDt = d => d
        ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
        : "—";

    const amounts = (bids || []).map(b => b.amount);
    const minBid = amounts.length ? Math.min(...amounts) : 0;
    const maxBid = amounts.length ? Math.max(...amounts) : 0;
    const bidCount = (bids || []).length;
    const finalPrice = auction.currentPrice ?? maxBid;
    const isLoading = bids === null;
    const hasNoBids = bids !== null && bids.length === 0;
    const freshScore = auction.freshnessScore;
    const freshColor = freshScore >= 80 ? "text-green-600 bg-green-50"
        : freshScore >= 50 ? "text-yellow-600 bg-yellow-50"
            : "text-red-600 bg-red-50";

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal panel — slide-up animation via CSS */}
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                style={{ animation: "modalSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-3xl px-6 py-5 flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-black text-white truncate">{auction.fishName}</h2>
                            <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                                <MapPin className="w-3 h-3" />{auction.location || "Unknown Harbor"}
                                {auction.quantityKg && <><span>·</span><Scale className="w-3 h-3" />{auction.quantityKg} kg</>}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition flex-shrink-0 ml-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Quick facts */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-50 rounded-2xl p-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Final Price</p>
                            <p className="text-xl font-black text-slate-700">{fmt(finalPrice)}</p>
                        </div>
                        {freshScore && (
                            <div className={`rounded-2xl p-3 ${freshColor}`}>
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 opacity-70">Freshness</p>
                                <p className="text-xl font-black">{freshScore}%</p>
                            </div>
                        )}
                        <div className="bg-slate-50 rounded-2xl p-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Ended</p>
                            <p className="text-xs font-bold text-slate-600 leading-tight">{fmtDt(auction.endTime)}</p>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                            <p className="text-sm text-gray-400">Fetching bid history…</p>
                        </div>
                    )}

                    {/* No bids */}
                    {hasNoBids && (
                        <div className="text-center py-8">
                            <Fish className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-400 text-sm font-medium">No bids were placed on this auction.</p>
                        </div>
                    )}

                    {/* Has bids */}
                    {!isLoading && !hasNoBids && (
                        <>
                            {/* Winner */}
                            {winner && (
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 rounded-xl">
                                        <Trophy className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">Winner</p>
                                        <p className="font-bold text-gray-800 truncate text-sm">{winner.bidderEmail}</p>
                                        <p className="text-amber-600 font-semibold text-sm mt-0.5">Won at {fmt(winner.amount)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Bid stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase">Opening</p>
                                    <p className="text-base font-black text-blue-700">{fmt(minBid)}</p>
                                </div>
                                <div className="bg-green-50 rounded-2xl p-3 text-center">
                                    <p className="text-[10px] text-green-400 font-bold uppercase">Final</p>
                                    <p className="text-base font-black text-green-700">{fmt(maxBid)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Bids</p>
                                    <p className="text-base font-black text-slate-700">{bidCount}</p>
                                </div>
                            </div>

                            {/* Plain-English story */}
                            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {bidCount === 1
                                        ? `Only 1 bid was placed. The auction closed at the opening price of ${fmt(minBid)}.`
                                        : `${bidCount} bids drove the price from ${fmt(minBid)} up to ${fmt(maxBid)} — a gain of ${fmt(maxBid - minBid)} over the auction.`}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                        >
                            Close
                        </button>
                        <Link
                            to={`/auction/${auction.id}/summary`}
                            onClick={onClose}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition"
                        >
                            Full Summary <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Keyframe injected inline — works without any build plugin */}
            <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Result Card — lightweight, no data pre-fetching.
   Just renders auction info + "Overview" button that opens the modal.
───────────────────────────────────────────────────────────────────────── */
function ResultCard({ auction, onOpenOverview }) {
    const hasImage = !!auction.imageBase64;
    const freshScore = auction.freshnessScore;
    const freshColor = freshScore >= 80 ? "bg-green-500/80 text-white"
        : freshScore >= 50 ? "bg-yellow-400/90 text-gray-900"
            : "bg-red-500/80 text-white";
    const finalPrice = auction.currentPrice ?? auction.startPrice ?? 0;
    const fmtDt = d => d ? new Date(d).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true
    }) : "—";

    return (
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Image */}
            <div className="relative h-40 flex-shrink-0 overflow-hidden">
                {hasImage ? (
                    <img src={`data:image/jpeg;base64,${auction.imageBase64}`} alt={auction.fishName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                        <span className="text-6xl">🐟</span>
                    </div>
                )}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/80 backdrop-blur-sm text-white">
                    CLOSED
                </span>
                {!!freshScore && (
                    <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 backdrop-blur-sm ${freshColor}`}>
                        <Sparkles className="w-3 h-3" />{freshScore}% Fresh
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                    <h3 className="font-black text-gray-800 text-lg truncate group-hover:text-slate-600 transition-colors">
                        {auction.fishName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400" />{auction.location || "Unknown"}</span>
                        {auction.quantityKg && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="flex items-center gap-1"><Scale className="w-3 h-3 text-teal-400" />{auction.quantityKg} kg</span></>}
                    </div>
                </div>

                <div className="bg-slate-50 border-l-4 border-slate-400 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Final Price</p>
                    <p className="text-2xl font-black text-slate-700">
                        ₹{finalPrice.toLocaleString("en-IN")} <span className="text-xs font-normal text-gray-400">/kg</span>
                    </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" /><span>Ended: {fmtDt(auction.endTime)}</span>
                </div>

                {/* Overview button — no data, just triggers modal */}
                <button
                    onClick={() => onOpenOverview(auction)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 mt-auto rounded-xl font-bold text-sm bg-slate-600 hover:bg-slate-700 text-white transition-all hover:shadow-md active:scale-95"
                >
                    <TrendingUp className="w-4 h-4" /> Overview
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   AuctionResults Page
───────────────────────────────────────────────────────────────────────── */
export default function AuctionResults() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [filterLoc, setFilterLoc] = useState("all");
    const [showSort, setShowSort] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [modalAuction, setModalAuction] = useState(null);

    useEffect(() => {
        api.get("/auctions/results")
            .then(r => setAuctions(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const openModal = useCallback((auction) => setModalAuction(auction), []);
    const closeModal = useCallback(() => setModalAuction(null), []);

    // Close modal on Escape key
    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") closeModal(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [closeModal]);

    const locationOptions = ["all", ...new Set(auctions.map(a => a.location).filter(Boolean))];

    const filtered = auctions
        .filter(a => {
            const s = search.toLowerCase();
            return ((a.fishName || "").toLowerCase().includes(s) || (a.location || "").toLowerCase().includes(s))
                && (filterLoc === "all" || a.location === filterLoc);
        })
        .sort((a, b) => {
            if (sortBy === "price_desc") return (b.currentPrice || 0) - (a.currentPrice || 0);
            if (sortBy === "price_asc") return (a.currentPrice || 0) - (b.currentPrice || 0);
            if (sortBy === "freshness") return (b.freshnessScore || 0) - (a.freshnessScore || 0);
            return new Date(b.endTime || 0) - new Date(a.endTime || 0);
        });

    const sortLabels = { newest: "Sort", price_desc: "Price ↓", price_asc: "Price ↑", freshness: "Freshness" };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pb-20">
            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-10 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-black flex items-center gap-3 mb-2">
                        <Trophy className="w-8 h-8 text-amber-400" /> Auction Results
                    </h1>
                    <p className="text-slate-400">Browse completed auctions — click Overview on any card to see the winner, bid history & price story.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
                {/* Search + filter bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 flex gap-2 sm:gap-3 items-center">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search fish or harbor…"
                            className="w-full pl-9 sm:pl-10 pr-2 sm:pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>

                    {/* Filter */}
                    <div className="relative flex-shrink-0">
                        <button onClick={() => { setShowFilter(v => !v); setShowSort(false); }}
                            className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all
                ${filterLoc !== "all" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            <Filter className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">{filterLoc === "all" ? "Filter" : filterLoc}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? "rotate-180" : ""}`} />
                        </button>
                        {showFilter && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-20 min-w-[180px]">
                                <p className="text-xs text-gray-400 font-bold uppercase px-3 py-1 mb-1">Harbor</p>
                                {locationOptions.map(loc => (
                                    <button key={loc} onClick={() => { setFilterLoc(loc); setShowFilter(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors
                      ${filterLoc === loc ? "bg-slate-100 text-slate-800 font-bold" : "hover:bg-gray-50 text-gray-700"}`}>
                                        {loc === "all" ? "🌊 All Locations" : `📍 ${loc}`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="relative flex-shrink-0">
                        <button onClick={() => { setShowSort(v => !v); setShowFilter(false); }}
                            className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all
                ${sortBy !== "newest" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? "rotate-180" : ""}`} />
                        </button>
                        {showSort && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-20 min-w-[200px]">
                                <p className="text-xs text-gray-400 font-bold uppercase px-3 py-1 mb-1">Sort By</p>
                                {[
                                    { val: "newest", label: "⏱ Most Recent" },
                                    { val: "price_desc", label: "💰 Price: High → Low" },
                                    { val: "price_asc", label: "💰 Price: Low → High" },
                                    { val: "freshness", label: "✨ Freshness Score" },
                                ].map(({ val, label }) => (
                                    <button key={val} onClick={() => { setSortBy(val); setShowSort(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors
                      ${sortBy === val ? "bg-slate-100 text-slate-800 font-bold" : "hover:bg-gray-50 text-gray-700"}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Count */}
                {!loading && (
                    <p className="text-sm text-gray-400 font-medium">
                        {filtered.length} completed auction{filtered.length !== 1 ? "s" : ""}
                        {(search || filterLoc !== "all") && " (filtered)"}
                        {" "}· Click <strong className="text-slate-600">Overview</strong> on any card to see bid details
                    </p>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center">
                        <Loader2 className="w-14 h-14 text-slate-400 animate-spin mb-4" />
                        <p className="text-gray-400 font-medium">Loading completed auctions…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                        <Ship className="w-14 h-14 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No results match your search.</p>
                        {(search || filterLoc !== "all") && (
                            <button onClick={() => { setSearch(""); setFilterLoc("all"); }}
                                className="mt-4 text-sm text-slate-600 underline">Clear filters</button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map(auction => (
                            <ResultCard key={auction.id} auction={auction} onOpenOverview={openModal} />
                        ))}
                    </div>
                )}
            </div>

            {/* Close dropdowns on backdrop click */}
            {(showSort || showFilter) && (
                <div className="fixed inset-0 z-10" onClick={() => { setShowSort(false); setShowFilter(false); }} />
            )}

            {/* Centered Overview Modal */}
            {modalAuction && <OverviewModal auction={modalAuction} onClose={closeModal} />}
        </div>
    );
}
