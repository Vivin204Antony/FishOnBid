import { useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", form);

      if (res.data === "Invalid credentials") {
        setMessage("❌ Invalid email or password");
        return;
      }

      // Extract token & user
      const { token, user } = res.data;

      // Use context login
      login(token, user);

      setMessage("✅ Login successful!");

      navigate("/dashboard");
    } catch (err) {
      if (!navigator.onLine) {
        setMessage("❌ You are offline. Please check your connection.");
      } else {
        setMessage("❌ Server error. Try again later.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>

        <form onSubmit={handleLogin}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            onChange={handleChange}
          />

          <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Login
          </button>

          {message && (
            <p className="text-center mt-4 text-red-600 font-medium">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
