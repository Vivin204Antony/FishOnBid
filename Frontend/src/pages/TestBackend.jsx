import api from "../api/axios";
import { useEffect, useState } from "react";

export default function TestBackend() {
  const [message, setMessage] = useState("Loading...");
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/users/test")
       .then(res => {
         console.log("Success:", res.data);
         setMessage(res.data);
       })
       .catch(err => {
         console.error("Error:", err);
         setError(err.message);
         setMessage("Failed to connect");
       });
  }, []);

  return (
    <div className="p-8">
      <h1 className={`text-2xl font-bold ${error ? 'text-red-600' : 'text-green-600'}`}>
        Backend says: {message}
      </h1>
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700 font-semibold">Error Details:</p>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            Check browser console (F12) for CORS errors
          </p>
        </div>
      )}
    </div>
  );
}
