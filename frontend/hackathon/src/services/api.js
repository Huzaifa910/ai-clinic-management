import axios from "axios";

// .env se URL lo
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5500/api";

// Simple axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Har request mein token add karo (agar ho to)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;