import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Fish, LayoutDashboard, Plus, LogOut, LogIn, User } from 'lucide-react';

/**
 * Professional Header Component with Lucide Icons
 */
export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/pwa-512x512.png" alt="FishOnBid Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-xl font-bold tracking-tight">FishOnBid</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              to="/auctions"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                         hover:bg-white/10 transition-colors"
            >
              <Fish className="w-4 h-4" />
              <span className="hidden sm:inline">Auctions</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                             hover:bg-white/10 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <Link
                  to="/auctions/create"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                             bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Auction</span>
                </Link>
              </>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           bg-red-600/20 hover:bg-red-600/40 text-red-300 transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
