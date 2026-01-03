import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-green-700 text-white shadow-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl tracking-wide">FishOnBid</span>
      </div>
      <nav className="hidden md:flex gap-6 items-center">
        <Link to="/auctions" className="hover:underline">Auctions</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        {user ? (
          <button onClick={handleLogout} className="ml-4 bg-white text-green-700 px-3 py-1 rounded font-semibold hover:bg-green-100">Logout</button>
        ) : (
          <Link to="/login" className="ml-4 bg-white text-green-700 px-3 py-1 rounded font-semibold hover:bg-green-100">Login</Link>
        )}
      </nav>
      {/* Mobile Hamburger */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setMenuOpen(!menuOpen)} className="focus:outline-none">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute top-16 right-4 bg-white text-green-700 rounded shadow-lg py-2 px-4 z-50 flex flex-col gap-2">
            <Link to="/auctions" onClick={() => setMenuOpen(false)} className="hover:underline">Auctions</Link>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:underline">Dashboard</Link>
            {user ? (
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="bg-green-700 text-white px-3 py-1 rounded font-semibold hover:bg-green-800">Logout</button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-green-700 text-white px-3 py-1 rounded font-semibold hover:bg-green-800">Login</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
