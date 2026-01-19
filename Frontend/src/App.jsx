import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
import CreateAuction from "./pages/CreateAuction";
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/auctions"
            element={
              <ProtectedRoute>
                <Auctions />
              </ProtectedRoute>
            }
          />

          {/* Create Auction with AI-Assisted Pricing */}
          <Route
            path="/auctions/create"
            element={
              <ProtectedRoute>
                <CreateAuction />
              </ProtectedRoute>
            }
          />

          {/* Auction Detail Route */}
          <Route path="/auction/:id" element={<AuctionDetail />} />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}