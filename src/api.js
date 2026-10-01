import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8002/api" });

// attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

// get a readable error message from the backend JSON
export const errMsg = (e) => e.response?.data?.error || "Server error / backend not running";

export default api;
