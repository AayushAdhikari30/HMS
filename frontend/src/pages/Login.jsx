import  { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

axios.defaults.withCredentials = true;
const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:8000";

const ROLE_CONFIG = {
  patient: {
    label: "Patient",
    gradient: "from-blue-600 to-indigo-600",
    hover:    "hover:from-blue-700 hover:to-indigo-700",
    ring:     "focus:ring-blue-500",
    badge:    "bg-blue-50 text-blue-700",
    placeholder: "patient@hospital.com",
  },
  doctor: {
    label: "Doctor",
    gradient: "from-teal-600 to-cyan-600",
    hover:    "hover:from-teal-700 hover:to-cyan-700",
    ring:     "focus:ring-teal-500",
    badge:    "bg-teal-50 text-teal-700",
    placeholder: "doctor@hospital.com",
  },
  admin: {
    label: "Admin",
    gradient: "from-purple-600 to-pink-600",
    hover:    "hover:from-purple-700 hover:to-pink-700",
    ring:     "focus:ring-purple-500",
    badge:    "bg-purple-50 text-purple-700",
    placeholder: "admin@hospital.com",
  },
};

const Login = () => {
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const cfg = ROLE_CONFIG[role];

  // Auto-login check
  useEffect(() => {
    const stored = localStorage.getItem("hms_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u?.role) { navigate(`/${u.role}-dashboard`); return; }
      } catch { localStorage.removeItem("hms_user"); }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckingAuth(false);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND}/api/v1/hms/login`,
        { email, password, role },
        { withCredentials: true }
      );
      if (res.data.success) {
        login(res.data.user);
        navigate(`/${role}-dashboard`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 px-4 py-12 font-display relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-0 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/60">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${cfg.gradient} rounded-2xl mb-4 shadow-xl`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">MediCare HMS</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your portal</p>
          </div>

          {/* Role toggle */}
          <div className="flex gap-1.5 mb-6 p-1 bg-gray-100 rounded-xl">
            {Object.entries(ROLE_CONFIG).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setRole(key); setError(""); }}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 ${
                  role === key
                    ? `bg-white text-gray-900 shadow-sm`
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {cfg.label} Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={cfg.placeholder}
                required
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${cfg.ring} focus:border-transparent transition-all text-sm`}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={`w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${cfg.ring} focus:border-transparent transition-all text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 bg-gradient-to-r ${cfg.gradient} ${cfg.hover} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                `Sign in as ${cfg.label}`
              )}
            </button>
          </form>

          {/* Register link (patients only) */}
          {role === "patient" && (
            <p className="text-center text-sm text-gray-500 mt-6">
              New patient?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
              >
                Create account
              </button>
            </p>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
          {["HIPAA Compliant", "256-bit Encrypted", "Trusted Platform"].map((b) => (
            <div key={b} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;