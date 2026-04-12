import axios from "axios";
import { appStorage, getApiBaseUrl } from "../utils/platform";

const BASE_URL = getApiBaseUrl();
console.log("FINAL API BASE URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = appStorage.get("token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error);

    if (error.response?.status === 401) {
      console.warn("Unauthorized, redirect to login");
    }

    return Promise.reject(error);
  }
);

export default api;