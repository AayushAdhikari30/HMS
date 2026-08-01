import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1/hms",
  withCredentials: true, // sends the httpOnly refresh token cookie
});

// Attach access token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Endpoints where a 401 is a normal, user-facing response (wrong password, etc.)
// — not a sign that a session expired, so they must never trigger the
// refresh-then-redirect flow below.
const AUTH_ENDPOINTS = [
  "/login",
  "/register",
  "/refresh",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
];

// If access token expires, auto-refresh and retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => original?.url?.includes(path));
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1/hms"}/refresh`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem("hms_token", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("hms_token");
        localStorage.removeItem("hms_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;