import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ── Request: adjunta el token en cada llamada ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: maneja 401 (token expirado / inválido) ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpia la sesión local
      localStorage.removeItem("token");

      // Redirige al login si no estamos ya ahí (evita loop)
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/signin")) {
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
