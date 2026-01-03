
import { Link } from "react-router-dom";

export default function AuctionCard({ auction }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-green-800">{auction.fishName}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${auction.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {auction.active ? "Active" : "Closed"}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Ends: <span className="font-medium">{auction.endTime}</span>
        </p>
        <p className="mt-2 text-lg">
          <span className="font-semibold">Current Price:</span>
          <span className="font-bold text-green-700 ml-2">₹{auction.currentPrice}</span>
        </p>
      </div>
      <Link
        to={`/auction/${auction.id}`}
        className="mt-4 bg-green-700 text-white px-4 py-2 rounded font-semibold text-center hover:bg-green-800 transition-colors"
      >
        View Auction
      </Link>
    </div>
  );
}
