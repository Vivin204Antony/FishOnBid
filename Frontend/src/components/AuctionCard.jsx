import { Link } from "react-router-dom";
import { MapPin, Scale, Clock, ArrowRight, Zap } from 'lucide-react';

/**
 * Enhanced Auction Card Component with Lucide Icons
 */
export default function AuctionCard({ auction }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden 
                    hover:shadow-md transition-all duration-300 flex flex-col group">
      <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 
                           transition-colors line-clamp-1">
              {auction.fishName}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {auction.location || 'Unknown Harbor'}
              </span>
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Scale className="w-3 h-3" /> {auction.quantityKg || '??'} kg
              </span>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${auction.active
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
            }`}>
            {auction.active && <Zap className="w-3 h-3" />}
            {auction.active ? "LIVE" : "CLOSED"}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Bid</p>
              <p className="text-2xl font-black text-blue-700">
                ₹{auction.currentPrice?.toLocaleString('en-IN') || '0'}
                <span className="text-xs font-normal text-gray-400 ml-1">/kg</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
          <Clock className="w-3 h-3" />
          <span>Ends: {formatDate(auction.endTime)}</span>
        </div>
      </div>

      <div className="px-5 pb-5">
        <Link
          to={`/auction/${auction.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-bold 
                     hover:bg-blue-700 transition-all shadow-sm hover:shadow-blue-200"
        >
          Place Your Bid <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
