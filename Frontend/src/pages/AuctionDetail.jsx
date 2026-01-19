import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import api from "../api/axios";
import wsService from "../api/wsService";
import { AuthContext } from "../context/AuthContext";
import {
  Fish, MapPin, Scale, Clock, ArrowLeft, Gavel, Trophy,
  TrendingUp, AlertCircle, Loader2, Wifi, WifiOff, Send,
  CheckCircle2
} from 'lucide-react';

/**
 * Professional Auction Detail Page with Lucide Icons
 * Features live WebSocket updates with polling fallback
 */
export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [priceFlash, setPriceFlash] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  const calculateTimeLeft = (endTime) => {
    if (!endTime) return "N/A";
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await api.get(`/auctions/${id}`);
        setAuction(res.data);
        setTimeLeft(calculateTimeLeft(res.data.endTime));
      } catch (err) {
        console.error("Failed to load auction:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  useEffect(() => {
    if (!auction) return;

    wsService.setOnConnectionChange(setWsConnected);

    wsService.connect(
      () => {
        wsService.subscribeToAuction(id, (data) => {
          console.log("WS Update received:", data);

          if (data.type === "BID_PLACED") {
            setAuction(prev => ({
              ...prev,
              currentPrice: data.currentPrice
            }));
            setPriceFlash(true);
            setTimeout(() => setPriceFlash(false), 2000);
          }

          if (data.type === "AUCTION_CLOSED") {
            setAuction(prev => ({
              ...prev,
              active: false,
              currentPrice: data.finalPrice
            }));
          }
        });

        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      },
      (error) => {
        console.warn("WebSocket failed, using polling fallback");
        startPolling();
      }
    );

    countdownRef.current = setInterval(() => {
      if (auction?.endTime) {
        setTimeLeft(calculateTimeLeft(auction.endTime));
      }
    }, 1000);

    return () => {
      wsService.unsubscribe(`/topic/auction/${id}`);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [id, auction?.endTime]);

  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/auctions/${id}`);
        if (res.data.currentPrice !== auction?.currentPrice) {
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 2000);
        }
        setAuction(res.data);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setBidError("");
    setBidSuccess("");

    const amount = parseFloat(bidAmount);
    if (!amount || amount <= auction.currentPrice) {
      setBidError(`Bid must be higher than ₹${auction.currentPrice}`);
      return;
    }

    setBidLoading(true);
    try {
      await api.post(`/auctions/${id}/bid`, { amount });
      setBidSuccess("Your bid has been placed!");
      setBidAmount("");

      if (!wsConnected) {
        const res = await api.get(`/auctions/${id}`);
        setAuction(res.data);
      }
    } catch (err) {
      setBidError(err.response?.data?.message || err.response?.data || "Please login to bid");
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md">
          <Fish className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Auction Not Found</h2>
          <p className="text-gray-500 mt-2 mb-6">This auction may have been removed.</p>
          <button onClick={() => navigate('/auctions')} className="bg-blue-600 text-white px-8 py-2 rounded-xl flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Connection Status */}
        <div className={`mb-4 px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
          {wsConnected ? (
            <><Wifi className="w-4 h-4" /> Live Updates Active</>
          ) : (
            <><WifiOff className="w-4 h-4" /> Using Polling Fallback</>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                <Fish className="w-32 h-32 text-white/50" />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-4xl font-black text-gray-800">{auction.fishName}</h1>
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 ${auction.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                    {auction.active ? <TrendingUp className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                    {auction.active ? "LIVE" : "CLOSED"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </p>
                    <p className="text-lg font-bold text-gray-700">{auction.location || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Quantity
                    </p>
                    <p className="text-lg font-bold text-gray-700">{auction.quantityKg || '??'} kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bidding */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
              {priceFlash && (
                <div className="absolute inset-0 bg-green-400/20 animate-pulse pointer-events-none"></div>
              )}

              <div className="text-center mb-8">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Price</p>
                <p className={`text-6xl font-black transition-all duration-300 ${priceFlash ? 'text-green-600 scale-110' : 'text-gray-900'
                  }`}>
                  ₹{auction.currentPrice?.toLocaleString('en-IN') || '0'}
                </p>
                <p className="text-sm text-gray-400 mt-2">Starting at ₹{auction.startPrice}</p>
              </div>

              {auction.active ? (
                <>
                  <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <span className="font-bold text-blue-800">Ends in:</span>
                    </div>
                    <span className="text-xl font-black text-blue-800 font-mono">{timeLeft}</span>
                  </div>

                  <form onSubmit={handleBid} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2">Your Bid</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`${(auction.currentPrice + 1).toFixed(2)}`}
                          className="w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-2xl 
                                     text-xl font-bold focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={bidLoading || !user}
                      className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 
                               text-white rounded-2xl font-black text-xl shadow-lg 
                               hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50
                               flex items-center justify-center gap-2"
                    >
                      {bidLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Placing Bid...</>
                      ) : (
                        <><Gavel className="w-5 h-5" /> PLACE BID</>
                      )}
                    </button>

                    {bidError && (
                      <p className="text-center text-red-600 font-bold text-sm bg-red-50 py-3 rounded-lg flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {bidError}
                      </p>
                    )}
                    {bidSuccess && (
                      <p className="text-center text-green-600 font-bold text-sm bg-green-50 py-3 rounded-lg flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {bidSuccess}
                      </p>
                    )}
                    {!user && <p className="text-center text-gray-500 text-sm italic">Please sign in to place a bid.</p>}
                  </form>
                </>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <h2 className="text-2xl font-black text-gray-800">Auction Completed</h2>
                  <p className="text-gray-500 mt-2">Final price: ₹{auction.currentPrice}</p>
                  <button
                    onClick={() => navigate('/auctions')}
                    className="mt-8 px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" /> Browse More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
