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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-12 px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black mb-3 flex items-center gap-2 sm:gap-3">
                <Fish className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" /> Live Fish Auctions
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
            className={`flex-1 min-w-0 py-3 px-3 sm:px-6 sm:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base
              ${activeTab === "live"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Live Auctions</span>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 ${activeTab === "live" ? "bg-white/20" : "bg-gray-200"}`}>
              {liveAuctions.length}
            </span>
          </button>
          <button onClick={() => { setActiveTab("closed"); setFilterLocation("all"); }}
            className={`flex-1 min-w-0 py-3 px-3 sm:px-6 sm:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base
              ${activeTab === "closed"
                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
            <Archive className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Closed Auctions</span>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 ${activeTab === "closed" ? "bg-white/20" : "bg-gray-200"}`}>
              {closedAuctions.length}
            </span>
          </button>
        </div>

        {/* Search + Filter + Sort Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 mb-10">
          <div className="flex gap-2 sm:gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search fish or harbor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-2 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Filter by Location */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => { setShowFilterPanel(p => !p); setShowSortPanel(false); }}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base transition-all
                  ${filterLocation !== "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                <Filter className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{filterLocation === "all" ? "Filter" : filterLocation.replace(" Harbor", "")}</span>
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
            <div className="relative flex-shrink-0">
              <button
                onClick={() => { setShowSortPanel(p => !p); setShowFilterPanel(false); }}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base transition-all
                  ${sortBy !== "newest"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{sortBy === "newest" ? "Sort" : sortLabel}</span>
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
