import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Users, Gavel, Activity, Trash2, XCircle,
    RefreshCw, Crown, Shield, UserCheck, Hammer,
    ShoppingBag, Sparkles, TrendingUp, Lock, Unlock,
    Database, CloudDownload, Radio, MapPin, Fish,
    BarChart3, Clock, AlertTriangle, CheckCircle2,
    ChevronDown, ChevronUp
} from "lucide-react";

const API = "http://localhost:8085/api/admin";

/* ── Utility: badge config by userType ── */
const USER_TYPE_CONFIG = {
    "Auctioneer": {
        label: "Auctioneer",
        icon: Hammer,
        pill: "bg-amber-100 text-amber-700 border border-amber-200",
        desc: "Creates & lists fish auctions",
    },
    "Bidder": {
        label: "Bidder",
        icon: ShoppingBag,
        pill: "bg-blue-100 text-blue-700 border border-blue-200",
        desc: "Participates in bidding",
    },
    "Both": {
        label: "Auctioneer + Bidder",
        icon: Sparkles,
        pill: "bg-purple-100 text-purple-700 border border-purple-200",
        desc: "Creates auctions & also bids",
    },
    "Admin": {
        label: "Admin",
        icon: Shield,
        pill: "bg-slate-800 text-white border border-slate-700",
        desc: "Platform administrator",
    },
    "New User": {
        label: "New User",
        icon: UserCheck,
        pill: "bg-gray-100 text-gray-500 border border-gray-200",
        desc: "Registered, no activity yet",
    },
};

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-300 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold text-gray-800">{value ?? "—"}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function UserTypeBadge({ userType }) {
    const cfg = USER_TYPE_CONFIG[userType] || USER_TYPE_CONFIG["New User"];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
        </span>
    );
}

/* ── User Card ── */
function UserCard({ u, currentUserId, onRoleChange, onDelete }) {
    const cfg = USER_TYPE_CONFIG[u.userType] || USER_TYPE_CONFIG["New User"];
    const isAdmin = u.role === "ADMIN";
    const isSelf = u.id === currentUserId;

    return (
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isAdmin ? "bg-slate-800 text-white" : "bg-blue-100 text-blue-700"}`}>
                        {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                </div>
                {isAdmin && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" title="Admin" />}
            </div>

            {/* User type badge */}
            <div className="flex items-center gap-2 flex-wrap">
                <UserTypeBadge userType={u.userType} />
                {isSelf && (
                    <span className="text-[10px] text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 font-medium">You</span>
                )}
            </div>

            {/* Activity stats */}
            <div className="flex gap-3">
                <div className="flex-1 bg-amber-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-700">{u.auctionCount}</p>
                    <p className="text-[10px] text-amber-500 font-medium">Auctions Listed</p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-blue-700">{u.bidCount}</p>
                    <p className="text-[10px] text-blue-500 font-medium">Bids Placed</p>
                </div>
            </div>

            {/* Actions */}
            {!isSelf && (
                <div className="flex gap-2 pt-1">
                    {isAdmin ? (
                        <button
                            onClick={() => onRoleChange(u.id, "USER")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        >
                            <Lock className="w-3.5 h-3.5" /> Remove Admin
                        </button>
                    ) : (
                        <button
                            onClick={() => onRoleChange(u.id, "ADMIN")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                        >
                            <Unlock className="w-3.5 h-3.5" /> Make Admin
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(u.id)}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Auction Card ── */
function AuctionCard({ a, onClose, onDelete }) {
    const isLive = a.active && a.endTime && new Date(a.endTime) > new Date();
    const price = (a.currentPrice ?? a.startPrice ?? 0).toLocaleString("en-IN");
    return (
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-gray-800">{a.fishName}</p>
                    <p className="text-xs text-gray-400">{a.location || "—"}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {isLive ? "🟢 Live" : "Closed"}
                </span>
            </div>

            <div className="flex gap-3">
                <div className="flex-1 bg-teal-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-teal-700">₹{price}</p>
                    <p className="text-[10px] text-teal-500 font-medium">Current Price</p>
                </div>
                {a.freshnessScore != null && (
                    <div className="flex-1 bg-orange-50 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-bold text-orange-700">{a.freshnessScore}/100</p>
                        <p className="text-[10px] text-orange-500 font-medium">Freshness</p>
                    </div>
                )}
            </div>

            {a.sellerEmail && (
                <p className="text-xs text-gray-400 truncate">
                    <span className="font-medium text-gray-500">Auctioneer:</span> {a.sellerEmail}
                </p>
            )}

            <div className="flex gap-2 pt-1">
                {isLive && (
                    <button
                        onClick={() => onClose(a.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                    >
                        <XCircle className="w-3.5 h-3.5" /> Force Close
                    </button>
                )}
                <button
                    onClick={() => onDelete(a.id)}
                    className={`${isLive ? "" : "flex-1"} flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition`}
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
            </div>
        </div>
    );
}

/* ── Freshness Badge ── */
function FreshnessBadge({ freshness }) {
    if (!freshness) return <span className="text-xs text-gray-400">No sync yet</span>;
    const isGreen = freshness.includes("Fresh");
    const isYellow = freshness.includes("old");
    const isRed = freshness.includes("Stale") || freshness.includes("No sync");
    const color = isGreen ? "bg-green-100 text-green-700 border-green-200"
        : isYellow ? "bg-amber-100 text-amber-700 border-amber-200"
        : isRed ? "bg-red-100 text-red-700 border-red-200"
        : "bg-gray-100 text-gray-500 border-gray-200";
    const Icon = isGreen ? CheckCircle2 : isYellow ? Clock : AlertTriangle;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
            <Icon className="w-3.5 h-3.5" />
            {freshness.replace(/[✅🟡⚠️]/g, "").trim()}
        </span>
    );
}

/* ── Market Stat Mini Card ── */
function MarketStat({ icon: Icon, label, value, sub, color = "bg-slate-100 text-slate-600" }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-gray-800">{value ?? "—"}</p>
                    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

/* ── Price Range Bar ── */
function PriceBar({ min, max, avg }) {
    if (!max || max === 0) return null;
    const pct = max > 0 ? ((avg - min) / (max - min)) * 100 : 50;
    return (
        <div className="mt-2">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Min: {"\u20B9"}{min}</span>
                <span>Avg: {"\u20B9"}{avg}</span>
                <span>Max: {"\u20B9"}{max}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                <div className="absolute inset-y-0 w-1 bg-white border border-teal-700 rounded-full" style={{ left: `${Math.min(98, Math.max(2, pct))}%` }} />
            </div>
        </div>
    );
}

/* ── Market Data Panel ── */
function MarketDataPanel({ status, records, loading, syncing, syncResult, onSync, onRefresh, marketView, setMarketView, expandedFish, setExpandedFish }) {
    if (loading) {
        return (
            <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading market intelligence data...</p>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="text-center py-20 space-y-4">
                <Database className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-gray-400">No market data available yet.</p>
                <button onClick={onSync} disabled={syncing}
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition">
                    {syncing ? "Syncing..." : "Sync from Govt APIs"}
                </button>
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "byFish", label: "By Species", icon: Fish },
        { id: "byLocation", label: "By Harbor", icon: MapPin },
        { id: "recent", label: "Recent Records", icon: Clock },
    ];

    return (
        <div className="space-y-5">
            {/* ── Sync Control Bar ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-100">
                            <Radio className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Government Market Feed</p>
                            <p className="text-xs text-gray-400">data.gov.in &middot; Daily Mandi + AgMarkNet APIs</p>
                        </div>
                        <FreshnessBadge freshness={status.dataFreshness} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onRefresh} disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                        <button onClick={onSync} disabled={syncing}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition shadow-sm">
                            <CloudDownload className={`w-3.5 h-3.5 ${syncing ? "animate-bounce" : ""}`} />
                            {syncing ? "Syncing..." : "Sync Now"}
                        </button>
                    </div>
                </div>

                {/* Sync Result Banner */}
                {syncResult && (
                    <div className={`mt-3 rounded-xl px-4 py-2.5 text-xs font-medium border ${syncResult.status === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-600"}`}>
                        {syncResult.status === "success" ? (
                            <span>Imported <strong>{syncResult.recordsImported}</strong> records (API-1: {syncResult.api1Records}, API-2: {syncResult.api2Records}) in {syncResult.durationMs}ms</span>
                        ) : (
                            <span>Sync failed: {syncResult.error}</span>
                        )}
                    </div>
                )}

                {/* Last sync info */}
                {status.lastSyncTimestamp && (
                    <p className="text-[10px] text-gray-400 mt-2">
                        Last sync: {new Date(status.lastSyncTimestamp).toLocaleString()}
                    </p>
                )}
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MarketStat icon={Database} label="Total Records" value={status.totalRecords} color="bg-teal-100 text-teal-600" />
                <MarketStat icon={Clock} label="Last 24h" value={status.recordsLast24h} sub="New records" color="bg-blue-100 text-blue-600" />
                <MarketStat icon={Fish} label="Fish Types" value={status.uniqueFishTypes} color="bg-amber-100 text-amber-600" />
                <MarketStat icon={MapPin} label="Locations" value={status.uniqueLocations} color="bg-purple-100 text-purple-600" />
                <MarketStat icon={TrendingUp} label="Avg Price" value={status.avgPrice > 0 ? `\u20B9${status.avgPrice}` : "—"} sub="per kg" color="bg-green-100 text-green-600" />
                <MarketStat icon={BarChart3} label="Last 7 Days" value={status.recordsLast7d} sub="Records" color="bg-indigo-100 text-indigo-600" />
            </div>

            {/* ── Sub-tabs ── */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setMarketView(id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${marketView === id ? "bg-teal-600 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                        <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                ))}
            </div>

            {/* ── Overview ── */}
            {marketView === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Price Range Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-teal-500" /> Price Range Overview
                        </h3>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Minimum</span>
                                <span className="font-bold text-gray-800">{"\u20B9"}{status.minPrice}/kg</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Average</span>
                                <span className="font-bold text-teal-600">{"\u20B9"}{status.avgPrice}/kg</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Maximum</span>
                                <span className="font-bold text-gray-800">{"\u20B9"}{status.maxPrice}/kg</span>
                            </div>
                        </div>
                        <PriceBar min={status.minPrice} max={status.maxPrice} avg={status.avgPrice} />
                    </div>

                    {/* Data Sources Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-teal-500" /> Data Sources
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                <div>
                                    <p className="text-xs font-semibold text-blue-800">API 1: Daily Mandi Price</p>
                                    <p className="text-[10px] text-blue-500">Real-time commodity prices</p>
                                </div>
                                <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-[10px] font-bold rounded-full">LIVE</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                <div>
                                    <p className="text-xs font-semibold text-purple-800">API 2: AgMarkNet Variety-wise</p>
                                    <p className="text-[10px] text-purple-500">77M+ historical records, multi-state</p>
                                </div>
                                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-bold rounded-full">LIVE</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] text-gray-500">
                                <strong>Resilience:</strong> Circuit Breaker (Resilience4j) + Exponential Backoff + 30s Timeout
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                                <strong>Schedule:</strong> Auto-sync daily at 2:00 AM IST
                            </p>
                        </div>
                    </div>

                    {/* Top Fish Types */}
                    {records?.byFishType && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Fish className="w-4 h-4 text-teal-500" /> Top Species by Record Count
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {records.byFishType.slice(0, 10).map((f, i) => {
                                    const maxCount = records.byFishType[0]?.recordCount || 1;
                                    const pct = (f.recordCount / maxCount) * 100;
                                    return (
                                        <div key={f.fishName} className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-3">
                                            <div className="absolute bottom-0 left-0 h-1 bg-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            <p className="text-xs font-bold text-gray-800">{f.fishName}</p>
                                            <p className="text-lg font-bold text-teal-600">{f.recordCount}</p>
                                            <p className="text-[10px] text-gray-400">{"\u20B9"}{f.avgPrice}/kg avg</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── By Fish Type ── */}
            {marketView === "byFish" && records?.byFishType && (
                <div className="space-y-3">
                    {records.byFishType.map(f => (
                        <div key={f.fishName} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <button onClick={() => setExpandedFish(expandedFish === f.fishName ? null : f.fishName)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                        <Fish className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-800">{f.fishName}</p>
                                        <p className="text-xs text-gray-400">{f.recordCount} records &middot; {f.locations.length} locations</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-teal-600">{"\u20B9"}{f.avgPrice}/kg</p>
                                        <p className="text-[10px] text-gray-400">{"\u20B9"}{f.minPrice} – {"\u20B9"}{f.maxPrice}</p>
                                    </div>
                                    {expandedFish === f.fishName ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </button>
                            {expandedFish === f.fishName && (
                                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                                            <p className="text-lg font-bold text-green-600">{"\u20B9"}{f.minPrice}</p>
                                            <p className="text-[10px] text-gray-400">Min Price/kg</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 text-center border border-teal-200">
                                            <p className="text-lg font-bold text-teal-600">{"\u20B9"}{f.avgPrice}</p>
                                            <p className="text-[10px] text-gray-400">Avg Price/kg</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                                            <p className="text-lg font-bold text-orange-600">{"\u20B9"}{f.maxPrice}</p>
                                            <p className="text-[10px] text-gray-400">Max Price/kg</p>
                                        </div>
                                    </div>
                                    <PriceBar min={f.minPrice} max={f.maxPrice} avg={f.avgPrice} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-2">Available at:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {f.locations.map(loc => (
                                                <span key={loc} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] text-gray-600 font-medium">
                                                    <MapPin className="w-2.5 h-2.5 inline mr-0.5" />{loc}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {records.byFishType.length === 0 && (
                        <div className="text-center py-16 text-gray-400 text-sm">No species data available. Run a sync first.</div>
                    )}
                </div>
            )}

            {/* ── By Location ── */}
            {marketView === "byLocation" && records?.byLocation && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {records.byLocation.map(loc => (
                        <div key={loc.location} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{loc.location}</p>
                                    <p className="text-xs text-gray-400">{loc.recordCount} records</p>
                                </div>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3 text-center mb-3">
                                <p className="text-xl font-bold text-purple-700">{"\u20B9"}{loc.avgPrice}</p>
                                <p className="text-[10px] text-purple-400 font-medium">Avg Price / kg</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 mb-1.5">Species traded:</p>
                                <div className="flex flex-wrap gap-1">
                                    {loc.fishTypes.map(ft => (
                                        <span key={ft} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full text-[10px] text-gray-600 font-medium">{ft}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {records.byLocation.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-400 text-sm">No location data available. Run a sync first.</div>
                    )}
                </div>
            )}

            {/* ── Recent Records Table ── */}
            {marketView === "recent" && records?.recentRecords && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">Latest 50 Govt Records</h3>
                    </div>
                    {records.recentRecords.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">No records yet. Run a sync to pull from govt APIs.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 font-medium">
                                        <th className="text-left px-4 py-3">ID</th>
                                        <th className="text-left px-4 py-3">Fish</th>
                                        <th className="text-left px-4 py-3">Location</th>
                                        <th className="text-right px-4 py-3">Price/kg</th>
                                        <th className="text-right px-4 py-3">Qty (kg)</th>
                                        <th className="text-left px-4 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {records.recentRecords.map((r, i) => (
                                        <tr key={r.id || i} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-2.5 text-gray-400 font-mono">#{r.id}</td>
                                            <td className="px-4 py-2.5 font-semibold text-gray-800">{r.fishName}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{r.location || "—"}</td>
                                            <td className="px-4 py-2.5 text-right font-bold text-teal-600">{"\u20B9"}{r.price?.toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">{r.quantityKg ?? "—"}</td>
                                            <td className="px-4 py-2.5 text-gray-400">{r.endTime ? new Date(r.endTime).toLocaleDateString() : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Main AdminPanel ── */
export default function AdminPanel() {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");

    // Market Data state
    const [marketStatus, setMarketStatus] = useState(null);
    const [marketRecords, setMarketRecords] = useState(null);
    const [marketLoading, setMarketLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [marketView, setMarketView] = useState("overview"); // overview | byFish | byLocation | recent
    const [expandedFish, setExpandedFish] = useState(null);

    useEffect(() => {
        if (!user || user.role !== "ADMIN") navigate("/dashboard", { replace: true });
    }, [user, navigate]);

    const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    async function load() {
        setLoading(true); setError(null);
        try {
            const [sR, uR, aR] = await Promise.all([
                fetch(`${API}/stats`, { headers: authHeaders }),
                fetch(`${API}/users`, { headers: authHeaders }),
                fetch(`${API}/auctions`, { headers: authHeaders }),
            ]);
            if (!sR.ok || !uR.ok || !aR.ok) throw new Error("Failed to load admin data — are you logged in as ADMIN?");
            setStats(await sR.json());
            setUsers(await uR.json());
            setAuctions(await aR.json());
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    useEffect(() => { if (user?.role === "ADMIN") load(); }, []);

    function showFlash(msg) {
        setFlash(msg);
        setTimeout(() => setFlash(null), 3000);
    }

    async function changeRole(id, newRole) {
        const r = await fetch(`${API}/users/${id}/role`, {
            method: "PUT", headers: authHeaders, body: JSON.stringify({ role: newRole })
        });
        if (r.ok) {
            setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole, userType: newRole === "ADMIN" ? "Admin" : (x.auctionCount > 0 && x.bidCount > 0 ? "Both" : x.auctionCount > 0 ? "Auctioneer" : x.bidCount > 0 ? "Bidder" : "New User") } : x));
            showFlash(`Role updated to ${newRole}`);
        }
    }

    async function deleteUser(id) {
        if (!window.confirm("Permanently delete this user?")) return;
        const r = await fetch(`${API}/users/${id}`, { method: "DELETE", headers: authHeaders });
        if (r.ok) { setUsers(u => u.filter(x => x.id !== id)); showFlash("User deleted"); }
    }

    async function closeAuction(id) {
        const r = await fetch(`${API}/auctions/${id}/close`, { method: "POST", headers: authHeaders });
        if (r.ok) { setAuctions(a => a.map(x => x.id === id ? { ...x, active: false } : x)); showFlash(`Auction #${id} closed`); }
    }

    async function deleteAuction(id) {
        if (!window.confirm("Permanently delete this auction?")) return;
        const r = await fetch(`${API}/auctions/${id}`, { method: "DELETE", headers: authHeaders });
        if (r.ok) { setAuctions(a => a.filter(x => x.id !== id)); showFlash("Auction deleted"); }
    }

    // ── Market Data functions ──
    async function loadMarketData() {
        setMarketLoading(true);
        try {
            const [statusRes, recordsRes] = await Promise.all([
                fetch(`${API}/market/status`, { headers: authHeaders }),
                fetch(`${API}/market/records`, { headers: authHeaders }),
            ]);
            if (statusRes.ok) setMarketStatus(await statusRes.json());
            if (recordsRes.ok) setMarketRecords(await recordsRes.json());
        } catch (e) {
            setError("Failed to load market data: " + e.message);
        } finally {
            setMarketLoading(false);
        }
    }

    async function triggerSync() {
        setSyncing(true);
        setSyncResult(null);
        try {
            const r = await fetch(`${API}/market/sync`, { method: "POST", headers: authHeaders });
            const data = await r.json();
            setSyncResult(data);
            if (data.status === "success") {
                showFlash(`Synced ${data.recordsImported} records from govt APIs`);
                loadMarketData();
            } else {
                setError(`Sync failed: ${data.error || "Unknown error"}`);
            }
        } catch (e) {
            setSyncResult({ status: "failed", error: e.message });
            setError("Sync request failed: " + e.message);
        } finally {
            setSyncing(false);
        }
    }

    // Load market data when tab switches to market
    useEffect(() => {
        if (activeTab === "market" && !marketStatus) loadMarketData();
    }, [activeTab]);

    if (!user || user.role !== "ADMIN") return null;

    const typeOptions = ["All", "Auctioneer", "Bidder", "Both", "Admin", "New User"];

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "All" || u.userType === typeFilter;
        return matchSearch && matchType;
    });

    const filteredAuctions = auctions.filter(a =>
        (a.fishName || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.location || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.sellerEmail || "").toLowerCase().includes(search.toLowerCase())
    );

    const typeCount = (type) => users.filter(u => u.userType === type).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pt-8 pb-16 px-4">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-slate-600" /> Admin Panel
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Platform management · Signed in as <strong>{user?.name}</strong></p>
                    </div>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 shadow-sm transition"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* ── Flash / Error ── */}
                {flash && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-medium">
                        ✓ {flash}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                        ⚠ {error}
                    </div>
                )}

                {/* ── Stats ── */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
                        <StatCard icon={Gavel} label="All Auctions" value={stats.totalAuctions} color="bg-teal-500" />
                        <StatCard icon={Activity} label="Live Now" value={stats.liveAuctions} color="bg-green-500" sub="Active bidding" />
                        <StatCard icon={XCircle} label="Closed" value={stats.closedAuctions} color="bg-slate-500" />
                    </div>
                )}

                {/* ── User type summary pills ── */}
                {activeTab === "users" && (
                    <div className="flex flex-wrap gap-2">
                        {["Auctioneer", "Bidder", "Both", "Admin", "New User"].map(t => {
                            const cfg = USER_TYPE_CONFIG[t];
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(typeFilter === t ? "All" : t)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${typeFilter === t ? cfg.pill + " shadow" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t} <span className="opacity-60">({typeCount(t)})</span>
                                </button>
                            );
                        })}
                        {typeFilter !== "All" && (
                            <button onClick={() => setTypeFilter("All")} className="text-xs text-gray-400 hover:text-gray-600 px-2">
                                Clear ×
                            </button>
                        )}
                    </div>
                )}

                {/* ── Tabs + Search ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        {[
                            { id: "users", label: "Users", icon: Users, count: users.length },
                            { id: "auctions", label: "Auctions", icon: Gavel, count: auctions.length },
                            { id: "market", label: "Market Data", icon: Database, count: marketStatus?.totalRecords ?? "—" },
                        ].map(({ id, label, icon: Icon, count }) => (
                            <button
                                key={id}
                                onClick={() => { setActiveTab(id); setSearch(""); setTypeFilter("All"); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === id ? "bg-slate-800 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={activeTab === "users" ? "Search by name or email…" : "Search by fish, location, seller…"}
                        className="w-full sm:w-72 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-sm">Loading platform data…</div>
                ) : (
                    <>
                        {/* Users grid */}
                        {activeTab === "users" && (
                            filteredUsers.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 text-sm">No users match your filter.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredUsers.map(u => (
                                        <UserCard
                                            key={u.id}
                                            u={u}
                                            currentUserId={user?.id}
                                            onRoleChange={changeRole}
                                            onDelete={deleteUser}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Auctions grid */}
                        {activeTab === "auctions" && (
                            filteredAuctions.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 text-sm">No auctions match your search.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredAuctions.map(a => (
                                        <AuctionCard
                                            key={a.id}
                                            a={a}
                                            onClose={closeAuction}
                                            onDelete={deleteAuction}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Market Data tab */}
                        {activeTab === "market" && (
                            <MarketDataPanel
                                status={marketStatus}
                                records={marketRecords}
                                loading={marketLoading}
                                syncing={syncing}
                                syncResult={syncResult}
                                onSync={triggerSync}
                                onRefresh={loadMarketData}
                                marketView={marketView}
                                setMarketView={setMarketView}
                                expandedFish={expandedFish}
                                setExpandedFish={setExpandedFish}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
