

import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
function formatTimeLeft(endTime) {
  const end = new Date(endTime);
  const now = new Date();
  const diff = Math.max(0, end - now);
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return `${min}m ${sec}s`;
}


function AuctionDetail() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceChanged, setPriceChanged] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Initial fetch
  useEffect(() => {
    api.get(`/auctions/${id}`)
      .then(res => {
        setAuction(res.data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [id]);

  // Polling for live price updates and countdown
  useEffect(() => {
    if (!auction) return;
    setTimeLeft(formatTimeLeft(auction.endTime));
    const interval = setInterval(() => {
      api.get(`/auctions/${id}`)
        .then(res => {
          if (auction.currentPrice !== res.data.currentPrice) {
            setPriceChanged(true);
            setTimeout(() => setPriceChanged(false), 1200);
          }
          setAuction(res.data);
        })
        .catch(() => {});
      setTimeLeft(formatTimeLeft(auction.endTime));
    }, 3000);
    return () => clearInterval(interval);
  }, [id, auction]);

  // Fetch summary if auction is closed
  useEffect(() => {
    if (auction && !auction.active) {
      api.get(`/auctions/${id}/summary`)
        .then(res => setSummary(res.data))
        .catch(() => {});
    }
  }, [auction, id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!auction) return <p className="text-center mt-10 text-red-600">Auction not found.</p>;

  // Bid handler
  const handleBid = async (e) => {
    e.preventDefault();
    setBidError("");
    setBidSuccess("");
    setBidLoading(true);
    if (!auction.active) {
      setBidError("Auction is closed.");
      setBidLoading(false);
      return;
    }
    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= auction.currentPrice) {
      setBidError("Bid must be greater than current price.");
      setBidLoading(false);
      return;
    }
    try {
      await api.post("/bids", {
        auctionId: auction.id,
        amount: bidValue,
      });
      setBidSuccess("Bid placed successfully!");
      setBidAmount("");
      // Refresh auction data instantly
      const res = await api.get(`/auctions/${id}`);
      setAuction(res.data);
    } catch (err) {
      setBidError(err.response?.data?.message || "Failed to place bid.");
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 mt-4 sm:mt-8 text-gray-900">
      {/* Auction Info Section */}
      <div className="mb-6 border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 break-words">{auction.fishName}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${auction.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {auction.active ? "Active" : "Closed"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-lg sm:text-xl font-bold text-green-700">₹{auction.currentPrice}</span>
          <span className={`ml-2 flex items-center gap-1 ${priceChanged ? "animate-pulse" : ""}`} aria-live="polite" aria-label="Live price update">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" aria-hidden="true"></span>
            <span className="text-xs text-gray-500">Live</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <span>Start: <span className="font-mono">{auction.startTime}</span></span>
          <span>End: <span className="font-mono">{auction.endTime}</span></span>
          {auction.active && <span className="font-semibold text-blue-700">⏳ {timeLeft} left</span>}
        </div>
      </div>

      {/* Bid Section */}
      {auction.active && (
        <div className="mb-6 border-b pb-4">
          <h2 className="text-lg font-semibold mb-2">Place a Bid</h2>
          <form onSubmit={handleBid}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="number"
                step="0.01"
                min={auction.currentPrice + 0.01}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder={`Bid > ₹${auction.currentPrice}`}
                className="border rounded px-3 py-3 sm:py-2 w-full sm:w-40 focus:outline-none focus:ring focus:border-blue-400 text-lg"
                disabled={!user || bidLoading}
                required
                aria-label="Bid amount"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded hover:bg-blue-700 font-semibold flex items-center gap-2 text-lg sm:text-base"
                disabled={!user || bidLoading}
                aria-label="Place Bid"
              >
                {bidLoading && <span className="loader border-2 border-white border-t-blue-600 rounded-full w-4 h-4 animate-spin"></span>}
                Place Bid
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum bid: ₹{auction.currentPrice + 0.01}</p>
            {!user && <p className="text-sm text-gray-500 mt-2">Login to place a bid.</p>}
            {bidError && <p className="text-sm text-red-600 mt-2" role="alert">{bidError}</p>}
            {bidSuccess && <p className="text-sm text-green-600 mt-2" role="status">{bidSuccess}</p>}
          </form>
        </div>
      )}

      {/* Summary Section */}
      {!auction.active && summary && (
        <div className="bg-gray-50 rounded p-4 mt-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Auction Closed</span>
            <span className="text-lg font-bold text-green-800">Final Price: ₹{summary.winningBid}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">🏆 Winner:</span>
            <span className="ml-2 font-bold text-green-700">{summary.winnerEmail}</span>
          </div>
          {summary.bidHistory && summary.bidHistory.length > 0 && (
            <div className="mt-4">
              <strong className="block mb-1">Bid History:</strong>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 text-left">Amount</th>
                      <th className="px-2 py-1 text-left">Bidder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.bidHistory.map((bid, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">₹{bid.amount}</td>
                        <td className="px-2 py-1">{bid.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AuctionDetail;
