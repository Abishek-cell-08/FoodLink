import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized, redirect to login");
      // optional: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
