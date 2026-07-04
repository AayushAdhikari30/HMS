import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api/axios";

const HospitalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// FIX: staff log in with admin-generated IDs (e.g. DOC-2026-0001), not email.
// The input must accept that, so type="email" can no longer be used and the
// placeholder/label must reflect each role's actual identifier format.
const ROLE_CONFIG = {
  patient: { label: "Patient", placeholder: "you@example.com", fieldLabel: "Email" },
  doctor: { label: "Doctor", placeholder: "DOC-2026-0001", fieldLabel: "Staff ID" },
  admin: { label: "Admin", placeholder: "ADM-2026-0001", fieldLabel: "Staff ID" },
};

const Login = () => {
  const [role, setRole] = useState("patient");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const cfg = ROLE_CONFIG[role];

  useEffect(() => {
    const stored = localStorage.getItem("hms_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u?.role) {
          navigate(`/${u.role}-dashboard`);
          return;
        }
      } catch {
        localStorage.removeItem("hms_user");
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckingAuth(false);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
    
      const res = await api.post("/login", { identifier, password, role });
      if (res.data.success) {
        localStorage.setItem("hms_token", res.data.accessToken);
        login(res.data.user);
        navigate(`/${role}-dashboard`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-3
    text-white placeholder-[#444] text-sm outline-none
    focus:border-green-500 focus:ring-1 focus:ring-green-500/20
    transition-all duration-200 [color-scheme:dark]
  `;
  const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-[#2a2a2a] border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      <div className="hidden lg:flex flex-1 flex-col justify-between px-14 py-12 bg-[#0a0a0a] border-r border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <HospitalIcon />
          <span className="text-white font-bold text-xl tracking-tight">
            Medi<span className="text-green-500">Care</span>
            <span className="text-[#555] font-normal ml-1 text-sm">HMS</span>
          </span>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
            <ShieldIcon />
            <span className="text-green-400 text-xs font-semibold tracking-wide uppercase">
              Trusted Healthcare Platform
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
            Welcome back<br />
            to <span className="text-green-500">MediCare</span>.
          </h1>

          <p className="text-[#666] text-base leading-relaxed max-w-sm">
            Sign in to access patient records, appointments, and care
            history — all in one secure place.
          </p>

          <div className="flex gap-8 mt-12">
            {[
              { value: "10k+", label: "Patients" },
              { value: "500+", label: "Doctors" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="border-l-2 border-green-500/40 pl-4">
                <p className="text-green-500 text-2xl font-bold">{stat.value}</p>
                <p className="text-[#555] text-xs uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {["HIPAA Compliant", "ISO 27001", "256-bit Encrypted"].map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[#555] text-xs">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-115 flex flex-col justify-center px-8 lg:px-12 py-12 bg-[#0d0d0d]">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <HospitalIcon />
          <span className="text-white font-bold text-lg">
            Medi<span className="text-green-500">Care</span> HMS
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Sign in to your portal</h2>
          <p className="text-[#555] text-sm">
            New patient?{" "}
            <Link to="/register" className="text-green-500 hover:text-green-400 font-medium transition-colors duration-150">
              Create an account
            </Link>
          </p>
        </div>

        <div className="flex gap-1.5 mb-6 p-1 bg-[#111111] border border-[#2a2a2a] rounded-xl">
          {Object.entries(ROLE_CONFIG).map(([key, c]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setRole(key);
                setError("");
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer ${
                role === key ? "bg-green-500 text-black" : "text-[#888] hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="identifier" className={labelClass}>
              {cfg.label} {cfg.fieldLabel}
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={cfg.placeholder}
              required
              autoComplete="username"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors cursor-pointer"
              >
                {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-medium text-[#666] hover:text-[#aaa] transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label={`Sign in as ${cfg.label}`}
            className="
              w-full py-3.5 rounded-lg font-semibold text-sm
              bg-green-500/10 text-green-500 border border-green-500/40
              hover:bg-green-500 hover:text-black hover:border-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-green-500/50
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in…
              </>
            ) : (
              `Sign in as ${cfg.label} →`
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-[#444]">
          {["HIPAA Compliant", "256-bit Encrypted", "Trusted Platform"].map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;