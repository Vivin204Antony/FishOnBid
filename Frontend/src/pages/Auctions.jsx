import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import AuctionCard from "../components/AuctionCard";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Fish, Search, Filter, SlidersHorizontal, Rocket, Ship, Loader2, Activity, Archive, LogIn } from 'lucide-react';

/**
 * Enhanced Auctions Page with Live/Closed Tabs and Lucide Icons
 */
export default function Auctions() {
  const { user } = useContext(AuthContext);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [closedAuctions, setClosedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("live"); // "live" or "closed"

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

  const currentAuctions = activeTab === "live" ? liveAuctions : closedAuctions;

  const filteredAuctions = currentAuctions.filter(a =>
    a.fishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Link
                to="/auctions/create"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl 
                           font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" /> Start New Auction
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl 
                           font-bold transition-all flex items-center justify-center gap-2 border border-white/30"
              >
                <LogIn className="w-5 h-5" /> Login to Start Selling
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "live"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
          >
            <Activity className="w-5 h-5" />
            Live Auctions
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${activeTab === "live" ? "bg-white/20" : "bg-gray-200"
              }`}>
              {liveAuctions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("closed")}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "closed"
                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
          >
            <Archive className="w-5 h-5" />
            Closed Auctions
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${activeTab === "closed" ? "bg-white/20" : "bg-gray-200"
              }`}>
              {closedAuctions.length}
            </span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-10 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search fish name or harbor location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl 
                         focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex-1 md:flex-none px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Sort
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 font-medium">
            Showing {filteredAuctions.length} {activeTab === "live" ? "live" : "closed"} auction{filteredAuctions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold">Scanning the market...</p>
          </div>
        ) : filteredAuctions.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAuctions.map(auction => (
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
              {searchTerm
                ? `We couldn't find any results for "${searchTerm}". Try a different search term.`
                : activeTab === "live"
                  ? "The harbor is quiet right now. Check back soon for fresh catch!"
                  : "No completed auctions yet. Check the live auctions tab!"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
