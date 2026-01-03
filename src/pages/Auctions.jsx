import { useEffect, useState } from "react";
import axios from "../api/axios";
import AuctionCard from "../components/AuctionCard";

export default function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/auctions")
      .then(res => setAuctions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading auctions...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        🐟 Live Fish Auctions
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {auctions.map(auction => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </div>
  );
}
