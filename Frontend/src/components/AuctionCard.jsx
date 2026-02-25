import { Link } from "react-router-dom";
import { MapPin, Scale, Clock, ArrowRight, Zap, Sparkles } from 'lucide-react';

/**
 * Auction Card — shows fish photo (imageBase64) or gradient placeholder.
 * LIVE/CLOSED badge, freshness score, price, CTA all adapt to auction state.
 */
export default function AuctionCard({ auction }) {

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const isLive = (() => {
    if (!auction.active) return false;
    if (!auction.endTime) return auction.active;
    return new Date() < new Date(auction.endTime);
  })();

  const hasImage = !!auction.imageBase64;

  // Freshness — color tier
  const freshScore = auction.freshnessScore;
  const freshColor = freshScore >= 80
    ? 'bg-green-500/80 text-white'
    : freshScore >= 50
      ? 'bg-yellow-400/90 text-gray-900'
      : 'bg-red-500/80 text-white';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
                    hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col group">

      {/* ── Fish Image / Placeholder Banner ── */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {hasImage ? (
          <img
            src={`data:image/jpeg;base64,${auction.imageBase64}`}
            alt={auction.fishName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700
                          flex items-center justify-center">
            <span className="text-7xl select-none drop-shadow-2xl">🐟</span>
          </div>
        )}

        {/* LIVE / CLOSED badge — top right */}
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px]
                          font-black uppercase tracking-widest flex items-center gap-1 shadow-lg
                          ${isLive
            ? 'bg-emerald-500 text-white shadow-emerald-500/40'
            : 'bg-slate-700/80 backdrop-blur-sm text-white'}`}>
          {isLive && <Zap className="w-3 h-3" />}
          {isLive ? 'LIVE' : 'CLOSED'}
        </span>

        {/* Freshness badge — top left */}
        {!!freshScore && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px]
                             font-black backdrop-blur-sm flex items-center gap-1 ${freshColor}`}>
            <Sparkles className="w-3 h-3" />
            {freshScore}% Fresh
          </span>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-gray-800 group-hover:text-blue-600
                       transition-colors line-clamp-1 mb-1">
          {auction.fishName}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            {auction.location || 'Unknown Harbor'}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1">
            <Scale className="w-3 h-3 text-teal-400" />
            {auction.quantityKg ?? '??'} kg
          </span>
        </div>

        {/* Price box */}
        <div className={`rounded-xl p-4 mb-4 border-l-4 flex-1 flex flex-col justify-center
          ${isLive
            ? 'bg-emerald-50 border-emerald-500'
            : 'bg-gray-50 border-gray-300'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wider mb-0.5
            ${isLive ? 'text-emerald-600' : 'text-gray-400'}`}>
            {isLive ? 'Current Bid' : 'Final Price'}
          </p>
          <p className={`text-3xl font-black ${isLive ? 'text-emerald-700' : 'text-gray-700'}`}>
            ₹{auction.currentPrice?.toLocaleString('en-IN') ?? '0'}
            <span className="text-xs font-normal text-gray-400 ml-1">/kg</span>
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
          <Clock className="w-3 h-3" />
          <span>{isLive ? 'Ends' : 'Ended'}: {formatDate(auction.endTime)}</span>
        </div>

        {/* CTA */}
        <Link
          to={`/auction/${auction.id}`}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold
                     transition-all shadow-sm text-white
                     ${isLive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-200 hover:shadow-md'
              : 'bg-slate-600 hover:bg-slate-700'}`}
        >
          {isLive ? 'Place Your Bid' : 'View Result'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
