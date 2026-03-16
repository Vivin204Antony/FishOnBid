import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import { AuthContext, AuthProvider } from "./context/AuthContext";

import OfflineBanner from "./components/OfflineBanner";
import Header from "./components/Header";

function GuestOnlyRoute({ children }) {
  const { token } = useContext(AuthContext);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <Login />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestOnlyRoute>
                <Signup />
              </GuestOnlyRoute>
            }
          />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/auctions" element={<ProtectedRoute><Auctions /></ProtectedRoute>} />
          <Route path="/auctions/create" element={<ProtectedRoute><CreateAuction /></ProtectedRoute>} />
          <Route path="/auction/:id" element={<ProtectedRoute><AuctionDetail /></ProtectedRoute>} />
          <Route path="/auction/:id/summary" element={<ProtectedRoute><AuctionSummary /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><AuctionResults /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
