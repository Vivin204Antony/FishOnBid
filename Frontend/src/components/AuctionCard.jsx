import { Link } from "react-router-dom";
import { MapPin, Scale, Clock, ArrowRight, Zap } from 'lucide-react';

/**
 * Auction Card Component
 * Shows the actual fish photo when imageBase64 is present (camera capture).
 * Falls back to a stylised fish-emoji gradient placeholder.
 * LIVE/CLOSED badge and freshness score overlaid on the image.
 */
export default function AuctionCard({ auction }) {

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const isActive = (() => {
    if (!auction.active) return false;
    if (!auction.endTime) return auction.active;
    return new Date() < new Date(auction.endTime);
  })();

  const hasImage = !!auction.imageBase64;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                    hover:shadow-lg transition-all duration-300 flex flex-col group">

      {/* ── Fish Image / Placeholder Banner ── */}
      <div className="relative h-40 overflow-hidden flex-shrink-0">
        {hasImage ? (
          <img
            src={`data:image/jpeg;base64,${auction.imageBase64}`}
            alt={auction.fishName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center">
            <span className="text-6xl select-none drop-shadow-lg">🐟</span>
          </div>
        )}

        {/* LIVE / CLOSED badge — top right */}
        <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px]
                          font-bold uppercase tracking-wider flex items-center gap-1
                          ${isActive
            ? 'bg-green-500 text-white shadow-md shadow-green-500/40'
            : 'bg-red-500 text-white'}`}>
          {isActive && <Zap className="w-3 h-3" />}
          {isActive ? 'LIVE' : 'CLOSED'}
        </span>

        {/* Freshness badge — top left (only when vision-scored) */}
        {!!auction.freshnessScore && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px]
                           font-bold bg-black/50 backdrop-blur-sm text-white">
            ✨ {auction.freshnessScore}% Fresh
          </span>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="p-5 flex-1">
        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600
                       transition-colors line-clamp-1 mb-1">
          {auction.fishName}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {auction.location || 'Unknown Harbor'}
          </span>
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Scale className="w-3 h-3" /> {auction.quantityKg || '??'} kg
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-3">
          <p className="text-xs text-gray-500 mb-1">Current Bid</p>
          <p className="text-2xl font-black text-blue-700">
            ₹{auction.currentPrice?.toLocaleString('en-IN') || '0'}
            <span className="text-xs font-normal text-gray-400 ml-1">/kg</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Ends: {formatDate(auction.endTime)}</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-5 pb-5">
        <Link
          to={`/auction/${auction.id}`}
          className="flex items-center justify-center gap-2 w-full py-3
                     bg-blue-600 text-white rounded-xl font-bold
                     hover:bg-blue-700 transition-all shadow-sm hover:shadow-blue-200"
        >
          Place Your Bid <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
