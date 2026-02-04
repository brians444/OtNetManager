import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("API Request:", config.method?.toUpperCase(), config.url, "with token:", !!token);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("=== API ERROR ===");
    console.log("Error status:", error.response?.status);
    console.log("Error URL:", originalRequest.url);
    console.log("Error method:", originalRequest.method?.toUpperCase());
    console.log("Has refresh token:", !!localStorage.getItem("refresh_token"));

    // Skip refresh logic for login endpoint - login failures should just fail
    const isLoginEndpoint = originalRequest.url?.includes('/api/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginEndpoint) {
      console.log("=== 401 ERROR - ATTEMPTING REFRESH ===");
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        
        if (!refreshToken) {
          console.log("No refresh token available - redirecting to login");
          throw new Error("No refresh token available");
        }

        console.log("Attempting refresh with token...");
        const params = new URLSearchParams();
        params.append("refresh_token", refreshToken);

        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          params,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        const { access_token, refresh_token } = response.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        console.log("Refresh successful - retrying original request");

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
