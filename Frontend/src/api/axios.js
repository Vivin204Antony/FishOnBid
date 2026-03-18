import axios from "axios";

const backendPort = 8085;
const baseURL =
  window.location.hostname === "localhost"
    ? `http://localhost:${backendPort}/api`
    : `http://${window.location.hostname}:${backendPort}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
