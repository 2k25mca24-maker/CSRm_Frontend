import axios from "axios";

// Automatically resolve backend URL from environment or local fallback
const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    const trimmed = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }
  return "http://localhost:8002/api";
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
});

// attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

// get a readable error message from the backend JSON
export const errMsg = (e) => e.response?.data?.error || "Server error / backend not running";

export default api;

