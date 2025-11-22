import { useState } from "react";
import axios from "../api/axios";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/users/add", form);
      setMessage("Account created successfully!");
    } catch (err) {
      setMessage("Failed to create account.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT SIDE IMAGE */}
        <div className="hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1500204754366-3c535be992f5"
            alt="Signup"
            className="w-full h-full object-cover"
          />
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
            Create Your Account
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="font-semibold">Full Name</label>
              <input
                name="name"
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="font-semibold">Email</label>
              <input
                name="email"
                type="email"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="example@mail.com"
                required
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="font-semibold">Password</label>
              <input
                name="password"
                type="password"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                onChange={handleChange}
              />
            </div>

            <button
              className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg hover:bg-blue-700 transition"
            >
              Create Account
            </button>

            {message && (
              <p className="text-center mt-4 text-green-600 font-semibold">{message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
