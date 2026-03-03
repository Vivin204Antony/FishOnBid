import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import AuctionCard from "../components/AuctionCard";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Fish, Search, SlidersHorizontal, Rocket, Ship, Loader2,
  Activity, Archive, LogIn, Filter, X, ChevronDown
} from 'lucide-react';

/**
 * Auctions Page — Live/Closed tabs, Search, Filter by location, Sort by price/freshness
 */
export default function Auctions() {
  const { user } = useContext(AuthContext);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [closedAuctions, setClosedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("live");

  // Filter & Sort state
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const [liveRes, closedRes] = await Promise.all([
          api.get("/auctions/live"),
          api.get("/auctions/closed")
        ]);
        setLiveAuctions(liveRes.data);
        setClosedAuctions(closedRes.data);
      } catch (err) {
        console.error("Failed to fetch auctions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  // Build location options from fetched data
  const allAuctions = activeTab === "live" ? liveAuctions : closedAuctions;
  const locationOptions = ["all", ...new Set(allAuctions.map(a => a.location).filter(Boolean))];

  // Apply search → filter → sort
  const filtered = allAuctions
    .filter(a => {
      const matchSearch =
        a.fishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLocation = filterLocation === "all" || a.location === filterLocation;
      return matchSearch && matchLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return (a.currentPrice || 0) - (b.currentPrice || 0);
        case "price_desc": return (b.currentPrice || 0) - (a.currentPrice || 0);
        case "freshness": return (b.freshnessScore || 0) - (a.freshnessScore || 0);
        case "newest":
        default:
          return new Date(b.startTime || 0) - new Date(a.startTime || 0);
      }
    });

  const sortLabel = {
    newest: "Newest First",
    price_asc: "Price: Low → High",
    price_desc: "Price: High → Low",
    freshness: "Freshness Score",
  }[sortBy];

  const isFiltered = filterLocation !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setFilterLocation("all");
    setSortBy("newest");
    setShowFilterPanel(false);
    setShowSortPanel(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-12 px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black mb-3 flex items-center gap-3">
                <Fish className="w-10 h-10" /> Live Fish Auctions
              </h1>
              <p className="text-blue-100 text-lg max-w-xl">
                Real-time marketplace for fresh catch. Secure, transparent, and direct from harbor.
              </p>
            </div>
            {user ? (
              <Link to="/auctions/create"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                <Rocket className="w-5 h-5" /> Start New Auction
              </Link>
            ) : (
              <Link to="/login"
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/30">
                <LogIn className="w-5 h-5" /> Login to Start Selling
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-2 flex gap-2">
          <button onClick={() => { setActiveTab("live"); setFilterLocation("all"); }}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2
              ${activeTab === "live"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
            <Activity className="w-5 h-5" />
            Live Auctions
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${activeTab === "live" ? "bg-white/20" : "bg-gray-200"}`}>
              {liveAuctions.length}
            </span>
          </button>
          <button onClick={() => { setActiveTab("closed"); setFilterLocation("all"); }}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2
              ${activeTab === "closed"
                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
            <Archive className="w-5 h-5" />
            Closed Auctions
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${activeTab === "closed" ? "bg-white/20" : "bg-gray-200"}`}>
              {closedAuctions.length}
            </span>
          </button>
        </div>

        {/* Search + Filter + Sort Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search fish name or harbor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Filter by Location */}
            <div className="relative">
              <button
                onClick={() => { setShowFilterPanel(p => !p); setShowSortPanel(false); }}
                className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
                  ${filterLocation !== "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                <Filter className="w-4 h-4" />
                {filterLocation === "all" ? "Filter" : filterLocation.replace(" Harbor", "")}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilterPanel ? "rotate-180" : ""}`} />
              </button>
              {showFilterPanel && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 min-w-[180px]">
                  <p className="text-xs text-gray-400 font-bold uppercase px-3 py-1 mb-1">Harbor / Location</p>
                  {locationOptions.map(loc => (
                    <button key={loc}
                      onClick={() => { setFilterLocation(loc); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        ${filterLocation === loc ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-gray-50 text-gray-700"}`}>
                      {loc === "all" ? "🌊 All Locations" : `📍 ${loc}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => { setShowSortPanel(p => !p); setShowFilterPanel(false); }}
                className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
                  ${sortBy !== "newest"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                <SlidersHorizontal className="w-4 h-4" />
                {sortBy === "newest" ? "Sort" : sortLabel}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortPanel ? "rotate-180" : ""}`} />
              </button>
              {showSortPanel && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 min-w-[200px]">
                  <p className="text-xs text-gray-400 font-bold uppercase px-3 py-1 mb-1">Sort By</p>
                  {[
                    { val: "newest", label: "⏱ Newest First" },
                    { val: "price_asc", label: "💰 Price: Low → High" },
                    { val: "price_desc", label: "💰 Price: High → Low" },
                    { val: "freshness", label: "✨ Freshness Score" },
                  ].map(({ val, label }) => (
                    <button key={val}
                      onClick={() => { setSortBy(val); setShowSortPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        ${sortBy === val ? "bg-indigo-100 text-indigo-700 font-bold" : "hover:bg-gray-50 text-gray-700"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {isFiltered && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {filterLocation !== "all" && (
                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  📍 {filterLocation}
                  <button onClick={() => setFilterLocation("all")} className="ml-1 hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {sortBy !== "newest" && (
                <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                  ↕ {sortLabel}
                  <button onClick={() => setSortBy("newest")} className="ml-1 hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                <X className="w-3 h-3" /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 font-medium">
            Showing {filtered.length} {activeTab} auction{filtered.length !== 1 ? 's' : ''}
            {isFiltered && <span className="text-blue-600 ml-1">(filtered)</span>}
          </p>
        </div>

        {/* Auction Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold">Scanning the market...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 shadow-sm">
            <Ship className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-2xl font-black text-gray-800 mb-3">
              {activeTab === "live" ? "No live auctions found" : "No closed auctions found"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
              {searchTerm || isFiltered
                ? "No results match your filters. Try clearing them."
                : activeTab === "live"
                  ? "The harbor is quiet right now. Check back soon!"
                  : "No completed auctions yet."}
            </p>
            {(searchTerm || isFiltered) && (
              <button
                onClick={() => { setSearchTerm(""); clearFilters(); }}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Close dropdowns on outside click */}
      {(showFilterPanel || showSortPanel) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowFilterPanel(false); setShowSortPanel(false); }} />
      )}
    </div>
  );
}
