import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
import AuctionSummary from "./pages/AuctionSummary";
import CreateAuction from "./pages/CreateAuction";
import Landing from "./pages/Landing";
import AdminPanel from "./pages/AdminPanel";
import AuctionResults from "./pages/AuctionResults";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import OfflineBanner from "./components/OfflineBanner";
import Header from "./components/Header";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <OfflineBanner />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/auctions" element={<ProtectedRoute><Auctions /></ProtectedRoute>} />
          <Route path="/auctions/create" element={<ProtectedRoute><CreateAuction /></ProtectedRoute>} />

          {/* Auction detail + summary — public so buyers can share links */}
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/auction/:id/summary" element={<AuctionSummary />} />

          {/* Results — public page, completed auctions with bids */}
          <Route path="/results" element={<AuctionResults />} />

          {/* Admin panel — only accessible by ADMIN role (page itself redirects non-admins) */}
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

          {/* Root: always Landing — the page itself adapts CTAs based on auth */}
          <Route path="/" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
