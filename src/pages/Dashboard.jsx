import { useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then(res => setCurrentUser(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Welcome {currentUser?.name}</h1>
      <p className="text-gray-600">Email: {currentUser?.email}</p>

      <button
        onClick={logout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
