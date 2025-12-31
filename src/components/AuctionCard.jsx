export default function AuctionCard({ auction }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border">
      <h3 className="text-xl font-semibold mb-1">
        {auction.fishName}
      </h3>

      <p className="text-sm text-gray-600">
        Item: {auction.itemName}
      </p>

      <p className="mt-2">
        💰 Current Price:
        <span className="font-bold text-green-700 ml-1">
          ₹{auction.currentPrice}
        </span>
      </p>

      <p className={`mt-1 text-sm ${auction.active ? "text-green-600" : "text-red-600"}`}>
        Status: {auction.active ? "Live" : "Closed"}
      </p>
    </div>
  );
}
