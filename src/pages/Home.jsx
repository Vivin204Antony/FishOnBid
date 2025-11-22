import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Welcome to FishOnBid</h1>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Login
        </Link>

        <Link
          to="/signup"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
