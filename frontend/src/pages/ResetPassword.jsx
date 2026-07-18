import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AuthShell, {
  AuthAlert,
  AuthButton,
  authInputClass,
  authLabelClass,
} from "../components/AuthShell";
import api from "../api/axios";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reset-password", { token, password });
      setDone(true);
      // Resetting revokes every existing session, so any stale credentials in
      // this browser are now dead weight.
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_user");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Link is incomplete" subtitle="This reset link is missing its token.">
        <AuthAlert>
          Open the link straight from your email, or{" "}
          <Link to="/forgot-password" className="underline hover:text-red-300">
            request a new one
          </Link>
          .
        </AuthAlert>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Taking you to the sign-in page…">
        <AuthAlert tone="success">
          You've been signed out everywhere else. Use your new password to sign back in.
        </AuthAlert>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Make it at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className={authLabelClass}>
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a new password"
              required
              autoComplete="new-password"
              autoFocus
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((p) => !p)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors cursor-pointer"
            >
              {show ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className={authLabelClass}>
            Confirm password
          </label>
          <input
            id="confirm"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            required
            autoComplete="new-password"
            className={authInputClass}
          />
        </div>

        {error && <AuthAlert>{error}</AuthAlert>}

        <AuthButton type="submit" loading={loading} loadingLabel="Updating…">
          Update password →
        </AuthButton>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
