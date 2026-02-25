import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Fish, LayoutDashboard, LogOut, LogIn, UserCircle2,
  Gavel, ChevronDown, UserPlus
} from 'lucide-react';

/**
 * Header with a person-icon dropdown menu.
 * Dropdown contains: Dashboard (if logged in), Auctions, Login/Logout.
 * No inline nav links — everything lives in the dropdown.
 */
export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const close = () => setOpen(false);

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/pwa-512x512.png" alt="FishOnBid Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-xl font-bold tracking-tight">FishOnBid</span>
          </Link>

          {/* ── User Dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl
                         hover:bg-white/10 transition-colors"
              aria-label="User menu"
            >
              <UserCircle2 className="w-7 h-7 text-white" />
              {user && (
                <span className="hidden sm:inline text-sm font-semibold max-w-[120px] truncate">
                  {user.name}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-white/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* ── Dropdown Panel ── */}
            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl
                              border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2
                              duration-150">

                {/* User info section (logged in) */}
                {user && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-blue-50">
                    <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                )}

                <div className="py-1">
                  {/* Dashboard — only when logged in */}
                  {user && (
                    <Link
                      to="/dashboard"
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                                 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  )}

                  {/* Auctions — always visible */}
                  <Link
                    to="/auctions"
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                               hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Gavel className="w-4 h-4" /> Auctions
                  </Link>

                  <div className="my-1 mx-3 h-px bg-gray-100" />

                  {/* Login / Logout */}
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm
                                 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={close}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                                   hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <LogIn className="w-4 h-4" /> Login
                      </Link>
                      <Link
                        to="/signup"
                        onClick={close}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                                   hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" /> Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
