import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import api from "../api/axios";
import wsService from "../api/wsService";
import { AuthContext } from "../context/AuthContext";
import {
  Fish, MapPin, Scale, Clock, ArrowLeft, Gavel, Trophy,
  TrendingUp, AlertCircle, Loader2, Wifi, WifiOff,
  CheckCircle2
} from 'lucide-react';

/**
 * Auction Detail Page — Live bidding + Bid History + Winner Panel
 */
export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [winner, setWinner] = useState(null);
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

  // ── Helpers ──────────────────────────────────────
  const maskEmail = (email) => {
    if (!email) return "Anonymous";
    const [local, domain] = email.split("@");
    if (!domain) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  // Convert YouTube watch URL → embed URL for <iframe>
  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      // youtube.com/watch?v=VIDEO_ID  →  youtube.com/embed/VIDEO_ID
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
      }
      // youtu.be/VIDEO_ID  →  youtube.com/embed/VIDEO_ID
      if (parsed.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${parsed.pathname}`;
      }
      // Google Drive: /file/d/FILE_ID/view  →  /file/d/FILE_ID/preview
      if (parsed.hostname.includes('drive.google.com')) {
        return url.replace('/view', '/preview');
      }
      // Already an embed or unknown — return as-is
      return url;
    } catch (_) {
      return null;
    }
  };

  const timeAgo = (instant) => {
    if (!instant) return "";
    const secs = Math.floor((Date.now() - new Date(instant).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const calculateTimeLeft = (endTime) => {
    if (!endTime) return "N/A";
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  // ── Data fetchers ─────────────────────────────────
  const fetchBids = async () => {
    try {
      const res = await api.get(`/auctions/${id}/bids`);
      setBids(res.data || []);
    } catch (_) { }
  };

  const fetchWinner = async () => {
    try {
      const res = await api.get(`/auctions/${id}/winner`);
      setWinner(res.data);
    } catch (_) { }
  };

  // ── Initial load ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/auctions/${id}`);
        setAuction(res.data);
        setTimeLeft(calculateTimeLeft(res.data.endTime));
        if (!res.data.active) fetchWinner();
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    init();
    fetchBids();
  }, [id]);

  // ── WebSocket + countdown ─────────────────────────
  useEffect(() => {
    if (!auction) return;

    wsService.setOnConnectionChange(setWsConnected);
    wsService.connect(
      () => {
        wsService.subscribeToAuction(id, (data) => {
          if (data.type === "BID_PLACED") {
            setAuction(prev => ({ ...prev, currentPrice: data.currentPrice }));
            setPriceFlash(true);
            setTimeout(() => setPriceFlash(false), 2000);
            fetchBids();
          }
          if (data.type === "AUCTION_CLOSED") {
            setAuction(prev => ({ ...prev, active: false, currentPrice: data.finalPrice }));
            fetchWinner();
            fetchBids();
          }
        });
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      },
      () => startPolling()
    );

    countdownRef.current = setInterval(() => {
      if (auction?.endTime) setTimeLeft(calculateTimeLeft(auction.endTime));
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
          fetchBids();
        }
        setAuction(res.data);
      } catch (_) { }
    }, 3000);
  };

  // ── Bid submit ────────────────────────────────────
  const handleBid = async (e) => {
    e.preventDefault();
    setBidError(""); setBidSuccess("");
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
        fetchBids();
      }
    } catch (err) {
      setBidError(err.response?.data?.message || err.response?.data || "Please login to bid");
    } finally {
      setBidLoading(false);
    }
  };

  // ── Loading / not found ───────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );

  if (!auction) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6">
      <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md">
        <Fish className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Auction Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6">This auction may have been removed.</p>
        <button onClick={() => navigate('/auctions')}
          className="bg-blue-600 text-white px-8 py-2 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-700">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </button>
      </div>
    </div>
  );

  const hasImage = !!auction.imageBase64;
  const isLive = auction.active && auction.endTime && new Date() < new Date(auction.endTime);

  // ── Render ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pb-12">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/auctions')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Auctions
          </button>
          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1
            ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {isLive ? <TrendingUp className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
            {isLive ? 'LIVE' : 'CLOSED'}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5
            ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {wsConnected ? <><Wifi className="w-3.5 h-3.5" /> Live</> : <><WifiOff className="w-3.5 h-3.5" /> Polling</>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Info + Bid History ── */}
          <div className="space-y-6">

            {/* Auction Info Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-64 overflow-hidden">
                {hasImage ? (
                  <img src={`data:image/jpeg;base64,${auction.imageBase64}`}
                    alt={auction.fishName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center">
                    <Fish className="w-24 h-24 text-white/30" />
                    <span className="text-8xl select-none drop-shadow-2xl absolute">🐟</span>
                  </div>
                )}
              </div>
              <div className="p-8">
                <h1 className="text-4xl font-black text-gray-800 mb-6">{auction.fishName}</h1>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </p>
                    <p className="text-base font-bold text-blue-800">{auction.location || 'N/A'}</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                    <p className="text-xs text-teal-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Quantity
                    </p>
                    <p className="text-base font-bold text-teal-800">{auction.quantityKg ?? '??'} kg</p>
                  </div>
                  {!!auction.freshnessScore && (
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-xs text-green-500 font-bold uppercase mb-1">✨ Freshness</p>
                      <p className="text-base font-bold text-green-800">{auction.freshnessScore}%</p>
                    </div>
                  )}
                  {!!auction.aiSuggestedPrice && (
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      <p className="text-xs text-indigo-500 font-bold uppercase mb-1">🤖 AI Price</p>
                      <p className="text-base font-bold text-indigo-800">₹{auction.aiSuggestedPrice}/kg</p>
                    </div>
                  )}
                </div>
                {auction.sellerNotes && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Seller Notes</p>
                    <p className="text-sm text-gray-700">{auction.sellerNotes}</p>
                  </div>
                )}

                {/* ── Video Embed ── */}
                {auction.videoUrl && getEmbedUrl(auction.videoUrl) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
                      🎬 Seller Video Preview
                    </p>
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={getEmbedUrl(auction.videoUrl)}
                        title="Fish catch video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full rounded-lg border border-gray-200"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400 text-center">
                      📹 Watch the catch before you bid
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bid History Panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-blue-500" /> Bid History
                </h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                  {bids.length} bid{bids.length !== 1 ? 's' : ''}
                </span>
              </div>

              {bids.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Gavel className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm">No bids yet – be the first!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {bids.map((bid, idx) => (
                    <div key={bid.id}
                      className={`flex items-center gap-4 px-6 py-3 transition-colors
                        ${idx === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0
                        ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                            idx === 2 ? 'bg-orange-300 text-orange-900' :
                              'bg-gray-100 text-gray-500'}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700 truncate">{maskEmail(bid.bidderEmail)}</p>
                        <p className="text-xs text-gray-400">{timeAgo(bid.bidTime)}</p>
                      </div>
                      <span className={`text-sm font-black shrink-0 ${idx === 0 ? 'text-yellow-700' : 'text-gray-700'}`}>
                        ₹{bid.amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Bid Form or Winner ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
              {priceFlash && (
                <div className="absolute inset-0 bg-green-400/20 animate-pulse pointer-events-none" />
              )}

              <div className="text-center mb-8">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Price</p>
                <p className={`text-6xl font-black transition-all duration-300
                  ${priceFlash ? 'text-green-600 scale-110' : 'text-gray-900'}`}>
                  ₹{auction.currentPrice?.toLocaleString('en-IN') || '0'}
                </p>
                <p className="text-sm text-gray-400 mt-2">Starting at ₹{auction.startPrice}</p>
              </div>

              {isLive ? (
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
                          type="number" step="0.01" value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`${(auction.currentPrice + 1).toFixed(2)}`}
                          className="w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-bold focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={bidLoading || !user}
                      className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xl shadow-lg hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                      {bidLoading
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing Bid...</>
                        : <><Gavel className="w-5 h-5" /> PLACE BID</>}
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
                /* ── CLOSED: Winner panel ── */
                <div className="text-center">
                  <div className="mb-4 text-5xl">🏆</div>
                  <h2 className="text-2xl font-black text-gray-800 mb-2">Auction Closed</h2>
                  <p className="text-gray-400 text-sm mb-6">Final price achieved</p>

                  {winner ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-200 text-left mb-6">
                      <p className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Winner
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700">{maskEmail(winner.bidderEmail)}</span>
                        <span className="text-xl font-black text-yellow-700">₹{winner.amount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{bids.length} total bid{bids.length !== 1 ? 's' : ''}</span>
                        {!!auction.aiSuggestedPrice && (
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px]
                            ${winner.amount >= auction.aiSuggestedPrice
                              ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {winner.amount >= auction.aiSuggestedPrice ? '↑ Above AI price' : '↓ Below AI price'}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
                      <p className="text-gray-500 text-sm">No bids were placed on this auction.</p>
                      <p className="text-2xl font-black text-gray-700 mt-2">₹{auction.currentPrice?.toLocaleString('en-IN')}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => navigate('/auctions')}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Browse More
                    </button>
                    <button onClick={() => navigate(`/auction/${id}/summary`)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <Trophy className="w-4 h-4" /> Full Summary
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
