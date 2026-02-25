import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';
import {
  Anchor, TrendingUp, Gavel, Bot, AlertTriangle, Plus, ArrowRight,
  Activity, BarChart3, Loader2, ExternalLink
} from 'lucide-react';

const FMPIS_URL = 'https://fmpisnfdb.in/';

/**
 * Professional Dashboard Component with Lucide Icons
 */
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeAuctions: 0,
    totalBids: 0,
    marketTrend: 'Stable',
    historicalPoints: 0
  });
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [liveRes, allRes] = await Promise.all([
          api.get('/auctions/live'),
          api.get('/auctions')
        ]);

        // Get first 4 live auctions (already ordered by newest first from backend)
        setMyAuctions(liveRes.data.slice(0, 4));

        setStats({
          activeAuctions: liveRes.data.length,
          totalBids: liveRes.data.reduce((acc, curr) => acc + (curr.currentPrice > curr.startPrice ? 5 : 0), 0) || liveRes.data.length * 2,
          marketTrend: 'Upward',
          historicalPoints: allRes.data.length
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 text-white py-14 px-6 relative overflow-hidden">
        {/* Decorative bubbles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="max-w-6xl mx-auto relative">
          <p className="text-blue-200 text-sm font-medium mb-1 tracking-wide">{todayStr}</p>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <span className="text-3xl">🐟</span>
            {greeting}, {user?.name?.split(' ')[0] || 'Fisherman'}!
          </h1>
          <p className="text-blue-200 text-base">
            <Anchor className="inline w-4 h-4 mr-1 opacity-70" />
            Welcome to your FishOnBid Command Center.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Live Auctions"
            value={stats.activeAuctions}
            Icon={Anchor}
            color="blue"
          />
          <StatCard
            title="Total Bids"
            value={stats.totalBids}
            Icon={Gavel}
            color="green"
          />
          <StatCard
            title="AI Training Points"
            value={stats.historicalPoints}
            Icon={Activity}
            color="indigo"
          />
          <StatCard
            title="Market Trend"
            value={stats.marketTrend}
            Icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Live Auctions</h2>
              <Link to="/auctions" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            ) : myAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myAuctions.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                <Anchor className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700">No active auctions found</h3>
                <p className="text-gray-500 mt-2 mb-6">Be the first to list your catch today!</p>
                <Link
                  to="/auctions/create"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  <Plus className="w-4 h-4" /> Start an Auction
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" /> AI Assistant
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Our AI Pricing tool is ready to help you maximize your profits based on historical market data.
              </p>
              <Link
                to="/auctions/create"
                className="block w-full text-center py-3 bg-blue-50 text-blue-700 
                         rounded-xl font-bold hover:bg-blue-100 transition-colors"
              >
                Try AI Pricing
              </Link>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
              <a
                href={FMPIS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-2 w-fit hover:underline decoration-white/60"
              >
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Market Alert
                </h3>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
              <p className="text-white/90 text-sm mb-1">
                Check live fish auction prices across India on the official government portal.
              </p>
              <p className="text-white/70 text-xs mb-4">
                📌 Fish Market Price Information System · fmpisnfdb.in
              </p>
              <a
                href={FMPIS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white/20 hover:bg-white/35 py-2 rounded-lg font-bold
                           transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" /> View Live Market Prices
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, Icon, color }) {
  const scheme = {
    blue: { icon: 'bg-blue-100 text-blue-600', border: 'border-l-blue-500', val: 'text-blue-700' },
    green: { icon: 'bg-green-100 text-green-600', border: 'border-l-green-500', val: 'text-green-700' },
    indigo: { icon: 'bg-indigo-100 text-indigo-600', border: 'border-l-indigo-500', val: 'text-indigo-700' },
    orange: { icon: 'bg-orange-100 text-orange-600', border: 'border-l-orange-500', val: 'text-orange-700' },
  }[color];

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 ${scheme.border}
                    flex items-center justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-3xl font-black ${scheme.val}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${scheme.icon}`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  );
}
