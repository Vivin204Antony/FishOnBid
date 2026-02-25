// Home.jsx is replaced by Landing.jsx — this file redirects to root.
import { Navigate } from "react-router-dom";
export default function Home() {
  return <Navigate to="/" replace />;
}
