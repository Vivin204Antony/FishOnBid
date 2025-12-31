
import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";


function AuctionDetail() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceChanged, setPriceChanged] = useState(false);

  // Initial fetch
  useEffect(() => {
    api.get(`/auctions/${id}`)
      .then(res => {
        setAuction(res.data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [id]);

  // Polling for live price updates
  useEffect(() => {
    if (!auction) return;
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
    if (!auction.active) {
      setBidError("Auction is closed.");
      return;
    }
    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= auction.currentPrice) {
      setBidError("Bid must be greater than current price.");
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
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Auction Details</h2>
        {!auction.active && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Auction Closed</span>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <p><strong>Fish Name:</strong> {auction.fishName}</p>
        <p><strong>Start Price:</strong> ₹{auction.startPrice}</p>
        <p className={`transition-colors duration-500 ${priceChanged ? "bg-yellow-100" : ""}`}>
          <strong>Current Price:</strong> <span className="text-green-700 font-bold">₹{auction.currentPrice}</span>
        </p>
        <p><strong>Start Time:</strong> {auction.startTime}</p>
        <p><strong>End Time:</strong> {auction.endTime}</p>
        <p><strong>Status:</strong> {auction.active ? "Active" : "Closed"}</p>
      </div>

      {/* Bid Input */}
      {auction.active && (
        <form onSubmit={handleBid} className="mb-6">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min={auction.currentPrice + 0.01}
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              placeholder={`Bid > ₹${auction.currentPrice}`}
              className="border rounded px-3 py-2 w-40 focus:outline-none focus:ring focus:border-blue-400"
              disabled={!user}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
              disabled={!user}
            >
              Place Bid
            </button>
          </div>
          {!user && <p className="text-sm text-gray-500 mt-2">Login to place a bid.</p>}
          {bidError && <p className="text-sm text-red-600 mt-2">{bidError}</p>}
          {bidSuccess && <p className="text-sm text-green-600 mt-2">{bidSuccess}</p>}
        </form>
      )}

      {/* Auction Summary */}
      {!auction.active && summary && (
        <div className="bg-gray-50 rounded p-4 mt-4">
          <h3 className="text-lg font-bold mb-2">Auction Summary</h3>
          <p><strong>Winning Bid:</strong> ₹{summary.winningBid}</p>
          <p><strong>Winner:</strong> {summary.winnerEmail}</p>
          {summary.bidHistory && summary.bidHistory.length > 0 && (
            <div className="mt-2">
              <strong>Bid History:</strong>
              <ul className="list-disc ml-6">
                {summary.bidHistory.map((bid, idx) => (
                  <li key={idx}>
                    ₹{bid.amount} by {bid.email}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AuctionDetail;
